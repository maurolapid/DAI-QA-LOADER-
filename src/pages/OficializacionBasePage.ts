import { Page, expect } from '@playwright/test';

export class OficializacionBasePage {
  constructor(protected page: Page) {}

  protected async responderTexto(valor: string) {
    const input = this.page.getByRole('textbox', {
      name: 'Ingresá tu respuesta'
    });

    console.log(
      '✔ Esperando disponibilidad de pregunta de texto...'
    );

    await input.waitFor({
      state: 'visible',
      timeout: 120000
    });

    console.log(
      '✔ Pregunta de texto disponible.'
    );

    await input.fill(valor);

    await expect(input).toHaveValue(
      valor,
      {
        timeout: 30000
      }
    );

    const guardarButton =
      this.page.getByRole('button', {
        name: 'GUARDAR RESPUESTA'
      });

    await expect(
      guardarButton
    ).toBeEnabled({
      timeout: 60000
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
          timeout: 120000,
          intervals: [
            200,
            300,
            500,
            1000,
            2000
          ]
        }
      )
      .toBe(true);

    console.log(
      `✔ Respuesta ${valor} procesada.`
    );
  }

  protected async responderSi() {
    const boton =
      this.page.getByRole('button', {
        name: 'SÍ',
        exact: true
      });

    await boton.waitFor({
      state: 'visible',
      timeout: 120000
    });

    await expect(
      boton
    ).toBeEnabled({
      timeout: 60000
    });

    await boton.click();
  }

  protected async responderNo() {
    const boton =
      this.page.getByRole('button', {
        name: 'NO',
        exact: true
      });

    await boton.waitFor({
      state: 'visible',
      timeout: 120000
    });

    await expect(
      boton
    ).toBeEnabled({
      timeout: 60000
    });

    await boton.click();
  }

  protected async confirmarSeleccion() {
    const boton =
      this.page.getByRole('button', {
        name: 'Confirmar selección'
      });

    await boton.waitFor({
      state: 'visible',
      timeout: 120000
    });

    await expect(
      boton
    ).toBeEnabled({
      timeout: 60000
    });

    await boton.click();
  }

  protected async seleccionarRadioExacto(
    nombre: string
  ) {
    const radio =
      this.page.getByRole('radio', {
        name: nombre,
        exact: true
      });

    await radio.waitFor({
      state: 'visible',
      timeout: 120000
    });

    await radio.check();

    await this.confirmarSeleccion();
  }

  protected async seleccionarRadioParcial(
    nombre: string
  ) {
    const radio =
      this.page
        .getByRole('radio', {
          name: nombre
        })
        .first();

    await radio.waitFor({
      state: 'visible',
      timeout: 120000
    });

    await radio.check();

    await this.confirmarSeleccion();
  }

  protected async irACertificacionPACROM() {
    const boton =
      this.page.getByRole('button', {
        name: 'ir a Certificación PAC/ROM'
      });

    await boton.waitFor({
      state: 'visible',
      timeout: 120000
    });

    await expect(
      boton
    ).toBeEnabled({
      timeout: 60000
    });

    await boton.click();
  }

  protected async completarCertificacionPACROM(
    _nombreTransporte: string
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

    // Venc. Embarque = fecha actual + 30 días
    const fechaVencimiento =
      new Date();

    fechaVencimiento.setDate(
      fechaVencimiento.getDate() + 30
    );

    const dia =
      String(
        fechaVencimiento.getDate()
      ).padStart(
        2,
        '0'
      );

    const mes =
      String(
        fechaVencimiento.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const anio =
      fechaVencimiento.getFullYear();

    const vencimientoEmbarque =
      `${dia}/${mes}/${anio}`;

    console.log(
      `✔ Venc. Embarque automático (+30 días): ${vencimientoEmbarque}`
    );

    await this.page
      .getByRole('textbox', {
        name: 'DD/MM/AAAA'
      })
      .fill(vencimientoEmbarque);

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
      .fill('avion');

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
    const boton =
      this.page.getByRole('button', {
        name: 'ir a Presupuesto General'
      });

    await boton.waitFor({
      state: 'visible',
      timeout: 120000
    });

    await expect(
      boton
    ).toBeEnabled({
      timeout: 60000
    });

    await boton.click();
  }

  protected async verificarDetallePresupuesto() {
    const verDetalle =
      this.page.getByRole('button', {
        name: 'VER TODO EL DETALLE'
      });

    await verDetalle.waitFor({
      state: 'visible',
      timeout: 120000
    });

    await expect(
      verDetalle
    ).toBeEnabled({
      timeout: 60000
    });

    await verDetalle.click();

    const cerrar =
      this.page.getByRole('button', {
        name: 'Cerrar'
      });

    await cerrar.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await cerrar.click();
  }
}