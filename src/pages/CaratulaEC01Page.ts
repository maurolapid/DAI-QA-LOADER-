import { Page, expect, Locator } from '@playwright/test';

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

  private async primerLocatorVisible(
    locators: Locator[],
    nombre: string
  ): Promise<Locator> {
    for (const locator of locators) {
      if (await locator.count() === 0) {
        continue;
      }

      const candidato = locator.first();

      if (await candidato.isVisible().catch(() => false)) {
        return candidato;
      }
    }

    throw new Error(
      `No se encontró un locator visible para "${nombre}".`
    );
  }

  private comboboxPorTextoCercano(texto: RegExp) {
    const etiqueta = this.page
      .getByText(texto, { exact: true })
      .first();

    return etiqueta
      .locator('xpath=..')
      .getByRole('combobox')
      .first();
  }

  private async monedaFOBCombo() {
    return this.primerLocatorVisible(
      [
        this.page
          .getByRole('combobox', {
            name: 'Seleccionar tipo de divisa'
          })
          .first(),

        this.page
          .getByRole('combobox', {
            name: /^Moneda$/i
          })
          .first(),

        this.comboboxPorTextoCercano(/^Moneda$/i),

        this.page
          .locator('div[role="combobox"][aria-haspopup="listbox"]:visible')
          .first()
      ],
      'Moneda FOB'
    );
  }

  private async condicionVentaCombo() {
    return this.primerLocatorVisible(
      [
        this.page.getByRole('combobox', {
          name: 'Seleccionar condición de venta'
        }),

        this.page.getByRole('combobox', {
          name: /Cond\.?Venta/i
        }),

        this.comboboxPorTextoCercano(/^Cond\.Venta$/i),

        this.page
          .getByText(/^Cond\.Venta$/i, { exact: true })
          .locator('xpath=..')
          .getByRole('combobox')
      ],
      'Condición de venta'
    );
  }

  private async destinoCombo() {
    return this.primerLocatorVisible(
      [
        this.page.getByRole('combobox', {
          name: 'Seleccionar destino'
        }),

        this.page.getByRole('combobox', {
          name: /País Proc\.\/Dest\./i
        }),

        this.comboboxPorTextoCercano(/^País Proc\.\/Dest\.$/i),

        this.page
          .getByText(/^País Proc\.\/Dest\.$/i, { exact: true })
          .locator('xpath=..')
          .getByRole('combobox')
      ],
      'País Proc./Dest.'
    );
  }

  private async aduanaDestinoCombo() {
    return this.primerLocatorVisible(
      [
        this.page.getByRole('combobox', {
          name: 'Aduana Dest./Sal.'
        }),

        this.page.getByRole('combobox', {
          name: /Aduana Dest\.\/Sal\./i
        }),

        this.comboboxPorTextoCercano(/^Aduana Dest\.\/Sal\.$/i),

        this.page
          .getByText(/^Aduana Dest\.\/Sal\.$/i, { exact: true })
          .locator('xpath=..')
          .getByRole('combobox')
      ],
      'Aduana Dest./Sal.'
    );
  }

  private presenciaFacturasCombo() {
    return this.page.locator('[id="22"]');
  }

  private async seleccionarOpcion(opcion: string) {
    const opcionLocator = this.page
      .getByRole('option', {
        name: opcion
      })
      .first();

    await opcionLocator.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await opcionLocator.click();
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
    const combo = await this.monedaFOBCombo();

    await combo.click();
    await this.seleccionarOpcion(moneda);
  }

  async seleccionarCondicionVenta(condicion: string) {
    const combo = await this.condicionVentaCombo();

    await combo.click();
    await this.seleccionarOpcion(condicion);
  }

  async seleccionarDestino(destino: string) {
    const combo = await this.destinoCombo();

    await combo.click();
    await this.seleccionarOpcion(destino);
  }

  async seleccionarAduanaDestino(aduana: string) {
    const combo = await this.aduanaDestinoCombo();

    await combo.click();
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

    await this.page
      .waitForLoadState('networkidle')
      .catch(() => undefined);
  }

  async completarCaratula(data: CaratulaEC01Data) {
    await this.completarFOB(
      data.fobTotal
    );

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
