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

    await this.page
      .getByText(codigo, { exact: true })
      .nth(1)
      .click();

    await expect(this.posicionArancelariaInput()).toHaveValue(codigo);
  }

  async completarCabeceraIC04() {
    await this.page.locator('#tipo_paso_items_seccion_cabecera').click();
    await this.page.getByRole('option', { name: 'N - Normal' }).click();

    await this.page.locator('#estmercad_paso_items_seccion_cabecera').click();
    await this.page
      .getByRole('option', { name: '- NUEVO SIN USO IMPORTADO' })
      .click();

    await this.page.locator('#origen_paisprov_paso_items_seccion_cabecera').click();
    await this.page.getByRole('option', { name: '- CHINA' }).click();

    await this.page.locator('#pais_procdestino_paso_items_seccion_cabecera').click();
    await this.page.getByRole('option', { name: '- CHINA' }).click();

    await this.page.locator('#unidad_declarada_paso_items_seccion_cabecera').click();
    await this.page.getByRole('option', { name: '- KILOGRAMO' }).click();

    const totalKiloNeto = this.page.locator(
      '#total_kilo_neto_paso_items_seccion_cabecera'
    );

    await totalKiloNeto.fill('10');
    await expect(totalKiloNeto).toHaveValue('10');
  }

  async continuarSinSubitems() {
    await this.page.getByRole('button', { name: 'CONTINUAR' }).click();

    await this.page
      .getByText('¿Desea agregar subitems?')
      .waitFor({
        state: 'visible',
        timeout: 30000
      });

    await this.page.getByRole('button', { name: 'NO' }).click();
  }

  async completarVentajasIC04() {
    const fobTotal = this.page.locator(
      '#fob_total_en_divisa_paso_items_seccion_valor_del_item'
    );

    await fobTotal.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await fobTotal.fill('10000');
    await expect(fobTotal).toHaveValue('10000');
  }

  async completarValorItemIC04() {
    const cantidadDeclarada = this.page.locator(
      '#cantidad_declarada_paso_items_seccion_valor_del_item'
    );

    await cantidadDeclarada.fill('10');
    await expect(cantidadDeclarada).toHaveValue('10');

    const unidadesEstadisticas = this.page.locator(
      '#cantunidades_estadisticas_paso_items_seccion_valor_del_item'
    );

    await unidadesEstadisticas.fill('10');
    await expect(unidadesEstadisticas).toHaveValue('10');
  }

  async completarSufijos(posicionArancelaria: string) {
    switch (posicionArancelaria) {
      case '7318.15.00.620M':
        await this.completarSufijos73181500620M();
        break;

      default:
        throw new Error(
          `No hay sufijos configurados para la posición arancelaria ${posicionArancelaria}`
        );
    }
  }

  private async completarSufijos73181500620M() {
    await this.page.getByRole('button', { name: 'Agregar sufijo' }).click();

    await this.page
      .getByRole('textbox', { name: 'Ingresá CODIGO DE PRODUCTO O' })
      .fill('Codigo del Producto Test');

    await this.page
      .getByRole('textbox', { name: 'Ingresá MARCA' })
      .fill('Marca Test');

    await this.page
      .getByRole('combobox', { name: 'Seleccionar' })
      .click();

    await this.page
      .getByRole('option', { name: 'NA00 - Ninguno' })
      .click();

    await this.page
      .getByRole('button', { name: 'AGREGAR SUFIJOS' })
      .click();

    await this.page
      .getByRole('button', { name: 'CARGAR ITEMS' })
      .click();
  }
}