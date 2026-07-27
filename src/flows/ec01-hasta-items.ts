import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegistroPage } from '../pages/RegistroPage';
import { CaratulaEC01Page } from '../pages/CaratulaEC01Page';

export async function ejecutarEC01HastaItems(baseUrl: string, data: any) {
  console.log('✔ Iniciando Chrome...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null
  });

  const page = await context.newPage();

  try {
    console.log('✔ Abriendo ambiente...');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    console.log(`✔ Login mock: ${data.loginMock}`);
    const loginPage = new LoginPage(page);
    await loginPage.ingresarConMock(data.loginMock);
    await loginPage.esperarIngresoAlSistema();

    console.log('✔ Ingresando a Operaciones > Nueva Operación...');
    const homePage = new HomePage(page);
    await homePage.irANuevaOperacion();

    console.log('✔ Completando Registro EC01...');
    const registroPage = new RegistroPage(page);
    await registroPage.completarRegistroEC01(data);

    console.log('✔ Presionando Ir a Carátula...');
    await registroPage.irACaratulaYEsperarNextStep();

    console.log('✔ Completando Carátula EC01...');
    const caratulaPage = new CaratulaEC01Page(page);
    await caratulaPage.completarCaratula(data.caratula);

    console.log('');
    console.log('==========================================');
    console.log('✔ Flujo EC01 finalizado');
    console.log('==========================================');
    console.log('EC01 llegó correctamente a Items.');
    console.log('Chrome queda abierto para continuar las pruebas manuales.');

  } catch (error) {
    console.error('');
    console.error('ERROR durante la ejecución:');
    console.error(error);

    await page
      .screenshot({
        path: `screenshots/error-${Date.now()}.png`,
        fullPage: true
      })
      .catch(() => undefined);

    throw error;
  }
}