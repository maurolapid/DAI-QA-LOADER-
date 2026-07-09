import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async ingresarConMock(token: string) {
    await this.page.getByRole('textbox', { name: 'Token (mock)' }).fill(token);
    await this.page.getByRole('button', { name: 'Ingresar con CUIT y Clave' }).click();
  }

  async esperarIngresoAlSistema() {
    await expect(this.page.getByRole('menuitem', { name: 'Operaciones' })).toBeVisible({ timeout: 30000 });
  }
}
