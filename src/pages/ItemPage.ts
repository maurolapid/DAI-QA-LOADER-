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
      name: 'Posición arancelaria'
    });
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

    await this.page
      .getByText(codigo, {
        exact: true
      })
      .nth(1)
      .click();

    await expect(input).toHaveValue(
      codigo
    );
  }

  async completarCabeceraIC04() {
    await this.page
      .locator(
        '#tipo_paso_items_seccion_cabecera'
      )
      .click();

    await this.seleccionarOpcion(
      'N - Normal'
    );

    await this.page
      .locator(
        '#estmercad_paso_items_seccion_cabecera'
      )
      .click();

    await this.seleccionarOpcion(
      '- NUEVO SIN USO IMPORTADO'
    );

    await this.page
      .locator(
        '#origen_paisprov_paso_items_seccion_cabecera'
      )
      .click();

    await this.seleccionarOpcion(
      '- CHINA'
    );

    await this.page
      .locator(
        '#pais_procdestino_paso_items_seccion_cabecera'
      )
      .click();

    await this.seleccionarOpcion(
      '- CHINA'
    );

    await this.page
      .locator(
        '#unidad_declarada_paso_items_seccion_cabecera'
      )
      .click();

    await this.seleccionarOpcion(
      '- KILOGRAMO'
    );

    const totalKiloNeto =
      this.page.locator(
        '#total_kilo_neto_paso_items_seccion_cabecera'
      );

    await totalKiloNeto.fill('10');

    await expect(
      totalKiloNeto
    ).toHaveValue('10');
  }

  async continuarSinSubitems() {
    await this.page
      .getByRole('button', {
        name: 'CONTINUAR'
      })
      .click();

    await this.page
      .getByText(
        '¿Desea agregar subitems?'
      )
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

  async completarVentajasIC04() {
    const fobTotal =
      this.page.locator(
        '#fob_total_en_divisa_paso_items_seccion_valor_del_item'
      );

    await fobTotal.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await fobTotal.fill('10');

    await expect(
      fobTotal
    ).toHaveValue('10');
  }

  async completarValorItemIC04() {
    const cantidadDeclarada =
      this.page.locator(
        '#cantidad_declarada_paso_items_seccion_valor_del_item'
      );

    await cantidadDeclarada.fill(
      '10'
    );

    await expect(
      cantidadDeclarada
    ).toHaveValue('10');

    const unidadesEstadisticas =
      this.page.locator(
        '#cantunidades_estadisticas_paso_items_seccion_valor_del_item'
      );

    await unidadesEstadisticas.fill(
      '10'
    );

    await expect(
      unidadesEstadisticas
    ).toHaveValue('10');
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

    const indice =
      sufijo.indice ?? 0;

    const combo =
      combos.nth(indice);

    await combo.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await combo.click();

    await this.seleccionarOpcion(
      sufijo.valor
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

    await this.page
      .getByRole('button', {
        name: 'CARGAR ITEMS'
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