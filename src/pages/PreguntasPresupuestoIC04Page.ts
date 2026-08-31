import {
  Page,
  expect
} from '@playwright/test';

export function obtenerFechaMas30Dias(): string {
  const fecha = new Date();

  fecha.setDate(
    fecha.getDate() + 30
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

    await expect(
      boton
    ).toBeEnabled({
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

    await expect(
      boton
    ).toBeEnabled({
      timeout: 60000
    });

    await boton.click();
  }

  private async responderNosHastaFecha(
    maximo: number
  ) {
    for (
      let index = 1;
      index <= maximo;
      index++
    ) {
      console.log(
        `✔ [IC04/Presupuesto] Esperando pregunta NO ${index}/${maximo} o campo de fecha...`
      );

      const botonNo =
        this.page.getByRole(
          'button',
          {
            name: 'NO',
            exact: true
          }
        ).first();

      const campoFecha =
        this.page.getByRole(
          'textbox',
          {
            name: 'DD/MM/AAAA'
          }
        ).first();

      const inicio =
        Date.now();

      const timeout =
        60000;

      let respondioNo =
        false;

      while (
        Date.now() - inicio <
        timeout
      ) {
        const fechaVisible =
          await campoFecha
            .isVisible()
            .catch(
              () => false
            );

        if (
          fechaVisible
        ) {
          console.log(
            `✔ [IC04/Presupuesto] Campo de fecha detectado después de ${index - 1} respuestas NO.`
          );

          return;
        }

        const noVisible =
          await botonNo
            .isVisible()
            .catch(
              () => false
            );

        if (
          noVisible
        ) {
          await expect(
            botonNo
          ).toBeEnabled({
            timeout: 30000
          });

          await botonNo.click();

          console.log(
            `✔ [IC04/Presupuesto] Respuesta NO ${index} completada.`
          );

          respondioNo =
            true;

          break;
        }

        await this.page.waitForTimeout(
          500
        );
      }

      if (
        !respondioNo
      ) {
        throw new Error(
          `[IC04/Presupuesto] No apareció ni el botón NO ni el campo DD/MM/AAAA en la pregunta ${index}.`
        );
      }
    }

    /*
     * Si llegamos al máximo configurado,
     * esperamos explícitamente que aparezca
     * el campo de fecha.
     */
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

    console.log(
      `✔ [IC04/Presupuesto] Campo de fecha detectado después de ${maximo} respuestas NO.`
    );
  }

  async completar() {
    console.log(
      '✔ [IC04/Presupuesto] Iniciando preguntas de Presupuesto General...'
    );

    /*
     * 1 - Tipo de mercadería
     */
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

    console.log(
      '✔ [IC04/Presupuesto] MERCADERIAS QUE NO SE... seleccionado.'
    );

    /*
     * 2 - Giro de divisas
     */
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

    console.log(
      '✔ [IC04/Presupuesto] Giro de divisas seleccionado.'
    );

    /*
     * 3 - Digitalización
     */
    const digitalizacion =
      this.page.getByRole(
        'radio',
        {
          name:
            /DIGITALIZACION POR PSAD/i
        }
      );

    await digitalizacion.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await digitalizacion.check();

    await this.confirmarSeleccion();

    console.log(
      '✔ [IC04/Presupuesto] DIGITALIZACION POR PSAD seleccionada.'
    );

    /*
     * 4 - Banco
     */
    const banco =
      this.page.getByRole(
        'radio',
        {
          name:
            /BANCO DE LA NACION ARGENTINA/i
        }
      );

    await banco.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await banco.check();

    await this.confirmarSeleccion();

    console.log(
      '✔ [IC04/Presupuesto] Banco Nación seleccionado.'
    );

    /*
     * Preguntas NO previas a la fecha.
     *
     * La cantidad puede variar según
     * las respuestas/reglas del backend.
     */
    await this.responderNosHastaFecha(
      6
    );

    /*
     * Fecha automática +30 días
     */
    const fechaMas30 =
      obtenerFechaMas30Dias();

    console.log(
      `✔ [IC04/Presupuesto] Fecha automática (+30 días): ${fechaMas30}`
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
      fechaMas30
    );

    const guardar =
      this.page.getByRole(
        'button',
        {
          name: 'GUARDAR RESPUESTA',
          exact: true
        }
      );

    await guardar.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await expect(
      guardar
    ).toBeEnabled({
      timeout: 60000
    });

    await guardar.click();

    console.log(
      '✔ [IC04/Presupuesto] Fecha guardada correctamente.'
    );

    /*
     * Pregunta posterior a la fecha.
     */
    await this.responderNo();

    console.log(
      '✔ [IC04/Presupuesto] Pregunta posterior a fecha respondida: NO.'
    );

    /*
     * Selección PSAD.
     *
     * El HTML confirma que PSAD02 es
     * un radio button real.
     */
    const psad02 =
      this.page.getByRole(
        'radio',
        {
          name:
            /PSAD02 - BOX CUSTODIA DE ARCHIVOS S\.A\./i
        }
      );

    await psad02.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await psad02.check();

    console.log(
      '✔ [IC04/Presupuesto] PSAD02 seleccionado.'
    );

    await this.confirmarSeleccion();

    console.log(
      '✔ [IC04/Presupuesto] PSAD02 confirmado.'
    );

    /*
     * Presentación de documentación
     */
    const noDeboPresentar =
      this.page.getByRole(
        'radio',
        {
          name:
            /No debo presentar la/i
        }
      );

    await noDeboPresentar.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await noDeboPresentar.check();

    await this.confirmarSeleccion();

    console.log(
      '✔ [IC04/Presupuesto] No debo presentar la... seleccionado.'
    );

    console.log(
      '✔ [IC04/Presupuesto] Preguntas completadas correctamente.'
    );
  }
}