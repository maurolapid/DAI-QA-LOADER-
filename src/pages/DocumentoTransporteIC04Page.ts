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

    if (!puertoNormalizado) {
      throw new Error(
        'El puerto/documento de procedencia no puede estar vacío.'
      );
    }

    if (!documentoNormalizado) {
      throw new Error(
        'El documento de transporte no puede estar vacío.'
      );
    }

    /*
     * CAMPO 1
     * Puerto / documento de procedencia
     */
    const campoPuerto =
      this.page
        .getByRole(
          'textbox',
          {
            name:
              /Ingresar documento de/i
          }
        )
        .first();

    await campoPuerto.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await campoPuerto.fill(
      puertoNormalizado
    );

    const opcionPuerto =
      this.page
        .getByText(
          new RegExp(
            `^${escaparRegex(
              puertoNormalizado
            )}\\s*-`,
            'i'
          )
        )
        .first();

    await opcionPuerto.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await opcionPuerto.click();

    console.log(
      `✔ Puerto/procedencia seleccionado: ${puertoNormalizado}`
    );

    /*
     * CAMPO 2
     * Documento de transporte
     *
     * Existen dos textboxes cuyo accessible name
     * comienza con "Ingresar documento de".
     *
     * El segundo corresponde al documento.
     */
    const campoDocumento =
      this.page
        .getByRole(
          'textbox',
          {
            name:
              /Ingresar documento de/i
          }
        )
        .nth(1);

    await campoDocumento.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await campoDocumento.fill(
      documentoNormalizado
    );

    console.log(
      `✔ Documento de transporte ingresado: ${documentoNormalizado}`
    );

    /*
     * PRESENCIA DEL DOCUMENTO DE TRANSPORTE
     *
     * El componente es un MUI Select:
     *
     * <div
     *   role="combobox"
     *   aria-haspopup="listbox"
     * >
     *
     * No posee un accessible name útil,
     * por eso NO lo buscamos por texto.
     *
     * Tomamos el último combobox visible de esta
     * pantalla, que corresponde a Presencia del
     * Documento de Transporte.
     */
    const comboPresenciaDocumento =
      this.page
        .locator(
          'div[role="combobox"][aria-haspopup="listbox"]:visible'
        )
        .last();

    await comboPresenciaDocumento.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await expect(
      comboPresenciaDocumento
    ).toBeEnabled({
      timeout: 60000
    });

    await comboPresenciaDocumento.click();

    console.log(
      '✔ Selector de presencia de documento abierto.'
    );

    /*
     * HTML real:
     *
     * SI
     * <li
     *   role="option"
     *   data-value="SI"
     * >
     *   Si
     * </li>
     *
     * NO
     * <li
     *   role="option"
     *   data-value="NO"
     * >
     *   No
     * </li>
     */
    const opcionSi =
      this.page.locator(
        'li[role="option"][data-value="SI"]'
      );

    await opcionSi.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await opcionSi.click();

    console.log(
      '✔ Presencia del documento de transporte: SI'
    );
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

    await expect(
      botonPresentar
    ).toBeEnabled({
      timeout: 30000
    });

    console.log(
      '✔ Presentando documento de transporte...'
    );

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
     * VALIDACIÓN RPA
     *
     * El botón "ir a Presupuesto General"
     * ya existe mientras el documento está
     * siendo validado, pero permanece disabled.
     *
     * DOCUMENTO ACEPTADO:
     * "ir a Presupuesto General" queda ENABLED.
     *
     * DOCUMENTO RECHAZADO:
     * aparece:
     * "Error en campo Bultos / Nro."
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
            () =>
              'rechazado' as const
          ),

        expect(
          botonPresupuesto
        )
          .toBeEnabled({
            timeout: 60000
          })
          .then(
            () =>
              'aceptado' as const
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
       * Esperamos que el formulario vuelva
       * a estar disponible.
       *
       * Así el launcher puede permitir:
       *
       * - Reintentar
       * - Guardar operación pendiente
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

      return 'rechazado';
    }

    console.log(
      '✔ Documento de transporte aceptado.'
    );

    return 'aceptado';
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

    console.log(
      '✔ Navegando a Presupuesto General...'
    );

    await boton.click();
  }
}