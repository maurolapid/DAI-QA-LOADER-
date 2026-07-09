import { Page } from '@playwright/test';

type RegistroIC04Data = {
  empresaCuit: string;
  aduanaOpcion: string;
  subregimenOpcion: string;
  interno: string;
  referencia: string;
};

export class RegistroPage {
  constructor(private page: Page) {}

  async completarRegistroIC04(data: RegistroIC04Data) {
    await this.page.getByRole('textbox', { name: 'Ingresar CUIT' }).fill(data.empresaCuit);

    // Selector pendiente de mejorar si la UI expone label accesible para Aduana.
    await this.page.locator('.MuiInputBase-root.MuiOutlinedInput-root.MuiInputBase-colorPrimary.MuiInputBase-fullWidth').first().click();
    await this.page.getByRole('option', { name: data.aduanaOpcion }).click();

    // Selector pendiente de mejorar si la UI expone label accesible para Subrégimen.
    await this.page.locator('div:nth-child(4) > .TextInput-module-scss-module__Ku0B-q__inputFieldContainer > .MuiFormControl-root > .MuiInputBase-root').click();
    await this.page.getByRole('option', { name: data.subregimenOpcion }).click();

    await this.page.getByRole('textbox', { name: 'Ingresar número interno' }).fill(data.interno);
    await this.page.getByRole('textbox', { name: 'Ingresar número de referencia' }).fill(data.referencia);
  }

  async irACaratulaYEsperarNextStep() {
    const nextStepResponse = this.page.waitForResponse(response =>
      response.url().includes('operations.nextStep') &&
      response.url().includes('batch=1') &&
      response.status() === 200,
      { timeout: 60000 }
    );

    await this.page.getByRole('button', { name: 'ir a Carátula' }).click();
    await nextStepResponse;
  }
}
