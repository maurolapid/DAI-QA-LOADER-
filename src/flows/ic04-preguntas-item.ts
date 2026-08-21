import {
  chromium,
  firefox
} from '@playwright/test';

import type {
  Browser,
  Page
} from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegistroPage } from '../pages/RegistroPage';
import { CaratulaPage } from '../pages/CaratulaPage';
import { ItemPage } from '../pages/ItemPage';
import { PreguntasItemIC04Page } from '../pages/PreguntasItemIC04Page';
import { DocumentoTransporteIC04Page } from '../pages/DocumentoTransporteIC04Page';
import { PreguntasPresupuestoIC04Page } from '../pages/PreguntasPresupuestoIC04Page';
import {
  guardarOperacionPendiente,
  marcarOperacionCompletada
} from '../utils/operaciones-pendientes';
import type {
  OperacionPendiente
} from '../utils/operaciones-pendientes';

export type NavegadorEjecucion =
  | 'chrome'
  | 'firefox'
  | 'edge';

export type InteraccionTransporteIC04 = {
  solicitarPuerto: () => Promise<string>;
  solicitarDocumento: () => Promise<string>;
  decidirTrasRechazo: () => Promise<
    'reintentar' | 'guardar'
  >;
};

export type ContextoIC04Preguntas = {
  ambienteNombre: string;
  interaccionTransporte:
    InteraccionTransporteIC04;
};

const POSICION_PREGUNTAS_IC04 =
  '7318.15.00.620M';

async function iniciarNavegador(
  navegador: NavegadorEjecucion
): Promise<Browser> {
  console.log(
    `✔ Iniciando navegador: ${navegador}...`
  );

  if (
    navegador === 'firefox'
  ) {
    return firefox.launch({
      headless: false
    });
  }

  if (
    navegador === 'edge'
  ) {
    return chromium.launch({
      channel: 'msedge',
      headless: false,
      args: [
        '--start-maximized'
      ]
    });
  }

  return chromium.launch({
    channel: 'chrome',
    headless: false,
    args: [
      '--start-maximized'
    ]
  });
}

function obtenerOperationId(
  urlActual: string
): string {
  const url =
    new URL(urlActual);

  const operationId =
    url.searchParams.get(
      'operation'
    );

  if (
    !operationId
  ) {
    throw new Error(
      `No se pudo obtener operationId desde la URL: ${urlActual}`
    );
  }

  return operationId;
}

function construirUrlOperacion(
  baseUrl: string,
  operationId: string
) {
  const url =
    new URL(
      '/operaciones/nueva',
      baseUrl
    );

  url.searchParams.set(
    'operation',
    operationId
  );

  return url.toString();
}

async function completarDesdeDocumentoTransporte(
  page: Page,
  pendienteBase: Omit<
    OperacionPendiente,
    'estado' | 'creadoEn' | 'actualizadoEn'
  >,
  interaccion:
    InteraccionTransporteIC04
): Promise<'completada' | 'pendiente'> {
  const documentoPage =
    new DocumentoTransporteIC04Page(
      page
    );

  while (true) {
    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      '       DOCUMENTO DE TRANSPORTE'
    );
    console.log(
      '=========================================='
    );

    const puerto =
      await interaccion
        .solicitarPuerto();

    const documento =
      await interaccion
        .solicitarDocumento();

    await documentoPage
      .completarDatos(
        puerto,
        documento
      );

    console.log(
      '✔ Presentando documento de transporte...'
    );

    const resultado =
      await documentoPage
        .presentar();

    if (
      resultado === 'aceptado'
    ) {
      console.log(
        '✔ Documento de transporte aceptado.'
      );

      await documentoPage
        .irAPresupuestoGeneral();

      const presupuestoPage =
        new PreguntasPresupuestoIC04Page(
          page
        );

      await presupuestoPage
        .completar();

      marcarOperacionCompletada(
        pendienteBase.operationId
      );

      console.log('');
      console.log(
        '=========================================='
      );
      console.log(
        '✔ IC04 PREGUNTAS COMPLETADO'
      );
      console.log(
        '=========================================='
      );

      return 'completada';
    }

    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      '⚠ DOCUMENTO DE TRANSPORTE RECHAZADO'
    );
    console.log(
      'Error detectado: Error en campo Bultos / Nro.'
    );
    console.log(
      '=========================================='
    );

    const decision =
      await interaccion
        .decidirTrasRechazo();

    if (
      decision === 'reintentar'
    ) {
      console.log(
        '✔ Reintentando con nuevos datos de transporte...'
      );

      continue;
    }

    const guardada =
      guardarOperacionPendiente(
        pendienteBase
      );

    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      '⚠ OPERACIÓN GUARDADA COMO PENDIENTE'
    );
    console.log(
      '=========================================='
    );
    console.log(
      `Ambiente:     ${guardada.ambienteNombre}`
    );
    console.log(
      `Operation ID: ${guardada.operationId}`
    );
    console.log(
      `Referencia:   ${guardada.referencia}`
    );
    console.log(
      `Etapa:        ${guardada.etapa}`
    );
    console.log(
      'Podrá retomarse desde el Launcher.'
    );

    return 'pendiente';
  }
}

export async function ejecutarIC04PreguntasItem(
  baseUrl: string,
  data: any,
  navegador:
    NavegadorEjecucion = 'chrome',
  contexto:
    ContextoIC04Preguntas
) {
  const items =
    Array.isArray(
      data.items
    ) &&
    data.items.length > 0
      ? data.items
      : [
          data.item
        ];

  if (
    items.length !== 1
  ) {
    throw new Error(
      'El flujo IC04 con preguntas está limitado actualmente a 1 item.'
    );
  }

  if (
    items[0]
      .posicionArancelaria !==
    POSICION_PREGUNTAS_IC04
  ) {
    throw new Error(
      `El flujo IC04 con preguntas requiere la posición fija ${POSICION_PREGUNTAS_IC04}.`
    );
  }

  const browser =
    await iniciarNavegador(
      navegador
    );

  const context =
    await browser.newContext({
      viewport: null
    });

  const page =
    await context.newPage();

  try {
    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] Abriendo ambiente...`
    );

    await page.goto(baseUrl, {
      waitUntil:
        'domcontentloaded'
    });

    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] Login mock: ${data.loginMock}`
    );

    const loginPage =
      new LoginPage(page);

    await loginPage.ingresarConMock(
      data.loginMock
    );

    await loginPage
      .esperarIngresoAlSistema();

    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] Ingresando a Operaciones > Nueva Operación...`
    );

    const homePage =
      new HomePage(page);

    await homePage
      .irANuevaOperacion();

    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] Completando Registro IC04...`
    );

    const registroPage =
      new RegistroPage(page);

    await registroPage
      .completarRegistroIC04(
        data
      );

    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] Presionando Ir a Carátula...`
    );

    await registroPage
      .irACaratulaYEsperarNextStep();

    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] Completando Carátula...`
    );

    const caratulaPage =
      new CaratulaPage(page);

    await caratulaPage
      .completarInicio(
        data.caratula
      );

    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] Clickeando Ir a Items...`
    );

    await Promise.all([
      page.waitForResponse(
        response =>
          response
            .url()
            .includes(
              '/operations.nextStep'
            ) &&
          response
            .request()
            .method() ===
            'POST' &&
          response.status() ===
            200
      ),

      page
        .getByRole(
          'button',
          {
            name: 'ir a Items'
          }
        )
        .click()
    ]);

    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] Esperando carga de Items...`
    );

    await page.waitForResponse(
      response =>
        response
          .url()
          .includes(
            '/operations.getOperation'
          ) &&
        response
          .request()
          .method() ===
          'GET' &&
        response.status() ===
          200
    );

    const operationId =
      obtenerOperationId(
        page.url()
      );

    const itemPage =
      new ItemPage(page);

    const item =
      items[0];

    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] Item fijo a cargar`
    );
    console.log(
      `Posición: ${item.posicionArancelaria}`
    );
    console.log(
      `FOB Item: ${item.fobTotalDivisa}`
    );
    console.log(
      `Operation ID: ${operationId}`
    );
    console.log(
      '=========================================='
    );

    await itemPage
      .abrirPrimerItem();

    await itemPage
      .completarPosicionArancelaria(
        item.posicionArancelaria
      );

    await itemPage
      .completarCabeceraIC04(
        item
      );

    await itemPage
      .continuarSinSubitems();

    await itemPage
      .completarVentajasIC04(
        item
      );

    await itemPage
      .completarValorItemIC04(
        item
      );

    const resultadoSufijos =
      await itemPage
        .completarSufijos(
          item
        );

    if (
      resultadoSufijos ===
      'asistido'
    ) {
      console.log('');
      console.log(
        '=========================================='
      );
      console.log(
        `⚠ [IC04-PREGUNTAS/${navegador}] MODO ASISTIDO ACTIVADO`
      );
      console.log(
        `Posición: ${item.posicionArancelaria}`
      );
      console.log(
        'Complete manualmente los sufijos.'
      );
      console.log(
        '=========================================='
      );

      return;
    }

    await itemPage
      .cargarTodosLosItems();

    console.log(
      `✔ [IC04-PREGUNTAS/${navegador}] CARGAR ITEMS ejecutado correctamente`
    );

    const preguntasPage =
      new PreguntasItemIC04Page(
        page
      );

    await preguntasPage
      .responderPreguntas73181500620M();

    const pendienteBase = {
      operationId,
      ambienteNombre:
        contexto.ambienteNombre,
      baseUrl,
      subregimen:
        'IC04' as const,
      posicionArancelaria:
        POSICION_PREGUNTAS_IC04,
      referencia:
        String(
          data.referencia ?? ''
        ),
      interno:
        String(
          data.interno ?? ''
        ),
      loginMock:
        String(
          data.loginMock ?? ''
        ),
      etapa:
        'documento-transporte' as const
    };

    await completarDesdeDocumentoTransporte(
      page,
      pendienteBase,
      contexto.interaccionTransporte
    );
  } catch (error) {
    console.error('');
    console.error(
      `ERROR IC04-PREGUNTAS/${navegador}:`
    );
    console.error(error);

    await page
      .screenshot({
        path:
          `screenshots/error-IC04-PREGUNTAS-${navegador}-${Date.now()}.png`,
        fullPage: true
      })
      .catch(
        () => undefined
      );

    throw error;
  }
}

export async function retomarIC04PreguntasItem(
  pendiente: OperacionPendiente,
  navegador:
    NavegadorEjecucion,
  interaccionTransporte:
    InteraccionTransporteIC04
) {
  const browser =
    await iniciarNavegador(
      navegador
    );

  const context =
    await browser.newContext({
      viewport: null
    });

  const page =
    await context.newPage();

  try {
    console.log(
      `✔ [IC04-RETOMAR/${navegador}] Abriendo ambiente ${pendiente.ambienteNombre}...`
    );

    await page.goto(
      pendiente.baseUrl,
      {
        waitUntil:
          'domcontentloaded'
      }
    );

    const loginPage =
      new LoginPage(page);

    await loginPage.ingresarConMock(
      pendiente.loginMock
    );

    await loginPage
      .esperarIngresoAlSistema();

    const operationUrl =
      construirUrlOperacion(
        pendiente.baseUrl,
        pendiente.operationId
      );

    console.log(
      `✔ [IC04-RETOMAR/${navegador}] Retomando operación ${pendiente.operationId}...`
    );

    await page.goto(
      operationUrl,
      {
        waitUntil:
          'domcontentloaded'
      }
    );

    const campoTransporte =
      page.getByRole(
        'textbox',
        {
          name:
            /Ingresar documento de/i
        }
      ).first();

    await campoTransporte.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await completarDesdeDocumentoTransporte(
      page,
      {
        operationId:
          pendiente.operationId,
        ambienteNombre:
          pendiente.ambienteNombre,
        baseUrl:
          pendiente.baseUrl,
        subregimen: 'IC04',
        posicionArancelaria:
          pendiente.posicionArancelaria,
        referencia:
          pendiente.referencia,
        interno:
          pendiente.interno,
        loginMock:
          pendiente.loginMock,
        etapa:
          'documento-transporte'
      },
      interaccionTransporte
    );
  } catch (error) {
    console.error('');
    console.error(
      `ERROR IC04-RETOMAR/${navegador}:`
    );
    console.error(error);

    await page
      .screenshot({
        path:
          `screenshots/error-IC04-RETOMAR-${navegador}-${Date.now()}.png`,
        fullPage: true
      })
      .catch(
        () => undefined
      );

    throw error;
  }
}
