export type SubregimenOperacionAprendida =
  | 'IC04'
  | 'EC01';

export type EstadoOperacionAprendida =
  | 'APRENDIDA'
  | 'INCOMPLETA';

export type EtapaOperacionAprendida =
  | 'REGISTRO'
  | 'CARATULA'
  | 'ITEMS'
  | 'PREGUNTAS_ITEM'
  | 'CERTIPAC'
  | 'PAC_ROM'
  | 'BULTOS'
  | 'DOCUMENTO_TRANSPORTE'
  | 'PRESUPUESTO'
  | 'OTRA';

export type ModoSufijosOperacionAprendida =
  | 'automatico'
  | 'asistido';

export interface ItemOperacionAprendida {
  numeroItem: number;
  posicionArancelaria: string;
  paisOrigen?: string;
  paisProcedencia?: string;
  paisDestino?: string;
}

export interface ContextoOperacionAprendida {
  ambienteNombre?: string;
  datosClave?: Record<string, string>;
  items: ItemOperacionAprendida[];
}

export interface ParametrosOperacionAprendida {
  fobTotal: string;
  modoSufijos: ModoSufijosOperacionAprendida;
  facturas: 'Si' | 'No';
}

export interface PerfilEscenarioAprendido {
  documentos: boolean;
  ventajas: boolean;
  cancelaciones: boolean;
}

export interface CaminoOperacionAprendida {
  id: string;
  nombre: string;
  perfil: PerfilEscenarioAprendido;
  parametros: ParametrosOperacionAprendida;
  recorrido: EtapaOperacionAprendida[];
  creadaEn: string;
  actualizadaEn: string;
}

export interface OperacionAprendida {
  id: string;
  nombre: string;
  subregimen: SubregimenOperacionAprendida;
  estado: EstadoOperacionAprendida;
  contexto: ContextoOperacionAprendida;
  caminos: CaminoOperacionAprendida[];
  creadaEn: string;
  actualizadaEn: string;
}

export interface BaseOperacionesAprendidas {
  version: 2;
  operaciones: OperacionAprendida[];
}
