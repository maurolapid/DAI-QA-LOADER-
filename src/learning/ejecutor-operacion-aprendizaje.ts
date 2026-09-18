import {
  chromium,
  firefox
} from '@playwright/test';

import type {
  Browser,
  Locator,
  Page
} from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegistroPage } from '../pages/RegistroPage';
import { CaratulaPage } from '../pages/CaratulaPage';
import { CaratulaEC01Page } from '../pages/CaratulaEC01Page';
import { ItemPage } from '../pages/ItemPage';
import { ItemsEC01Page } from '../pages/ItemsEC01Page';
import { DocumentoTransporteIC04Page } from '../pages/DocumentoTransporteIC04Page';
import { DocumentoAPresentarPage } from '../pages/DocumentoAPresentarPage';
import { BultosPage } from '../pages/BultosPage';
import { AprendizajeManual } from './aprendizaje-manual';

import type {
  EtapaAprendizaje,
  PreguntaDetectada
} from './tipos-aprendizaje';

import type {
  EtapaOperacionAprendida,
  SubregimenOperacionAprendida
} from './tipos-operacion-aprendida';

export type NavegadorAprendizaje =
  | 'chrome'
  | 'firefox'
  | 'edge';

export interface InteraccionAprendizaje {
  esperarIntervencionManual: (
    mensaje: string
  ) => Promise<void>;

  solicitarPuerto: () => Promise<string>;

  solicitarDocumento: () => Promise<string>;

  solicitarReferenciaDocumento: (
    documento: string,
    indice: number
  ) => Promise<string>;

  decidirTrasRechazo: () => Promise<
    'reintentar' | 'guardar'
  >;

  confirmarFinPresupuesto?: () => Promise<boolean>;

  decidirRespuestaHeredada: (
    pregunta: PreguntaDetectada,
    respuestaAprendida: string
  ) => Promise<'reutilizar' | 'cambiar'>;
}

export interface ResultadoEjecucionAprendizaje {
  llegoAPresupuesto: boolean;
  recorrido: EtapaOperacionAprendida[];
  huboCambiosAprendizaje: boolean;
}

type EtapaDetectada = {
  etapaOperacion:
    EtapaOperacionAprendida;
  etapaAprendizaje:
    EtapaAprendizaje;
};

async function iniciarNavegador(
  navegador: NavegadorAprendizaje
): Promise<Browser> {
  console.log(
    `✔ [Learning] Iniciando navegador: ${navegador}...`
  );

  if (
    navegador === 'firefox'
  ) {
    return firefox.launch({
      headless: false
    });
  }

  if (
    navegador === 'edge'
  ) {
    return chromium.launch({
      channel: 'msedge',
      headless: false,
      args: [
        '--start-maximized'
      ]
    });
  }

  return chromium.launch({
    channel: 'chrome',
    headless: false,
    args: [
      '--start-maximized'
    ]
  });
}

function normalizar(
  valor: string
): string {
  return valor
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .toLocaleUpperCase(
      'es-AR'
    );
}

function registrarEtapa(
  recorrido:
    EtapaOperacionAprendida[],
  etapa:
    EtapaOperacionAprendida
): void {
  if (
    recorrido[
      recorrido.length - 1
    ] === etapa
  ) {
    return;
  }

  recorrido.push(
    etapa
  );

  console.log(
    `[Learning/Ruta] Etapa detectada: ${etapa}`
  );
}

async function obtenerDialogoCompatible(
  page: Page
): Promise<Locator | null> {
  const dialogos =
    page.getByRole(
      'dialog'
    );

  const cantidad =
    await dialogos.count();

  for (
    let indice = 0;
    indice < cantidad;
    indice += 1
  ) {
    const dialogo =
      dialogos.nth(
        indice
      );

    if (
      !await dialogo
        .isVisible()
        .catch(
          () => false
        )
    ) {
      continue;
    }

    const radioVisible =
      await dialogo
        .getByRole(
          'radiogroup'
        )
        .first()
        .isVisible()
        .catch(
          () => false
        );

    if (
      radioVisible
    ) {
      return dialogo;
    }

    const noVisible =
      await dialogo
        .getByRole(
          'button',
          {
            name: 'NO',
            exact: true
          }
        )
        .first()
        .isVisible()
        .catch(
          () => false
        );

    const siVisible =
      await dialogo
        .getByRole(
          'button',
          {
            name: 'SÍ',
            exact: true
          }
        )
        .first()
        .isVisible()
        .catch(
          () => false
        );

    if (
      noVisible &&
      siVisible
    ) {
      return dialogo;
    }

    const textoVisible =
      await dialogo
        .locator(
          'input[type="text"][placeholder="Ingresá tu respuesta"]'
        )
        .first()
        .isVisible()
        .catch(
          () => false
        );

    if (
      textoVisible
    ) {
      return dialogo;
    }

    const fechaVisible =
      await dialogo
        .locator(
          'input[placeholder="DD/MM/AAAA"]'
        )
        .first()
        .isVisible()
        .catch(
          () => false
        );

    if (
      fechaVisible
    ) {
      return dialogo;
    }
  }

  return null;
}

async function cerrarModalTransicionSiAparece(
  page: Page
): Promise<boolean> {
  const botonEntendido =
    page.getByRole(
      'button',
      {
        name: 'Entendido',
        exact: true
      }
    );

  if (
    !await botonEntendido
      .isVisible()
      .catch(
        () => false
      )
  ) {
    return false;
  }

  console.log(
    '[Learning/Ruta] Modal informativo de transición detectado. Cerrando con "Entendido"...'
  );

  await botonEntendido.click({
    timeout: 30000
  });

  await botonEntendido
    .waitFor({
      state: 'hidden',
      timeout: 10000
    })
    .catch(
      () => undefined
    );

  console.log(
    '[Learning/Ruta] Modal informativo cerrado. Se continúa con la ruta.'
  );

  return true;
}

async function textoVisibleDeTitulos(
  page: Page
): Promise<string> {
  const titulos =
    page.locator(
      'main h1, main h2, main h3, main h4, main h5, main h6, [role="main"] h1, [role="main"] h2, [role="main"] h3, [role="main"] h4, [role="main"] h5, [role="main"] h6'
    );

  const cantidad =
    await titulos.count();

  const textos:
    string[] = [];

  for (
    let indice = 0;
    indice < cantidad;
    indice += 1
  ) {
    const titulo =
      titulos.nth(
        indice
      );

    if (
      !await titulo
        .isVisible()
        .catch(
          () => false
        )
    ) {
      continue;
    }

    const texto =
      normalizar(
        await titulo
          .innerText()
          .catch(
            () => ''
          )
      );

    if (
      texto
    ) {
      textos.push(
        texto
      );
    }
  }

  return textos.join(
    ' | '
  );
}

async function detectarEtapa(
  page: Page
): Promise<EtapaDetectada> {
  const titulos =
    await textoVisibleDeTitulos(
      page
    );

  const url =
    normalizar(
      page.url()
    );

  const existeCampoDocumentoTransporte =
    await page
      .getByRole(
        'textbox',
        {
          name:
            /documento de transporte/i
        }
      )
      .first()
      .isVisible()
      .catch(
        () => false
      );

  const existeFormularioBultos =
    await page
      .getByRole(
        'textbox',
        {
          name:
            'Ingresar número de bultos'
        }
      )
      .first()
      .isVisible()
      .catch(
        () => false
      );

  const existeTituloPresupuesto =
    await page
      .getByRole(
        'heading',
        {
          name:
            /presupuesto general/i,
          exact: true
        }
      )
      .first()
      .isVisible()
      .catch(
        () => false
      );

  if (
    existeCampoDocumentoTransporte ||
    titulos.includes(
      'DOCUMENTO DE TRANSPORTE'
    ) ||
    titulos.includes(
      'DOCUMENTO TRANSPORTE'
    )
  ) {
    return {
      etapaOperacion:
        'DOCUMENTO_TRANSPORTE',
      etapaAprendizaje:
        'DOCUMENTO_TRANSPORTE'
    };
  }

  if (
    existeFormularioBultos
  ) {
    return {
      etapaOperacion:
        'BULTOS',
      etapaAprendizaje:
        'BULTOS'
    };
  }

  if (
    existeTituloPresupuesto ||
    /STEP=.?PRESUPUESTO/.test(
      url
    )
  ) {
    return {
      etapaOperacion:
        'PRESUPUESTO',
      etapaAprendizaje:
        'PRESUPUESTO'
    };
  }

  if (
    titulos.includes(
      'CERTIFICACION PAC/ROM'
    ) ||
    titulos.includes(
      'CERTIFICADO PAC/ROM'
    )
  ) {
    return {
      etapaOperacion:
        'PAC_ROM',
      etapaAprendizaje:
        'CERTIPAC'
    };
  }

  if (
    titulos.includes(
      'CERTIPAC'
    )
  ) {
    return {
      etapaOperacion:
        'CERTIPAC',
      etapaAprendizaje:
        'CERTIPAC'
    };
  }

  return {
    etapaOperacion:
      'OTRA',
    etapaAprendizaje:
      'OTRA'
  };
}

async function clickSiguienteEtapaConocida(
  page: Page
): Promise<
  EtapaOperacionAprendida | null
> {
  const botones =
    page.getByRole(
      'button'
    );

  const cantidad =
    await botones.count();

  for (
    let indice = 0;
    indice < cantidad;
    indice += 1
  ) {
    const boton =
      botones.nth(
        indice
      );

    if (
      !await boton
        .isVisible()
        .catch(
          () => false
        )
    ) {
      continue;
    }

    if (
      !await boton
        .isEnabled()
        .catch(
          () => false
        )
    ) {
      continue;
    }

    const texto =
      normalizar(
        await boton
          .innerText()
          .catch(
            () => ''
          )
      );

    let etapa:
      EtapaOperacionAprendida | null =
        null;

    if (
      texto.includes(
        'IR A CERTIFICADO PAC/ROM'
      ) ||
      texto.includes(
        'IR A CERTIFICACION PAC/ROM'
      )
    ) {
      etapa =
        'PAC_ROM';
    } else if (
      texto.includes(
        'IR A BULTOS'
      )
    ) {
      etapa =
        'BULTOS';
    } else if (
      texto.includes(
        'IR A DOCUMENTO'
      ) &&
      texto.includes(
        'TRANSPORTE'
      )
    ) {
      etapa =
        'DOCUMENTO_TRANSPORTE';
    } else if (
      texto.includes(
        'IR A PRESUPUESTO'
      )
    ) {
      etapa =
        'PRESUPUESTO';
    }

    if (
      !etapa
    ) {
      continue;
    }

    const etapaAntes =
      await detectarEtapa(
        page
      );

    console.log(
      `[Learning/Ruta] Intentando navegación automática: ${texto}`
    );

    await boton.click();

    const inicio =
      Date.now();

    while (
      Date.now() - inicio <
      10000
    ) {
      const dialogo =
        await obtenerDialogoCompatible(
          page
        );

      if (
        dialogo
      ) {
        console.log(
          `[Learning/Ruta] Navegación confirmada por aparición de preguntas: ${etapa}`
        );

        return etapa;
      }

      const modalDocumentosVisible =
        await page
          .locator(
            'input[name^="documentos."][name$=".referencia"]'
          )
          .first()
          .isVisible()
          .catch(
            () => false
          );

      if (
        modalDocumentosVisible
      ) {
        console.log(
          `[Learning/Ruta] Navegación confirmada por aparición de Documentos a presentar: ${etapa}`
        );

        return etapa;
      }

      const etapaDespues =
        await detectarEtapa(
          page
        );

      if (
        etapaDespues.etapaOperacion !==
          etapaAntes.etapaOperacion
      ) {
        console.log(
          `[Learning/Ruta] Navegación confirmada: ${etapaDespues.etapaOperacion}`
        );

        return etapaDespues
          .etapaOperacion;
      }

      await page.waitForTimeout(
        250
      );
    }

    console.log(
      `[Learning/Ruta] El botón ${texto} no produjo un cambio de etapa. No se repetirá el clic en esta iteración.`
    );

    return null;
  }

  return null;
}

async function procesarPreguntasSiAparecen(
  page: Page,
  contexto: {
    subregimen:
      SubregimenOperacionAprendida;
    posicionArancelaria:
      string;
    numeroItem?:
      number;
    perfilId:
      string;
    aprenderNuevoPerfil:
      boolean;
    decidirRespuestaHeredada:
      InteraccionAprendizaje['decidirRespuestaHeredada'];
  },
  etapa:
    EtapaDetectada
): Promise<{
  procesadas: boolean;
  huboConocimientoNuevo: boolean;
}> {
  const dialogo =
    await obtenerDialogoCompatible(
      page
    );

  if (
    !dialogo
  ) {
    return {
      procesadas: false,
      huboConocimientoNuevo: false
    };
  }

  console.log(
    `[Learning] Preguntas detectadas en etapa ${etapa.etapaOperacion}.`
  );

  const aprendizaje =
    new AprendizajeManual(
      page
    );

  const resultado =
    await aprendizaje
      .capturarRecorridoManual({
        subregimen:
          contexto.subregimen,
        posicionArancelaria:
          contexto.posicionArancelaria,
        perfilId:
          contexto.perfilId,
        etapa:
          etapa.etapaAprendizaje,
        numeroItem:
          contexto.numeroItem
      }, {
        aprenderNuevoPerfil:
          contexto.aprenderNuevoPerfil,
        decidirRespuestaHeredada:
          contexto.decidirRespuestaHeredada
      });

  console.log(
    `[Learning] Etapa ${etapa.etapaOperacion}: ${resultado.pasos.length} pregunta(s) procesada(s).`
  );

  return {
    procesadas: true,
    huboConocimientoNuevo:
      resultado.huboConocimientoNuevo
  };
}

async function completarDocumentoTransporteDesdeLoader(
  page: Page,
  interaccion:
    InteraccionAprendizaje
): Promise<
  'presupuesto' | 'detener'
> {
  const documentoPage =
    new DocumentoTransporteIC04Page(
      page
    );

  while (
    true
  ) {
    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      ' DOCUMENTO DE TRANSPORTE - CARGA LOADER'
    );
    console.log(
      '=========================================='
    );

    const puerto =
      await interaccion
        .solicitarPuerto();

    const documento =
      await interaccion
        .solicitarDocumento();

    await documentoPage
      .completarDatos(
        puerto,
        documento
      );

    console.log(
      '[Learning] Presentando Documento de Transporte desde el Loader...'
    );

    const resultado =
      await documentoPage
        .presentar();

    if (
      resultado ===
      'aceptado'
    ) {
      console.log(
        '[Learning] Documento de Transporte aceptado.'
      );

      await documentoPage
        .irAPresupuestoGeneral();

      return 'presupuesto';
    }

    console.log(
      '[Learning] Documento de Transporte rechazado.'
    );

    const decision =
      await interaccion
        .decidirTrasRechazo();

    if (
      decision ===
      'reintentar'
    ) {
      continue;
    }

    console.log(
      '[Learning] Ejecución detenida a pedido del usuario después del rechazo del Documento de Transporte.'
    );

    return 'detener';
  }
}

async function esperarTransicionAutomatica(
  page: Page,
  timeoutMs:
    number = 10000,
  etapaActual?:
    EtapaOperacionAprendida
): Promise<boolean> {
  const inicio =
    Date.now();

  while (
    Date.now() - inicio <
    timeoutMs
  ) {
    const dialogo =
      await obtenerDialogoCompatible(
        page
      );

    if (
      dialogo
    ) {
      console.log(
        '[Learning/Ruta] Nueva tanda de preguntas detectada automáticamente.'
      );

      return true;
    }

    const etapa =
      await detectarEtapa(
        page
      );

    if (
      etapa.etapaOperacion !==
        'OTRA' &&
      etapa.etapaOperacion !==
        etapaActual
    ) {
      console.log(
        `[Learning/Ruta] Nueva etapa detectada automáticamente: ${etapa.etapaOperacion}`
      );

      return true;
    }

    await page.waitForTimeout(
      250
    );
  }

  return false;
}

async function esperarModalCompatible(
  page: Page,
  timeoutMs:
    number = 10000
): Promise<boolean> {
  const inicio =
    Date.now();

  while (
    Date.now() - inicio <
    timeoutMs
  ) {
    const dialogo =
      await obtenerDialogoCompatible(
        page
      );

    if (
      dialogo
    ) {
      return true;
    }

    await page.waitForTimeout(
      250
    );
  }

  return false;
}

async function recorrerHastaPresupuesto(
  page: Page,
  contexto: {
    subregimen:
      SubregimenOperacionAprendida;
    posicionArancelaria:
      string;
    numeroItem?:
      number;
    perfilId:
      string;
    aprenderNuevoPerfil:
      boolean;
    decidirRespuestaHeredada:
      InteraccionAprendizaje['decidirRespuestaHeredada'];
  },
  recorrido:
    EtapaOperacionAprendida[],
  interaccion:
    InteraccionAprendizaje,
  huboCambiosIniciales:
    boolean = false
): Promise<{
  llegoAPresupuesto: boolean;
  huboCambiosAprendizaje: boolean;
}> {
  const maximoCiclosSinProgreso =
    3;

  let intervencionesManuales =
    0;

  let huboCambiosAprendizaje =
    huboCambiosIniciales;

  let etapaForzada:
    EtapaDetectada | null =
      null;

  const confirmarFinalizacion =
    async (): Promise<boolean> => {
      if (
        !interaccion
          .confirmarFinPresupuesto
      ) {
        throw new Error(
          'Learning Engine: no se configuró la confirmación obligatoria antes de guardar y cerrar la operación.'
        );
      }

      const confirmar =
        await interaccion
          .confirmarFinPresupuesto();

      if (
        confirmar
      ) {
        console.log(
          '[Learning] Finalización confirmada por el usuario. La operación puede guardarse y el navegador puede cerrarse.'
        );

        return true;
      }

      console.log(
        '[Learning] Finalización rechazada por el usuario. La operación no se guardará ni se cerrará todavía.'
      );

      await interaccion
        .esperarIntervencionManual(
          'Continuá trabajando en la operación con el navegador abierto. Cuando quieras volver a verificar la finalización, presioná ENTER.'
        );

      return false;
    };

  const documentoAPresentarPage =
    new DocumentoAPresentarPage(
      page,
      interaccion
        .solicitarReferenciaDocumento
    );

  while (
    true
  ) {
    await page.waitForTimeout(
      500
    );

    if (
      await documentoAPresentarPage
        .estaVisible() &&
      await documentoAPresentarPage
        .procesarSiAparece(
          300
        )
    ) {
      intervencionesManuales =
        0;

      console.log(
        '[Learning/Ruta] Documentos a presentar completados. Se retoma la detección automática del recorrido.'
      );

      continue;
    }

    if (
      await cerrarModalTransicionSiAparece(
        page
      )
    ) {
      intervencionesManuales =
        0;

      continue;
    }

    const etapa =
      etapaForzada ??
      await detectarEtapa(
        page
      );

    etapaForzada =
      null;

    registrarEtapa(
      recorrido,
      etapa.etapaOperacion
    );

    const resultadoPreguntas =
      await procesarPreguntasSiAparecen(
        page,
        contexto,
        etapa
      );

    huboCambiosAprendizaje =
      huboCambiosAprendizaje ||
      resultadoPreguntas
        .huboConocimientoNuevo;

    if (
      resultadoPreguntas
        .procesadas
    ) {
      intervencionesManuales =
        0;

      if (
        etapa.etapaOperacion ===
        'PRESUPUESTO'
      ) {
        console.log(
          '[Learning] Preguntas de Presupuesto procesadas por el Learning Engine.'
        );

        console.log(
          '[Learning] Esperando 10 segundos para comprobar si DAI presenta otra tanda de preguntas de Presupuesto...'
        );

        const aparecioOtraTanda =
          await esperarModalCompatible(
            page,
            10000
          );

        if (
          aparecioOtraTanda
        ) {
          console.log(
            '[Learning] Nueva tanda de Presupuesto detectada. Se continúa sin solicitar validación final.'
          );

          etapaForzada = {
            etapaOperacion:
              'PRESUPUESTO',
            etapaAprendizaje:
              'PRESUPUESTO'
          };

          continue;
        }

        if (
          huboCambiosAprendizaje
        ) {
          if (
            await confirmarFinalizacion()
          ) {
            return {
              llegoAPresupuesto: true,
              huboCambiosAprendizaje
            };
          }
        } else {
          console.log('');
          console.log(
            '=========================================='
          );
          console.log(
            ' HANDOFF A PRUEBA MANUAL'
          );
          console.log(
            '=========================================='
          );
          console.log(
            'La ejecución automática fue idéntica al conocimiento existente.'
          );

          await interaccion
            .esperarIntervencionManual(
              'El navegador permanecerá abierto para que continúes la operación manualmente. Presioná ENTER únicamente cuando hayas terminado y quieras guardar/finalizar esta ejecución.'
            );

          return {
            llegoAPresupuesto: true,
            huboCambiosAprendizaje
          };
        }

        etapaForzada = {
          etapaOperacion:
            'PRESUPUESTO',
          etapaAprendizaje:
            'PRESUPUESTO'
        };

        continue;
      }

      continue;
    }

    if (
      etapa.etapaOperacion ===
      'DOCUMENTO_TRANSPORTE'
    ) {
      const resultadoTransporte =
        await completarDocumentoTransporteDesdeLoader(
          page,
          interaccion
        );

      if (
        resultadoTransporte ===
        'detener'
      ) {
        return {
          llegoAPresupuesto: false,
          huboCambiosAprendizaje
        };
      }

      registrarEtapa(
        recorrido,
        'PRESUPUESTO'
      );

      etapaForzada = {
        etapaOperacion:
          'PRESUPUESTO',
        etapaAprendizaje:
          'PRESUPUESTO'
      };

      intervencionesManuales =
        0;

      continue;
    }

    if (
      etapa.etapaOperacion ===
      'BULTOS'
    ) {
      console.log('');
      console.log(
        '=========================================='
      );
      console.log(
        ' BULTOS - CARGA LOADER (DATOS HERRERO)'
      );
      console.log(
        '=========================================='
      );

      const bultosPage =
        new BultosPage(
          page
        );

      await bultosPage
        .completar();

      const siguienteBultos =
        await clickSiguienteEtapaConocida(
          page
        );

      if (
        siguienteBultos !==
        'PRESUPUESTO'
      ) {
        throw new Error(
          'Learning Engine: Bultos fue completado, pero DAI no confirmó el avance a Presupuesto.'
        );
      }

      registrarEtapa(
        recorrido,
        'PRESUPUESTO'
      );

      etapaForzada = {
        etapaOperacion:
          'PRESUPUESTO',
        etapaAprendizaje:
          'PRESUPUESTO'
      };

      intervencionesManuales =
        0;

      continue;
    }

    const siguiente =
      await clickSiguienteEtapaConocida(
        page
      );

    if (
      siguiente
    ) {
      registrarEtapa(
        recorrido,
        siguiente
      );

      if (
        siguiente ===
        'PRESUPUESTO'
      ) {
        etapaForzada = {
          etapaOperacion:
            'PRESUPUESTO',
          etapaAprendizaje:
            'PRESUPUESTO'
        };
      } else if (
        siguiente ===
        'DOCUMENTO_TRANSPORTE'
      ) {
        etapaForzada = {
          etapaOperacion:
            'DOCUMENTO_TRANSPORTE',
          etapaAprendizaje:
            'DOCUMENTO_TRANSPORTE'
        };
      } else if (
        siguiente ===
        'PAC_ROM'
      ) {
        etapaForzada = {
          etapaOperacion:
            'PAC_ROM',
          etapaAprendizaje:
            'CERTIPAC'
        };
      } else if (
        siguiente ===
        'BULTOS'
      ) {
        etapaForzada = {
          etapaOperacion:
            'BULTOS',
          etapaAprendizaje:
            'BULTOS'
        };
      }

      intervencionesManuales =
        0;

      continue;
    }

    if (
      etapa.etapaOperacion ===
      'PRESUPUESTO'
    ) {
      console.log(
        '[Learning] Presupuesto detectado sin modal visible. Esperando 10 segundos antes de habilitar la validación final...'
      );

      const aparecioModalPresupuesto =
        await esperarModalCompatible(
          page,
          10000
        );

      if (
        aparecioModalPresupuesto
      ) {
        console.log(
          '[Learning] Modal de Presupuesto detectado. Se continúa con las preguntas sin solicitar validación final.'
        );

        etapaForzada = {
          etapaOperacion:
            'PRESUPUESTO',
          etapaAprendizaje:
            'PRESUPUESTO'
        };

        continue;
      }

      if (
        huboCambiosAprendizaje
      ) {
        if (
          await confirmarFinalizacion()
        ) {
          return {
            llegoAPresupuesto: true,
            huboCambiosAprendizaje
          };
        }
      } else {
        console.log('');
        console.log(
          '=========================================='
        );
        console.log(
          ' HANDOFF A PRUEBA MANUAL'
        );
        console.log(
          '=========================================='
        );
        console.log(
          'La ejecución automática fue idéntica al conocimiento existente.'
        );

        await interaccion
          .esperarIntervencionManual(
            'El navegador permanecerá abierto para que continúes la operación manualmente. Presioná ENTER únicamente cuando hayas terminado y quieras guardar/finalizar esta ejecución.'
          );

        return {
          llegoAPresupuesto: true,
          huboCambiosAprendizaje
        };
      }

      etapaForzada = {
        etapaOperacion:
          'PRESUPUESTO',
        etapaAprendizaje:
          'PRESUPUESTO'
      };

      continue;
    }

    console.log(
      `[Learning/Ruta] Pantalla ${etapa.etapaOperacion} sin preguntas ni navegación disponible. Esperando transición automática de DAI...`
    );

    const huboTransicion =
      await esperarTransicionAutomatica(
        page,
        10000,
        etapa.etapaOperacion
      );

    if (
      huboTransicion
    ) {
      intervencionesManuales =
        0;

      continue;
    }

    if (
      !contexto.aprenderNuevoPerfil
    ) {
      intervencionesManuales +=
        1;

      if (
        intervencionesManuales ===
        1
      ) {
        console.log(
          '[Learning/Ruta] Camino aprendido: se continúa observando automáticamente sin solicitar ENTER.'
        );
      }

      if (
        intervencionesManuales >=
        maximoCiclosSinProgreso
      ) {
        throw new Error(
          'Learning Engine: el camino aprendido permaneció demasiado tiempo sin preguntas, navegación ni cambio de etapa.'
        );
      }

      continue;
    }

    intervencionesManuales +=
      1;

    if (
      intervencionesManuales >=
      maximoCiclosSinProgreso
    ) {
      throw new Error(
        'Learning Engine: demasiadas intervenciones manuales consecutivas sin detectar un cambio de etapa.'
      );
    }

    await interaccion
      .esperarIntervencionManual(
        `Pantalla detectada: ${etapa.etapaOperacion}. El Learning Engine no detectó una transición automática en 10 segundos. Completá únicamente los datos necesarios o avanzá a la siguiente pantalla y presioná ENTER. Si aparece un modal de preguntas, no lo respondas antes de presionar ENTER.`
      );
  }
}

export async function ejecutarOperacionAprendizaje(
  baseUrl: string,
  data: any,
  subregimen:
    SubregimenOperacionAprendida,
  navegador:
    NavegadorAprendizaje,
  interaccion:
    InteraccionAprendizaje,
  perfilId:
    string,
  aprenderNuevoPerfil:
    boolean
): Promise<ResultadoEjecucionAprendizaje> {
  const browser =
    await iniciarNavegador(
      navegador
    );

  const context =
    await browser.newContext({
      viewport: null
    });

  const page =
    await context.newPage();

  const recorrido:
    EtapaOperacionAprendida[] =
      [];

  try {
    console.log(
      `✔ [Learning/${subregimen}] Abriendo ambiente...`
    );

    await page.goto(
      baseUrl,
      {
        waitUntil:
          'domcontentloaded'
      }
    );

    const loginPage =
      new LoginPage(
        page
      );

    await loginPage
      .ingresarConMock(
        data.loginMock
      );

    await loginPage
      .esperarIngresoAlSistema();

    const homePage =
      new HomePage(
        page
      );

    await homePage
      .irANuevaOperacion();

    registrarEtapa(
      recorrido,
      'REGISTRO'
    );

    const registroPage =
      new RegistroPage(
        page
      );

    if (
      subregimen ===
      'IC04'
    ) {
      await registroPage
        .completarRegistroIC04(
          data
        );
    } else {
      await registroPage
        .completarRegistroEC01(
          data
        );
    }

    await registroPage
      .irACaratulaYEsperarNextStep();

    registrarEtapa(
      recorrido,
      'CARATULA'
    );

    if (
      subregimen ===
      'IC04'
    ) {
      const caratulaPage =
        new CaratulaPage(
          page
        );

      await caratulaPage
        .completarInicio(
          data.caratula
        );

      await Promise.all([
        page.waitForResponse(
          response =>
            response
              .url()
              .includes(
                '/operations.nextStep'
              ) &&
            response
              .request()
              .method() ===
              'POST' &&
            response.status() ===
              200
        ),

        page
          .getByRole(
            'button',
            {
              name:
                'ir a Items'
            }
          )
          .click()
      ]);

      await page.waitForResponse(
        response =>
          response
            .url()
            .includes(
              '/operations.getOperation'
            ) &&
          response
            .request()
            .method() ===
              'GET' &&
          response.status() ===
            200
      );
    } else {
      const caratulaPage =
        new CaratulaEC01Page(
          page
        );

      await caratulaPage
        .completarCaratula(
          data.caratula
        );
    }

    registrarEtapa(
      recorrido,
      'ITEMS'
    );

    const items =
      Array.isArray(
        data.items
      ) &&
      data.items.length > 0
        ? data.items
        : [
            data.item
          ];

    if (
      subregimen ===
      'IC04'
    ) {
      const itemPage =
        new ItemPage(
          page
        );

      for (
        let index = 0;
        index < items.length;
        index += 1
      ) {
        const item =
          items[index];

        const numeroItem =
          index + 1;

        console.log(
          `[Learning/Items] IC04 - Item ${numeroItem} de ${items.length} - ${item.posicionArancelaria}`
        );

        if (
          index === 0
        ) {
          await itemPage
            .abrirPrimerItem();
        } else {
          await itemPage
            .agregarOtroItem();
        }

        await itemPage
          .completarPosicionArancelaria(
            item.posicionArancelaria
          );

        await itemPage
          .completarCabeceraIC04(
            item
          );

        await itemPage
          .continuarSinSubitems();

        await itemPage
          .completarVentajasIC04(
            item
          );

        await itemPage
          .completarValorItemIC04(
            item
          );

        const resultadoSufijos =
          await itemPage
            .completarSufijos(
              item
            );

        if (
          resultadoSufijos ===
          'asistido'
        ) {
          await interaccion
            .esperarIntervencionManual(
              `Completá manualmente los sufijos del item IC04 ${numeroItem} de ${items.length} y presioná ENTER cuando estén listos.`
            );
        }
      }

      await itemPage
        .cargarTodosLosItems();
    } else {
      const itemsPage =
        new ItemsEC01Page(
          page
        );

      for (
        let index = 0;
        index < items.length;
        index += 1
      ) {
        const item =
          items[index];

        const numeroItem =
          index + 1;

        const esUltimoItem =
          index ===
          items.length - 1;

        console.log(
          `[Learning/Items] EC01 - Item ${numeroItem} de ${items.length} - ${item.posicionArancelaria}`
        );

        const resultadoItem =
          await itemsPage
            .completarItem(
              item,
              {
                apertura:
                  index === 0
                    ? 'primer'
                    : 'siguiente',
                cargarTodosAlFinal:
                  esUltimoItem
              }
            );

        if (
          resultadoItem ===
          'asistido'
        ) {
          await interaccion
            .esperarIntervencionManual(
              `Completá manualmente los sufijos del item EC01 ${numeroItem} de ${items.length}${esUltimoItem ? ' y cargá todos los items' : ''}. Después presioná ENTER.`
            );
        }
      }
    }

    registrarEtapa(
      recorrido,
      'PREGUNTAS_ITEM'
    );

    const firmaPosiciones =
      items
        .map(
          (
            item: any,
            index: number
          ) =>
            `${index + 1}:${item.posicionArancelaria}`
        )
        .join('|');

    const contextoPregunta = {
      subregimen,
      posicionArancelaria:
        items.length === 1
          ? String(
              items[0]
                .posicionArancelaria
            )
          : `MULTI[${firmaPosiciones}]`,
      numeroItem:
        items.length === 1
          ? 1
          : undefined,
      perfilId,
      aprenderNuevoPerfil,
      decidirRespuestaHeredada:
        interaccion.decidirRespuestaHeredada
    };

    const preguntaInicial =
      await obtenerDialogoCompatible(
        page
      );

    let huboCambiosIniciales =
      false;

    if (
      preguntaInicial
    ) {
      const resultadoPreguntasIniciales =
        await procesarPreguntasSiAparecen(
          page,
          contextoPregunta,
          {
            etapaOperacion:
              'PREGUNTAS_ITEM',
            etapaAprendizaje:
              'PREGUNTAS_ITEM'
          }
        );

      huboCambiosIniciales =
        resultadoPreguntasIniciales
          .huboConocimientoNuevo;
    } else {
      console.log(
        '[Learning] No se detectó un modal de preguntas de Item. Se continúa con la ruta generada por DAI.'
      );
    }

    const resultadoRecorrido =
      await recorrerHastaPresupuesto(
        page,
        contextoPregunta,
        recorrido,
        interaccion,
        huboCambiosIniciales
      );

    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      '✔ LEARNING ENGINE - EJECUCIÓN FINALIZADA'
    );
    console.log(
      '=========================================='
    );
    console.log(
      `Subrégimen: ${subregimen}`
    );
    console.log(
      `Items: ${items.length}`
    );
    console.log(
      `Contexto posiciones: ${contextoPregunta.posicionArancelaria}`
    );
    console.log(
      `Recorrido: ${recorrido.join(' -> ')}`
    );
    console.log(
      `Presupuesto alcanzado: ${resultadoRecorrido.llegoAPresupuesto ? 'SÍ' : 'NO'}`
    );

    await browser.close();

    console.log(
      '[Learning] Navegador cerrado. Ejecución finalizada.'
    );

    return {
      llegoAPresupuesto:
        resultadoRecorrido
          .llegoAPresupuesto,
      recorrido,
      huboCambiosAprendizaje:
        resultadoRecorrido
          .huboCambiosAprendizaje
    };
  } catch (error) {
    console.error('');
    console.error(
      `ERROR LEARNING ENGINE/${subregimen}:`
    );
    console.error(
      error
    );

    await page
      .screenshot({
        path:
          `screenshots/error-LEARNING-${subregimen}-${Date.now()}.png`,
        fullPage:
          true
      })
      .catch(
        () => undefined
      );

    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      ' ERROR - NAVEGADOR DISPONIBLE PARA INSPECCIÓN'
    );
    console.log(
      '=========================================='
    );

    await interaccion
      .esperarIntervencionManual(
        'La ejecución encontró un error, pero el navegador permanecerá abierto para que continúes las pruebas manuales o inspecciones el estado. Presioná ENTER únicamente cuando quieras cerrar el navegador y finalizar.'
      )
      .catch(
        () => undefined
      );

    await browser
      .close()
      .catch(
        () => undefined
      );

    throw error;
  }
}
