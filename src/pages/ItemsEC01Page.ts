import { Page, expect } from '@playwright/test';

type ModoSufijos = 'automatico' | 'asistido';

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

type SufijoItem = SufijoTexto | SufijoCombo;

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

  private async seleccionarOpcion(opcion: string) {
    await this.page
      .getByRole('option', {
        name: opcion
      })
      .first()
      .click();
  }

  async abrirNuevoItem() {
    const botonAgregarItem =
      this.page.getByRole('button', {
        name: 'AGREGAR ITEM'
      });

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

    await this.page
      .getByText(
        posicionArancelaria,
        {
          exact: true
        }
      )
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

    await this.page
      .getByRole('button', {
        name: 'NO',
        exact: true
      })
      .waitFor({
        state: 'visible',
        timeout: 30000
      });

    await this.page
      .getByRole('button', {
        name: 'NO',
        exact: true
      })
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
    const campo = this.page.getByRole(
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

    await campo.fill(sufijo.valor);

    await expect(campo).toHaveValue(
      sufijo.valor
    );
  }

  private async completarSufijoCombo(
    sufijo: SufijoCombo
  ) {
    const combos = this.page.getByRole(
      'combobox',
      {
        name: new RegExp(
          sufijo.nombreAccesible,
          'i'
        )
      }
    );

    const indice = sufijo.indice ?? 0;
    const combo = combos.nth(indice);

    await combo.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await combo.click();

    await this.seleccionarOpcion(
      sufijo.valor
    );
  }

  async completarSufijosAutomaticamente(
    sufijos: SufijoItem[]
  ) {
    for (const sufijo of sufijos) {
      if (sufijo.tipo === 'texto') {
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

  async cargarItem() {
    await this.page
      .getByRole('button', {
        name: 'CARGAR ITEMS'
      })
      .click();
  }

  async completarItem(
    data: ItemEC01Data
  ): Promise<ResultadoCargaItem> {
    await this.abrirNuevoItem();

    await this.seleccionarPosicionArancelaria(
      data.posicionArancelaria
    );

    await this.completarCabecera(data);

    // Orden real validado por Codegen:
    // Cabecera → Continuar → Sin SubItems → Valores → Sufijos → Cargar Item

    await this.continuarSinSubitems();

    await this.completarValores(data);

    await this.abrirSufijos();

    if (data.modoSufijos === 'asistido') {
      return 'asistido';
    }

    if (
      !Array.isArray(data.sufijos) ||
      data.sufijos.length === 0
    ) {
      return 'asistido';
    }

    await this.completarSufijosAutomaticamente(
      data.sufijos
    );

    await this.cargarItem();

    return 'completado';
  }
}