import { Page, expect } from '@playwright/test';

type ModoSufijos =
  | 'automatico'
  | 'asistido';

type SufijoTexto = {
  tipo: 'texto';
  nombreAccesible: string;
  valor: string;
};

type SufijoCombo = {
  tipo: 'combo';
  nombreAccesible: string;
  valor: string;
  indice?: number;
};

type SufijoItem =
  | SufijoTexto
  | SufijoCombo;

type ItemIC04Data = {
  posicionArancelaria: string;

  tipoOpcion: string;
  estadoMercaderiaOpcion: string;
  origenOpcion: string;
  paisProcedenciaOpcion: string;
  unidadDeclaradaOpcion: string;

  totalKiloNeto: string;

  fobTotalDivisa: string;
  cantidadDeclarada: string;
  cantidadUnidadesEstadisticas: string;

  modoSufijos: ModoSufijos;
  sufijos: SufijoItem[];
};

export type ResultadoCargaSufijos =
  | 'completado'
  | 'asistido';

export class ItemPage {
  constructor(private page: Page) {}

  private posicionArancelariaInput() {
    return this.page.getByRole('textbox', {
      name: 'Ej: 0000.00.00.000A'
    });
  }

  private async seleccionarOpcion(
    opcion: string
  ) {
    const locator =
      this.page.getByRole('option', {
        name: opcion
      }).first();

    await locator.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await locator.click();
  }

  async abrirPrimerItem() {
    const candidatos = [
      this.page.getByRole('button', {
        name: /^Agregar ítem$/i
      }),
      this.page.getByRole('button', {
        name: /^Agregar item$/i
      })
    ];

    let botonAgregarItem = candidatos[0];

    for (const candidato of candidatos) {
      if (
        await candidato
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        botonAgregarItem =
          candidato.first();
        break;
      }
    }

    await botonAgregarItem.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await expect(
      botonAgregarItem
    ).toBeEnabled({
      timeout: 30000
    });

    await botonAgregarItem.click();
  }

  async agregarOtroItem() {
    const candidatos = [
      this.page.getByRole('button', {
        name: /^\+ Agregar item$/i
      }),
      this.page.getByRole('button', {
        name: /^\+ Agregar ítem$/i
      }),
      this.page.getByRole('button', {
        name: /^Agregar item$/i
      })
    ];

    let botonAgregarItem = candidatos[0];

    for (const candidato of candidatos) {
      if (
        await candidato
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        botonAgregarItem =
          candidato.first();
        break;
      }
    }

    await botonAgregarItem.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await expect(
      botonAgregarItem
    ).toBeEnabled({
      timeout: 30000
    });

    await botonAgregarItem.click();
  }

  async cargarTodosLosItems() {
    const candidatos = [
      this.page.getByRole('button', {
        name: 'Validar items',
        exact: true
      }),
      this.page.getByRole('button', {
        name: 'CARGAR ITEMS',
        exact: true
      })
    ];

    let botonFinal = candidatos[0];

    for (const candidato of candidatos) {
      if (
        await candidato
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        botonFinal =
          candidato.first();
        break;
      }
    }

    await botonFinal.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await expect(
      botonFinal
    ).toBeEnabled({
      timeout: 30000
    });

    await botonFinal.click();
  }

  async completarPosicionArancelaria(
    codigo: string
  ) {
    const input =
      this.posicionArancelariaInput();

    await input.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await input.fill(codigo);

    const opcion =
      this.page.getByText(
        codigo,
        {
          exact: true
        }
      );

    await opcion
      .last()
      .waitFor({
        state: 'visible',
        timeout: 30000
      });

    await opcion
      .last()
      .click();

    await expect(input).toHaveValue(
      codigo
    );
  }

  async completarCabeceraIC04(
    data: ItemIC04Data
  ) {
    await this.page
      .getByRole('radio', {
        name: data.tipoOpcion,
        exact: true
      })
      .check();

    await this.page
      .getByText(
        'Seleccioná el estado de',
        { exact: false }
      )
      .click();

    await this.seleccionarOpcion(
      data.estadoMercaderiaOpcion
    );

    await this.page
      .locator(
        '#origen_paisprov_paso_items_seccion_cabecera'
      )
      .getByText(
        'Seleccioná el país',
        { exact: false }
      )
      .click();

    await this.seleccionarOpcion(
      data.origenOpcion
    );

    await this.page
      .locator(
        '#pais_procdestino_paso_items_seccion_cabecera'
      )
      .getByText(
        'Seleccioná el país',
        { exact: false }
      )
      .click();

    await this.seleccionarOpcion(
      data.paisProcedenciaOpcion
    );

    await this.page
      .getByRole('combobox', {
        name: 'Seleccioná una opción',
        exact: true
      })
      .click();

    await this.seleccionarOpcion(
      data.unidadDeclaradaOpcion
    );

    const totalKiloNeto =
      this.page.getByRole(
        'textbox',
        {
          name: 'Ej: 5000,0000'
        }
      );

    await totalKiloNeto.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await totalKiloNeto.fill(
      data.totalKiloNeto
    );

    await expect(
      totalKiloNeto
    ).toHaveValue(
      data.totalKiloNeto
    );
  }

  async continuarSinSubitems() {
    const seccionValor =
      this.page.getByText(
        'Valor del item',
        { exact: false }
      ).first();

    await seccionValor.waitFor({
      state: 'visible',
      timeout: 30000
    });

    const botonVerMasCercano =
      seccionValor
        .locator('xpath=..')
        .getByRole('button', {
          name: /Ver más/i
        });

    if (
      await botonVerMasCercano.count() > 0 &&
      await botonVerMasCercano
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await botonVerMasCercano
        .first()
        .click();

      return;
    }

    const botonesVerMas =
      this.page.getByRole(
        'button',
        {
          name: /Ver más/i
        }
      );

    const cantidad =
      await botonesVerMas.count();

    if (cantidad === 0) {
      throw new Error(
        'No se encontró el botón para desplegar "Valor del item".'
      );
    }

    await botonesVerMas
      .nth(
        Math.min(
          2,
          cantidad - 1
        )
      )
      .click();
  }

  async completarVentajasIC04(
    data: ItemIC04Data
  ) {
    const fobTotal =
      this.page.locator(
        '#fob_total_en_divisa_paso_items_seccion_valor_del_item'
      );

    await fobTotal.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await fobTotal.fill(
      data.fobTotalDivisa
    );

    await expect(
      fobTotal
    ).toHaveValue(
      data.fobTotalDivisa
    );
  }

  async completarValorItemIC04(
    data: ItemIC04Data
  ) {
    const cantidadDeclarada =
      this.page.locator(
        '#cantidad_declarada_paso_items_seccion_valor_del_item'
      );

    await cantidadDeclarada.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await cantidadDeclarada.fill(
      data.cantidadDeclarada
    );

    await expect(
      cantidadDeclarada
    ).toHaveValue(
      data.cantidadDeclarada
    );

    const unidadesEstadisticas =
      this.page.getByRole(
        'textbox',
        {
          name: 'Seleccioná una opción de'
        }
      );

    await unidadesEstadisticas.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await unidadesEstadisticas.fill(
      data.cantidadUnidadesEstadisticas
    );

    await expect(
      unidadesEstadisticas
    ).toHaveValue(
      data.cantidadUnidadesEstadisticas
    );
  }

  async abrirSufijos() {
    const botonAgregarSufijo =
      this.page.getByRole('button', {
        name: 'Agregar sufijo'
      });

    await botonAgregarSufijo.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await botonAgregarSufijo.click();
  }

  private async completarSufijoTexto(
    sufijo: SufijoTexto
  ) {
    const campo =
      this.page.getByRole(
        'textbox',
        {
          name: new RegExp(
            sufijo.nombreAccesible,
            'i'
          )
        }
      );

    await campo.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await campo.fill(
      sufijo.valor
    );

    await expect(campo).toHaveValue(
      sufijo.valor
    );
  }

  private async completarSufijoCombo(
    sufijo: SufijoCombo
  ) {
    const combos =
      this.page.getByRole(
        'combobox',
        {
          name: new RegExp(
            sufijo.nombreAccesible,
            'i'
          )
        }
      );

    const cantidadCombos =
      await combos.count();

    if (cantidadCombos === 0) {
      throw new Error(
        `No se encontró ningún combo para el sufijo "${sufijo.valor}"`
      );
    }

    console.log(
      `✔ Combos encontrados para "${sufijo.nombreAccesible}": ${cantidadCombos}`
    );

    if (
      sufijo.indice !== undefined
    ) {
      const combo =
        combos.nth(sufijo.indice);

      await combo.waitFor({
        state: 'visible',
        timeout: 30000
      });

      await combo.click();

      const opcion =
        this.page.getByRole(
          'option',
          {
            name: sufijo.valor,
            exact: true
          }
        ).first();

      await opcion.waitFor({
        state: 'visible',
        timeout: 30000
      });

      await opcion.click();

      console.log(
        `✔ Sufijo combo seleccionado: ${sufijo.valor}`
      );

      return;
    }

    for (
      let indice = 0;
      indice < cantidadCombos;
      indice++
    ) {
      const combo =
        combos.nth(indice);

      if (
        !(await combo
          .isVisible()
          .catch(() => false))
      ) {
        continue;
      }

      await combo.click();

      const opcion =
        this.page.getByRole(
          'option',
          {
            name: sufijo.valor,
            exact: true
          }
        );

      if (
        await opcion.count() > 0 &&
        await opcion
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await opcion
          .first()
          .click();

        console.log(
          `✔ Sufijo combo seleccionado: ${sufijo.valor}`
        );

        return;
      }

      await this.page
        .keyboard
        .press('Escape')
        .catch(() => undefined);
    }

    throw new Error(
      `No se pudo seleccionar el sufijo combo "${sufijo.valor}"`
    );
  }

  private async completarSufijosAutomaticamente(
    sufijos: SufijoItem[]
  ) {
    for (
      const sufijo of sufijos
    ) {
      if (
        sufijo.tipo === 'texto'
      ) {
        await this.completarSufijoTexto(
          sufijo
        );

        continue;
      }

      await this.completarSufijoCombo(
        sufijo
      );
    }

    await this.page
      .getByRole('button', {
        name: 'AGREGAR SUFIJOS'
      })
      .click();
  }

  async completarSufijos(
    data: ItemIC04Data
  ): Promise<ResultadoCargaSufijos> {
    await this.abrirSufijos();

    if (
      data.modoSufijos ===
      'asistido'
    ) {
      return 'asistido';
    }

    if (
      !Array.isArray(
        data.sufijos
      ) ||
      data.sufijos.length === 0
    ) {
      return 'asistido';
    }

    await this
      .completarSufijosAutomaticamente(
        data.sufijos
      );

    return 'completado';
  }
}
