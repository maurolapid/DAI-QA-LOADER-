import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { ejecutarIC04HastaPaso2 } from './src/flows/ic04-hasta-paso2';
import { ejecutarEC01HastaItems } from './src/flows/ec01-hasta-items';

type Ambiente = {
  id: string;
  nombre: string;
  url: string;
};

type PosicionArancelaria = {
  id: number;
  codigo: string;
  descripcion: string;
  nota?: string;
};

type ModoSufijos =
  | 'automatico'
  | 'asistido';

type SufijoItem = {
  tipo: 'texto' | 'combo';
  nombreAccesible: string;
  valor: string;
  indice?: number;
};

type SufijosPorPosicion =
  Record<string, SufijoItem[]>;

const root = process.cwd();

const rl = readline.createInterface({
  input,
  output
});

function readJson<T>(
  relativePath: string
): T {
  const fullPath = path.join(
    root,
    relativePath
  );

  console.log('');
  console.log(
    '------------------------------------------'
  );
  console.log(
    `Leyendo JSON: ${fullPath}`
  );

  const content = fs.readFileSync(
    fullPath,
    'utf-8'
  );

  console.log(
    `Tamaño: ${content.length} bytes`
  );

  if (
    content.trim().length === 0
  ) {
    throw new Error(
      `El archivo JSON está vacío: ${fullPath}`
    );
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('');
    console.error(
      `Error parseando JSON: ${fullPath}`
    );
    console.error(
      'Contenido leído:'
    );
    console.error(content);

    throw error;
  }
}

function banner() {
  console.log(
    '=========================================='
  );
  console.log(
    '          DAI QA LOADER v1.4.0'
  );
  console.log(
    '=========================================='
  );
  console.log(
    'Carga automatizada de datos de prueba DAI'
  );
  console.log('');
}

async function askOption(
  title: string,
  options: string[]
) {
  console.log(title);

  options.forEach(
    (option, index) => {
      console.log(
        `  [${index + 1}] ${option}`
      );
    }
  );

  const value =
    await rl.question(
      '\nSeleccione opcion: '
    );

  const selected =
    Number(value.trim());

  if (
    !selected ||
    selected < 1 ||
    selected > options.length
  ) {
    throw new Error(
      `Opcion invalida para ${title}`
    );
  }

  console.log('');

  return selected - 1;
}

async function main() {
  banner();

  const ambientes =
    readJson<Ambiente[]>(
      'config/ambientes.json'
    );

  const posiciones =
    readJson<PosicionArancelaria[]>(
      'config/posiciones-arancelarias.json'
    );

  const sufijosPorPosicion =
    readJson<SufijosPorPosicion>(
      'config/sufijos-posiciones.json'
    );

  const ambienteOptions =
    ambientes
      .map(
        ambiente =>
          `${ambiente.nombre} - ${ambiente.url}`
      )
      .concat([
        'URL Manual'
      ]);

  const ambienteIndex =
    await askOption(
      'Ambiente',
      ambienteOptions
    );

  let ambienteNombre = '';
  let baseUrl = '';

  if (
    ambienteIndex ===
    ambientes.length
  ) {
    ambienteNombre =
      'URL Manual';

    baseUrl =
      await rl.question(
        'Ingrese URL manual: '
      );
  } else {
    const ambiente =
      ambientes[ambienteIndex];

    ambienteNombre =
      ambiente.nombre;

    baseUrl =
      ambiente.url;
  }

  const subregimenIndex =
    await askOption(
      'Subregimen',
      [
        'IC04',
        'EC01'
      ]
    );

  const subregimen =
    subregimenIndex === 0
      ? 'IC04'
      : 'EC01';

  const escenarioIndex =
    await askOption(
      'Escenario de prueba',
      [
        'Caso Feliz'
      ]
    );

  if (
    escenarioIndex !== 0
  ) {
    throw new Error(
      'Solo Caso Feliz disponible.'
    );
  }

  const posicionIndex =
    await askOption(
      'Posicion Arancelaria',
      posiciones.map(
        posicion =>
          `${posicion.codigo} - ${posicion.descripcion}${
            posicion.nota
              ? ` (${posicion.nota})`
              : ''
          }`
      )
    );

  const posicionSeleccionada =
    posiciones[posicionIndex];

  const modoSufijosIndex =
    await askOption(
      'Modo de carga de sufijos',
      [
        'Automatico',
        'Asistido'
      ]
    );

  const modoSolicitado:
    ModoSufijos =
      modoSufijosIndex === 0
        ? 'automatico'
        : 'asistido';

  const sufijosConfigurados =
    sufijosPorPosicion[
      posicionSeleccionada.codigo
    ] ?? [];

  const modoSufijos:
    ModoSufijos =
      modoSolicitado ===
        'automatico' &&
      sufijosConfigurados.length === 0
        ? 'asistido'
        : modoSolicitado;

  if (
    modoSolicitado ===
      'automatico' &&
    modoSufijos ===
      'asistido'
  ) {
    console.log('');

    console.warn(
      `No hay sufijos automáticos configurados para ${posicionSeleccionada.codigo}.`
    );

    console.warn(
      'La ejecución continuará en modo asistido.'
    );

    console.log('');
  }

  const facturasIndex =
    await askOption(
      'Facturas',
      [
        'Con facturas',
        'Sin facturas'
      ]
    );

  const data =
    readJson<any>(
      `data/${subregimen}/feliz.json`
    );

  data.item = {
    ...data.item,

    posicionArancelaria:
      posicionSeleccionada.codigo,

    modoSufijos,

    sufijos:
      sufijosConfigurados
  };

  if (
    data.caratula?.facturas
  ) {
    data.caratula
      .facturas
      .presencia =
        facturasIndex === 0
          ? 'Si'
          : 'No';
  }

  const now =
    new Date();

  const stamp =
    now
      .toISOString()
      .replace(
        /[-:TZ.]/g,
        ''
      )
      .slice(
        0,
        14
      );

  data.interno =
    `${data.interno} ${stamp}`;

  data.referencia =
    `QA-${stamp}`;

  console.log(
    'Resumen de ejecucion'
  );

  console.log(
    `Ambiente:     ${ambienteNombre}`
  );

  console.log(
    `URL:          ${baseUrl}`
  );

  console.log(
    `Login:        ${data.loginMock}`
  );

  console.log(
    `Empresa:      ${data.empresaCuit}`
  );

  console.log(
    `Subregimen:   ${data.subregimen}`
  );

  console.log(
    `Escenario:    ${data.nombre}`
  );

  console.log(
    `Pos. Aranc:   ${data.item.posicionArancelaria}`
  );

  console.log(
    `Modo sufijos: ${
      data.item
        .modoSufijos ===
      'automatico'
        ? 'Automatico'
        : 'Asistido'
    }`
  );

  console.log(
    `Sufijos:      ${
      data.item.sufijos.length
    } configurados`
  );

  console.log(
    `Interno:      ${data.interno}`
  );

  console.log(
    `Referencia:   ${data.referencia}`
  );

  if (
    data.caratula?.facturas
  ) {
    console.log(
      `Facturas:     ${
        data.caratula
          .facturas
          .presencia ===
        'Si'
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

  if (
    confirm
      .trim()
      .toUpperCase() ===
    'N'
  ) {
    console.log(
      'Ejecucion cancelada.'
    );

    return;
  }

  if (
    subregimen === 'IC04'
  ) {
    await ejecutarIC04HastaPaso2(
      baseUrl,
      data
    );
  } else {
    await ejecutarEC01HastaItems(
      baseUrl,
      data
    );
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
  .finally(
    () => rl.close()
  );