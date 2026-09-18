import type {
  Locator,
  Page
} from '@playwright/test';

interface DocumentoDetectado {
  indice: number;
  documento: string;
  descripcion: string;
  entrega: string;
  presencia: string;
  inputReferencia: Locator;
}

export class DocumentoAPresentarPage {
  constructor(
    private readonly page: Page
  ) {}

  async estaVisible(): Promise<boolean> {
    return this.obtenerDialogo()
      .isVisible()
      .catch(
        () => false
      );
  }

  async procesarSiAparece(
    timeoutMs = 5000
  ): Promise<boolean> {
    const dialogo =
      this.obtenerDialogo();

    const visible =
      await dialogo
        .waitFor({
          state: 'visible',
          timeout: timeoutMs
        })
        .then(() => true)
        .catch(() => false);

    if (!visible) {
      console.log(
        '[Documentos] No se detectó modal "Documentos a presentar".'
      );
      return false;
    }

    console.log('');
    console.log('==========================================');
    console.log('     DOCUMENTO A PRESENTAR DETECTADO');
    console.log('==========================================');

    const documentos =
      await this.leerDocumentos(
        dialogo
      );

    if (documentos.length === 0) {
      throw new Error(
        'Documento a Presentar Detectado, pero no se encontraron campos de referencia.'
      );
    }

    for (const documento of documentos) {
      console.log('');
      console.log(
        `Documento ${documento.indice + 1}: ${documento.documento || '(sin código visible)'}`
      );

      if (documento.descripcion) {
        console.log(
          `Descripción: ${documento.descripcion}`
        );
      }

      if (documento.entrega) {
        console.log(
          `Entrega: ${documento.entrega}`
        );
      }

      if (documento.presencia) {
        console.log(
          `Presencia: ${documento.presencia}`
        );
      }

      const referencia =
        await this.preguntarReferencia(
          documento.documento,
          documento.indice
        );

      await documento.inputReferencia.fill(
        referencia
      );

      const valorIngresado =
        await documento.inputReferencia.inputValue();

      if (valorIngresado !== referencia) {
        throw new Error(
          `No se pudo verificar la referencia del documento ${documento.documento || documento.indice + 1}.`
        );
      }

      console.log(
        `[Documentos] Referencia ingresada: ${referencia}`
      );
    }

    const botonContinuar =
      dialogo.getByRole(
        'button',
        {
          name:
            /^(CONTINUAR|GUARDAR|ACEPTAR)$/i
        }
      )
        .first();

    await botonContinuar.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await this.esperarBotonHabilitado(
      botonContinuar
    );

    console.log(
      '[Documentos] CONTINUAR habilitado.'
    );

    await botonContinuar.click({
      timeout: 30000
    });

    await dialogo.waitFor({
      state: 'hidden',
      timeout: 30000
    });

    console.log(
      '[Documentos] CONTINUAR ejecutado correctamente.'
    );
    console.log('==========================================');

    return true;
  }

  private obtenerDialogo(): Locator {
    return this.page
      .getByRole('dialog')
      .filter({
        has: this.page.locator(
          'input[name^="documentos."][name$=".referencia"]'
        )
      })
      .first();
  }

  private async leerDocumentos(
    dialogo: Locator
  ): Promise<DocumentoDetectado[]> {
    const inputs =
      dialogo.locator(
        'input[name^="documentos."][name$=".referencia"]'
      );

    const cantidad =
      await inputs.count();

    const documentos:
      DocumentoDetectado[] = [];

    for (
      let indice = 0;
      indice < cantidad;
      indice += 1
    ) {
      const inputReferencia =
        inputs.nth(indice);

      const fila =
        inputReferencia.locator(
          'xpath=ancestor::div[contains(@class,"documentRow")][1]'
        );

      const textos =
        await fila
          .locator(':scope > div')
          .allInnerTexts()
          .catch(() => []);

      const limpios =
        textos.map(
          valor =>
            this.normalizarTexto(
              valor
            )
        );

      documentos.push({
        indice,
        documento: limpios[0] ?? '',
        descripcion: limpios[1] ?? '',
        entrega: limpios[2] ?? '',
        presencia: limpios[3] ?? '',
        inputReferencia
      });
    }

    return documentos;
  }

  private async preguntarReferencia(
    documento: string,
    indice: number
  ): Promise<string> {
    while (true) {
      const mensaje =
        documento
          ? `Ingresá la referencia para ${documento}: `
          : `Ingresá la referencia para el documento ${indice + 1}: `;

      const respuesta =
        (
          await this.preguntarConsola(
            mensaje
          )
        ).trim();

      if (respuesta.length > 0) {
        return respuesta;
      }

      console.log(
        '[Documentos] La referencia no puede quedar vacía.'
      );
    }
  }

  private preguntarConsola(
    mensaje: string
  ): Promise<string> {
    /*
     * No creamos un segundo readline.Interface.
     * El Launcher mantiene su propia interfaz sobre stdin; abrir otra interfaz
     * sobre el mismo TTY provoca el eco visual duplicado de cada carácter.
     *
     * Acá hacemos una lectura puntual de stdin en modo raw y restauramos el
     * estado anterior al terminar, sin registrar un segundo consumidor readline.
     */
    return new Promise((resolve, reject) => {
      const entrada = process.stdin;
      const salida = process.stdout;

      let respuesta = '';
      const eraRaw =
        Boolean(
          entrada.isTTY &&
          (entrada as NodeJS.ReadStream).isRaw
        );

      const limpiar = (): void => {
        entrada.off('data', onData);

        if (entrada.isTTY) {
          (entrada as NodeJS.ReadStream)
            .setRawMode(eraRaw);
        }

        entrada.pause();
      };

      const finalizar = (): void => {
        salida.write('\n');
        limpiar();
        resolve(respuesta);
      };

      const onData = (
        chunk: Buffer | string
      ): void => {
        const texto =
          chunk.toString();

        for (const caracter of texto) {
          if (
            caracter === '\r' ||
            caracter === '\n'
          ) {
            finalizar();
            return;
          }

          if (
            caracter === '\u0003'
          ) {
            limpiar();
            reject(
              new Error(
                'Entrada cancelada por el usuario.'
              )
            );
            return;
          }

          if (
            caracter === '\u007f' ||
            caracter === '\b'
          ) {
            if (respuesta.length > 0) {
              respuesta =
                respuesta.slice(0, -1);

              salida.write('\b \b');
            }

            continue;
          }

          if (
            caracter >= ' ' &&
            caracter !== '\u007f'
          ) {
            respuesta +=
              caracter;

            salida.write(
              caracter
            );
          }
        }
      };

      salida.write(mensaje);

      entrada.resume();

      if (entrada.isTTY) {
        (entrada as NodeJS.ReadStream)
          .setRawMode(true);
      }

      entrada.on(
        'data',
        onData
      );
    });
  }

  private async esperarBotonHabilitado(
    boton: Locator
  ): Promise<void> {
    const inicio =
      Date.now();

    while (
      Date.now() - inicio <
      30000
    ) {
      const habilitado =
        await boton
          .isEnabled()
          .catch(() => false);

      if (habilitado) {
        return;
      }

      await this.page.waitForTimeout(
        100
      );
    }

    throw new Error(
      'La referencia fue completada, pero el botón CONTINUAR no se habilitó dentro de 30 segundos.'
    );
  }

  private normalizarTexto(
    valor: string
  ): string {
    return valor
      .trim()
      .replace(
        /\s+/g,
        ' '
      );
  }
}
