import {
  chromium,
  firefox
} from '@playwright/test';
import type { Browser } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegistroPage } from '../pages/RegistroPage';
import { CaratulaPage } from '../pages/CaratulaPage';
import { ItemPage } from '../pages/ItemPage';

export type NavegadorEjecucion =
  | 'chrome'
  | 'firefox'
  | 'edge';

async function iniciarNavegador(
  navegador: NavegadorEjecucion
): Promise<Browser> {
  console.log(
    `✔ Iniciando navegador: ${navegador}...`
  );

  if (navegador === 'firefox') {
    return firefox.launch({
      headless: false
    });
  }

  if (navegador === 'edge') {
    return chromium.launch({
      channel: 'msedge',
      headless: false,
      args: ['--start-maximized']
    });
  }

  return chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--start-maximized']
  });
}

export async function ejecutarIC04HastaPaso2(
  baseUrl: string,
  data: any,
  navegador:
    NavegadorEjecucion = 'chrome'
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
      `✔ [IC04/${navegador}] Abriendo ambiente...`
    );

    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded'
    });

    console.log(
      `✔ [IC04/${navegador}] Login mock: ${data.loginMock}`
    );

    const loginPage =
      new LoginPage(page);

    await loginPage.ingresarConMock(
      data.loginMock
    );

    await loginPage
      .esperarIngresoAlSistema();

    console.log(
      `✔ [IC04/${navegador}] Ingresando a Operaciones > Nueva Operación...`
    );

    const homePage =
      new HomePage(page);

    await homePage
      .irANuevaOperacion();

    console.log(
      `✔ [IC04/${navegador}] Completando Registro IC04...`
    );

    const registroPage =
      new RegistroPage(page);

    await registroPage
      .completarRegistroIC04(
        data
      );

    console.log(
      `✔ [IC04/${navegador}] Presionando Ir a Carátula...`
    );

    await registroPage
      .irACaratulaYEsperarNextStep();

    console.log(
      `✔ [IC04/${navegador}] Completando Carátula...`
    );

    const caratulaPage =
      new CaratulaPage(page);

    await caratulaPage
      .completarInicio(
        data.caratula
      );

    console.log(
      `✔ [IC04/${navegador}] Clickeando Ir a Items...`
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
          response.status() === 200
      ),

      page
        .getByRole('button', {
          name: 'ir a Items'
        })
        .click()
    ]);

    console.log(
      `✔ [IC04/${navegador}] Esperando carga de Items...`
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
        response.status() === 200
    );

    console.log(
      `✔ [IC04/${navegador}] Abriendo Agregar Item...`
    );

    await page
      .getByRole('button', {
        name: 'AGREGAR ITEM'
      })
      .click();

    const itemPage =
      new ItemPage(page);

    console.log(
      `✔ [IC04/${navegador}] Completando posición arancelaria...`
    );

    await itemPage
      .completarPosicionArancelaria(
        data.item
          .posicionArancelaria
      );

    console.log(
      `✔ [IC04/${navegador}] Completando cabecera IC04...`
    );

    await itemPage
      .completarCabeceraIC04();

    console.log(
      `✔ [IC04/${navegador}] Continuando sin SubItems...`
    );

    await itemPage
      .continuarSinSubitems();

    console.log(
      `✔ [IC04/${navegador}] Completando Ventajas...`
    );

    await itemPage
      .completarVentajasIC04();

    console.log(
      `✔ [IC04/${navegador}] Completando valor del Item...`
    );

    await itemPage
      .completarValorItemIC04();

    console.log(
      `✔ [IC04/${navegador}] Completando sufijos...`
    );

    const resultadoSufijos =
      await itemPage
        .completarSufijos(
          data.item
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
        `⚠ [IC04/${navegador}] MODO ASISTIDO ACTIVADO`
      );
      console.log(
        `Posición: ${data.item.posicionArancelaria}`
      );
      console.log(
        `Complete manualmente los sufijos en ${navegador}.`
      );
      console.log(
        '=========================================='
      );

      return;
    }

    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      `✔ [IC04/${navegador}] Flujo finalizado`
    );
    console.log(
      '=========================================='
    );
    console.log(
      'Ítem IC04 cargado correctamente.'
    );
  } catch (error) {
    console.error('');
    console.error(
      `ERROR IC04/${navegador}:`
    );
    console.error(error);

    await page
      .screenshot({
        path:
          `screenshots/error-IC04-${navegador}-${Date.now()}.png`,
        fullPage: true
      })
      .catch(
        () => undefined
      );

    throw error;
  }
}