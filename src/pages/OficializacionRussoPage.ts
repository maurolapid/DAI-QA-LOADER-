import { OficializacionBasePage } from './OficializacionBasePage';

export class OficializacionRussoPage
  extends OficializacionBasePage {

  private async responderPreguntasPostItems() {
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

    await this.responderTexto('TST');

    await this.responderSi();
    await this.responderSi();

    await this.seleccionarRadioExacto(
      'CHINA'
    );

    await this.seleccionarRadioParcial(
      'EL PLAZO DE ESPERA PARA EL PAGO DE LOS DERECHOS DE EXPORTACION SERA DE 15 DIAS'
    );

    // Pregunta adicional exclusiva de Russo
    await this.responderNo();
  }

  private async responderPreguntasPresupuesto() {
    await this.seleccionarRadioParcial(
      'DIGITALIZACION POR PSAD.'
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

    // Secuencia Russo
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();
    await this.responderNo();

    await this.responderSi();

    console.log(
      '✔ Russo - Respuesta texto 1: 0'
    );

    await this.responderTexto('0');

    console.log(
      '✔ Russo - Respuesta texto 2: 0'
    );

    await this.responderTexto('0');

    // Pregunta adicional Russo
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
      'transformer'
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