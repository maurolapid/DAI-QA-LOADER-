import { Page, expect } from '@playwright/test';

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
      timeout: 120000
    });

    await expect(boton).toBeEnabled({
      timeout: 60000
    });

    await boton.click({
      timeout: 120000
    });
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
      timeout: 120000
    });

    await expect(boton).toBeEnabled({
      timeout: 60000
    });

    await boton.click({
      timeout: 120000
    });
  }

  private async irACertificacionPACROM() {
    const botonNuevo =
      this.page.getByRole(
        'button',
        {
          name: 'Ir a Certificado PAC/ROM',
          exact: true
        }
      );

    const botonAnterior =
      this.page.getByRole(
        'button',
        {
          name: 'ir a Certificación PAC/ROM',
          exact: true
        }
      );

    console.log(
      '✔ [IC04/Preguntas] Esperando botón de Certificado PAC/ROM...'
    );

    const tipoBoton =
      await expect
        .poll(
          async () => {
            if (
              await botonNuevo
                .isVisible()
                .catch(() => false)
            ) {
              return 'nuevo';
            }

            if (
              await botonAnterior
                .isVisible()
                .catch(() => false)
            ) {
              return 'anterior';
            }

            return 'esperando';
          },
          {
            timeout: 120000,
            intervals: [
              300,
              500,
              1000,
              2000
            ]
          }
        )
        .not.toBe('esperando')
        .then(async () => {
          if (
            await botonNuevo
              .isVisible()
              .catch(() => false)
          ) {
            return 'nuevo' as const;
          }

          return 'anterior' as const;
        });

    const botonCertificacion =
      tipoBoton === 'nuevo'
        ? botonNuevo
        : botonAnterior;

    await expect(
      botonCertificacion
    ).toBeEnabled({
      timeout: 60000
    });

    await botonCertificacion.click({
      timeout: 120000
    });
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
      timeout: 120000
    });

    await importacionDestinada.check({
      timeout: 120000
    });

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
      timeout: 120000
    });

    await giroDivisas.check({
      timeout: 120000
    });

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
      timeout: 120000
    });

    await opcionChad.check({
      timeout: 120000
    });

    await this.confirmarSeleccion();

    // Confirmación adicional previa al siguiente paso
    await this.confirmarSeleccion();

    await this.irACertificacionPACROM();

    console.log(
      '✔ [IC04/Preguntas] Preguntas completadas.'
    );

    console.log(
      '✔ [IC04/Preguntas] Navegación a Certificación PAC/ROM ejecutada.'
    );
  }
}
