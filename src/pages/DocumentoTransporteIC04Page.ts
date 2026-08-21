import {
  Page,
  expect
} from '@playwright/test';

export type ResultadoDocumentoTransporte =
  | 'aceptado'
  | 'rechazado';

function escaparRegex(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

export class DocumentoTransporteIC04Page {
  constructor(private page: Page) {}

  async completarDatos(
    puertoBusqueda: string,
    documento: string
  ) {
    const puertoNormalizado =
      puertoBusqueda
        .trim()
        .toUpperCase();

    const documentoNormalizado =
      documento.trim();

    if (
      !puertoNormalizado
    ) {
      throw new Error(
        'El puerto/documento de procedencia no puede estar vacío.'
      );
    }

    if (
      !documentoNormalizado
    ) {
      throw new Error(
        'El documento de transporte no puede estar vacío.'
      );
    }

    const campoPuerto =
      this.page.getByRole(
        'textbox',
        {
          name:
            /Ingresar documento de/i
        }
      ).first();

    await campoPuerto.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await campoPuerto.fill(
      puertoNormalizado
    );

    const opcionPuerto =
      this.page.getByText(
        new RegExp(
          `^${escaparRegex(
            puertoNormalizado
          )}\\s*-`,
          'i'
        )
      ).first();

    await opcionPuerto.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await opcionPuerto.click();

    const campoDocumento =
      this.page.getByLabel(
        'Ingresar documento de'
      );

    await campoDocumento.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await campoDocumento.fill(
      documentoNormalizado
    );

    const combo =
      this.page.getByRole(
        'combobox',
        {
          name:
            /Seleccione una opción/i
        }
      );

    await combo.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await combo.click();

    await this.page
      .getByRole(
        'option',
        {
          name: 'Si',
          exact: true
        }
      )
      .click();
  }

  async presentar(): Promise<
    ResultadoDocumentoTransporte
  > {
    const botonPresentar =
      this.page.getByRole(
        'button',
        {
          name: 'PRESENTAR',
          exact: true
        }
      );

    await botonPresentar.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await botonPresentar.click();

    const errorDocumento =
      this.page.getByText(
        'Error en campo Bultos / Nro.',
        {
          exact: false
        }
      );

    const botonPresupuesto =
      this.page.getByRole(
        'button',
        {
          name:
            'ir a Presupuesto General',
          exact: true
        }
      );

    /*
     * IMPORTANTE:
     * El botón "ir a Presupuesto General" ya existe en pantalla
     * mientras el documento se está validando, pero permanece disabled.
     *
     * Por eso NO alcanza con esperar que esté visible.
     * Sólo consideramos el documento aceptado cuando el botón queda ENABLED.
     *
     * En paralelo esperamos el mensaje real de rechazo del RPA.
     */
    const resultado =
      await Promise.race<
        ResultadoDocumentoTransporte
      >([
        errorDocumento
          .waitFor({
            state: 'visible',
            timeout: 60000
          })
          .then(
            () => 'rechazado' as const
          ),

        expect(
          botonPresupuesto
        )
          .toBeEnabled({
            timeout: 60000
          })
          .then(
            () => 'aceptado' as const
          )
      ]);

    if (
      resultado === 'rechazado'
    ) {
      console.log(
        '⚠ Error de documento detectado en pantalla.'
      );

      const aceptar =
        this.page.getByRole(
          'button',
          {
            name: 'ACEPTAR',
            exact: true
          }
        );

      await aceptar.waitFor({
        state: 'visible',
        timeout: 30000
      });

      await aceptar.click();

      /*
       * Esperamos que el formulario vuelva a quedar disponible
       * antes de devolver "rechazado" al flow.
       * Esto permite que el siguiente intento pueda volver a
       * escribir puerto y documento sin carreras de UI.
       */
      await this.page
        .getByRole(
          'textbox',
          {
            name:
              /Ingresar documento de/i
          }
        )
        .first()
        .waitFor({
          state: 'visible',
          timeout: 30000
        });
    }

    return resultado;
  }

  async irAPresupuestoGeneral() {
    const boton =
      this.page.getByRole(
        'button',
        {
          name:
            'ir a Presupuesto General',
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
}