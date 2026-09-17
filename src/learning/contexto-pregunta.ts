import {
  ContextoPregunta,
  EtapaAprendizaje,
  RespuestaPrevia,
} from './tipos-aprendizaje';

export interface DatosContextoPregunta {
  subregimen: string;
  posicionArancelaria: string;
  perfilId: string;
  etapa: EtapaAprendizaje;

  cuit?: string;

  paisOrigen?: string;
  paisProcedencia?: string;
  paisDestino?: string;

  ventajas?: string[];

  informacionComplementaria?: Record<string, string>;

  numeroItem?: number;
  numeroSubitem?: number;
}

/**
 * Mantiene el contexto actual del recorrido de preguntas.
 *
 * Su responsabilidad NO es decidir respuestas.
 * Solamente conoce el estado de la operación y las
 * respuestas que ya fueron dadas durante el recorrido.
 */
export class ContextoPreguntaBuilder {
  private readonly datos: DatosContextoPregunta;
  private readonly respuestasPrevias: RespuestaPrevia[] = [];

  constructor(datos: DatosContextoPregunta) {
    this.datos = {
      ...datos,
      ventajas: datos.ventajas ? [...datos.ventajas] : undefined,
      informacionComplementaria: datos.informacionComplementaria
        ? { ...datos.informacionComplementaria }
        : undefined,
    };
  }

  /**
   * Registra una respuesta realizada durante el recorrido.
   *
   * Esto nos permitirá distinguir ramas:
   *
   * P1 = NO -> P2
   * P1 = SI -> P7
   */
  registrarRespuesta(pregunta: string, respuesta: string): void {
    this.respuestasPrevias.push({
      pregunta: this.normalizarTexto(pregunta),
      respuesta: respuesta.trim(),
    });
  }

  /**
   * Devuelve una fotografía del contexto EN ESTE MOMENTO.
   *
   * Importante:
   * devolvemos copias para evitar que otro componente
   * modifique accidentalmente el contexto interno.
   */
  obtenerContexto(): ContextoPregunta {
    return {
      ...this.datos,

      ventajas: this.datos.ventajas
        ? [...this.datos.ventajas]
        : undefined,

      informacionComplementaria: this.datos.informacionComplementaria
        ? { ...this.datos.informacionComplementaria }
        : undefined,

      respuestasPrevias: this.respuestasPrevias.map((respuesta) => ({
        ...respuesta,
      })),
    };
  }

  obtenerRespuestasPrevias(): RespuestaPrevia[] {
    return this.respuestasPrevias.map((respuesta) => ({
      ...respuesta,
    }));
  }

  /**
   * Por ahora hacemos una normalización CONSERVADORA.
   *
   * No queremos fuzzy matching ni interpretar que dos
   * preguntas "parecidas" significan lo mismo.
   */
  private normalizarTexto(texto: string): string {
    return texto
      .trim()
      .replace(/\s+/g, ' ');
  }
}
