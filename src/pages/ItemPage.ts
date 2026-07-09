import { Page, expect } from '@playwright/test';

export class ItemPage {
  constructor(private page: Page) {}

  private posicionArancelariaInput() {
    return this.page.getByRole('textbox', {
      name: 'Posición arancelaria'
    });
  }

  async completarPosicionArancelaria(codigo: string) {
    await this.posicionArancelariaInput().waitFor({
      state: 'visible',
      timeout: 30000
    });

    await this.posicionArancelariaInput().fill(codigo);

    await expect(
      this.posicionArancelariaInput()
    ).toHaveValue(codigo);
  }
}