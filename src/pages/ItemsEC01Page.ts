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
      name: 'Posición arancelaria'
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
    return this.page.locator(
      '#cantunidades_estadisticas_paso_items_seccion_valor_del_item'
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
    const botonAgregarItem =
      apertura === 'primer'
        ? this.page.getByRole(
            'button',
            {
              name: 'AGREGAR ITEM',
              exact: true
            }
          )
        : this.page.getByRole(
            'button',
            {
              name: 'Agregar item',
              exact: true
            }
          );

    await botonAgregarItem.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await botonAgregarItem.click();
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
    await this.tipoCombo().click();

    await this.seleccionarOpcion(
      data.tipoOpcion
    );

    await this.estadoMercaderiaCombo().click();

    await this.seleccionarOpcion(
      data.estadoMercaderiaOpcion
    );

    await this.origenCombo().click();

    await this.seleccionarOpcion(
      data.origenOpcion
    );

    await this.paisProcedenciaCombo().click();

    await this.seleccionarOpcion(
      data.paisProcedenciaOpcion
    );

    await this.unidadDeclaradaCombo().click();

    await this.seleccionarOpcion(
      data.unidadDeclaradaOpcion
    );

    await this.totalKiloNetoInput().fill(
      data.totalKiloNeto
    );

    await expect(
      this.totalKiloNetoInput()
    ).toHaveValue(
      data.totalKiloNeto
    );
  }

  async continuarSinSubitems() {
    await this.page
      .getByRole('button', {
        name: 'CONTINUAR'
      })
      .click();

    const botonNo =
      this.page.getByRole(
        'button',
        {
          name: 'NO',
          exact: true
        }
      );

    await botonNo.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await botonNo.click();
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
    const botonCargarItems =
      this.page.getByRole(
        'button',
        {
          name: 'CARGAR ITEMS',
          exact: true
        }
      );

    await botonCargarItems.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await botonCargarItems.click();
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