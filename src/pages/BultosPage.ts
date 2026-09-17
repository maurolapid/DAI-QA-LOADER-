import {
  expect,
  type Page
} from '@playwright/test';

export interface DatosBultos {
  marcas: string;
  via: string;
  diasVencimientoEmbarque: number;
  bandera: string;
  nombreTransporte: string;
  agenteTransporte: string;
  numeroBultos: string;
  embalajeCodigo: string;
  cantidadADespachar: string;
  embalajeTipo: string;
  pesoKg: string;
}

export const DATOS_BULTOS_HERRERO: DatosBultos = {
  marcas: 'SM',
  via: '2 - AVION',
  diasVencimientoEmbarque: 30,
  bandera: '998 - INDET.(CONTINENTE)',
  nombreTransporte: 'avion',
  agenteTransporte: 'INDET',
  numeroBultos: '1',
  embalajeCodigo: '99 - BULTOS',
  cantidadADespachar: '1',
  embalajeTipo: 'N - No Retornable',
  pesoKg: '10'
};

export class BultosPage {
  constructor(
    private readonly page: Page
  ) {}

  private crearFechaVencimiento(
    dias: number
  ): string {
    const fecha = new Date();

    fecha.setDate(
      fecha.getDate() + dias
    );

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    return `${dia}/${mes}/${fecha.getFullYear()}`;
  }

  private async seleccionarCombo(
    nombre: string,
    opcion: string
  ): Promise<void> {
    const combo =
      this.page.getByRole(
        'combobox',
        {
          name: nombre,
          exact: true
        }
      );

    await combo.waitFor({
      state: 'visible',
      timeout: 60000
    });

    await combo.click({
      timeout: 120000
    });

    await this.page
      .getByRole(
        'option',
        {
          name: opcion,
          exact: true
        }
      )
      .click({
        timeout: 120000
      });
  }

  async completar(
    datos:
      DatosBultos =
        DATOS_BULTOS_HERRERO
  ): Promise<void> {
    const campoMarcas =
      this.page.getByRole(
        'textbox',
        {
          name: 'Ingresar marcas'
        }
      );

    console.log(
      '✔ Esperando formulario de Bultos...'
    );

    await campoMarcas.waitFor({
      state: 'visible',
      timeout: 120000
    });

    await expect(
      campoMarcas
    ).toBeEnabled({
      timeout: 60000
    });

    await campoMarcas.fill(
      datos.marcas
    );

    await this.seleccionarCombo(
      'Via',
      datos.via
    );

    const vencimientoEmbarque =
      this.crearFechaVencimiento(
        datos.diasVencimientoEmbarque
      );

    console.log(
      `✔ Venc. Embarque automático (+${datos.diasVencimientoEmbarque} días): ${vencimientoEmbarque}`
    );

    await this.page
      .getByRole(
        'textbox',
        {
          name: 'DD/MM/AAAA'
        }
      )
      .fill(
        vencimientoEmbarque
      );

    await this.seleccionarCombo(
      'Bandera',
      datos.bandera
    );

    await this.page
      .getByRole(
        'textbox',
        {
          name:
            'Ingresar nombre del transporte'
        }
      )
      .fill(
        datos.nombreTransporte
      );

    await this.page
      .getByRole(
        'textbox',
        {
          name:
            'Ingresar el agente de'
        }
      )
      .fill(
        datos.agenteTransporte
      );

    await this.page
      .getByRole(
        'textbox',
        {
          name:
            'Ingresar número de bultos'
        }
      )
      .fill(
        datos.numeroBultos
      );

    await this.seleccionarCombo(
      'Embalaje Codigo',
      datos.embalajeCodigo
    );

    await this.page
      .locator(
        'input[name="cant_a_despachar_paso_bultos"]'
      )
      .fill(
        datos.cantidadADespachar
      );

    await this.seleccionarCombo(
      'Embalaje tipo',
      datos.embalajeTipo
    );

    await this.page
      .locator(
        'input[name="peso_kgr_paso_bultos"]'
      )
      .fill(
        datos.pesoKg
      );

    console.log(
      '✔ Bultos completado con los datos validados del flujo Herrero.'
    );
  }
}
