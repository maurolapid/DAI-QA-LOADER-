import { Page, expect } from '@playwright/test';
import { BultosPage } from './BultosPage';

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

    await guardarButton.click({ timeout: 120000 });

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

    await boton.click({ timeout: 120000 });
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

    await boton.click({ timeout: 120000 });
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

    await boton.click({ timeout: 120000 });
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

    await radio.check({ timeout: 120000 });

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

    await radio.check({ timeout: 120000 });

    await this.confirmarSeleccion();
  }

  private async esperarYCerrarModalMensajesItemsSiAparece() {
    const botonEntendido =
      this.page.getByRole('button', {
        name: 'Entendido',
        exact: true
      });

    const botonNuevo =
      this.page.getByRole('button', {
        name: 'Ir a Certificado PAC/ROM',
        exact: true
      });

    const botonAnterior =
      this.page.getByRole('button', {
        name: 'ir a Certificación PAC/ROM',
        exact: true
      });

    console.log(
      '✔ Esperando modal de mensajes o botón de Certificado PAC/ROM...'
    );

    const estado = await expect
      .poll(
        async () => {
          if (
            await botonEntendido
              .isVisible()
              .catch(() => false)
          ) {
            return 'modal';
          }

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
          await botonEntendido
            .isVisible()
            .catch(() => false)
        ) {
          return 'modal' as const;
        }

        if (
          await botonNuevo
            .isVisible()
            .catch(() => false)
        ) {
          return 'nuevo' as const;
        }

        return 'anterior' as const;
      });

    if (estado === 'modal') {
      console.log(
        '✔ Modal "Revisá los mensajes del ítem" detectado.'
      );

      await expect(
        botonEntendido
      ).toBeEnabled({
        timeout: 30000
      });

      await botonEntendido.click({ timeout: 120000 });

      await botonEntendido
        .waitFor({
          state: 'hidden',
          timeout: 30000
        })
        .catch(() => {});

      console.log(
        '✔ Modal de mensajes de Items cerrado.'
      );
    }
  }

  protected async irACertificacionPACROM() {
    await this.esperarYCerrarModalMensajesItemsSiAparece();

    const botonNuevo =
      this.page.getByRole('button', {
        name: 'Ir a Certificado PAC/ROM',
        exact: true
      });

    const botonAnterior =
      this.page.getByRole('button', {
        name: 'ir a Certificación PAC/ROM',
        exact: true
      });

    const boton = await expect
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
          return botonNuevo;
        }

        return botonAnterior;
      });

    await expect(
      boton
    ).toBeEnabled({
      timeout: 60000
    });

    console.log(
      '✔ Avanzando a Certificado PAC/ROM...'
    );

    await boton.click({ timeout: 120000 });
  }

  protected async completarCertificacionPACROM(
    _nombreTransporte: string
  ) {
    const bultosPage =
      new BultosPage(
        this.page
      );

    await bultosPage
      .completar();
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

    await boton.click({ timeout: 120000 });
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

    await verDetalle.click({ timeout: 120000 });

    const cerrar =
      this.page.getByRole('button', {
        name: 'Cerrar'
      });

    await cerrar.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await cerrar.click({ timeout: 120000 });
  }
}
