import type {
  Locator,
  Page
} from '@playwright/test';

import { randomUUID } from 'crypto';

import { DetectorPreguntas } from './detector-preguntas';
import { ContextoPreguntaBuilder } from './contexto-pregunta';
import { RepositorioConocimiento } from './repositorio-conocimiento';
import { MatcherConocimiento } from './matcher-conocimiento';

import type {
  ContextoPregunta,
  PreguntaDetectada,
  RegistroConocimiento
} from './tipos-aprendizaje';

export const APRENDIZAJE_MANUAL_VERSION =
  'v21-transaccional-fecha';

export type DatosContextoAprendizajeManual =
  Omit<
    ContextoPregunta,
    | 'respuestasPrevias'
    | 'perfilId'
  > & {
    /**
     * Los flujos tradicionales que no seleccionan un perfil siguen
     * perteneciendo al escenario base "Sin Documentos".
     */
    perfilId?: string;
    respuestasPrevias?:
      ContextoPregunta[
        'respuestasPrevias'
      ];
  };

export type PasoAprendizajeManual = {
  numero: number;
  pregunta: PreguntaDetectada;
  respuestaSeleccionada: string;
};

export type ResultadoAprendizajeManual = {
  contexto: ContextoPregunta;
  pasos: PasoAprendizajeManual[];
  registrosPendientes: RegistroConocimiento[];
  huboConocimientoNuevo: boolean;
};

export type OpcionesAprendizajeManual = {
  persistirConocimiento?: boolean;
  conocimientoTemporal?: RegistroConocimiento[];
  aprenderNuevoPerfil?: boolean;
  decidirRespuestaHeredada?: (
    pregunta: PreguntaDetectada,
    respuestaAprendida: string
  ) => Promise<'reutilizar' | 'cambiar'>;
};

type EventoSiNo = {
  secuencia: number;
  respuesta: 'SÍ' | 'NO';
  pregunta: string;
};

export class AprendizajeManual {
  private readonly detector:
    DetectorPreguntas;

  constructor(
    private readonly page: Page
  ) {
    this.detector =
      new DetectorPreguntas(
        page
      );
  }

  async capturarRecorridoManual(
    contexto: DatosContextoAprendizajeManual,
    opciones:
      OpcionesAprendizajeManual = {}
  ): Promise<ResultadoAprendizajeManual> {
    await this
      .instalarObservadorSiNo();

    const pasos:
      PasoAprendizajeManual[] = [];

    let huboConocimientoNuevo =
      false;

    const persistirConocimiento =
      opciones.persistirConocimiento ??
      true;

    const registrosPendientes:
      RegistroConocimiento[] =
        (opciones.conocimientoTemporal ?? [])
          .map(
            registro =>
              this.clonarRegistroConocimiento(
                registro
              )
          );

    const idsTemporalesIniciales =
      new Set(
        registrosPendientes
          .map(
            registro =>
              registro.id
          )
      );

    const contextoBuilder =
      new ContextoPreguntaBuilder({
        subregimen:
          contexto.subregimen,
        posicionArancelaria:
          contexto.posicionArancelaria,
        etapa:
          contexto.etapa,
        perfilId:
          contexto.perfilId ??
          'docs-no__ventajas-no__cancelaciones-no',
        cuit:
          contexto.cuit,
        paisOrigen:
          contexto.paisOrigen,
        paisProcedencia:
          contexto.paisProcedencia,
        paisDestino:
          contexto.paisDestino,
        ventajas:
          contexto.ventajas,
        informacionComplementaria:
          contexto.informacionComplementaria,
        numeroItem:
          contexto.numeroItem,
        numeroSubitem:
          contexto.numeroSubitem
      });

    for (
      const respuestaPrevia of
      contexto.respuestasPrevias ?? []
    ) {
      contextoBuilder
        .registrarRespuesta(
          respuestaPrevia.pregunta,
          respuestaPrevia.respuesta
        );
    }

    const repositorioConocimiento =
      new RepositorioConocimiento();

    const matcherConocimiento =
      new MatcherConocimiento();

    let numeroPregunta =
      1;

    let secuenciaSiNoProcesada =
      0;

    let preguntaActual =
      await this.detector
        .detectarPreguntaActual();

    while (
      preguntaActual
    ) {
      this.imprimirPregunta(
        numeroPregunta,
        preguntaActual
      );

      const contextoActual =
        contextoBuilder
          .obtenerContexto();

      const registrosActuales = [
        ...repositorioConocimiento
          .obtenerRegistros(),
        ...registrosPendientes
      ];

      const resultadoMatch =
        matcherConocimiento
          .buscar(
            contextoActual,
            preguntaActual,
            registrosActuales
          );

      let registroConocido =
        resultadoMatch.encontrada
          ? resultadoMatch.registro
          : undefined;

      if (
        registroConocido &&
        resultadoMatch.heredada &&
        opciones.aprenderNuevoPerfil
      ) {
        if (
          !opciones.decidirRespuestaHeredada
        ) {
          throw new Error(
            'Learning Engine: falta decidir si se reutiliza o cambia la respuesta heredada del perfil base.'
          );
        }

        console.log('');
        console.log(
          `[Perfil] Respuesta heredada de otro camino: ${registroConocido.respuesta.valor}`
        );

        const decision =
          await opciones
            .decidirRespuestaHeredada(
              preguntaActual,
              registroConocido.respuesta.valor
            );

        if (
          decision === 'cambiar'
        ) {
          console.log(
            '[Perfil] Se aprenderá una respuesta específica para el nuevo camino.'
          );
          registroConocido =
            undefined;
        } else {
          console.log(
            '[Perfil] Se reutiliza la respuesta heredada.'
          );
        }
      }

      let respuestaSeleccionada:
        string;

      if (
        registroConocido
      ) {
        respuestaSeleccionada =
          registroConocido
            .respuesta
            .valor;

        console.log('');
        console.log(
          '[Conocimiento] Estado: CONOCIDA'
        );
        console.log(
          `[Conocimiento] Respuesta aprendida: ${respuestaSeleccionada}`
        );
        console.log(
          '[Conocimiento] Respondiendo automáticamente...'
        );

        if (
          preguntaActual.tipoControl ===
          'RADIO'
        ) {
          const opcionesActuales =
            (preguntaActual.opciones ?? [])
              .map(
                opcion =>
                  this.normalizarTexto(
                    opcion
                  )
              );

          const respuestaNormalizada =
            this.normalizarTexto(
              respuestaSeleccionada
            );

          if (
            !opcionesActuales.some(
              opcion =>
                opcion ===
                respuestaNormalizada
            )
          ) {
            throw new Error(
              `Learning Engine: conocimiento inconsistente. La respuesta aprendida "${respuestaSeleccionada}" no pertenece a las opciones detectadas para la pregunta actual. No se modificó DAI.`
            );
          }

          await this
            .responderRadioAutomaticamente(
              respuestaSeleccionada,
              preguntaActual
            );

          console.log(
            `[Aprendizaje] Pregunta ${numeroPregunta} respondida automáticamente.`
          );
        } else if (
          preguntaActual.tipoControl ===
          'SI_NO'
        ) {
          await this
            .responderSiNoAutomaticamente(
              respuestaSeleccionada
            );

          console.log(
            `[Aprendizaje] Pregunta ${numeroPregunta} respondida automáticamente.`
          );
        } else if (
          preguntaActual.tipoControl ===
          'TEXTO'
        ) {
          await this.responderTextoAutomaticamente(
            respuestaSeleccionada,
            'TEXTO'
          );

          console.log(
            `[Aprendizaje] Pregunta ${numeroPregunta} respondida automáticamente.`
          );
        } else if (
          preguntaActual.tipoControl ===
          'FECHA'
        ) {
          const respuestaFecha =
            this.esPreguntaFechaEmbarqueOrigen(
              preguntaActual.texto
            )
              ? this.obtenerFechaMenos15Dias()
              : respuestaSeleccionada;

          respuestaSeleccionada =
            respuestaFecha;

          if (
            this.esPreguntaFechaEmbarqueOrigen(
              preguntaActual.texto
            )
          ) {
            console.log(
              `[Conocimiento] FEMB-ORIGEN detectada. Fecha dinámica (-15 días): ${respuestaFecha}`
            );
          }

          await this.responderTextoAutomaticamente(
            respuestaFecha,
            'FECHA'
          );

          console.log(
            `[Aprendizaje] Pregunta ${numeroPregunta} respondida automáticamente.`
          );
        } else {
          throw new Error(
            `Learning Engine: la pregunta es conocida, pero el tipo ${preguntaActual.tipoControl} todavía no soporta respuesta automática.`
          );
        }

        pasos.push({
          numero:
            numeroPregunta,
          pregunta:
            this.clonarPregunta(
              preguntaActual
            ),
          respuestaSeleccionada
        });
      } else {
        huboConocimientoNuevo =
          true;

        console.log('');
        console.log(
          '[Conocimiento] Estado: DESCONOCIDA'
        );

        if (
          preguntaActual.tipoControl ===
          'RADIO'
        ) {
          console.log('');
          console.log(
            'Seleccioná MANUALMENTE una respuesta en DAI.'
          );
          console.log(
            'Podés elegir cualquier opción, incluida "Ninguna opción".'
          );
          console.log(
            'Después de seleccionar, confirmá/guardá MANUALMENTE si DAI muestra un botón para hacerlo.'
          );
          console.log(
            'El Loader no confirmará una pregunta desconocida; observará también tu Confirmar/Guardar manual.'
          );
          console.log(
            '=========================================='
          );

          respuestaSeleccionada =
            await this
              .esperarClickManualRadio(
                preguntaActual
              );

          console.log('');
          console.log(
            `[Aprendizaje] Respuesta manual detectada y verificada en DAI: ${respuestaSeleccionada}`
          );
          console.log(
            '[Aprendizaje] Si DAI requiere Confirmar/Guardar, hacelo ahora manualmente.'
          );

          pasos.push({
            numero:
              numeroPregunta,
            pregunta:
              this.clonarPregunta(
                preguntaActual
              ),
            respuestaSeleccionada
          });
        } else if (
          preguntaActual.tipoControl ===
          'SI_NO'
        ) {
          console.log('');
          console.log(
            'Respondé MANUALMENTE haciendo clic en SÍ o NO.'
          );
          console.log(
            'En este tipo de pregunta el clic responde y confirma al mismo tiempo.'
          );
          console.log(
            '=========================================='
          );

          secuenciaSiNoProcesada =
            await this
              .obtenerSecuenciaSiNoActual();

          console.log(
            `[Aprendizaje] SI_NO preparado. Secuencia base: ${secuenciaSiNoProcesada}. Esperando únicamente el próximo clic manual.`
          );

          const evento =
            await this
              .esperarRespuestaManualSiNo(
                secuenciaSiNoProcesada,
                preguntaActual
              );

          secuenciaSiNoProcesada =
            evento.secuencia;

          respuestaSeleccionada =
            evento.respuesta;

          console.log('');
          console.log(
            `[Aprendizaje] Respuesta SI_NO detectada: ${respuestaSeleccionada}`
          );

          pasos.push({
            numero:
              numeroPregunta,
            pregunta:
              this.clonarPregunta(
                preguntaActual
              ),
            respuestaSeleccionada
          });

          console.log(
            `[Aprendizaje] Pregunta ${numeroPregunta} respondida y confirmada por el usuario.`
          );
        } else if (
          preguntaActual.tipoControl ===
            'TEXTO' ||
          preguntaActual.tipoControl ===
            'FECHA'
        ) {
          const tipoEntrada =
            preguntaActual.tipoControl;

          console.log('');
          console.log(
            tipoEntrada === 'FECHA'
              ? 'Ingresá MANUALMENTE la fecha en DAI.'
              : 'Escribí MANUALMENTE la respuesta en DAI.'
          );

          if (
            tipoEntrada === 'FECHA' &&
            this.esPreguntaFechaEmbarqueOrigen(
              preguntaActual.texto
            )
          ) {
            console.log(
              `[Sugerencia] Para FEMB-ORIGEN ingresá la fecha actual menos 15 días: ${this.obtenerFechaMenos15Dias()}`
            );
          }

          console.log('Después presioná GUARDAR RESPUESTA manualmente.');
          console.log('El Loader capturará el valor real del input al confirmar y sólo aprenderá si DAI avanza.');
          console.log('==========================================');

          respuestaSeleccionada =
            await this.esperarRespuestaManualTexto(preguntaActual);

          console.log('');
          console.log(
            `[Aprendizaje] Confirmación manual ${tipoEntrada} detectada. Valor capturado: ${respuestaSeleccionada}`
          );

          pasos.push({
            numero: numeroPregunta,
            pregunta: this.clonarPregunta(preguntaActual),
            respuestaSeleccionada
          });
        } else {
          throw new Error(
            `Learning Engine: el tipo ${preguntaActual.tipoControl} todavía no está soportado por el modo aprendizaje.`
          );
        }
      }

      const requiereAvanceManual =
        !registroConocido &&
        (
          preguntaActual.tipoControl === 'RADIO' ||
          preguntaActual.tipoControl === 'TEXTO'
        );

      const siguiente =
        await this
          .esperarSiguientePreguntaRobusta(
            preguntaActual,
            requiereAvanceManual
              ? 5 * 60 * 1000
              : 60 * 1000
          );

      /*
       * El conocimiento se persiste recién después de comprobar que DAI
       * aceptó la respuesta y avanzó (o cerró el modal). Así evitamos guardar
       * selecciones visuales que el frontend todavía no había aplicado.
       */
      await this
        .procesarConocimientoCapturado(
          contextoActual,
          preguntaActual,
          respuestaSeleccionada,
          registroConocido,
          persistirConocimiento,
          registrosPendientes
        );

      contextoBuilder
        .registrarRespuesta(
          preguntaActual.texto,
          respuestaSeleccionada
        );

      if (
        !siguiente
      ) {
        console.log('');
        console.log(
          '[Aprendizaje] El modal de preguntas terminó.'
        );
        break;
      }

      numeroPregunta +=
        1;

      preguntaActual =
        siguiente;
    }

    /*
     * Guardia final de persistencia:
     * reconstruye exactamente el recorrido aceptado por DAI y verifica que
     * cada paso exista en la base antes de devolver el resultado.
     *
     * Esto cubre especialmente el caso de la última RADIO, donde confirmar
     * puede cerrar el modal inmediatamente. El recorrido ya fue validado por
     * la transición/cierre del modal; acá sólo garantizamos que el conocimiento
     * correspondiente haya quedado persistido.
     */
    await this.auditarPersistenciaRecorrido(
      contexto,
      pasos,
      repositorioConocimiento,
      matcherConocimiento,
      persistirConocimiento,
      registrosPendientes
    );

    const nuevosPendientes =
      registrosPendientes
        .filter(
          registro =>
            !idsTemporalesIniciales
              .has(
                registro.id
              )
        )
        .map(
          registro =>
            this.clonarRegistroConocimiento(
              registro
            )
        );

    return {
      contexto:
        contextoBuilder
          .obtenerContexto(),
      pasos,
      registrosPendientes:
        nuevosPendientes,
      huboConocimientoNuevo
    };
  }

  private async auditarPersistenciaRecorrido(
    contextoInicial: DatosContextoAprendizajeManual,
    pasos: PasoAprendizajeManual[],
    repositorioConocimiento: RepositorioConocimiento,
    matcherConocimiento: MatcherConocimiento,
    persistirConocimiento: boolean,
    registrosPendientes: RegistroConocimiento[]
  ): Promise<void> {
    const contextoAuditoria =
      new ContextoPreguntaBuilder({
        subregimen: contextoInicial.subregimen,
        posicionArancelaria: contextoInicial.posicionArancelaria,
        etapa: contextoInicial.etapa,
        perfilId:
          contextoInicial.perfilId ??
          'docs-no__ventajas-no__cancelaciones-no',
        cuit: contextoInicial.cuit,
        paisOrigen: contextoInicial.paisOrigen,
        paisProcedencia: contextoInicial.paisProcedencia,
        paisDestino: contextoInicial.paisDestino,
        ventajas: contextoInicial.ventajas,
        informacionComplementaria:
          contextoInicial.informacionComplementaria,
        numeroItem: contextoInicial.numeroItem,
        numeroSubitem: contextoInicial.numeroSubitem
      });

    for (
      const respuestaPrevia of
      contextoInicial.respuestasPrevias ?? []
    ) {
      contextoAuditoria.registrarRespuesta(
        respuestaPrevia.pregunta,
        respuestaPrevia.respuesta
      );
    }

    let recuperados = 0;

    for (const paso of pasos) {
      const contextoPaso =
        contextoAuditoria.obtenerContexto();

      const resultado =
        matcherConocimiento.buscar(
          contextoPaso,
          paso.pregunta,
          [
            ...repositorioConocimiento
              .obtenerRegistros(),
            ...registrosPendientes
          ]
        );

      if (resultado.encontrada && resultado.registro) {
        const aprendida =
          this.normalizarTexto(
            resultado.registro.respuesta.valor
          );

        const ejecutada =
          this.normalizarTexto(
            paso.respuestaSeleccionada
          );

        if (aprendida !== ejecutada) {
          throw new Error(
            `Learning Engine: CONFLICTO durante la auditoría final. Para "${paso.pregunta.texto}" la base contiene "${resultado.registro.respuesta.valor}" y el recorrido validado por DAI contiene "${paso.respuestaSeleccionada}". No se modificó la base de conocimiento.`
          );
        }
      } else {
        console.log(
          `[Conocimiento] Guardia final: faltaba persistir la pregunta ${paso.numero}. Recuperando asociación validada...`
        );

        await this.procesarConocimientoCapturado(
          contextoPaso,
          paso.pregunta,
          paso.respuestaSeleccionada,
          undefined,
          persistirConocimiento,
          registrosPendientes
        );

        recuperados += 1;
      }

      contextoAuditoria.registrarRespuesta(
        paso.pregunta.texto,
        paso.respuestaSeleccionada
      );
    }

    if (recuperados > 0) {
      console.log(
        `[Conocimiento] Guardia final completada. Asociaciones recuperadas: ${recuperados}.`
      );
    }
  }

  private async procesarConocimientoCapturado(
    contextoActual: ContextoPregunta,
    preguntaActual: PreguntaDetectada,
    respuestaSeleccionada: string,
    registroExistente?: RegistroConocimiento,
    persistirConocimiento:
      boolean = true,
    registrosPendientes:
      RegistroConocimiento[] = []
  ): Promise<void> {
    if (
      registroExistente
    ) {
      const respuestaAprendida =
        this.normalizarTexto(
          registroExistente
            .respuesta
            .valor
        );

      const respuestaActual =
        this.normalizarTexto(
          respuestaSeleccionada
        );

      if (
        respuestaAprendida !==
        respuestaActual
      ) {
        throw new Error(
          `Learning Engine: CONFLICTO DE CONOCIMIENTO. La respuesta aprendida era "${registroExistente.respuesta.valor}" pero en esta ejecución se respondió "${respuestaSeleccionada}". No se modificó la base de conocimiento.`
        );
      }

      console.log(
        '[Conocimiento] Respuesta validada contra conocimiento existente. No se crea duplicado.'
      );

      return;
    }

    const registro:
      RegistroConocimiento = {
        id:
          randomUUID(),
        contexto: {
          ...contextoActual,
          ventajas:
            contextoActual.ventajas
              ? [
                  ...contextoActual
                    .ventajas
                ]
              : undefined,
          informacionComplementaria:
            contextoActual
              .informacionComplementaria
              ? {
                  ...contextoActual
                    .informacionComplementaria
                }
              : undefined,
          respuestasPrevias:
            contextoActual
              .respuestasPrevias
              .map(
                respuesta => ({
                  ...respuesta
                })
              )
        },
        pregunta: {
          ...preguntaActual,
          opciones:
            preguntaActual
              .opciones
              ? [
                  ...preguntaActual
                    .opciones
                ]
              : undefined
        },
        respuesta: {
          valor:
            respuestaSeleccionada
        },
        fechaAprendizaje:
          new Date()
            .toISOString(),
        cantidadUsos:
          0
      };

    if (
      persistirConocimiento
    ) {
      const repositorioConocimiento =
        new RepositorioConocimiento();

      repositorioConocimiento
        .guardar(
          registro
        );

      console.log(
        `[Conocimiento] NUEVA asociación guardada. Previas: ${contextoActual.respuestasPrevias.length}.`
      );

      return;
    }

    registrosPendientes.push(
      this.clonarRegistroConocimiento(
        registro
      )
    );

    console.log(
      `[Conocimiento] Asociación validada en memoria. NO persistida todavía. Previas: ${contextoActual.respuestasPrevias.length}.`
    );
  }

  private async instalarObservadorSiNo(): Promise<void> {
    const script =
      String.raw`
(() => {
  const w = window;

  if (
    w.__daiLearningSiNo &&
    w.__daiLearningSiNo.instalado
  ) {
    return;
  }

  const normalizar = (valor) =>
    String(valor || '')
      .trim()
      .replace(/\s+/g, ' ');

  w.__daiLearningSiNo = {
    instalado: true,
    secuencia: 0,
    eventos: []
  };

  document.addEventListener(
    'click',
    (evento) => {
      const objetivo = evento.target;

      if (
        !(objetivo instanceof Element)
      ) {
        return;
      }

      const boton =
        objetivo.closest('button');

      if (!boton) {
        return;
      }

      const respuesta =
        normalizar(
          boton.textContent
        );

      if (
        respuesta !== 'SÍ' &&
        respuesta !== 'NO'
      ) {
        return;
      }

      const dialogo =
        boton.closest(
          '[role="dialog"]'
        );

      if (!dialogo) {
        return;
      }

      const parrafos =
        Array.from(
          dialogo.querySelectorAll('p')
        )
          .map(
            (parrafo) =>
              normalizar(
                parrafo.textContent
              )
          )
          .filter(Boolean)
          .filter(
            (texto) =>
              !/complet[aá].*preguntas.*item/i
                .test(texto)
          )
          .sort(
            (a, b) =>
              b.length -
              a.length
          );

      const pregunta =
        parrafos[0] || '';

      const estado =
        w.__daiLearningSiNo;

      if (!estado) {
        return;
      }

      estado.secuencia += 1;

      estado.eventos.push({
        secuencia:
          estado.secuencia,
        respuesta,
        pregunta
      });
    },
    true
  );
})();
`;

    await this.page
      .addScriptTag({
        content:
          script
      });

    console.log(
      '[Aprendizaje] Observador SI_NO instalado.'
    );
  }

  private async esperarRespuestaManualRadio(): Promise<string> {
    const limiteMs =
      5 * 60 * 1000;

    const inicio =
      Date.now();

    while (
      Date.now() - inicio <
      limiteMs
    ) {
      const dialogo =
        await this
          .obtenerDialogoPreguntas();

      if (
        dialogo
      ) {
        const radioGroups =
          dialogo.getByRole(
            'radiogroup'
          );

        const cantidadRadioGroups =
          await radioGroups.count();

        if (
          cantidadRadioGroups >
          0
        ) {
          const respuesta =
            await this
              .leerRespuestaSeleccionada(
                radioGroups.first()
              );

          if (
            respuesta &&
            !this.esOpcionNeutral(
              respuesta
            )
          ) {
            return respuesta;
          }
        }
      }

      await this.page
        .waitForTimeout(
          100
        );
    }

    throw new Error(
      'Learning Engine: no se detectó una respuesta RADIO manual dentro de 5 minutos.'
    );
  }

  private async obtenerSecuenciaSiNoActual(): Promise<number> {
    const secuencia =
      await this.page
        .evaluate(
          `(() => {
            const estado =
              window.__daiLearningSiNo;

            if (
              !estado ||
              typeof estado.secuencia !==
                'number'
            ) {
              return 0;
            }

            return estado.secuencia;
          })()`
        ) as number;

    return Number.isFinite(
      secuencia
    )
      ? secuencia
      : 0;
  }

  private async esperarRespuestaManualSiNo(
    secuenciaProcesada: number,
    preguntaActual:
      PreguntaDetectada
  ): Promise<EventoSiNo> {
    const limiteMs =
      5 * 60 * 1000;

    const inicio =
      Date.now();

    while (
      Date.now() - inicio <
      limiteMs
    ) {
      const lectura =
        `(() => {
          const estado =
            window.__daiLearningSiNo;

          if (!estado) {
            return null;
          }

          return (
            estado.eventos.find(
              (evento) =>
                evento.secuencia >
                ${secuenciaProcesada}
            ) || null
          );
        })()`;

      const evento =
        await this.page
          .evaluate(
            lectura
          ) as EventoSiNo | null;

      if (
        evento
      ) {
        const preguntaEvento =
          this.normalizarTexto(
            evento.pregunta
          );

        const preguntaEsperada =
          this.normalizarTexto(
            preguntaActual.texto
          );

        if (
          preguntaEvento &&
          preguntaEsperada &&
          preguntaEvento !==
            preguntaEsperada
        ) {
          throw new Error(
            'Learning Engine: la respuesta SÍ/NO capturada no coincide con la pregunta observada. Se detuvo para evitar aprender una asociación incorrecta.'
          );
        }

        return evento;
      }

      await this.page
        .waitForTimeout(
          100
        );
    }

    throw new Error(
      'Learning Engine: no se detectó un clic manual en SÍ o NO dentro de 5 minutos.'
    );
  }

  private async leerRespuestaSeleccionada(
    radioGroup: Locator
  ): Promise<string | null> {
    const radios =
      radioGroup.locator(
        'input[type="radio"]'
      );

    const cantidad =
      await radios.count();

    for (
      let indice = 0;
      indice < cantidad;
      indice += 1
    ) {
      const radio =
        radios.nth(
          indice
        );

      const seleccionado =
        await radio
          .isChecked()
          .catch(
            () => false
          );

      if (
        !seleccionado
      ) {
        continue;
      }

      const id =
        await radio
          .getAttribute(
            'id'
          );

      if (
        id
      ) {
        const labelPorFor =
          radioGroup.locator(
            `label[for="${id}"]`
          );

        if (
          await labelPorFor.count() >
          0
        ) {
          const texto =
            this.normalizarTexto(
              await labelPorFor
                .first()
                .innerText()
            );

          if (
            texto
          ) {
            return texto;
          }
        }
      }

      const labelPadre =
        radio.locator(
          'xpath=ancestor::label[1]'
        );

      if (
        await labelPadre.count() >
        0
      ) {
        const texto =
          this.normalizarTexto(
            await labelPadre
              .first()
              .innerText()
          );

        if (
          texto
        ) {
          return texto;
        }
      }

      const valor =
        await radio
          .getAttribute(
            'value'
          );

      if (
        valor
      ) {
        return this
          .normalizarTexto(
            valor
          );
      }
    }

    return null;
  }

  private async esperarClickManualRadio(
    preguntaActual: PreguntaDetectada
  ): Promise<string> {
    await this
      .instalarObservadorClickRadio();

    // Descarta cualquier clic RADIO residual de la transición anterior.
    await this
      .limpiarEventoClickRadio();

    const opcionesEsperadas =
      (preguntaActual.opciones ?? [])
        .map(
          opcion =>
            this.normalizarTexto(
              opcion
            )
        );

    const inicio =
      Date.now();

    while (
      Date.now() - inicio <
      300000
    ) {
      const evento =
        await this
          .leerEventoClickRadio();

      if (
        evento
      ) {
        const respuestaCapturada =
          this.normalizarTexto(
            evento.respuesta
          );

        const preguntaCoincide =
          this.coincidePreguntaCapturada(
            evento.pregunta,
            preguntaActual.texto
          );

        const respuestaPertenece =
          opcionesEsperadas.some(
            opcion =>
              opcion ===
              respuestaCapturada
          );

        if (
          preguntaCoincide &&
          respuestaPertenece
        ) {
          if (
            evento.origen ===
              'CONFIRMAR'
          ) {
            console.log(
              `[Aprendizaje] Confirmación manual detectada con RADIO seleccionada: ${respuestaCapturada}`
            );

            await this
              .limpiarEventoClickRadio();

            return respuestaCapturada;
          }

          const aplicada =
            await this
              .esperarSeleccionRadioAplicada(
                respuestaCapturada,
                preguntaActual,
                5000
              );

          if (
            aplicada
          ) {
            await this
              .limpiarEventoClickRadio();

            return respuestaCapturada;
          }

          console.log(
            `[Aprendizaje] Clic RADIO visto, pero DAI todavía no refleja la selección "${respuestaCapturada}". Se sigue esperando.`
          );
        } else {
          console.log(
            `[Aprendizaje] Clic RADIO descartado: "${respuestaCapturada}" no corresponde a la pregunta actualmente observada.`
          );
        }

        await this
          .limpiarEventoClickRadio();
      }

      await this.page.waitForTimeout(
        100
      );
    }

    throw new Error(
      'Learning Engine: timeout esperando un clic manual explícito sobre una opción RADIO válida para la pregunta actual.'
    );
  }

  private async esperarSeleccionRadioAplicada(
    respuestaEsperada: string,
    preguntaOriginal: PreguntaDetectada,
    limiteMs: number
  ): Promise<boolean> {
    const objetivo =
      this.normalizarTexto(
        respuestaEsperada
      );

    const firmaOriginal =
      this.crearFirmaPregunta(
        preguntaOriginal
      );

    const inicio =
      Date.now();

    let verificacionesConsecutivas =
      0;

    while (
      Date.now() - inicio <
      limiteMs
    ) {
      const dialogo =
        await this
          .obtenerDialogoPreguntas();

      if (
        !dialogo
      ) {
        // El modal desapareció: la selección produjo un avance real.
        return true;
      }

      const firmaActual =
        await this
          .leerFirmaActual(
            dialogo
          );

      if (
        firmaActual &&
        firmaActual !==
          firmaOriginal
      ) {
        // DAI cambió de pregunta como consecuencia de la selección.
        return true;
      }

      const radioGroups =
        dialogo.getByRole(
          'radiogroup'
        );

      if (
        await radioGroups.count() >
        0
      ) {
        const seleccionActual =
          await this
            .leerRespuestaSeleccionada(
              radioGroups.first()
            );

        if (
          seleccionActual &&
          this.normalizarTexto(
            seleccionActual
          ) === objetivo
        ) {
          verificacionesConsecutivas +=
            1;

          if (
            verificacionesConsecutivas >=
            2
          ) {
            return true;
          }
        } else {
          verificacionesConsecutivas =
            0;
        }
      }

      await this.page.waitForTimeout(
        100
      );
    }

    return false;
  }

  private async instalarObservadorClickRadio(): Promise<void> {
    const script = String.raw`
      (() => {
        if (window.__daiLearningRadioInstalledV10) {
          window.__daiLearningRadio = null;
          return;
        }

        window.__daiLearningRadioInstalledV10 = true;
        window.__daiLearningRadio = null;

        const normalizar = (valor) =>
          String(valor || '').trim().replace(/\s+/g, ' ');

        const obtenerPregunta = (radioGroup) => {
          const contenedor = radioGroup.parentElement?.parentElement;
          const textos = contenedor
            ? Array.from(contenedor.querySelectorAll('p'))
                .map(e => normalizar(e.textContent))
                .filter(Boolean)
            : [];

          return textos[0] || 'RADIO_SIN_TEXTO';
        };

        const obtenerLabelRadio = (radio, dialog) => {
          if (!radio) return null;

          const labelCercano = radio.closest('label');
          if (labelCercano) return labelCercano;

          if (radio.id) {
            return dialog.querySelector(
              'label[for="' + CSS.escape(radio.id) + '"]'
            );
          }

          return null;
        };

        const capturarRadio = (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;

          const dialog = target.closest('[role="dialog"]');
          if (!dialog) return;

          let label = target.closest('label');

          if (!label) {
            const input = target.closest('input[type="radio"]');
            if (input && input.id) {
              label = dialog.querySelector(
                'label[for="' + CSS.escape(input.id) + '"]'
              );
            }
          }

          if (!label) return;

          const radioGroup = label.closest('[role="radiogroup"]');
          if (!radioGroup) return;

          const respuesta = normalizar(label.textContent);
          if (!respuesta) return;

          window.__daiLearningRadio = {
            respuesta,
            pregunta: obtenerPregunta(radioGroup),
            origen: 'RADIO',
            timestamp: Date.now()
          };
        };

        const capturarConfirmacion = (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;

          const button = target.closest('button');
          if (!button) return;

          const textoBoton = normalizar(button.textContent)
            .toLocaleUpperCase('es-AR');

          if (
            !textoBoton.includes('CONFIRMAR') &&
            !textoBoton.includes('GUARDAR')
          ) {
            return;
          }

          const dialog = button.closest('[role="dialog"]');
          if (!dialog) return;

          const radioGroups = Array.from(
            dialog.querySelectorAll('[role="radiogroup"]')
          );

          for (const radioGroup of radioGroups) {
            const checked = radioGroup.querySelector(
              'input[type="radio"]:checked'
            );

            if (!checked) continue;

            const label = obtenerLabelRadio(checked, dialog);
            if (!label) continue;

            const respuesta = normalizar(label.textContent);
            if (!respuesta) continue;

            window.__daiLearningRadio = {
              respuesta,
              pregunta: obtenerPregunta(radioGroup),
              origen: 'CONFIRMAR',
              timestamp: Date.now()
            };

            return;
          }
        };

        // pointerdown permite registrar incluso una opción que ya estaba checked.
        document.addEventListener('pointerdown', capturarRadio, true);
        // click queda como respaldo para controles Material UI.
        document.addEventListener('click', capturarRadio, true);
        // En una confirmación manual capturamos también el RADIO realmente checked.
        document.addEventListener('click', capturarConfirmacion, true);
      })();
    `;

    await this.page.addScriptTag({
      content: script
    });
  }

  private async leerEventoClickRadio(): Promise<{
    respuesta: string;
    pregunta: string;
    origen: 'RADIO' | 'CONFIRMAR';
  } | null> {
    const resultado =
      await this.page.evaluate(
        `(() => {
          const evento =
            window.__daiLearningRadio;

          if (!evento) {
            return null;
          }

          return {
            respuesta:
              String(
                evento.respuesta || ''
              ),
            pregunta:
              String(
                evento.pregunta || ''
              ),
            origen:
              evento.origen === 'CONFIRMAR'
                ? 'CONFIRMAR'
                : 'RADIO'
          };
        })()`
      );

    if (
      !resultado ||
      typeof resultado !==
        'object'
    ) {
      return null;
    }

    const evento =
      resultado as {
        respuesta?: unknown;
        pregunta?: unknown;
        origen?: unknown;
      };

    if (
      typeof evento.respuesta !==
        'string' ||
      !evento.respuesta.trim()
    ) {
      return null;
    }

    return {
      respuesta:
        this.normalizarTexto(
          evento.respuesta
        ),
      pregunta:
        typeof evento.pregunta ===
          'string'
          ? this.normalizarTexto(
              evento.pregunta
            )
          : '',
      origen:
        evento.origen ===
          'CONFIRMAR'
          ? 'CONFIRMAR'
          : 'RADIO'
    };
  }

  private async limpiarEventoClickRadio(): Promise<void> {
    await this.page.evaluate(
      `(() => {
        window.__daiLearningRadio = null;
      })()`
    );
  }

  private coincidePreguntaCapturada(
    capturada: string,
    esperada: string
  ): boolean {
    if (!capturada) {
      return true;
    }

    return (
      this.normalizarTexto(
        capturada
      ) ===
      this.normalizarTexto(
        esperada
      )
    );
  }

  private async instalarObservadorTexto(): Promise<void> {
    const script = String.raw`
(() => {
  const w = window;
  if (w.__daiLearningTexto && w.__daiLearningTexto.instalado) {
    w.__daiLearningTexto.evento = null;
    return;
  }

  const normalizar = (valor) => String(valor ?? '').trim().replace(/\s+/g, ' ');
  const obtenerPregunta = (dialogo, input) => {
    let actual = input.parentElement;
    while (actual && actual !== dialogo) {
      const p = actual.querySelector('p');
      const texto = p ? normalizar(p.textContent) : '';
      if (texto && !/complet[aá].*preguntas.*item/i.test(texto)) return texto;
      actual = actual.parentElement;
    }
    return Array.from(dialogo.querySelectorAll('p'))
      .map((p) => normalizar(p.textContent))
      .filter(Boolean)
      .filter((t) => !/complet[aá].*preguntas.*item/i.test(t))
      .sort((a, b) => b.length - a.length)[0] || '';
  };

  w.__daiLearningTexto = { instalado: true, evento: null };

  document.addEventListener('click', (evento) => {
    const objetivo = evento.target;
    if (!(objetivo instanceof Element)) return;
    const boton = objetivo.closest('button, [role="button"]');
    if (!boton) return;
    const textoBoton = normalizar(boton.textContent).toLocaleUpperCase('es-AR');
    if (!textoBoton.includes('GUARDAR RESPUESTA')) return;
    const dialogo = boton.closest('[role="dialog"]');
    if (!dialogo) return;
    const input = dialogo.querySelector(
      'input[type="text"][placeholder="Ingresá tu respuesta"], input[placeholder="DD/MM/AAAA"]'
    );
    if (!input) return;
    const respuesta = String(input.value ?? '').trim();
    // "0" es válido; sólo rechazamos cadena realmente vacía.
    if (respuesta.length === 0) return;
    w.__daiLearningTexto.evento = {
      pregunta: obtenerPregunta(dialogo, input),
      respuesta,
      timestamp: Date.now()
    };
  }, true);
})();
`;

    await this.page.addScriptTag({ content: script });
  }

  private async esperarRespuestaManualTexto(
    preguntaActual: PreguntaDetectada
  ): Promise<string> {
    await this.instalarObservadorTexto();
    const inicio = Date.now();
    const limiteMs = 5 * 60 * 1000;

    while (Date.now() - inicio < limiteMs) {
      const resultado = await this.page.evaluate(`(() => {
        const estado = window.__daiLearningTexto;
        if (!estado || !estado.evento) return null;
        return {
          pregunta: String(estado.evento.pregunta || ''),
          respuesta: String(estado.evento.respuesta ?? '')
        };
      })()`) as { pregunta: string; respuesta: string } | null;

      if (resultado) {
        if (!this.coincidePreguntaCapturada(resultado.pregunta, preguntaActual.texto)) {
          throw new Error(
            `Learning Engine: la respuesta ${preguntaActual.tipoControl} capturada no coincide con la pregunta observada. Se detuvo para evitar aprender una asociación incorrecta.`
          );
        }
        if (resultado.respuesta.trim().length === 0) {
          throw new Error(`Learning Engine: se intentó guardar una respuesta ${preguntaActual.tipoControl} vacía. No se aprendió.`);
        }
        return resultado.respuesta.trim();
      }

      await this.page.waitForTimeout(100);
    }

    throw new Error(
      `Learning Engine: no se detectó GUARDAR RESPUESTA manual para la pregunta ${preguntaActual.tipoControl} dentro de 5 minutos.`
    );
  }

  private esPreguntaFechaEmbarqueOrigen(
    textoPregunta: string
  ): boolean {
    const textoNormalizado =
      this.normalizarTexto(
        textoPregunta
      )
        .toLocaleUpperCase('es-AR');

    return (
      textoNormalizado.includes(
        'FEMB-ORIGEN'
      ) ||
      textoNormalizado.includes(
        'FECHA DE EMBARQUE DE ORIGEN'
      )
    );
  }

  private obtenerFechaMenos15Dias(): string {
    const fecha = new Date();

    fecha.setDate(
      fecha.getDate() - 15
    );

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const anio =
      fecha.getFullYear();

    return `${dia}/${mes}/${anio}`;
  }

  private async responderTextoAutomaticamente(
    respuesta: string,
    tipoControl: 'TEXTO' | 'FECHA' = 'TEXTO'
  ): Promise<void> {
    const dialogo = await this.obtenerDialogoPreguntas();
    if (!dialogo) {
      throw new Error(`Learning Engine: el modal desapareció antes de responder automáticamente la pregunta ${tipoControl}.`);
    }

    const selectorInput =
      tipoControl === 'FECHA'
        ? 'input[placeholder="DD/MM/AAAA"]'
        : 'input[type="text"][placeholder="Ingresá tu respuesta"]';

    const input = dialogo.locator(selectorInput).first();

    if (!await input.isVisible().catch(() => false)) {
      throw new Error(`Learning Engine: no encontró el input ${tipoControl} visible para responder automáticamente.`);
    }

    await input.fill(respuesta);
    const valorAplicado = await input.inputValue();
    if (valorAplicado !== respuesta) {
      throw new Error(`Learning Engine: DAI no reflejó correctamente la respuesta ${tipoControl} aprendida "${respuesta}".`);
    }

    console.log(`[Conocimiento] ${tipoControl} completado y verificado automáticamente: ${respuesta}`);

    const botonGuardar = dialogo.getByRole('button', { name: /GUARDAR RESPUESTA/i });
    await botonGuardar.waitFor({ state: 'visible', timeout: 30000 });
    await botonGuardar.click({ timeout: 30000 });
    console.log('[Conocimiento] GUARDAR RESPUESTA ejecutado automáticamente.');
  }

  private async responderRadioAutomaticamente(
    respuesta: string,
    preguntaActual: PreguntaDetectada
  ): Promise<void> {
    const dialogo =
      await this
        .obtenerDialogoPreguntas();

    if (!dialogo) {
      throw new Error(
        'Learning Engine: el modal desapareció antes de responder automáticamente la pregunta RADIO.'
      );
    }

    const radioGroups =
      dialogo.getByRole(
        'radiogroup'
      );

    if (
      await radioGroups.count() ===
      0
    ) {
      throw new Error(
        'Learning Engine: no encontró el radiogroup para responder automáticamente.'
      );
    }

    const radioGroup =
      radioGroups.first();

    const labels =
      radioGroup.locator('label');

    const textos =
      (await labels.allInnerTexts())
        .map(
          texto =>
            this.normalizarTexto(texto)
        );

    const objetivo =
      this.normalizarTexto(
        respuesta
      );

    const indice =
      textos.findIndex(
        texto =>
          texto === objetivo
      );

    if (indice < 0) {
      throw new Error(
        `Learning Engine: la respuesta RADIO aprendida "${respuesta}" ya no existe entre las opciones actuales. No se respondió automáticamente.`
      );
    }

    const label =
      labels.nth(indice);

    const radio =
      label.locator(
        'input[type="radio"]'
      );

    if (
      await radio.count()
    ) {
      await radio.check({
        timeout:
          30000
      });
    } else {
      await label.click({
        timeout:
          30000
      });
    }

    const aplicada =
      await this
        .esperarSeleccionRadioAplicada(
          respuesta,
          preguntaActual,
          5000
        );

    if (
      !aplicada
    ) {
      throw new Error(
        `Learning Engine: DAI no reflejó de forma estable la selección automática RADIO "${respuesta}".`
      );
    }

    console.log(
      `[Conocimiento] RADIO seleccionada y verificada automáticamente: ${respuesta}`
    );

    const confirmada =
      await this
        .intentarConfirmarSeleccionRadio();

    if (
      confirmada
    ) {
      console.log(
        '[Conocimiento] Confirmar selección ejecutado automáticamente.'
      );
    } else {
      console.log(
        '[Conocimiento] La RADIO no requiere un botón visible de Confirmar selección; se observará la transición de DAI.'
      );
    }
  }

  private async responderSiNoAutomaticamente(
    respuesta: string
  ): Promise<void> {
    const valor =
      this.normalizarTexto(
        respuesta
      );

    if (
      valor !== 'SÍ' &&
      valor !== 'NO'
    ) {
      throw new Error(
        `Learning Engine: respuesta SI_NO aprendida inválida: "${respuesta}".`
      );
    }

    const dialogo =
      await this
        .obtenerDialogoPreguntas();

    if (!dialogo) {
      throw new Error(
        'Learning Engine: el modal desapareció antes de responder automáticamente la pregunta SI_NO.'
      );
    }

    const boton =
      dialogo.getByRole(
        'button',
        {
          name:
            valor,
          exact:
            true
        }
      );

    await boton.waitFor({
      state:
        'visible',
      timeout:
        30000
    });

    console.log(
      `[Conocimiento] SI_NO respondida automáticamente: ${valor}`
    );

    await boton.click();
  }

  private async intentarConfirmarSeleccionRadio(): Promise<boolean> {
    const dialogo =
      await this
        .obtenerDialogoPreguntas();

    if (
      !dialogo
    ) {
      return false;
    }

    const botonConfirmar =
      dialogo.getByRole(
        'button',
        {
          name:
            /Confirmar selección/i
        }
      );

    const visible =
      await botonConfirmar
        .isVisible()
        .catch(
          () => false
        );

    if (
      !visible
    ) {
      return false;
    }

    await this.page.waitForTimeout(
      250
    );

    await botonConfirmar
      .click({
        timeout:
          30000
      });

    return true;
  }

  private async esperarSiguientePreguntaRobusta(
    preguntaAnterior:
      PreguntaDetectada,
    limiteMs:
      number = 60 * 1000
  ): Promise<PreguntaDetectada | null> {
    const firmaAnterior =
      this.crearFirmaPregunta(
        preguntaAnterior
      );

    const inicio =
      Date.now();

    let intento =
      0;

    let modalAusenteDesde:
      number | null =
        null;

    const ausenciaEstableMs =
      1200;

    while (
      Date.now() - inicio <
      limiteMs
    ) {
      intento +=
        1;

      const dialogo =
        await this
          .obtenerDialogoPreguntas();

      if (
        !dialogo
      ) {
        if (
          modalAusenteDesde ===
          null
        ) {
          modalAusenteDesde =
            Date.now();
        }

        if (
          Date.now() -
            modalAusenteDesde >=
          ausenciaEstableMs
        ) {
          console.log(
            '[Aprendizaje] El modal de preguntas terminó.'
          );

          return null;
        }

        await this.page
          .waitForTimeout(
            100
          );

        continue;
      }

      modalAusenteDesde =
        null;

      const firmaActual =
        await this
          .leerFirmaActual(
            dialogo
          );

      if (
        firmaActual &&
        firmaActual !==
          firmaAnterior
      ) {
        console.log(
          `[Aprendizaje] Cambio de pregunta detectado en intento ${intento}.`
        );

        await this.page
          .waitForTimeout(
            200
          );

        return this.detector
          .detectarPreguntaActual();
      }

      await this.page
        .waitForTimeout(
          150
        );
    }

    const dialogoFinal =
      await this
        .obtenerDialogoPreguntas();

    if (
      !dialogoFinal
    ) {
      return null;
    }

    const firmaFinal =
      await this
        .leerFirmaActual(
          dialogoFinal
        );

    if (
      firmaFinal &&
      firmaFinal !==
        firmaAnterior
    ) {
      console.log(
        '[Aprendizaje] Cambio de pregunta detectado en verificación final.'
      );

      return this.detector
        .detectarPreguntaActual();
    }

    throw new Error(
      `Learning Engine: se respondió la pregunta, pero no se detectó una pregunta nueva dentro de ${Math.round(limiteMs / 1000)} segundos.`
    );
  }

  private async leerFirmaActual(
    dialogo: Locator
  ): Promise<string | null> {
    const radioGroups =
      dialogo.getByRole(
        'radiogroup'
      );

    if (
      await radioGroups.count() >
      0
    ) {
      for (
        let indice = 0;
        indice < await radioGroups.count();
        indice += 1
      ) {
        const radioGroup =
          radioGroups.nth(
            indice
          );

        const visible =
          await radioGroup
            .isVisible()
            .catch(
              () => false
            );

        if (
          !visible
        ) {
          continue;
        }

        const pregunta =
          await this
            .leerRadioSinLogs(
              radioGroup
            );

        if (
          pregunta
        ) {
          return this
            .crearFirmaPregunta(
              pregunta
            );
        }
      }
    }

    const botonNo =
      dialogo.getByRole(
        'button',
        {
          name:
            'NO',
          exact:
            true
        }
      );

    const botonSi =
      dialogo.getByRole(
        'button',
        {
          name:
            'SÍ',
          exact:
            true
        }
      );

    const noVisible =
      await botonNo
        .isVisible()
        .catch(
          () => false
        );

    const siVisible =
      await botonSi
        .isVisible()
        .catch(
          () => false
        );

    if (
      noVisible &&
      siVisible
    ) {
      const texto =
        await this
          .leerTextoSiNoSinLogs(
            dialogo
          );

      if (
        texto
      ) {
        return this
          .crearFirmaPregunta({
            texto,
            tipoControl:
              'SI_NO',
            opciones: [
              'NO',
              'SÍ'
            ]
          });
      }
    }

    const inputTexto = dialogo.locator(
      'input[type="text"][placeholder="Ingresá tu respuesta"]'
    );

    if (await inputTexto.count() > 0) {
      const inputVisible = inputTexto.first();
      if (await inputVisible.isVisible().catch(() => false)) {
        const texto = await this.leerTextoPreguntaSinLogs(dialogo, inputVisible);
        if (texto) {
          return this.crearFirmaPregunta({ texto, tipoControl: 'TEXTO' });
        }
      }
    }

    const inputFecha = dialogo.locator(
      'input[placeholder="DD/MM/AAAA"]'
    );

    if (await inputFecha.count() > 0) {
      const inputVisible = inputFecha.first();
      if (await inputVisible.isVisible().catch(() => false)) {
        const texto = await this.leerTextoPreguntaSinLogs(dialogo, inputVisible);
        if (texto) {
          return this.crearFirmaPregunta({ texto, tipoControl: 'FECHA' });
        }
      }
    }

    return null;
  }

  private async leerTextoPreguntaSinLogs(
    dialogo: Locator,
    inputTexto: Locator
  ): Promise<string | null> {
    try {
      const contenedor = inputTexto.locator('xpath=ancestor::div[p][1]');
      if (await contenedor.count() > 0) {
        const parrafos = contenedor.locator('p');
        for (let i = 0; i < await parrafos.count(); i += 1) {
          const p = parrafos.nth(i);
          if (!await p.isVisible().catch(() => false)) continue;
          const texto = this.normalizarTexto(await p.innerText());
          if (texto) return texto;
        }
      }
      return this.leerTextoSiNoSinLogs(dialogo);
    } catch {
      return null;
    }
  }

  private async leerRadioSinLogs(
    radioGroup: Locator
  ): Promise<PreguntaDetectada | null> {
    try {
      const contenedorPregunta =
        radioGroup.locator(
          'xpath=../..'
        );

      const textosPregunta =
        contenedorPregunta
          .locator('p');

      const textos =
        await textosPregunta.count() > 0
          ? await textosPregunta
              .allInnerTexts()
          : [];

      const texto =
        textos
          .map(
            (valor: string) =>
              this.normalizarTexto(
                valor
              )
          )
          .find(
            Boolean
          ) ??
        'RADIO_SIN_TEXTO';

      const labels =
        radioGroup.locator(
          'label'
        );

      const textosOpciones =
        await labels
          .allInnerTexts();

      const opciones =
        textosOpciones
          .map(
            (valor: string) =>
              this.normalizarTexto(
                valor
              )
          )
          .filter(
            Boolean
          );

      if (
        opciones.length ===
        0
      ) {
        return null;
      }

      return {
        texto,
        tipoControl:
          'RADIO',
        opciones
      };
    } catch {
      /*
       * DAI puede reemplazar el radiogroup mientras cambia de pregunta.
       * Si ocurre durante la lectura, el polling vuelve a intentar con
       * el nuevo DOM en vez de bloquearse sobre un label que ya no existe.
       */
      return null;
    }
  }

  private async leerTextoSiNoSinLogs(
    dialogo: Locator
  ): Promise<string | null> {
    const parrafos =
      dialogo.locator(
        'p'
      );

    const cantidad =
      await parrafos.count();

    const candidatos:
      string[] = [];

    for (
      let indice = 0;
      indice < cantidad;
      indice += 1
    ) {
      const parrafo =
        parrafos.nth(
          indice
        );

      const visible =
        await parrafo
          .isVisible()
          .catch(
            () => false
          );

      if (
        !visible
      ) {
        continue;
      }

      const texto =
        this.normalizarTexto(
          await parrafo
            .innerText()
      );

      if (
        !texto
      ) {
        continue;
      }

      if (
        /complet[aá].*preguntas.*item/i
          .test(
            texto
          )
      ) {
        continue;
      }

      candidatos.push(
        texto
      );
    }

    if (
      candidatos.length ===
      0
    ) {
      return null;
    }

    return candidatos
      .sort(
        (
          a,
          b
        ) =>
          b.length -
          a.length
      )[0];
  }

  private async obtenerDialogoPreguntas(): Promise<Locator | null> {
    const dialogos =
      this.page.getByRole(
        'dialog'
      );

    const cantidad =
      await dialogos.count();

    for (
      let indice = 0;
      indice < cantidad;
      indice += 1
    ) {
      const candidato =
        dialogos.nth(
          indice
        );

      if (
        !await candidato
          .isVisible()
          .catch(
            () => false
          )
      ) {
        continue;
      }

      const radioVisible =
        await candidato
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
        return candidato;
      }

      const noVisible =
        await candidato
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
        await candidato
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
        return candidato;
      }

      const textoVisible =
        await candidato
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
        return candidato;
      }

      const fechaVisible =
        await candidato
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
        return candidato;
      }
    }

    return null;
  }

  private imprimirPregunta(
    numeroPregunta: number,
    pregunta:
      PreguntaDetectada
  ): void {
    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      `       PREGUNTA ${numeroPregunta} - APRENDIZAJE`
    );
    console.log(
      '=========================================='
    );
    console.log(
      `Pregunta: ${pregunta.texto}`
    );
    console.log(
      `Tipo: ${pregunta.tipoControl}`
    );

    const opciones =
      pregunta.opciones ??
      [];

    if (
      opciones.length >
      0
    ) {
      console.log('');
      console.log(
        'Opciones:'
      );

      opciones.forEach(
        (
          opcion,
          indice
        ) => {
          console.log(
            `[${indice}] ${opcion}`
          );
        }
      );
    }
  }

  private esOpcionNeutral(
    texto: string
  ): boolean {
    return this
      .normalizarTexto(
        texto
      )
      .toLocaleLowerCase(
        'es'
      ) ===
        'ninguna opción';
  }

  private crearFirmaPregunta(
    pregunta:
      PreguntaDetectada
  ): string {
    return JSON.stringify({
      texto:
        this.normalizarTexto(
          pregunta.texto
        ),
      tipoControl:
        pregunta.tipoControl,
      opciones:
        (
          pregunta.opciones ??
          []
        )
          .map(
            opcion =>
              this.normalizarTexto(
                opcion
              )
          )
    });
  }

  private clonarPregunta(
    pregunta:
      PreguntaDetectada
  ): PreguntaDetectada {
    return {
      ...pregunta,
      opciones:
        pregunta.opciones
          ? [
              ...pregunta
                .opciones
            ]
          : undefined
    };
  }

  private clonarRegistroConocimiento(
    registro: RegistroConocimiento
  ): RegistroConocimiento {
    return {
      ...registro,
      contexto: {
        ...registro.contexto,
        ventajas:
          registro.contexto.ventajas
            ? [
                ...registro
                  .contexto
                  .ventajas
              ]
            : undefined,
        informacionComplementaria:
          registro.contexto
            .informacionComplementaria
              ? {
                  ...registro
                    .contexto
                    .informacionComplementaria
                }
              : undefined,
        respuestasPrevias:
          registro.contexto
            .respuestasPrevias
            .map(
              respuesta => ({
                ...respuesta
              })
            )
      },
      pregunta: {
        ...registro.pregunta,
        opciones:
          registro.pregunta.opciones
            ? [
                ...registro
                  .pregunta
                  .opciones
              ]
            : undefined
      },
      respuesta: {
        ...registro.respuesta
      }
    };
  }

  private normalizarTexto(
    texto: string
  ): string {
    return texto
      .trim()
      .replace(
        /\s+/g,
        ' '
      );
  }
}
