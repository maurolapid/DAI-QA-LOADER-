import { Page } from '@playwright/test';

export class HomePage {
  constructor(private page: Page) {}

  async irANuevaOperacion() {
    await this.page.getByRole('menuitem', { name: 'Operaciones' }).click();
    await this.page.getByRole('menuitem', { name: 'Nueva Operación' }).click();
  }
}
