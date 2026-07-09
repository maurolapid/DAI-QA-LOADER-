import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { ejecutarIC04HastaPaso2 } from './src/flows/ic04-hasta-paso2';

type Ambiente = { id: string; nombre: string; url: string };

const root = process.cwd();
const rl = readline.createInterface({ input, output });

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf-8'));
}

function banner() {
  console.log('==========================================');
  console.log('          DAI QA LOADER v1.2.0');
  console.log('==========================================');
  console.log('Carga automatizada de datos de prueba DAI');
  console.log('');
}

async function askOption(title: string, options: string[]) {
  console.log(title);
  options.forEach((option, index) => console.log(`  [${index + 1}] ${option}`));
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

  const ambientes = readJson<Ambiente[]>('config/ambientes.json');
  const ambienteOptions = ambientes.map(a => `${a.nombre} - ${a.url}`).concat(['URL Manual']);
  const ambienteIndex = await askOption('Ambiente', ambienteOptions);

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

  const subregimenIndex = await askOption('Subregimen', ['IC04']);
  if (subregimenIndex !== 0) throw new Error('Solo IC04 disponible en V1');

  const escenarioIndex = await askOption('Escenario de prueba', ['Caso Feliz']);
  if (escenarioIndex !== 0) throw new Error('Solo Caso Feliz disponible en V1');

  const facturasIndex = await askOption('Facturas', ['Con facturas', 'Sin facturas']);

  const data = readJson<any>('data/IC04/feliz.json');
  data.caratula.facturas.presencia = facturasIndex === 0 ? 'Si' : 'No';
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  data.interno = `${data.interno} ${stamp}`;
  data.referencia = `QA-${stamp}`;

  console.log('Resumen de ejecucion');
  console.log(`Ambiente:   ${ambienteNombre}`);
  console.log(`URL:        ${baseUrl}`);
  console.log(`Login:      ${data.loginMock}`);
  console.log(`Empresa:    ${data.empresaCuit}`);
  console.log(`Subregimen: ${data.subregimen}`);
  console.log(`Escenario:  ${data.nombre}`);
  console.log(`Interno:    ${data.interno}`);
  console.log(`Referencia: ${data.referencia}`);
  console.log(`Facturas:   ${data.caratula.facturas.presencia === 'Si' ? 'Con facturas' : 'Sin facturas'}`);
  console.log('');

  const confirm = await rl.question('Presione ENTER para iniciar o escriba N para cancelar: ');
  if (confirm.trim().toUpperCase() === 'N') {
    console.log('Ejecucion cancelada.');
    return;
  }

  await ejecutarIC04HastaPaso2(baseUrl, data);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
