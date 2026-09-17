import type {
  Locator,
  Page
} from '@playwright/test';

import type {
  PreguntaDetectada
} from './tipos-aprendizaje';

export const DETECTOR_PREGUNTAS_VERSION =
  'v19-dialogo-dinamico-fecha';

export class DetectorPreguntas {
  constructor(
    private readonly page: Page
  ) {}

  async detectarPreguntaActual(): Promise<PreguntaDetectada> {
    console.log(
      '[Detector] Esperando un modal compatible con el Learning Engine...'
    );

    const dialogo =
      await this.esperarDialogoPreguntas();

    if (!dialogo) {
      throw new Error(
        'Learning Engine: no apareció un modal visible compatible con los controles soportados dentro de 60 segundos.'
      );
    }

    console.log(
      '[Detector] Modal compatible encontrado.'
    );

    const radioGroups =
      dialogo.getByRole(
        'radiogroup'
      );

    const cantidadRadioGroups =
      await radioGroups.count();

    console.log(
      `[Detector] Radiogroups encontrados: ${cantidadRadioGroups}`
    );

    if (
      cantidadRadioGroups >
      0
    ) {
      const radioGroup =
        radioGroups.first();

      const visible =
        await radioGroup
          .isVisible()
          .catch(
            () => false
          );

      if (
        visible
      ) {
        console.log(
          '[Detector] Control RADIO detectado.'
        );

        return this
          .detectarRadio(
            radioGroup
          );
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
      console.log(
        '[Detector] Control SI_NO detectado.'
      );

      return this
        .detectarSiNo(
          dialogo
        );
    }

    const inputTexto = dialogo.locator(
      'input[type="text"][placeholder="Ingresá tu respuesta"]'
    );

    if (await inputTexto.count() > 0) {
      const visible = await inputTexto.first().isVisible().catch(() => false);
      if (visible) {
        console.log('[Detector] Control TEXTO detectado.');
        return this.detectarTexto(dialogo);
      }
    }

    const inputFecha = dialogo.locator(
      'input[placeholder="DD/MM/AAAA"]'
    );

    if (await inputFecha.count() > 0) {
      const visible = await inputFecha.first().isVisible().catch(() => false);
      if (visible) {
        console.log('[Detector] Control FECHA detectado.');
        return this.detectarFecha(dialogo);
      }
    }

    console.log(
      '[Detector] No se encontró un control compatible.'
    );

    throw new Error(
      'Learning Engine: apareció una pregunta cuyo tipo de control todavía no sabemos detectar.'
    );
  }

  private async esperarDialogoPreguntas(): Promise<Locator | null> {
    const timeoutMs = 60000;
    const inicio = Date.now();
    let ultimoConteo = -1;

    while (Date.now() - inicio < timeoutMs) {
      const dialogos = this.page.getByRole('dialog');
      const cantidadDialogos = await dialogos.count();

      if (cantidadDialogos !== ultimoConteo) {
        console.log(
          `[Detector] Dialogs encontrados: ${cantidadDialogos}`
        );
        ultimoConteo = cantidadDialogos;
      }

      for (let indice = 0; indice < cantidadDialogos; indice += 1) {
        const candidato = dialogos.nth(indice);

        if (!await candidato.isVisible().catch(() => false)) {
          continue;
        }

        if (await this.esDialogoCompatible(candidato)) {
          console.log(
            `[Detector] Dialog visible ${indice + 1}/${cantidadDialogos} compatible con el Learning Engine.`
          );
          return candidato;
        }
      }

      await this.page.waitForTimeout(250);
    }

    return null;
  }

  private async esDialogoCompatible(
    dialogo: Locator
  ): Promise<boolean> {
    const radioVisible =
      await dialogo
        .getByRole('radiogroup')
        .first()
        .isVisible()
        .catch(() => false);

    if (radioVisible) {
      return true;
    }

    const noVisible =
      await dialogo
        .getByRole('button', { name: 'NO', exact: true })
        .first()
        .isVisible()
        .catch(() => false);

    const siVisible =
      await dialogo
        .getByRole('button', { name: 'SÍ', exact: true })
        .first()
        .isVisible()
        .catch(() => false);

    if (noVisible && siVisible) {
      return true;
    }

    const textoVisible = await dialogo
      .locator(
        'input[type="text"][placeholder="Ingresá tu respuesta"]'
      )
      .first()
      .isVisible()
      .catch(() => false);

    if (textoVisible) {
      return true;
    }

    return dialogo
      .locator('input[placeholder="DD/MM/AAAA"]')
      .first()
      .isVisible()
      .catch(() => false);
  }

  private async detectarRadio(
    radioGroup: Locator
  ): Promise<PreguntaDetectada> {
    console.log(
      '[Detector] Analizando control RADIO...'
    );

    const labels =
      radioGroup.locator(
        'label'
      );

    const cantidadOpciones =
      await labels.count();

    console.log(
      `[Detector] Labels encontrados: ${cantidadOpciones}`
    );

    const opciones:
      string[] = [];

    for (
      let indice = 0;
      indice < cantidadOpciones;
      indice += 1
    ) {
      const texto =
        await labels
          .nth(indice)
          .innerText();

      const normalizado =
        this.normalizarTexto(
          texto
        );

      if (
        normalizado
      ) {
        opciones.push(
          normalizado
        );

        console.log(
          `[Detector] Opción ${indice}: ${normalizado}`
        );
      }
    }

    if (
      opciones.length ===
      0
    ) {
      throw new Error(
        'Learning Engine: se detectó un radiogroup pero no fue posible obtener sus opciones.'
      );
    }

    const contenedorPregunta =
      radioGroup.locator(
        'xpath=../..'
      );

    const textosPregunta =
      contenedorPregunta
        .locator('p');

    const cantidadTextos =
      await textosPregunta.count();

    console.log(
      `[Detector] Textos candidatos encontrados: ${cantidadTextos}`
    );

    let textoNormalizado =
      'RADIO_SIN_TEXTO';

    if (
      cantidadTextos >
      0
    ) {
      const textoPregunta =
        await textosPregunta
          .first()
          .innerText();

      const textoDetectado =
        this.normalizarTexto(
          textoPregunta
        );

      if (
        textoDetectado
      ) {
        textoNormalizado =
          textoDetectado;
      }
    }

    if (
      textoNormalizado ===
      'RADIO_SIN_TEXTO'
    ) {
      console.log(
        '[Detector] RADIO sin texto independiente. Se identificará por etapa + opciones.'
      );
    } else {
      console.log(
        `[Detector] Texto detectado: ${textoNormalizado}`
      );
    }

    console.log(
      `[Detector] Detección RADIO completada. Opciones encontradas: ${opciones.length}.`
    );

    return {
      texto:
        textoNormalizado,
      tipoControl:
        'RADIO',
      opciones
    };
  }

  private async detectarSiNo(
    dialogo: Locator
  ): Promise<PreguntaDetectada> {
    console.log(
      '[Detector] Leyendo texto de pregunta SI_NO...'
    );

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
      throw new Error(
        'Learning Engine: se detectaron botones SÍ/NO pero no se encontró el texto de la pregunta.'
      );
    }

    const textoPregunta =
      candidatos
        .sort(
          (
            a,
            b
          ) =>
            b.length -
            a.length
        )[0];

    console.log(
      `[Detector] Texto detectado: ${textoPregunta}`
    );

    console.log(
      '[Detector] Detección SI_NO completada. Opciones: NO | SÍ.'
    );

    return {
      texto:
        textoPregunta,
      tipoControl:
        'SI_NO',
      opciones: [
        'NO',
        'SÍ'
      ]
    };
  }

  private async detectarTexto(
    dialogo: Locator
  ): Promise<PreguntaDetectada> {
    console.log('[Detector] Leyendo texto de pregunta TEXTO...');

    const input = dialogo.locator(
      'input[type="text"][placeholder="Ingresá tu respuesta"]'
    ).first();

    const contenedor = input.locator('xpath=ancestor::div[p][1]');
    let textoPregunta = '';

    if (await contenedor.count() > 0) {
      const parrafos = contenedor.locator('p');
      for (let i = 0; i < await parrafos.count(); i += 1) {
        const p = parrafos.nth(i);
        if (!await p.isVisible().catch(() => false)) continue;
        const texto = this.normalizarTexto(await p.innerText());
        if (texto) { textoPregunta = texto; break; }
      }
    }

    if (!textoPregunta) {
      const parrafos = dialogo.locator('p');
      const candidatos: string[] = [];
      for (let i = 0; i < await parrafos.count(); i += 1) {
        const p = parrafos.nth(i);
        if (!await p.isVisible().catch(() => false)) continue;
        const texto = this.normalizarTexto(await p.innerText());
        if (!texto || /complet[aá].*preguntas.*item/i.test(texto)) continue;
        candidatos.push(texto);
      }
      textoPregunta = candidatos.sort((a, b) => b.length - a.length)[0] ?? '';
    }

    if (!textoPregunta) {
      throw new Error(
        'Learning Engine: se detectó un input TEXTO pero no se encontró el texto de la pregunta.'
      );
    }

    console.log(`[Detector] Texto detectado: ${textoPregunta}`);
    console.log('[Detector] Detección TEXTO completada.');

    return { texto: textoPregunta, tipoControl: 'TEXTO' };
  }

  private async detectarFecha(
    dialogo: Locator
  ): Promise<PreguntaDetectada> {
    console.log('[Detector] Leyendo texto de pregunta FECHA...');

    const input = dialogo.locator(
      'input[placeholder="DD/MM/AAAA"]'
    ).first();

    const contenedor = input.locator('xpath=ancestor::div[p][1]');
    let textoPregunta = '';

    if (await contenedor.count() > 0) {
      const parrafos = contenedor.locator('p');
      for (let i = 0; i < await parrafos.count(); i += 1) {
        const p = parrafos.nth(i);
        if (!await p.isVisible().catch(() => false)) continue;
        const texto = this.normalizarTexto(await p.innerText());
        if (texto) { textoPregunta = texto; break; }
      }
    }

    if (!textoPregunta) {
      const parrafos = dialogo.locator('p');
      const candidatos: string[] = [];
      for (let i = 0; i < await parrafos.count(); i += 1) {
        const p = parrafos.nth(i);
        if (!await p.isVisible().catch(() => false)) continue;
        const texto = this.normalizarTexto(await p.innerText());
        if (!texto || /complet[aá].*preguntas.*item/i.test(texto)) continue;
        candidatos.push(texto);
      }
      textoPregunta = candidatos.sort((a, b) => b.length - a.length)[0] ?? '';
    }

    if (!textoPregunta) {
      throw new Error(
        'Learning Engine: se detectó un input FECHA pero no se encontró el texto de la pregunta.'
      );
    }

    console.log(`[Detector] Texto detectado: ${textoPregunta}`);
    console.log('[Detector] Detección FECHA completada.');

    return { texto: textoPregunta, tipoControl: 'FECHA' };
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
