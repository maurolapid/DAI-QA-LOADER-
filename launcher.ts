import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { ejecutarIC04HastaPaso2 } from './src/flows/ic04-hasta-paso2';
import { ejecutarEC01HastaItems } from './src/flows/ec01-hasta-items';

type Ambiente = { id: string; nombre: string; url: string };

type PosicionArancelaria = {
  id: number;
  codigo: string;
  descripcion: string;
  nota?: string;
};

const root = process.cwd();
const rl = readline.createInterface({ input, output });

function readJson<T>(relativePath: string): T {
  const fullPath = path.join(root, relativePath);

  console.log('');
  console.log('------------------------------------------');
  console.log(`Leyendo JSON: ${fullPath}`);

  const content = fs.readFileSync(fullPath, 'utf-8');

  console.log(`Tamaño: ${content.length} bytes`);

  if (content.trim().length === 0) {
    throw new Error(`El archivo JSON está vacío: ${fullPath}`);
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('');
    console.error(`Error parseando JSON: ${fullPath}`);
    console.error('Contenido leído:');
    console.error(content);

    throw error;
  }
}

function banner() {
  console.log('==========================================');
  console.log('          DAI QA LOADER v1.3.0');
  console.log('==========================================');
  console.log('Carga automatizada de datos de prueba DAI');
  console.log('');
}

async function askOption(title: string, options: string[]) {
  console.log(title);

  options.forEach((option, index) =>
    console.log(`  [${index + 1}] ${option}`)
  );

  const value = await rl.question('\nSeleccione opcion: ');
  const selected = Number(value.trim());

  if (!selected || selected < 1 || selected > options.length) {
    throw new Error(`Opcion invalida para ${title}`);
  }

  console.log('');
  return selected - 1;
}

async function main() {
  banner();

  const ambientes =
    readJson<Ambiente[]>('config/ambientes.json');

  const posiciones =
    readJson<PosicionArancelaria[]>(
      'config/posiciones-arancelarias.json'
    );

  const ambienteOptions = ambientes
    .map(a => `${a.nombre} - ${a.url}`)
    .concat(['URL Manual']);

  const ambienteIndex =
    await askOption('Ambiente', ambienteOptions);

  let ambienteNombre = '';
  let baseUrl = '';

  if (ambienteIndex === ambientes.length) {
    ambienteNombre = 'URL Manual';
    baseUrl = await rl.question('Ingrese URL manual: ');
  } else {
    const ambiente = ambientes[ambienteIndex];
    ambienteNombre = ambiente.nombre;
    baseUrl = ambiente.url;
  }

  const subregimenIndex = await askOption(
    'Subregimen',
    ['IC04', 'EC01']
  );

  const subregimen =
    subregimenIndex === 0 ? 'IC04' : 'EC01';

  const escenarioIndex =
    await askOption(
      'Escenario de prueba',
      ['Caso Feliz']
    );

  if (escenarioIndex !== 0) {
    throw new Error('Solo Caso Feliz disponible.');
  }

  const posicionIndex =
    await askOption(
      'Posicion Arancelaria',
      posiciones.map(
        p =>
          `${p.codigo} - ${p.descripcion}${
            p.nota ? ` (${p.nota})` : ''
          }`
      )
    );

  const posicionSeleccionada =
    posiciones[posicionIndex];

  const facturasIndex =
    await askOption(
      'Facturas',
      ['Con facturas', 'Sin facturas']
    );

  const data =
    readJson<any>(
      `data/${subregimen}/feliz.json`
    );

  data.item = {
    posicionArancelaria:
      posicionSeleccionada.codigo
  };

  if (data.caratula.facturas) {
    data.caratula.facturas.presencia =
      facturasIndex === 0 ? 'Si' : 'No';
  }

  const now = new Date();
  const stamp =
    now
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);

  data.interno =
    `${data.interno} ${stamp}`;

  data.referencia =
    `QA-${stamp}`;

  console.log('Resumen de ejecucion');
  console.log(`Ambiente:   ${ambienteNombre}`);
  console.log(`URL:        ${baseUrl}`);
  console.log(`Login:      ${data.loginMock}`);
  console.log(`Empresa:    ${data.empresaCuit}`);
  console.log(`Subregimen: ${data.subregimen}`);
  console.log(`Escenario:  ${data.nombre}`);
  console.log(`Pos. Aranc: ${data.item.posicionArancelaria}`);
  console.log(`Interno:    ${data.interno}`);
  console.log(`Referencia: ${data.referencia}`);

  if (data.caratula.facturas) {
    console.log(
      `Facturas:   ${
        data.caratula.facturas.presencia === 'Si'
          ? 'Con facturas'
          : 'Sin facturas'
      }`
    );
  }

  console.log('');

  const confirm =
    await rl.question(
      'Presione ENTER para iniciar o escriba N para cancelar: '
    );

  if (confirm.trim().toUpperCase() === 'N') {
    console.log('Ejecucion cancelada.');
    return;
  }

  if (subregimen === 'IC04') {
    await ejecutarIC04HastaPaso2(baseUrl, data);
  } else {
    await ejecutarEC01HastaItems(baseUrl, data);
  }
}

main()
  .catch(error => {
    console.error(
      error instanceof Error
        ? error.message
        : error
    );

    process.exitCode = 1;
  })
  .finally(() => rl.close());