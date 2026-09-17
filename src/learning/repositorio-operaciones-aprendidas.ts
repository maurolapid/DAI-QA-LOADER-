import fs from 'node:fs';
import path from 'node:path';

import type {
  BaseOperacionesAprendidas,
  OperacionAprendida
} from './tipos-operacion-aprendida';

const BASE_VACIA: BaseOperacionesAprendidas = {
  version: 2,
  operaciones: []
};

export class RepositorioOperacionesAprendidas {
  private readonly archivo: string;

  constructor(
    archivo: string = path.join(
      process.cwd(),
      'data',
      'aprendizaje',
      'operaciones-aprendidas.json'
    )
  ) {
    this.archivo = archivo;
  }

  inicializar(): void {
    const directorio =
      path.dirname(this.archivo);

    fs.mkdirSync(
      directorio,
      {
        recursive: true
      }
    );

    if (
      !fs.existsSync(
        this.archivo
      )
    ) {
      this.escribir(
        BASE_VACIA
      );
    }
  }

  obtenerBase(): BaseOperacionesAprendidas {
    this.inicializar();

    const contenido =
      fs.readFileSync(
        this.archivo,
        'utf-8'
      )
        .replace(
          /^\uFEFF/,
          ''
        );

    const base =
      JSON.parse(
        contenido
      ) as BaseOperacionesAprendidas;

    if (
      base.version !== 2 ||
      !Array.isArray(
        base.operaciones
      )
    ) {
      throw new Error(
        'Learning Engine: operaciones-aprendidas.json tiene un formato inválido.'
      );
    }

    return {
      version: 2,
      operaciones:
        base.operaciones.map(
          operacion =>
            structuredClone(
              operacion
            )
        )
    };
  }

  obtenerOperaciones(): OperacionAprendida[] {
    return this
      .obtenerBase()
      .operaciones;
  }

  guardar(
    operacion: OperacionAprendida
  ): void {
    const base =
      this.obtenerBase();

    const claveOperacion =
      this.crearClaveIdentidad(
        operacion
      );

    base.operaciones =
      base.operaciones
        .filter(
          actual =>
            actual.id !==
              operacion.id &&
            this.crearClaveIdentidad(
              actual
            ) !==
              claveOperacion
        );

    base.operaciones.push(
      structuredClone(
        operacion
      )
    );

    this.escribir(
      base
    );
  }

  private crearClaveIdentidad(
    operacion: OperacionAprendida
  ): string {
    const posiciones =
      operacion.contexto.items
        .map(
          item =>
            item.posicionArancelaria
              .replace(
                /[^A-Z0-9]/gi,
                ''
              )
              .toLocaleUpperCase(
                'es-AR'
              )
        )
        .join('|');

    return `${operacion.subregimen}|${posiciones}`;
  }

  private escribir(
    base: BaseOperacionesAprendidas
  ): void {
    fs.writeFileSync(
      this.archivo,
      `${JSON.stringify(
        base,
        null,
        2
      )}\n`,
      {
        encoding: 'utf-8'
      }
    );
  }
}
