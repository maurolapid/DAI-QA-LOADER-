import fs from 'fs';
import path from 'path';
import {
  BaseConocimiento,
  RegistroConocimiento,
} from './tipos-aprendizaje';

export class RepositorioConocimiento {
  private readonly rutaArchivo: string;

  constructor(
    rutaArchivo = path.resolve(
      process.cwd(),
      'data',
      'aprendizaje',
      'conocimiento.json',
    ),
  ) {
    this.rutaArchivo = rutaArchivo;
  }

  /**
   * Garantiza que exista el directorio y el archivo
   * de conocimiento.
   */
  inicializar(): void {
    const directorio = path.dirname(this.rutaArchivo);

    if (!fs.existsSync(directorio)) {
      fs.mkdirSync(directorio, { recursive: true });
    }

    if (!fs.existsSync(this.rutaArchivo)) {
      const baseInicial: BaseConocimiento = {
        version: 2,
        registros: [],
      };

      this.escribir(baseInicial);
    }
  }

  /**
   * Obtiene toda la base de conocimiento actual.
   */
  obtenerBase(): BaseConocimiento {
    this.inicializar();

    const contenido = fs.readFileSync(
      this.rutaArchivo,
      'utf-8',
    );

    const datos = JSON.parse(contenido) as BaseConocimiento;

    if (datos.version !== 2) {
      throw new Error(
        `Versión de conocimiento no soportada: ${datos.version}`,
      );
    }

    if (!Array.isArray(datos.registros)) {
      throw new Error(
        'El archivo de conocimiento no contiene un arreglo de registros válido.',
      );
    }

    return datos;
  }

  /**
   * Devuelve una copia de todos los conocimientos almacenados.
   */
  obtenerRegistros(): RegistroConocimiento[] {
    const base = this.obtenerBase();

    return base.registros.map((registro) => ({
      ...registro,
      contexto: {
        ...registro.contexto,
        ventajas: registro.contexto.ventajas
          ? [...registro.contexto.ventajas]
          : undefined,
        informacionComplementaria:
          registro.contexto.informacionComplementaria
            ? { ...registro.contexto.informacionComplementaria }
            : undefined,
        respuestasPrevias:
          registro.contexto.respuestasPrevias.map((respuesta) => ({
            ...respuesta,
          })),
      },
      pregunta: {
        ...registro.pregunta,
        opciones: registro.pregunta.opciones
          ? [...registro.pregunta.opciones]
          : undefined,
      },
      respuesta: {
        ...registro.respuesta,
      },
    }));
  }

  /**
   * Guarda un nuevo conocimiento.
   *
   * Por ahora NO hacemos deduplicación ni matching.
   * Eso será responsabilidad del motor de conocimiento.
   */
  guardar(registro: RegistroConocimiento): void {
    const base = this.obtenerBase();

    base.registros.push(registro);

    this.escribir(base);
  }

  private escribir(base: BaseConocimiento): void {
    fs.writeFileSync(
      this.rutaArchivo,
      JSON.stringify(base, null, 2),
      'utf-8',
    );
  }
}
