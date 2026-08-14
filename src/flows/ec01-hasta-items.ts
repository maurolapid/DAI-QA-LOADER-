import {
  chromium,
  firefox
} from '@playwright/test';
import type { Browser } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegistroPage } from '../pages/RegistroPage';
import { CaratulaEC01Page } from '../pages/CaratulaEC01Page';
import { ItemsEC01Page } from '../pages/ItemsEC01Page';
import { OficializacionHerreroPage } from '../pages/OficializacionHerreroPage';
import { OficializacionRussoPage } from '../pages/OficializacionRussoPage';

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

export async function ejecutarEC01HastaItems(
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
      `✔ [EC01/${navegador}] Abriendo ambiente...`
    );

    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded'
    });

    console.log(
      `✔ [EC01/${navegador}] Login mock: ${data.loginMock}`
    );

    const loginPage =
      new LoginPage(page);

    await loginPage.ingresarConMock(
      data.loginMock
    );

    await loginPage
      .esperarIngresoAlSistema();

    console.log(
      `✔ [EC01/${navegador}] Ingresando a Operaciones > Nueva Operación...`
    );

    const homePage =
      new HomePage(page);

    await homePage
      .irANuevaOperacion();

    console.log(
      `✔ [EC01/${navegador}] Completando Registro EC01...`
    );

    const registroPage =
      new RegistroPage(page);

    await registroPage
      .completarRegistroEC01(
        data
      );

    console.log(
      `✔ [EC01/${navegador}] Presionando Ir a Carátula...`
    );

    await registroPage
      .irACaratulaYEsperarNextStep();

    console.log(
      `✔ [EC01/${navegador}] Completando Carátula EC01...`
    );

    const caratulaPage =
      new CaratulaEC01Page(page);

    await caratulaPage
      .completarCaratula(
        data.caratula
      );

    console.log(
      `✔ [EC01/${navegador}] Cargando posición arancelaria: ${data.item.posicionArancelaria}`
    );

    const itemsPage =
      new ItemsEC01Page(page);

    const resultadoItem =
      await itemsPage
        .completarItem(
          data.item
        );

    if (
      resultadoItem ===
      'asistido'
    ) {
      console.log('');
      console.log(
        '=========================================='
      );
      console.log(
        `⚠ [EC01/${navegador}] MODO ASISTIDO ACTIVADO`
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
      `✔ [EC01/${navegador}] Ítem cargado correctamente`
    );
    console.log(
      '=========================================='
    );

    if (
      data.esOficializacion === true
    ) {
      const flujoPreguntas =
        data.flujoPreguntasOficializacion ??
        data.perfilOficializacion;

      console.log('');
      console.log(
        '=========================================='
      );
      console.log(
        `✔ Perfil de ejecución: ${data.perfilOficializacion}`
      );
      console.log(
        `✔ Flujo de preguntas: ${flujoPreguntas}`
      );
      console.log(
        '=========================================='
      );

      if (
        flujoPreguntas ===
        'Herrero'
      ) {
        const oficializacionPage =
          new OficializacionHerreroPage(
            page
          );

        await oficializacionPage
          .completarHappyPath();

        console.log('');
        console.log(
          '=========================================='
        );
        console.log(
          `✔ Oficialización completada - Perfil ${data.perfilOficializacion} / Preguntas Herrero`
        );
        console.log(
          '=========================================='
        );

        return;
      }

      if (
        flujoPreguntas ===
        'Russo'
      ) {
        const oficializacionPage =
          new OficializacionRussoPage(
            page
          );

        await oficializacionPage
          .completarHappyPath();

        console.log('');
        console.log(
          '=========================================='
        );
        console.log(
          `✔ Oficialización completada - Perfil ${data.perfilOficializacion} / Preguntas Russo`
        );
        console.log(
          '=========================================='
        );

        return;
      }

      throw new Error(
        `Flujo de preguntas de oficialización inválido: ${flujoPreguntas}`
      );
    }

    console.log(
      `[EC01/${navegador}] La ejecución quedó esperando las preguntas.`
    );

    console.log(
      `${navegador} queda abierto para continuar las pruebas manuales.`
    );
  } catch (error) {
    console.error('');
    console.error(
      `ERROR EC01/${navegador}:`
    );
    console.error(error);

    await page
      .screenshot({
        path:
          `screenshots/error-EC01-${navegador}-${Date.now()}.png`,
        fullPage: true
      })
      .catch(() => undefined);

    throw error;
  }
}