import { Page, expect } from '@playwright/test';

type CaratulaData = {
  fobTotal: string;
  monedaOpcion: string;
  fleteTotal: string;
  porcentajeSeguro: string;
  condicionVentaOpcion: string;
  compraVenta: string;
  informacionAdicional: {
    domicilioEstablecimiento: string;
    fechaInicioActividad: string;
    fechaEmisionFactura: string;
    idTribProveedor: string;
  };
  facturas: {
    presencia: 'Si' | 'No';
    numeroFactura: string;
  };
};

export class CaratulaPage {
  constructor(private page: Page) {}

  private fobTotalInput() {
    return this.page.getByRole('textbox', { name: 'Ingresar valor de monto FOB' });
  }

  private fleteTotalInput() {
    return this.page.getByRole('textbox', { name: 'Ingresar el monto de flete' });
  }

  private porcentajeSeguroInput() {
    return this.page.getByRole('textbox', { name: 'Porcentaje Seguro' });
  }

  private ajusteAIncluirInput() {
    return this.page.getByRole('textbox', { name: 'Ajuste a Incluir' });
  }

  private ajusteADeducirInput() {
    return this.page.getByRole('textbox', { name: 'Ajuste a Deducir' });
  }

  private compraVentaInput() {
    return this.page.getByRole('textbox', { name: 'Compr./Vend.' });
  }

  private agregarInformacionButton() {
    return this.page.getByRole('button', { name: '+ AGREGAR INFORMACIÓN' });
  }

  private async completarModalInformacionAdicional(data: CaratulaData['informacionAdicional']) {
    const modal = this.page.getByTestId('mock-dialog');
    await modal.waitFor({ state: 'visible', timeout: 30000 });

    const inputs = modal.getByRole('textbox');
    await expect(inputs.nth(0)).toBeVisible();
    await inputs.nth(0).fill(data.domicilioEstablecimiento);
    await inputs.nth(1).fill(data.fechaInicioActividad);
    await inputs.nth(2).fill(data.fechaEmisionFactura);
    await inputs.nth(3).fill(data.idTribProveedor);

    await modal.getByRole('button', { name: 'AGREGAR' }).click();
  }

  private async seleccionarComboPorIndice(indice: number, optionName: string) {
    const combo = this.page.getByRole('combobox').nth(indice);
    await combo.waitFor({ state: 'visible', timeout: 30000 });
    await combo.click();
    await this.page.getByRole('option', { name: optionName }).click();
  }

  private async completarFacturas(data: CaratulaData['facturas']) {
    // Campo FACTURAS: Presencia de todas las Facturas.
    await this.page.getByLabel('', { exact: true }).click();
    await this.page.getByRole('option', { name: data.presencia }).click();

    if (data.presencia === 'Si') {
      await this.page.locator('[id="23-input"]').waitFor({ state: 'visible', timeout: 30000 });
      await this.page.locator('[id="23-input"]').fill(data.numeroFactura);
      await expect(this.page.locator('[id="23-input"]')).toHaveValue(data.numeroFactura);

      await this.page.getByRole('button', { name: 'AGREGAR', exact: true }).click();
    }
  }

  async completarInicio(data: CaratulaData) {
    await this.fobTotalInput().waitFor({ state: 'visible', timeout: 60000 });

    await this.fobTotalInput().fill(data.fobTotal);
    await expect(this.fobTotalInput()).toHaveValue(data.fobTotal);

    // Combo 0: Moneda FOB
    await this.seleccionarComboPorIndice(0, data.monedaOpcion);

    await this.fleteTotalInput().fill(data.fleteTotal);
    await expect(this.fleteTotalInput()).toHaveValue(data.fleteTotal);

    // Combo 1: Moneda Flete
    await this.seleccionarComboPorIndice(1, data.monedaOpcion);

    await this.porcentajeSeguroInput().fill(data.porcentajeSeguro);
    await expect(this.porcentajeSeguroInput()).toHaveValue(data.porcentajeSeguro);

    // Combo 2: Moneda Seguro Total
    await this.seleccionarComboPorIndice(2, data.monedaOpcion);

    await expect(this.ajusteAIncluirInput()).toBeVisible();
    await expect(this.ajusteADeducirInput()).toBeVisible();

    // Combo 3: Condición de Venta
    await this.seleccionarComboPorIndice(3, data.condicionVentaOpcion);

    await this.compraVentaInput().fill(data.compraVenta);
    await expect(this.compraVentaInput()).toHaveValue(data.compraVenta);

    await this.agregarInformacionButton().click();
    await this.completarModalInformacionAdicional(data.informacionAdicional);

    await this.completarFacturas(data.facturas);

}
}
