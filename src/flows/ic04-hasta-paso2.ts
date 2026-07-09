import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegistroPage } from '../pages/RegistroPage';
import { CaratulaPage } from '../pages/CaratulaPage';
import { ItemPage } from '../pages/ItemPage';

export async function ejecutarIC04HastaPaso2(baseUrl: string, data: any) {
  console.log('✔ Iniciando Chrome...');
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: null });
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

    console.log('✔ Completando Registro IC04...');
    const registroPage = new RegistroPage(page);
    await registroPage.completarRegistroIC04(data);

    console.log('✔ Presionando Ir a Carátula y esperando operations.nextStep...');
    await registroPage.irACaratulaYEsperarNextStep();

    console.log('✔ Completando Carátula...');
    const caratulaPage = new CaratulaPage(page);
    await caratulaPage.completarInicio(data.caratula);

    console.log('✔ Clickeando Ir a Items...');
    await Promise.all([
      page.waitForResponse(r =>
        r.url().includes('/operations.nextStep') &&
        r.request().method() === 'POST' &&
        r.status() === 200
      ),
      page.getByRole('button', { name: 'ir a Items' }).click()
    ]);

    console.log('✔ Esperando carga de Items...');
    await page.waitForResponse(r =>
      r.url().includes('/operations.getOperation') &&
      r.request().method() === 'GET' &&
      r.status() === 200
    );

    console.log('✔ Abriendo Agregar Item...');
    await page.getByRole('button', { name: 'AGREGAR ITEM' }).click();

    const itemPage = new ItemPage(page);
    await itemPage.completarPosicionArancelaria(data.item.posicionArancelaria);

    console.log('');
    console.log('==========================================');
    console.log('✔ Flujo finalizado');
    console.log('==========================================');
    console.log('Carátula completada correctamente.');
    console.log('Se ingresó a Items y se abrió el formulario Agregar Item.');
    console.log('Chrome queda abierto para continuar las pruebas manuales.');
  } catch (error) {
    console.error('');
    console.error('ERROR durante la ejecucion:');
    console.error(error);
    await page.screenshot({ path: `screenshots/error-${Date.now()}.png`, fullPage: true }).catch(() => undefined);
    throw error;
  }
}