import { Page, expect } from '@playwright/test';

type CaratulaEC01Data = {
  fobTotal: string;
  monedaOpcion: string;
  condicionVentaOpcion: string;
  paisProcedenciaOpcion: string;
  aduanaDestinoOpcion: string;
  facturas: {
    presencia: 'Si' | 'No';
    numeroFactura: string;
  };
};

export class CaratulaEC01Page {
  constructor(private page: Page) {}

  private fobTotalInput() {
    return this.page.getByRole('textbox', {
      name: 'Ingresar valor de monto FOB'
    });
  }

  private monedaFOBCombo() {
    return this.page
      .getByRole('combobox', {
        name: 'Seleccionar tipo de divisa'
      })
      .first();
  }

  private condicionVentaCombo() {
    return this.page.getByRole('combobox', {
      name: 'Seleccionar condición de venta'
    });
  }

  private destinoCombo() {
    return this.page.getByRole('combobox', {
      name: 'Seleccionar destino'
    });
  }

  private aduanaDestinoCombo() {
    return this.page.getByRole('combobox', {
      name: 'Aduana Dest./Sal.'
    });
  }

  private presenciaFacturasCombo() {
    return this.page.locator('[id="22"]');
  }

  private async seleccionarOpcion(opcion: string) {
    await this.page
     .getByRole('option', {
       name: opcion
    })
    .first()
    .click();
 }

  async completarFOB(fob: string) {
    const campoFOB = this.fobTotalInput();

    await campoFOB.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await campoFOB.fill(fob);
    await expect(campoFOB).toHaveValue(fob);
  }

  async seleccionarMonedaFOB(moneda: string) {
    await this.monedaFOBCombo().click();
    await this.seleccionarOpcion(moneda);
  }

  async seleccionarCondicionVenta(condicion: string) {
    await this.condicionVentaCombo().click();
    await this.seleccionarOpcion(condicion);
  }

  async seleccionarDestino(destino: string) {
    await this.destinoCombo().click();
    await this.seleccionarOpcion(destino);
  }

  async seleccionarAduanaDestino(aduana: string) {
    await this.aduanaDestinoCombo().click();
    await this.seleccionarOpcion(aduana);
  }

  async completarFacturas(
    facturas: CaratulaEC01Data['facturas']
  ) {
    await this.presenciaFacturasCombo().click();
    await this.seleccionarOpcion(facturas.presencia);

    if (facturas.presencia === 'Si') {
      const numeroFacturaInput = this.page.locator('[id="23-input"]');

      await numeroFacturaInput.waitFor({
        state: 'visible',
        timeout: 30000
      });

      await numeroFacturaInput.fill(
        facturas.numeroFactura
      );

      await expect(numeroFacturaInput).toHaveValue(
        facturas.numeroFactura
      );

      await this.page
        .getByRole('button', {
          name: 'AGREGAR',
          exact: true
        })
        .click();
    }
  }

  async irAItems() {
    await this.page
      .getByRole('button', {
        name: 'ir a Items'
      })
      .click();

    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async completarCaratula(data: CaratulaEC01Data) {
    await this.completarFOB(data.fobTotal);

    await this.seleccionarMonedaFOB(
      data.monedaOpcion
    );

    await this.seleccionarCondicionVenta(
      data.condicionVentaOpcion
    );

    await this.seleccionarDestino(
      data.paisProcedenciaOpcion
    );

    await this.seleccionarAduanaDestino(
      data.aduanaDestinoOpcion
    );

    await this.completarFacturas(
      data.facturas
    );

    await this.irAItems();
  }
}