import { Page } from '@playwright/test';

export class PreguntasItemIC04Page {
  constructor(private page: Page) {}

  private async confirmarSeleccion() {
    const boton =
      this.page.getByRole(
        'button',
        {
          name: 'Confirmar selección',
          exact: true
        }
      );

    await boton.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await boton.click();
  }

  private async responderBoton(
    nombre: 'NO' | 'SÍ'
  ) {
    const boton =
      this.page.getByRole(
        'button',
        {
          name: nombre,
          exact: true
        }
      );

    await boton.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await boton.click();
  }

  async responderPreguntas73181500620M() {
    console.log(
      '✔ [IC04/Preguntas] Iniciando preguntas para 7318.15.00.620M...'
    );

    // Pregunta 1
    await this.confirmarSeleccion();

    const importacionDestinada =
      this.page.getByRole(
        'radio',
        {
          name:
            /Importación destinada al/i
        }
      );

    await importacionDestinada.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await importacionDestinada.check();

    await this.confirmarSeleccion();

    // Pregunta 2
    const giroDivisas =
      this.page.getByRole(
        'radio',
        {
          name:
            /Importacion con giro de divisas.*PAGO DIFERIDO.*Divisas compradas en MLC/i
        }
      );

    await giroDivisas.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await giroDivisas.check();

    await this.confirmarSeleccion();

    // Preguntas SI / NO según Codegen validado
    await this.responderBoton('NO');
    await this.responderBoton('NO');
    await this.responderBoton('SÍ');

    // Selección CHAD
    const opcionChad =
      this.page.getByRole(
        'radio',
        {
          name: 'CHAD',
          exact: true
        }
      );

    await opcionChad.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await opcionChad.check();

    await this.confirmarSeleccion();

    // Confirmación adicional previa al siguiente paso
    await this.confirmarSeleccion();

    const botonCertificacion =
      this.page.getByRole(
        'button',
        {
          name:
            'ir a Certificación PAC/ROM',
          exact: true
        }
      );

    await botonCertificacion.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await botonCertificacion.click();

    console.log(
      '✔ [IC04/Preguntas] Preguntas completadas.'
    );

    console.log(
      '✔ [IC04/Preguntas] Navegación a Certificación PAC/ROM ejecutada.'
    );
  }
}