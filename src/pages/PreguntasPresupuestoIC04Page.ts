import { Page } from '@playwright/test';

export function obtenerFechaMas20Dias(): string {
  const fecha =
    new Date();

  fecha.setDate(
    fecha.getDate() + 20
  );

  const dia =
    String(
      fecha.getDate()
    ).padStart(
      2,
      '0'
    );

  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const anio =
    fecha.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

export class PreguntasPresupuestoIC04Page {
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

  private async responderNo() {
    const boton =
      this.page.getByRole(
        'button',
        {
          name: 'NO',
          exact: true
        }
      ).first();

    await boton.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await boton.click();
  }

  async completar() {
    const mercaderias =
      this.page.getByRole(
        'radio',
        {
          name:
            /MERCADERIAS QUE NO SE/i
        }
      );

    await mercaderias.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await mercaderias.check();
    await this.confirmarSeleccion();

    const giroDivisas =
      this.page.getByRole(
        'radio',
        {
          name:
            /Importacion con giro de divisas.*PAGO DIFERIDO.*Divisas compradas en MLC/i
        }
      );

    await giroDivisas.check();
    await this.confirmarSeleccion();

    const digitalizacion =
      this.page.getByRole(
        'radio',
        {
          name:
            /DIGITALIZACION POR PSAD/i
        }
      );

    await digitalizacion.check();
    await this.confirmarSeleccion();

    const banco =
      this.page.getByRole(
        'radio',
        {
          name:
            /BANCO DE LA NACION ARGENTINA/i
        }
      );

    await banco.check();
    await this.confirmarSeleccion();

    for (
      let index = 0;
      index < 6;
      index++
    ) {
      await this.responderNo();
    }

    const fechaMas20 =
      obtenerFechaMas20Dias();

    console.log(
      `✔ [IC04/Presupuesto] Fecha automática (+20 días): ${fechaMas20}`
    );

    const campoFecha =
      this.page.getByRole(
        'textbox',
        {
          name: 'DD/MM/AAAA'
        }
      ).first();

    await campoFecha.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await campoFecha.fill(
      fechaMas20
    );

    const guardar =
      this.page.getByRole(
        'button',
        {
          name: 'GUARDAR RESPUESTA',
          exact: true
        }
      );

    await guardar.click();

    await this.responderNo();

    const psad02 =
      this.page.getByRole(
        'radio',
        {
          name:
            /PSAD02 - BOX CUSTODIA DE/i
        }
      );

    await psad02.check();
    await this.confirmarSeleccion();

    const noDeboPresentar =
      this.page.getByRole(
        'radio',
        {
          name:
            /No debo presentar la/i
        }
      );

    await noDeboPresentar.check();
    await this.confirmarSeleccion();

    console.log(
      '✔ [IC04/Presupuesto] Preguntas completadas correctamente.'
    );
  }
}