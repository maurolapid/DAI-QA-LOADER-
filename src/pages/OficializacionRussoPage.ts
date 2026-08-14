import { OficializacionBasePage } from './OficializacionBasePage';

export class OficializacionRussoPage
  extends OficializacionBasePage {

  private async responderPreguntasPostItems() {
    console.log(
      '✔ [RUSSO] Pregunta texto: 0'
    );

    await this.responderTexto('0');

    await this.responderNo();
    await this.responderNo();
    await this.responderNo();

    await this.responderSi();

    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();

    console.log(
      '✔ [RUSSO] Pregunta texto: TST'
    );

    await this.responderTexto('TST');

    await this.responderSi();
    await this.responderSi();

    console.log(
      '✔ [RUSSO] Seleccionando CHINA'
    );

    await this.seleccionarRadioExacto(
      'CHINA'
    );

    console.log(
      '✔ [RUSSO] Seleccionando plazo CONCORDANTE'
    );

    await this.seleccionarRadioParcial(
      'EL PLAZO DE ESPERA PARA EL PAGO DE LOS DERECHOS DE EXPORTACION SERA CONCORDANTE'
    );

    console.log(
      '✔ [RUSSO] Respondiendo pregunta adicional: NO'
    );

    await this.responderNo();
  }

  private async responderPreguntasPresupuesto() {
    console.log(
      '✔ [RUSSO] Inicio preguntas de Presupuesto'
    );

    await this.responderNo();

    await this.seleccionarRadioParcial(
      'No debo presentar la'
    );

    await this.responderSi();
    await this.responderSi();

    await this.seleccionarRadioParcial(
      '- BANCO DE LA NACION ARGENTINA'
    );

    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();

    await this.responderSi();

    console.log(
      '✔ [RUSSO] Respuesta texto Presupuesto: tca'
    );

    await this.responderTexto('tca');

    console.log(
      '✔ [RUSSO] Respuesta texto Presupuesto: 0'
    );

    await this.responderTexto('0');

    await this.responderNo();

    await this.seleccionarRadioParcial(
      'PSAD02 - BOX CUSTODIA DE'
    );
  }

  async completarHappyPath() {
    console.log(
      '✔ [RUSSO] Respondiendo preguntas posteriores a Items...'
    );

    await this.responderPreguntasPostItems();

    console.log(
      '✔ [RUSSO] Avanzando a Certificación PAC/ROM...'
    );

    await this.irACertificacionPACROM();

    console.log(
      '✔ [RUSSO] Completando Certificación PAC/ROM...'
    );

    await this.completarCertificacionPACROM(
      'Transformer'
    );

    console.log(
      '✔ [RUSSO] Avanzando a Presupuesto General...'
    );

    await this.irAPresupuestoGeneral();

    console.log(
      '✔ [RUSSO] Respondiendo preguntas de Presupuesto...'
    );

    await this.responderPreguntasPresupuesto();

    console.log(
      '✔ [RUSSO] Verificando detalle del presupuesto...'
    );

    await this.verificarDetallePresupuesto();

    console.log('');
    console.log(
      '=========================================='
    );
    console.log(
      '✔ HAPPY PATH RUSSO FINALIZADO'
    );
    console.log(
      '=========================================='
    );
  }
}