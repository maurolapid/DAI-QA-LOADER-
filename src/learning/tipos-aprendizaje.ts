export type TipoControlPregunta =
  | 'SI_NO'
  | 'RADIO'
  | 'TEXTO'
  | 'FECHA'
  | 'SELECTOR'
  | 'CONFIRMACION'
  | 'DESCONOCIDO';

export type EtapaAprendizaje =
  | 'PREGUNTAS_ITEM'
  | 'CERTIPAC'
  | 'BULTOS'
  | 'DOCUMENTO_TRANSPORTE'
  | 'PRESUPUESTO'
  | 'OTRA';

export interface RespuestaPrevia {
  pregunta: string;
  respuesta: string;
}

export interface ContextoPregunta {
  /**
   * Variables principales conocidas.
   */
  subregimen: string;
  posicionArancelaria: string;

  /** Perfil funcional seleccionado para esta ejecución. */
  perfilId: string;

  /**
   * Lugar del flujo donde DAI mostró la pregunta.
   */
  etapa: EtapaAprendizaje;

  /**
   * Contexto opcional.
   *
   * No asumimos todavía que estas variables siempre
   * intervienen en la generación de preguntas.
   */
  cuit?: string;

  paisOrigen?: string;
  paisProcedencia?: string;
  paisDestino?: string;

  ventajas?: string[];

  informacionComplementaria?: Record<string, string>;

  /**
   * Para poder identificar diferentes ramas del
   * recorrido dinámico generado por DAI.
   */
  respuestasPrevias: RespuestaPrevia[];

  /**
   * Preparado desde ahora para operaciones
   * con múltiples items y futuros subitems.
   */
  numeroItem?: number;
  numeroSubitem?: number;
}

export interface PreguntaDetectada {
  texto: string;
  tipoControl: TipoControlPregunta;

  /**
   * Valores disponibles cuando el control posee
   * opciones seleccionables.
   *
   * Ejemplo:
   * ["SI", "NO"]
   * ["CHINA", "BRASIL", "CHAD"]
   */
  opciones?: string[];
}

export interface RespuestaAprendida {
  valor: string;

  /**
   * Indica que DAI debe propagar esta respuesta a los ítems siguientes.
   * Los registros históricos sin esta propiedad equivalen a false.
   */
  repetirEnItemsSiguientes?: boolean;
}

export interface RegistroConocimiento {
  id: string;

  contexto: ContextoPregunta;

  pregunta: PreguntaDetectada;

  respuesta: RespuestaAprendida;

  /**
   * Información de trazabilidad.
   */
  fechaAprendizaje: string;
  ultimaValidacion?: string;
  cantidadUsos: number;
}

export interface BaseConocimiento {
  version: 2;
  registros: RegistroConocimiento[];
}
