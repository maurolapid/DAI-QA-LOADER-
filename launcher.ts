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

type PerfilOficializacion =
  | 'Herrero'
  | 'Russo';

type SufijoItem = {
  tipo: 'texto' | 'combo';
  nombreAccesible: string;
  valor: string;
  indice?: number;
};

type SufijosPorPosicion =
  Record<string, SufijoItem[]>;

const POSICION_OFICIALIZACION =
  '7318.11.00.100F';

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

  // ==========================================
  // CONFIGURACION
  // ==========================================

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

  // ==========================================
  // AMBIENTE
  // ==========================================

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
  let ambienteId = '';
  let baseUrl = '';

  if (
    ambienteIndex ===
    ambientes.length
  ) {
    ambienteNombre =
      'URL Manual';

    ambienteId =
      'manual';

    baseUrl =
      await rl.question(
        'Ingrese URL manual: '
      );
  } else {
    const ambiente =
      ambientes[ambienteIndex];

    ambienteNombre =
      ambiente.nombre;

    ambienteId =
      ambiente.id;

    baseUrl =
      ambiente.url;
  }

  // ==========================================
  // DETECTAR OFICIALIZACION
  // ==========================================

  const esAmbienteOficializacion =
    ambienteId
      .toLowerCase() ===
      'oficializacion' ||
    ambienteNombre
      .toLowerCase() ===
      'oficializacion';

  // ==========================================
  // PERFIL EXCLUSIVO DE OFICIALIZACION
  // ==========================================

  let perfilOficializacion:
    PerfilOficializacion | null =
      null;

  if (
    esAmbienteOficializacion
  ) {
    const perfilIndex =
      await askOption(
        'Perfil de oficializacion',
        [
          'Herrero',
          'Russo'
        ]
      );

    perfilOficializacion =
      perfilIndex === 0
        ? 'Herrero'
        : 'Russo';
  }

  // ==========================================
  // SUBREGIMEN
  // ==========================================

  let subregimen: 'IC04' | 'EC01';

  if (
    esAmbienteOficializacion
  ) {
    subregimen = 'EC01';

    console.log(
      'Subregimen: EC01 [FIJO OFICIALIZACION]'
    );

    console.log('');
  } else {
    const subregimenIndex =
      await askOption(
        'Subregimen',
        [
          'IC04',
          'EC01'
        ]
      );

    subregimen =
      subregimenIndex === 0
        ? 'IC04'
        : 'EC01';
  }

  // ==========================================
  // ESCENARIO
  // ==========================================

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

  // ==========================================
  // POSICION ARANCELARIA
  // ==========================================

  let posicionSeleccionada:
    PosicionArancelaria;

  if (
    esAmbienteOficializacion
  ) {
    const posicionOficializacion =
      posiciones.find(
        posicion =>
          posicion.codigo ===
          POSICION_OFICIALIZACION
      );

    if (
      !posicionOficializacion
    ) {
      throw new Error(
        `No se encontró la posición ${POSICION_OFICIALIZACION} en config/posiciones-arancelarias.json`
      );
    }

    posicionSeleccionada =
      posicionOficializacion;

    console.log(
      'Posicion Arancelaria'
    );

    console.log(
      `  [FIJA OFICIALIZACION] ${posicionSeleccionada.codigo} - ${posicionSeleccionada.descripcion}`
    );

    console.log('');
  } else {
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

    posicionSeleccionada =
      posiciones[posicionIndex];
  }

  // ==========================================
  // MODO SUFIJOS
  // ==========================================

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

  // ==========================================
  // FACTURAS
  // ==========================================

  let facturasIndex: number;

  if (
    esAmbienteOficializacion
  ) {
    // 1 = Sin facturas
    facturasIndex = 1;

    console.log(
      'Facturas: Sin facturas [FIJO OFICIALIZACION]'
    );

    console.log('');
  } else {
    facturasIndex =
      await askOption(
        'Facturas',
        [
          'Con facturas',
          'Sin facturas'
        ]
      );
  }

  // ==========================================
  // DATOS DEL ESCENARIO
  // ==========================================

  const data =
    readJson<any>(
      `data/${subregimen}/feliz.json`
    );

  // ==========================================
  // CONTEXTO DE OFICIALIZACION
  // ==========================================

  data.esOficializacion =
    esAmbienteOficializacion;

  data.perfilOficializacion =
    perfilOficializacion;

  // ==========================================
  // LOGIN SEGUN PERFIL
  // ==========================================

  if (
    perfilOficializacion ===
    'Herrero'
  ) {
    data.loginMock =
      'mock_20045302211';
  }

  if (
    perfilOficializacion ===
    'Russo'
  ) {
    data.loginMock =
      'mock_20107469681';
  }

  // ==========================================
  // ITEM
  // ==========================================

  data.item = {
    ...data.item,

    posicionArancelaria:
      posicionSeleccionada.codigo,

    modoSufijos,

    sufijos:
      sufijosConfigurados
  };

  // ==========================================
  // FACTURAS
  // ==========================================

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

  // ==========================================
  // DATOS DINAMICOS
  // ==========================================

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

  // ==========================================
  // RESUMEN
  // ==========================================

  console.log(
    'Resumen de ejecucion'
  );

  console.log(
    `Ambiente:     ${ambienteNombre}`
  );

  console.log(
    `URL:          ${baseUrl}`
  );

  if (
    perfilOficializacion
  ) {
    console.log(
      `Perfil:       ${perfilOficializacion}`
    );
  }

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

  if (
    esAmbienteOficializacion
  ) {
    console.log(
      'Posición fija: SI (Oficializacion)'
    );
  }

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

  // ==========================================
  // CONFIRMACION
  // ==========================================

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

  // ==========================================
  // EJECUCION
  // ==========================================

  if (
    subregimen ===
    'IC04'
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