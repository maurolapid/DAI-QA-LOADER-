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

type CaratulaEC01Data = {
  fobTotal: string;
  monedaOpcion: string;
  condicionVentaOpcion: string;
  paisProcedenciaOpcion: string;
};

export class CaratulaPage {
  constructor(private page: Page) {}

  private fobTotalInput() {
    return this.page.getByRole('textbox', {
      name: 'Ingresar valor de monto FOB'
    });
  }

  private fleteTotalInput() {
    return this.page.getByRole('textbox', {
      name: 'Ingresar el monto de flete'
    });
  }

  private porcentajeSeguroInput() {
    return this.page.getByRole('textbox', {
      name: 'Porcentaje Seguro'
    });
  }

  private ajusteAIncluirInput() {
    return this.page.getByRole('textbox', {
      name: 'Ajuste a Incluir'
    });
  }

  private ajusteADeducirInput() {
    return this.page.getByRole('textbox', {
      name: 'Ajuste a Deducir'
    });
  }

  private compraVentaInput() {
    return this.page.getByRole('textbox', {
      name: 'Compr./Vend.'
    });
  }

  private agregarInformacionButton() {
    return this.page.getByRole('button', {
      name: '+ AGREGAR INFORMACIÓN'
    });
  }

  private async completarModalInformacionAdicional(
    data: CaratulaData['informacionAdicional']
  ) {
    const modal = this.page.getByTestId('mock-dialog');

    await modal.waitFor({
      state: 'visible',
      timeout: 30000
    });

    const inputs = modal.getByRole('textbox');

    await expect(inputs.nth(0)).toBeVisible();

    await inputs.nth(0).fill(data.domicilioEstablecimiento);
    await inputs.nth(1).fill(data.fechaInicioActividad);
    await inputs.nth(2).fill(data.fechaEmisionFactura);
    await inputs.nth(3).fill(data.idTribProveedor);

    await modal.getByRole('button', { name: 'AGREGAR' }).click();
  }

  private async seleccionarComboPorIndice(
    indice: number,
    optionName: string
  ) {
    const combo = this.page.getByRole('combobox').nth(indice);

    await combo.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await combo.click();

    await this.page
      .getByRole('option', { name: optionName })
      .click();
  }

  private async completarFacturas(
    data: CaratulaData['facturas']
  ) {
    await this.page.getByLabel('', { exact: true }).click();

    await this.page
      .getByRole('option', { name: data.presencia })
      .click();

    if (data.presencia === 'Si') {
      const factura = this.page.locator('[id="23-input"]');

      await factura.waitFor({
        state: 'visible',
        timeout: 30000
      });

      await factura.fill(data.numeroFactura);

      await expect(factura).toHaveValue(
        data.numeroFactura
      );

      await this.page
        .getByRole('button', {
          name: 'AGREGAR',
          exact: true
        })
        .click();
    }
  }

  // ==========================
  // IC04
  // ==========================

  async completarInicio(data: CaratulaData) {
    await this.fobTotalInput().waitFor({
      state: 'visible',
      timeout: 60000
    });

    await this.fobTotalInput().fill(data.fobTotal);

    await expect(this.fobTotalInput()).toHaveValue(
      data.fobTotal
    );

    // Moneda FOB
    await this.seleccionarComboPorIndice(
      0,
      data.monedaOpcion
    );

    await this.fleteTotalInput().fill(data.fleteTotal);

    await expect(this.fleteTotalInput()).toHaveValue(
      data.fleteTotal
    );

    // Moneda Flete
    await this.seleccionarComboPorIndice(
      1,
      data.monedaOpcion
    );

    await this.porcentajeSeguroInput().fill(
      data.porcentajeSeguro
    );

    await expect(
      this.porcentajeSeguroInput()
    ).toHaveValue(data.porcentajeSeguro);

    // Moneda Seguro
    await this.seleccionarComboPorIndice(
      2,
      data.monedaOpcion
    );

    await expect(
      this.ajusteAIncluirInput()
    ).toBeVisible();

    await expect(
      this.ajusteADeducirInput()
    ).toBeVisible();

    // Condición de Venta
    await this.seleccionarComboPorIndice(
      3,
      data.condicionVentaOpcion
    );

    await this.compraVentaInput().fill(
      data.compraVenta
    );

    await expect(
      this.compraVentaInput()
    ).toHaveValue(data.compraVenta);

    await this.agregarInformacionButton().click();

    await this.completarModalInformacionAdicional(
      data.informacionAdicional
    );

    await this.completarFacturas(data.facturas);
  }

  // ==========================
  // EC01
  // ==========================

  async completarInicioEC01(
    data: CaratulaEC01Data
  ) {
    await this.fobTotalInput().waitFor({
      state: 'visible',
      timeout: 60000
    });

    await this.fobTotalInput().fill(data.fobTotal);

    await expect(this.fobTotalInput()).toHaveValue(
      data.fobTotal
    );

    // Moneda FOB
    await this.seleccionarComboPorIndice(
      0,
      data.monedaOpcion
    );

    // Condición de Venta
    await this.seleccionarComboPorIndice(
      1,
      data.condicionVentaOpcion
    );

    // País Proc./Destino
    await this.seleccionarComboPorIndice(
      2,
      data.paisProcedenciaOpcion
    );
  }

  async irAItems() {
    await Promise.all([
      this.page.waitForResponse(
        r =>
          r.url().includes('/operations.nextStep') &&
          r.request().method() === 'POST' &&
          r.status() === 200
      ),
      this.page
        .getByRole('button', {
          name: 'ir a Items'
        })
        .click()
    ]);

    await this.page.waitForResponse(
      r =>
        r.url().includes('/operations.getOperation') &&
        r.request().method() === 'GET' &&
        r.status() === 200
    );
  }
}