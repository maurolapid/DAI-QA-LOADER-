import crypto from 'crypto';

import { ContextoPreguntaBuilder } from './src/learning/contexto-pregunta';
import { MatcherConocimiento } from './src/learning/matcher-conocimiento';
import { RepositorioConocimiento } from './src/learning/repositorio-conocimiento';

import {
  PreguntaDetectada,
  RegistroConocimiento,
} from './src/learning/tipos-aprendizaje';

const SUBREGIMEN = 'IC04';
const POSICION = '7318.15.00.620M';

const pregunta: PreguntaDetectada = {
  texto: '¿La mercadería requiere intervención?',
  tipoControl: 'SI_NO',
  opciones: ['SI', 'NO'],
};

const contextoBuilder = new ContextoPreguntaBuilder({
  subregimen: SUBREGIMEN,
  posicionArancelaria: POSICION,
  etapa: 'PREGUNTAS_ITEM',
  numeroItem: 1,
});

const repositorio = new RepositorioConocimiento();
const matcher = new MatcherConocimiento();

const contexto = contextoBuilder.obtenerContexto();
const registrosAntes = repositorio.obtenerRegistros();

console.log('');
console.log('==========================================');
console.log('       TEST MOTOR DE APRENDIZAJE');
console.log('==========================================');
console.log('');
console.log(`Subrégimen: ${SUBREGIMEN}`);
console.log(`Posición:   ${POSICION}`);
console.log(`Pregunta:   ${pregunta.texto}`);
console.log('');

const resultadoAntes = matcher.buscar(
  contexto,
  pregunta,
  registrosAntes,
);

if (!resultadoAntes.encontrada) {
  console.log('❓ PREGUNTA DESCONOCIDA');
  console.log('Simulando respuesta manual: NO');
  console.log('');

  const registro: RegistroConocimiento = {
    id: crypto.randomUUID(),

    contexto,

    pregunta,

    respuesta: {
      valor: 'NO',
    },

    fechaAprendizaje: new Date().toISOString(),
    cantidadUsos: 0,
  };

  repositorio.guardar(registro);

  console.log('🧠 Conocimiento guardado.');
} else {
  console.log('🧠 PREGUNTA YA CONOCIDA');
  console.log(
    `Respuesta aprendida: ${resultadoAntes.registro?.respuesta.valor}`,
  );
}

console.log('');
console.log('--- Verificación ---');
console.log('');

const registrosDespues = repositorio.obtenerRegistros();

const resultadoDespues = matcher.buscar(
  contexto,
  pregunta,
  registrosDespues,
);

if (!resultadoDespues.encontrada) {
  throw new Error(
    'El conocimiento fue guardado pero el Matcher no pudo recuperarlo.',
  );
}

console.log('✔ Pregunta reconocida');
console.log(
  `✔ Respuesta recuperada: ${resultadoDespues.registro?.respuesta.valor}`,
);
console.log(
  `✔ Registros almacenados: ${registrosDespues.length}`,
);
console.log('');
console.log('==========================================');
console.log('             TEST OK');
console.log('==========================================');