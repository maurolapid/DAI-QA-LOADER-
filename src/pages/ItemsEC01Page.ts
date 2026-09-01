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

type ItemEC01Data = {
  posicionArancelaria: string;
  tipoOpcion: string;
  estadoMercaderiaOpcion: string;
  origenOpcion: string;
  paisProcedenciaOpcion: string;
  unidadDeclaradaOpcion: string;
  totalKiloNeto: string;

  modoSufijos: ModoSufijos;
  sufijos: SufijoItem[];

  fobTotalDivisa: string;
  cantidadDeclarada: string;
  cantidadUnidadesEstadisticas: string;
};

type OpcionesCargaItem = {
  apertura:
    | 'primer'
    | 'siguiente';

  cargarTodosAlFinal: boolean;
};

export type ResultadoCargaItem =
  | 'completado'
  | 'asistido';

export class ItemsEC01Page {
  constructor(private page: Page) {}

  private posicionArancelariaInput() {
    return this.page.getByRole('textbox', {
      name: 'Ej: 0000.00.00.000A'
    });
  }

  private tipoCombo() {
    return this.page.locator(
      '#tipo_paso_items_seccion_cabecera'
    );
  }

  private estadoMercaderiaCombo() {
    return this.page.locator(
      '#estmercad_paso_items_seccion_cabecera'
    );
  }

  private origenCombo() {
    return this.page.locator(
      '#origen_paisprov_paso_items_seccion_cabecera'
    );
  }

  private paisProcedenciaCombo() {
    return this.page.locator(
      '#pais_procdestino_paso_items_seccion_cabecera'
    );
  }

  private unidadDeclaradaCombo() {
    return this.page.locator(
      '#unidad_declarada_paso_items_seccion_cabecera'
    );
  }

  private totalKiloNetoInput() {
    return this.page.locator(
      '#total_kilo_neto_paso_items_seccion_cabecera'
    );
  }

  private fobTotalDivisaInput() {
    return this.page.locator(
      '#fob_total_en_divisa_paso_items_seccion_valor_del_item'
    );
  }

  private cantidadDeclaradaInput() {
    return this.page.locator(
      '#cantidad_declarada_paso_items_seccion_valor_del_item'
    );
  }

  private cantidadUnidadesEstadisticasInput() {
    return this.page.getByRole(
      'textbox',
      {
        name: 'Seleccioná una opción de'
      }
    );
  }

  private async seleccionarOpcion(
    opcion: string
  ) {
    await this.page
      .getByRole('option', {
        name: opcion
      })
      .first()
      .click();
  }

  async abrirNuevoItem(
    apertura:
      | 'primer'
      | 'siguiente'
  ) {
    const candidatos =
      apertura === 'primer'
        ? [
            this.page.getByRole(
              'button',
              {
                name: /^Agregar ítem$/i
              }
            ),
            this.page.getByRole(
              'button',
              {
                name: /^Agregar item$/i
              }
            )
          ]
        : [
            this.page.getByRole(
              'button',
              {
                name: /^\+ Agregar item$/i
              }
            ),
            this.page.getByRole(
              'button',
              {
                name: /^\+ Agregar ítem$/i
              }
            ),
            this.page.getByRole(
              'button',
              {
                name: /^Agregar item$/i
              }
            )
          ];

    console.log(
      apertura === 'primer'
        ? '✔ Esperando disponibilidad para agregar el primer Item...'
        : '✔ Esperando disponibilidad para agregar el siguiente Item...'
    );

    const indiceDisponible =
      await expect
        .poll(
          async () => {
            for (
              let indice = 0;
              indice < candidatos.length;
              indice++
            ) {
              const candidato =
                candidatos[indice].first();

              if (
                await candidato
                  .isVisible()
                  .catch(() => false)
              ) {
                return indice;
              }
            }

            return -1;
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
        .not.toBe(-1)
        .then(async () => {
          for (
            let indice = 0;
            indice < candidatos.length;
            indice++
          ) {
            if (
              await candidatos[indice]
                .first()
                .isVisible()
                .catch(() => false)
            ) {
              return indice;
            }
          }

          return -1;
        });

    if (indiceDisponible < 0) {
      throw new Error(
        apertura === 'primer'
          ? 'No se encontró el botón para agregar el primer Item.'
          : 'No se encontró el botón para agregar el siguiente Item.'
      );
    }

    const botonAgregarItem =
      candidatos[indiceDisponible].first();

    await expect(
      botonAgregarItem
    ).toBeEnabled({
      timeout: 60000
    });

    await botonAgregarItem.click();

    await this
      .posicionArancelariaInput()
      .waitFor({
        state: 'visible',
        timeout: 60000
      });
  }

  async seleccionarPosicionArancelaria(
    posicionArancelaria: string
  ) {
    const input =
      this.posicionArancelariaInput();

    await input.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await input.fill(
      posicionArancelaria
    );

    const coincidencias =
      this.page.getByText(
        posicionArancelaria,
        {
          exact: true
        }
      );

    const cantidad =
      await coincidencias.count();

    if (cantidad === 0) {
      throw new Error(
        `No se encontró la posición arancelaria ${posicionArancelaria}`
      );
    }

    await coincidencias
      .last()
      .click();
  }

  async completarCabecera(
    data: ItemEC01Data
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

    const kiloNeto =
      this.page.getByRole(
        'textbox',
        {
          name: 'Ej: 5000,0000'
        }
      );

    await kiloNeto.fill(
      data.totalKiloNeto
    );

    await expect(
      kiloNeto
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

    const botonVerMas =
      seccionValor
        .locator('xpath=..')
        .getByRole('button', {
          name: /Ver más/i
        });

    if (
      await botonVerMas.count() > 0
    ) {
      await botonVerMas.first().click();
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

  async completarValores(
    data: ItemEC01Data
  ) {
    await this.fobTotalDivisaInput().fill(
      data.fobTotalDivisa
    );

    await expect(
      this.fobTotalDivisaInput()
    ).toHaveValue(
      data.fobTotalDivisa
    );

    await this.cantidadDeclaradaInput().fill(
      data.cantidadDeclarada
    );

    await expect(
      this.cantidadDeclaradaInput()
    ).toHaveValue(
      data.cantidadDeclarada
    );

    await this
      .cantidadUnidadesEstadisticasInput()
      .fill(
        data.cantidadUnidadesEstadisticas
      );

    await expect(
      this.cantidadUnidadesEstadisticasInput()
    ).toHaveValue(
      data.cantidadUnidadesEstadisticas
    );
  }

  async abrirSufijos() {
    const botonAgregarSufijo =
      this.page.getByRole(
        'button',
        {
          name: 'Agregar sufijo'
        }
      );

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

    for (
      let indice = 0;
      indice < cantidadCombos;
      indice++
    ) {
      const combo =
        combos.nth(indice);

      if (
        !(await combo.isVisible())
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

      const cantidadOpciones =
        await opcion.count();

      if (
        cantidadOpciones > 0 &&
        await opcion
          .first()
          .isVisible()
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
        .catch(
          () => undefined
        );
    }

    throw new Error(
      `No se pudo seleccionar el sufijo combo "${sufijo.valor}"`
    );
  }

  async completarSufijosAutomaticamente(
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

  async cargarItems() {
    const botonValidarItems =
      this.page.getByRole(
        'button',
        {
          name: 'Validar items',
          exact: true
        }
      );

    await botonValidarItems.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await expect(
      botonValidarItems
    ).toBeEnabled({
      timeout: 30000
    });

    await botonValidarItems.click();
  }

  async completarItem(
    data: ItemEC01Data,
    opciones: OpcionesCargaItem
  ): Promise<ResultadoCargaItem> {
    await this.abrirNuevoItem(
      opciones.apertura
    );

    await this.seleccionarPosicionArancelaria(
      data.posicionArancelaria
    );

    await this.completarCabecera(
      data
    );

    await this.continuarSinSubitems();

    await this.completarValores(
      data
    );

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

    if (
      opciones.cargarTodosAlFinal
    ) {
      await this.cargarItems();
    }

    return 'completado';
  }
}