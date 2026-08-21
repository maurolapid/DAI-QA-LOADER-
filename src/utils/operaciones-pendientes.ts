import fs from 'node:fs';
import path from 'node:path';

export type EtapaOperacionPendiente =
  | 'documento-transporte';

export type OperacionPendiente = {
  operationId: string;
  ambienteNombre: string;
  baseUrl: string;
  subregimen: 'IC04';
  posicionArancelaria: string;
  referencia: string;
  interno: string;
  loginMock: string;
  etapa: EtapaOperacionPendiente;
  estado: 'pendiente';
  creadoEn: string;
  actualizadoEn: string;
};

export type OperacionCompletada =
  Omit<OperacionPendiente, 'estado'> & {
    estado: 'completada';
    completadoEn: string;
  };

const root = process.cwd();

const runtimeDir =
  path.join(
    root,
    'runtime'
  );

const pendientesPath =
  path.join(
    runtimeDir,
    'operaciones-pendientes.json'
  );

const completadasPath =
  path.join(
    runtimeDir,
    'operaciones-completadas.json'
  );

function asegurarRuntime() {
  fs.mkdirSync(
    runtimeDir,
    {
      recursive: true
    }
  );
}

function leerArray<T>(
  filePath: string
): T[] {
  if (
    !fs.existsSync(filePath)
  ) {
    return [];
  }

  const content =
    fs.readFileSync(
      filePath,
      'utf-8'
    );

  if (
    content.trim().length === 0
  ) {
    return [];
  }

  const parsed =
    JSON.parse(content);

  return Array.isArray(parsed)
    ? parsed as T[]
    : [];
}

function escribirArray<T>(
  filePath: string,
  data: T[]
) {
  asegurarRuntime();

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      data,
      null,
      2
    ) + '\n',
    'utf-8'
  );
}

function normalizarBaseUrl(
  value: string
) {
  return value
    .trim()
    .replace(/\/+$/, '');
}

export function listarOperacionesPendientes(
  baseUrl?: string
): OperacionPendiente[] {
  const pendientes =
    leerArray<OperacionPendiente>(
      pendientesPath
    );

  if (
    !baseUrl
  ) {
    return pendientes;
  }

  const objetivo =
    normalizarBaseUrl(baseUrl);

  return pendientes.filter(
    pendiente =>
      normalizarBaseUrl(
        pendiente.baseUrl
      ) === objetivo
  );
}

export function guardarOperacionPendiente(
  pendiente: Omit<
    OperacionPendiente,
    'estado' | 'creadoEn' | 'actualizadoEn'
  >
): OperacionPendiente {
  const ahora =
    new Date().toISOString();

  const pendientes =
    listarOperacionesPendientes();

  const existente =
    pendientes.find(
      item =>
        item.operationId ===
        pendiente.operationId
    );

  const registro:
    OperacionPendiente = {
      ...pendiente,
      estado: 'pendiente',
      creadoEn:
        existente?.creadoEn ??
        ahora,
      actualizadoEn:
        ahora
    };

  const actualizadas =
    pendientes.filter(
      item =>
        item.operationId !==
        pendiente.operationId
    );

  actualizadas.push(
    registro
  );

  escribirArray(
    pendientesPath,
    actualizadas
  );

  return registro;
}

export function marcarOperacionCompletada(
  operationId: string
) {
  const pendientes =
    listarOperacionesPendientes();

  const pendiente =
    pendientes.find(
      item =>
        item.operationId ===
        operationId
    );

  if (
    !pendiente
  ) {
    return;
  }

  const restantes =
    pendientes.filter(
      item =>
        item.operationId !==
        operationId
    );

  escribirArray(
    pendientesPath,
    restantes
  );

  const completadas =
    leerArray<OperacionCompletada>(
      completadasPath
    );

  completadas.push({
    ...pendiente,
    estado: 'completada',
    completadoEn:
      new Date().toISOString()
  });

  escribirArray(
    completadasPath,
    completadas
  );
}