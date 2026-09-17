import {
  ContextoPregunta,
  PreguntaDetectada,
  RegistroConocimiento,
} from './tipos-aprendizaje';

export interface ResultadoMatch {
  encontrada: boolean;
  registro?: RegistroConocimiento;
  heredada?: boolean;
}

/**
 * Busca conocimiento previamente aprendido.
 *
 * En esta primera versión somos deliberadamente estrictos.
 *
 * NO hacemos:
 * - fuzzy matching
 * - similitud semántica
 * - IA
 * - aproximaciones
 *
 * Si no estamos seguros, la pregunta se considera desconocida.
 */
export class MatcherConocimiento {
  buscar(
    contextoActual: ContextoPregunta,
    preguntaActual: PreguntaDetectada,
    registros: RegistroConocimiento[],
  ): ResultadoMatch {
    const registroExacto = registros.find((candidato) =>
      this.coincide(
        contextoActual,
        preguntaActual,
        candidato,
        false,
      ),
    );

    if (registroExacto) {
      return {
        encontrada: true,
        registro: registroExacto,
        heredada: false,
      };
    }

    const candidatosHeredados = registros.filter((candidato) =>
      this.coincide(
        contextoActual,
        preguntaActual,
        candidato,
        true,
      ),
    );

    const respuestasDistintas = new Set(
      candidatosHeredados.map((candidato) =>
        this.normalizarValor(candidato.respuesta.valor),
      ),
    );

    if (
      candidatosHeredados.length === 0 ||
      respuestasDistintas.size !== 1
    ) {
      return {
        encontrada: false,
      };
    }

    return {
      encontrada: true,
      registro: candidatosHeredados[0],
      heredada: true,
    };
  }

  private coincide(
    contextoActual: ContextoPregunta,
    preguntaActual: PreguntaDetectada,
    candidato: RegistroConocimiento,
    ignorarPerfil: boolean,
  ): boolean {
    if (
      this.normalizarValor(contextoActual.subregimen) !==
      this.normalizarValor(candidato.contexto.subregimen)
    ) {
      return false;
    }

    if (
      this.normalizarValor(contextoActual.posicionArancelaria) !==
      this.normalizarValor(candidato.contexto.posicionArancelaria)
    ) {
      return false;
    }

    if (
      !ignorarPerfil &&
      contextoActual.perfilId !==
        candidato.contexto.perfilId
    ) {
      return false;
    }

    if (contextoActual.etapa !== candidato.contexto.etapa) {
      return false;
    }

    if (
      this.normalizarPregunta(preguntaActual.texto) !==
      this.normalizarPregunta(candidato.pregunta.texto)
    ) {
      return false;
    }

    if (
      preguntaActual.tipoControl !==
      candidato.pregunta.tipoControl
    ) {
      return false;
    }

    /**
     * DAI puede mostrar textos genéricos como:
     *
     * "Seleccion de una opción"
     *
     * Por eso, cuando existen opciones, también forman
     * parte de la identidad de la pregunta.
     */
    if (
      !this.coincidenOpciones(
        preguntaActual.opciones,
        candidato.pregunta.opciones,
      )
    ) {
      return false;
    }

    if (
      !this.coincidenRespuestasPrevias(
        contextoActual.respuestasPrevias,
        candidato.contexto.respuestasPrevias,
      )
    ) {
      return false;
    }

    return true;
  }

  private coincidenOpciones(
    actuales?: string[],
    aprendidas?: string[],
  ): boolean {
    const opcionesActuales =
      actuales?.map((opcion) =>
        this.normalizarPregunta(opcion),
      ) ?? [];

    const opcionesAprendidas =
      aprendidas?.map((opcion) =>
        this.normalizarPregunta(opcion),
      ) ?? [];

    if (
      opcionesActuales.length !==
      opcionesAprendidas.length
    ) {
      return false;
    }

    return opcionesActuales.every(
      (opcion, indice) =>
        opcion === opcionesAprendidas[indice],
    );
  }

  private coincidenRespuestasPrevias(
    actuales: ContextoPregunta['respuestasPrevias'],
    aprendidas: ContextoPregunta['respuestasPrevias'],
  ): boolean {
    if (actuales.length !== aprendidas.length) {
      return false;
    }

    return actuales.every((actual, indice) => {
      const aprendida = aprendidas[indice];

      return (
        this.normalizarPregunta(actual.pregunta) ===
          this.normalizarPregunta(aprendida.pregunta) &&
        this.normalizarValor(actual.respuesta) ===
          this.normalizarValor(aprendida.respuesta)
      );
    });
  }

  /**
   * Normalización conservadora.
   *
   * Ignoramos únicamente:
   * - espacios sobrantes
   * - mayúsculas/minúsculas
   *
   * NO eliminamos palabras.
   * NO alteramos acentos.
   * NO hacemos similitud.
   */
  private normalizarPregunta(texto: string): string {
    return texto
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleUpperCase('es-AR');
  }

  private normalizarValor(valor: string): string {
    return valor
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleUpperCase('es-AR');
  }
}
