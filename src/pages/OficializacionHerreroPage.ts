import { Page, expect } from '@playwright/test';

export class OficializacionHerreroPage {
  constructor(private page: Page) {}

  private async responderTexto(valor: string) {
    const input = this.page.getByRole('textbox', {
      name: 'Ingresá tu respuesta'
    });

    await input.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await input.fill(valor);

    await expect(input).toHaveValue(valor);

    const guardarButton = this.page.getByRole('button', {
      name: 'GUARDAR RESPUESTA'
    });

    await expect(guardarButton).toBeEnabled({
      timeout: 30000
    });

    console.log(`✔ Enviando respuesta de texto: ${valor}`);

    await guardarButton.click();

    await expect
      .poll(
        async () => {
          const textbox = this.page.getByRole('textbox', {
            name: 'Ingresá tu respuesta'
          });

          const cantidad = await textbox.count();

          if (cantidad === 0) {
            return true;
          }

          const valorActual = await textbox
            .first()
            .inputValue()
            .catch(() => '');

          return valorActual !== valor;
        },
        {
          timeout: 30000,
          intervals: [200, 300, 500, 1000]
        }
      )
      .toBe(true);

    console.log(
      `✔ Respuesta ${valor} procesada. Siguiente pregunta disponible.`
    );
  }

  private async responderSi() {
    await this.page
      .getByRole('button', {
        name: 'SÍ',
        exact: true
      })
      .click();
  }

  private async responderNo() {
    await this.page
      .getByRole('button', {
        name: 'NO',
        exact: true
      })
      .click();
  }

  private async seleccionarRadio(nombre: string) {
    await this.page
      .getByRole('radio', {
        name: nombre
      })
      .check();

    await this.page
      .getByRole('button', {
        name: 'Confirmar selección'
      })
      .click();
  }

  async responderPreguntasPostItems() {
    await this.responderTexto('0');

    await this.responderNo();
    await this.responderNo();
    await this.responderNo();

    await this.responderSi();

    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();

    await this.responderTexto('0');

    await this.responderSi();
    await this.responderSi();

    await this.seleccionarRadio(
      'BURKINA FASO'
    );

    await this.seleccionarRadio(
      'Ninguna opción'
    );

    await this.seleccionarRadio(
      'EL PLAZO DE ESPERA PARA EL'
    );
  }

  async irACertificacionPACROM() {
    await this.page
      .getByRole('button', {
        name: 'ir a Certificación PAC/ROM'
      })
      .click();
  }

  async completarCertificacionPACROM() {
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
      .fill('avion');

    await this.page
      .getByRole('textbox', {
        name: 'Ingresar el agente de'
      })
      .fill('indet');

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

  async irAPresupuestoGeneral() {
    await this.page
      .getByRole('button', {
        name: 'ir a Presupuesto General'
      })
      .click();
  }

  async responderPreguntasPresupuesto() {
    await this.seleccionarRadio(
      'DIGITALIZACION POR PSAD.'
    );

    await this.responderNo();

    await this.seleccionarRadio(
      'No debo presentar la'
    );

    await this.responderSi();
    await this.responderSi();

    await this.seleccionarRadio(
      '- BANCO DE LA NACION ARGENTINA'
    );

    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();

    console.log(
      '✔ Respondiendo texto Presupuesto: TCA'
    );

    await this.responderTexto('TCA');

    console.log(
      '✔ Respondiendo texto Presupuesto: 0'
    );

    await this.responderTexto('0');

    await this.seleccionarRadio(
      'PSAD02 - BOX CUSTODIA DE'
    );
  }

  async verificarDetallePresupuesto() {
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

  async afectarPresupuesto() {
    await this.page
      .getByRole('button', {
        name: 'AFECTAR PRESUPUESTO'
      })
      .click();
  }

  async completarHappyPath() {
    console.log(
      '✔ Respondiendo preguntas posteriores a Items...'
    );

    await this.responderPreguntasPostItems();

    console.log(
      '✔ Avanzando a Certificación PAC/ROM...'
    );

    await this.irACertificacionPACROM();

    console.log(
      '✔ Completando Certificación PAC/ROM...'
    );

    await this.completarCertificacionPACROM();

    console.log(
      '✔ Avanzando a Presupuesto General...'
    );

    await this.irAPresupuestoGeneral();

    console.log(
      '✔ Respondiendo preguntas de Presupuesto General...'
    );

    await this.responderPreguntasPresupuesto();

    console.log(
      '✔ Verificando detalle del presupuesto...'
    );

    await this.verificarDetallePresupuesto();

    console.log(
      '✔ Afectando presupuesto...'
    );

    await this.afectarPresupuesto();

    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      '✔ HAPPY PATH HERRERO FINALIZADO'
    );
    console.log(
      '=========================================='
    );
  }
}