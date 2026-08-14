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

type FlujoPreguntasOficializacion =
  | 'Herrero'
  | 'Russo';

type Navegador =
  | 'chrome'
  | 'firefox'
  | 'edge';

type ModoEjecucion =
  | 'individual'
  | 'paralelo';

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


function obtenerSiguienteNumeroOficializacion(): string {
  const relativePath =
    'data/oficializacion-contador.json';

  const fullPath = path.join(
    root,
    relativePath
  );

  let ultimoNumero = 0;

  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(
      fullPath,
      'utf-8'
    );

    if (content.trim().length > 0) {
      const contador =
        JSON.parse(content) as {
          ultimoNumero?: number;
        };

      ultimoNumero =
        Number(contador.ultimoNumero) || 0;
    }
  }

  const siguienteNumero =
    ultimoNumero + 1;

  fs.mkdirSync(
    path.dirname(fullPath),
    { recursive: true }
  );

  fs.writeFileSync(
    fullPath,
    JSON.stringify(
      { ultimoNumero: siguienteNumero },
      null,
      2
    ) + '\n',
    'utf-8'
  );

  return String(
    siguienteNumero
  ).padStart(
    3,
    '0'
  );
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


async function seleccionarNavegador(
  titulo: string
): Promise<Navegador> {
  const navegadorIndex =
    await askOption(
      titulo,
      [
        'Chrome',
        'Firefox',
        'Edge'
      ]
    );

  if (navegadorIndex === 0) {
    return 'chrome';
  }

  if (navegadorIndex === 1) {
    return 'firefox';
  }

  return 'edge';
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

  let flujoPreguntasOficializacion:
    FlujoPreguntasOficializacion | null =
      null;

  let empresaCuitOficializacion:
    string | null =
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

    const empresaOficializacionIndex =
      await askOption(
        'Empresa para oficializacion',
        [
          'Baterias Moura - 30500938125',
          'Malba Textil - 33710718879'
        ]
      );

    empresaCuitOficializacion =
      empresaOficializacionIndex === 0
        ? '30500938125'
        : '33710718879';

    const flujoPreguntasIndex =
      await askOption(
        'Flujo de preguntas de oficializacion',
        [
          'Herrero',
          'Russo'
        ]
      );

    flujoPreguntasOficializacion =
      flujoPreguntasIndex === 0
        ? 'Herrero'
        : 'Russo';
  }

  // ==========================================
  // MODO DE EJECUCION
  // ==========================================

  let modoEjecucion:
    ModoEjecucion = 'individual';

  if (
    !esAmbienteOficializacion
  ) {
    const modoEjecucionIndex =
      await askOption(
        'Modo de ejecucion',
        [
          'Individual',
          'Paralelo IC04 + EC01'
        ]
      );

    modoEjecucion =
      modoEjecucionIndex === 0
        ? 'individual'
        : 'paralelo';
  }

  // ==========================================
  // OFICIALIZACION
  // ==========================================

  if (
    esAmbienteOficializacion
  ) {
    const subregimen:
      'EC01' = 'EC01';

    console.log(
      'Subregimen: EC01 [FIJO OFICIALIZACION]'
    );

    console.log('');

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

    const posicionSeleccionada =
      posicionOficializacion;

    console.log(
      'Posicion Arancelaria'
    );

    console.log(
      `  [FIJA OFICIALIZACION] ${posicionSeleccionada.codigo} - ${posicionSeleccionada.descripcion}`
    );

    console.log('');

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

    console.log(
      'Facturas: Sin facturas [FIJO OFICIALIZACION]'
    );

    console.log('');

    const data =
      readJson<any>(
        `data/${subregimen}/feliz.json`
      );

    data.esOficializacion =
      true;

    data.perfilOficializacion =
      perfilOficializacion;

    data.flujoPreguntasOficializacion =
      flujoPreguntasOficializacion;

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

    if (
      !empresaCuitOficializacion
    ) {
      throw new Error(
        'No se seleccionó empresa para oficialización.'
      );
    }

    data.empresaCuit =
      empresaCuitOficializacion;

    // ==========================================
    // DATOS ESPECIFICOS DEL FLUJO RUSSO
    // ==========================================

    if (
      flujoPreguntasOficializacion ===
      'Russo'
    ) {
      // REGISTRO
      data.aduanaOpcion =
        '- EZEIZA';

      data.subregimenOpcion =
        'EC01 - EXPORTACION A CONSUMO';

      // CARATULA
      data.caratula = {
        ...data.caratula,

        fobTotal:
          '1',

        monedaOpcion:
          'DOL - DOLAR ESTADOUNIDENSE',

        condicionVentaOpcion:
          'FOB - LIBRE PUESTA A BORDO',

        paisProcedenciaOpcion:
          '- CHINA',

        aduanaDestinoOpcion:
          '- EZEIZA',

        facturas: {
          ...data.caratula.facturas,
          presencia: 'No'
        }
      };

      // ITEM
      data.item = {
        ...data.item,

        tipoOpcion:
          'N - Normal',

        estadoMercaderiaOpcion:
          '- NUEVO SIN USO ARGENTINO',

        origenOpcion:
          'BA - BUENOS AIRES',

        paisProcedenciaOpcion:
          '- CHINA',

        unidadDeclaradaOpcion:
          '- KILOGRAMO',

        totalKiloNeto:
          '1',

        fobTotalDivisa:
          '1',

        cantidadDeclarada:
          '1',

        cantidadUnidadesEstadisticas:
          '1'
      };
    }

    const sufijosFinales =
      flujoPreguntasOficializacion ===
      'Russo'
        ? [
            {
              tipo: 'texto' as const,
              nombreAccesible:
                'Ingresá MARCA',
              valor:
                'marca'
            },
            {
              tipo: 'texto' as const,
              nombreAccesible:
                'Ingresá CODIGO DE PRODUCTO O',
              valor:
                'codigo'
            }
          ]
        : sufijosConfigurados;

    data.item = {
      ...data.item,

      posicionArancelaria:
        posicionSeleccionada.codigo,

      modoSufijos,

      sufijos:
        sufijosFinales
    };

    if (
      data.caratula?.facturas
    ) {
      data.caratula
        .facturas
        .presencia =
          'No';
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

    const numeroOficializacion =
      obtenerSiguienteNumeroOficializacion();

    data.interno =
      `Operacion para OFICIALIZACION UNICAMENTE numero ${numeroOficializacion}`;

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

    if (
      perfilOficializacion
    ) {
      console.log(
        `Perfil:       ${perfilOficializacion}`
      );
    }

    if (
      flujoPreguntasOficializacion
    ) {
      console.log(
        `Flujo preg.:   ${flujoPreguntasOficializacion}`
      );
    }

    console.log(
      `Login:        ${data.loginMock}`
    );

    console.log(
      `Empresa:      ${
        data.empresaCuit ===
        '30500938125'
          ? 'Baterias Moura - 30500938125'
          : 'Malba Textil - 33710718879'
      }`
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
      'Posición fija: SI (Oficializacion)'
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

    console.log(
      'Facturas:     Sin facturas'
    );

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

    await ejecutarEC01HastaItems(
      baseUrl,
      data,
      'chrome'
    );

    return;
  }

  // ==========================================
  // EJECUCION NORMAL - INDIVIDUAL
  // ==========================================

  if (
    modoEjecucion ===
    'individual'
  ) {
    const subregimenIndex =
      await askOption(
        'Subregimen',
        [
          'IC04',
          'EC01'
        ]
      );

    const subregimen:
      'IC04' | 'EC01' =
        subregimenIndex === 0
          ? 'IC04'
          : 'EC01';

    const navegador =
      await seleccionarNavegador(
        'Navegador'
      );

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

    data.esOficializacion =
      false;

    data.perfilOficializacion =
      null;

    data.flujoPreguntasOficializacion =
      null;

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
      `Navegador:    ${navegador}`
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
      subregimen ===
      'IC04'
    ) {
      await ejecutarIC04HastaPaso2(
        baseUrl,
        data,
        navegador
      );
    } else {
      await ejecutarEC01HastaItems(
        baseUrl,
        data,
        navegador
      );
    }

    return;
  }

  // ==========================================
  // EJECUCION NORMAL - PARALELO IC04 + EC01
  // ==========================================

  const navegadorIC04 =
    await seleccionarNavegador(
      'Navegador para IC04'
    );

  const navegadorEC01 =
    await seleccionarNavegador(
      'Navegador para EC01'
    );

  if (
    navegadorIC04 ===
    navegadorEC01
  ) {
    throw new Error(
      'Para la ejecución paralela seleccione navegadores diferentes.'
    );
  }

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

  const facturasIC04Index =
    await askOption(
      'Facturas para IC04',
      [
        'Con facturas',
        'Sin facturas'
      ]
    );

  const facturasEC01Index =
    await askOption(
      'Facturas para EC01',
      [
        'Con facturas',
        'Sin facturas'
      ]
    );

  const dataIC04 =
    readJson<any>(
      'data/IC04/feliz.json'
    );

  const dataEC01 =
    readJson<any>(
      'data/EC01/feliz.json'
    );

  dataIC04.esOficializacion =
    false;

  dataIC04.perfilOficializacion =
    null;

  dataIC04.flujoPreguntasOficializacion =
    null;

  dataIC04.item = {
    ...dataIC04.item,

    posicionArancelaria:
      posicionSeleccionada.codigo,

    modoSufijos,

    sufijos:
      sufijosConfigurados
  };

  if (
    dataIC04.caratula?.facturas
  ) {
    dataIC04.caratula
      .facturas
      .presencia =
        facturasIC04Index === 0
          ? 'Si'
          : 'No';
  }

  dataEC01.esOficializacion =
    false;

  dataEC01.perfilOficializacion =
    null;

  dataEC01.flujoPreguntasOficializacion =
    null;

  dataEC01.item = {
    ...dataEC01.item,

    posicionArancelaria:
      posicionSeleccionada.codigo,

    modoSufijos,

    sufijos:
      sufijosConfigurados
  };

  if (
    dataEC01.caratula?.facturas
  ) {
    dataEC01.caratula
      .facturas
      .presencia =
        facturasEC01Index === 0
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

  dataIC04.interno =
    `${dataIC04.interno} ${stamp}`;

  dataIC04.referencia =
    `QA-IC04-${stamp}`;

  dataEC01.interno =
    `${dataEC01.interno} ${stamp}`;

  dataEC01.referencia =
    `QA-EC01-${stamp}`;

  console.log('');
  console.log(
    '=========================================='
  );
  console.log(
    '       EJECUCION PARALELA'
  );
  console.log(
    '=========================================='
  );

  console.log(
    `IC04 -> ${navegadorIC04}`
  );

  console.log(
    `EC01 -> ${navegadorEC01}`
  );

  console.log(
    `Posicion -> ${posicionSeleccionada.codigo}`
  );

  console.log(
    `Facturas IC04 -> ${
      facturasIC04Index === 0
        ? 'Con facturas'
        : 'Sin facturas'
    }`
  );

  console.log(
    `Facturas EC01 -> ${
      facturasEC01Index === 0
        ? 'Con facturas'
        : 'Sin facturas'
    }`
  );

  console.log('');

  const confirm =
    await rl.question(
      'Presione ENTER para iniciar ambos flujos o escriba N para cancelar: '
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

  console.log('');
  console.log(
    '✔ Iniciando IC04 y EC01 en paralelo...'
  );

  const resultados =
    await Promise.allSettled([
      ejecutarIC04HastaPaso2(
        baseUrl,
        dataIC04,
        navegadorIC04
      ),
      ejecutarEC01HastaItems(
        baseUrl,
        dataEC01,
        navegadorEC01
      )
    ]);

  const [
    resultadoIC04,
    resultadoEC01
  ] = resultados;

  console.log('');
  console.log(
    '=========================================='
  );
  console.log(
    '       RESULTADO PARALELO'
  );
  console.log(
    '=========================================='
  );

  console.log(
    `IC04: ${
      resultadoIC04.status ===
      'fulfilled'
        ? 'OK'
        : 'ERROR'
    }`
  );

  console.log(
    `EC01: ${
      resultadoEC01.status ===
      'fulfilled'
        ? 'OK'
        : 'ERROR'
    }`
  );

  if (
    resultadoIC04.status ===
    'rejected'
  ) {
    console.error(
      'Error IC04:',
      resultadoIC04.reason
    );
  }

  if (
    resultadoEC01.status ===
    'rejected'
  ) {
    console.error(
      'Error EC01:',
      resultadoEC01.reason
    );
  }

  if (
    resultadoIC04.status ===
      'rejected' ||
    resultadoEC01.status ===
      'rejected'
  ) {
    process.exitCode = 1;
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