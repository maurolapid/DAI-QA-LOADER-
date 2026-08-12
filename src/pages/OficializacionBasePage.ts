import { Page, expect } from '@playwright/test';

export class OficializacionBasePage {
  constructor(protected page: Page) {}

  protected async responderTexto(valor: string) {
    const input = this.page.getByRole('textbox', {
      name: 'Ingresá tu respuesta'
    });

    await input.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await input.fill(valor);

    await expect(input).toHaveValue(valor);

    const guardarButton =
      this.page.getByRole('button', {
        name: 'GUARDAR RESPUESTA'
      });

    await expect(guardarButton).toBeEnabled({
      timeout: 30000
    });

    console.log(
      `✔ Enviando respuesta de texto: ${valor}`
    );

    await guardarButton.click();

    await expect
      .poll(
        async () => {
          const textbox =
            this.page.getByRole('textbox', {
              name: 'Ingresá tu respuesta'
            });

          const cantidad =
            await textbox.count();

          if (cantidad === 0) {
            return true;
          }

          const valorActual =
            await textbox
              .first()
              .inputValue()
              .catch(() => '');

          return valorActual !== valor;
        },
        {
          timeout: 30000,
          intervals: [
            200,
            300,
            500,
            1000
          ]
        }
      )
      .toBe(true);

    console.log(
      `✔ Respuesta ${valor} procesada.`
    );
  }

  protected async responderSi() {
    await this.page
      .getByRole('button', {
        name: 'SÍ',
        exact: true
      })
      .click();
  }

  protected async responderNo() {
    await this.page
      .getByRole('button', {
        name: 'NO',
        exact: true
      })
      .click();
  }

  protected async confirmarSeleccion() {
    await this.page
      .getByRole('button', {
        name: 'Confirmar selección'
      })
      .click();
  }

  protected async seleccionarRadioExacto(
    nombre: string
  ) {
    await this.page
      .getByRole('radio', {
        name: nombre,
        exact: true
      })
      .check();

    await this.confirmarSeleccion();
  }

  protected async seleccionarRadioParcial(
    nombre: string
  ) {
    await this.page
      .getByRole('radio', {
        name: nombre
      })
      .first()
      .check();

    await this.confirmarSeleccion();
  }

  protected async irACertificacionPACROM() {
    await this.page
      .getByRole('button', {
        name: 'ir a Certificación PAC/ROM'
      })
      .click();
  }

  protected async completarCertificacionPACROM(
    nombreTransporte: string
  ) {
    await this.page
      .getByRole('textbox', {
        name: 'Ingresar marcas'
      })
      .fill('SM');

    await this.page
      .getByRole('combobox', {
        name: 'Via'
      })
      .click();

    await this.page
      .getByRole('option', {
        name: '- AVION'
      })
      .click();

    await this.page
      .getByRole('textbox', {
        name: 'DD/MM/AAAA'
      })
      .fill('05/09/2026');

    await this.page
      .getByRole('combobox', {
        name: 'Bandera'
      })
      .click();

    await this.page
      .getByRole('option', {
        name: '- INDET.(CONTINENTE)'
      })
      .click();

    await this.page
      .getByRole('textbox', {
        name: 'Ingresar nombre del transporte'
      })
      .fill(nombreTransporte);

    await this.page
      .getByRole('textbox', {
        name: 'Ingresar el agente de'
      })
      .fill('INDET');

    await this.page
      .getByRole('textbox', {
        name: 'Ingresar número de bultos'
      })
      .fill('1');

    await this.page
      .getByRole('combobox', {
        name: 'Embalaje Codigo'
      })
      .click();

    await this.page
      .getByRole('option', {
        name: '- BULTOS'
      })
      .click();

    await this.page
      .getByRole('spinbutton', {
        name: 'Ingresar la cantidad'
      })
      .fill('1');

    await this.page
      .getByRole('combobox', {
        name: 'Embalaje tipo'
      })
      .click();

    await this.page
      .getByRole('option', {
        name: 'N - No Retornable'
      })
      .click();

    await this.page
      .getByRole('textbox', {
        name: 'Ingresar el peso'
      })
      .fill('10');
  }

  protected async irAPresupuestoGeneral() {
    await this.page
      .getByRole('button', {
        name: 'ir a Presupuesto General'
      })
      .click();
  }

  protected async verificarDetallePresupuesto() {
    await this.page
      .getByRole('button', {
        name: 'VER TODO EL DETALLE'
      })
      .click();

    await this.page
      .getByRole('button', {
        name: 'Cerrar'
      })
      .click();
  }
}