# DAI QA Loader

Herramienta de QA desarrollada en TypeScript y Playwright para crear, cargar y reutilizar operaciones de prueba en DAI.

La versión **v2.0.0** incorpora el **Learning Engine**: un motor local que observa las preguntas reales de DAI, aprende respuestas validadas por el usuario y reutiliza únicamente coincidencias exactas dentro del mismo contexto funcional.

## Versión actual

### v2.0.0

Principales capacidades:

- Operaciones IC04 y EC01.
- Uno o múltiples ítems.
- Múltiples posiciones arancelarias.
- Distribución automática de FOB.
- Sufijos automáticos y asistidos.
- Ejecución individual o paralela.
- Flujos de Oficialización Herrero y Russo.
- Learning Engine con conocimiento persistente.
- Operaciones aprendidas sin duplicados.
- Caminos de escenario, actualmente Sin Documentos y Con Documentos.
- Navegación dinámica hasta Presupuesto.
- Carga compartida de Bultos.
- Documento de Transporte desde el Loader.
- Handoff controlado a prueba manual.

## Estado funcional

| Funcionalidad | Estado |
|---|:---:|
| Login Mock | ✅ |
| IC04 | ✅ |
| EC01 | ✅ |
| Operación individual | ✅ |
| IC04 + EC01 en paralelo | ✅ |
| Multi-item tradicional hasta 250 ítems | ✅ |
| Learning Engine hasta 350 ítems | 🧪 En validación |
| Múltiples posiciones por operación | ✅ |
| Distribución y validación de FOB | ✅ |
| Sufijos automáticos/asistidos | ✅ |
| Con facturas / Sin facturas | ✅ |
| Oficialización Herrero / Russo | ✅ |
| Chrome / Firefox / Edge | ✅ |
| Learning Engine IC04 / EC01 | ✅ |
| Controles RADIO / SÍ-NO / TEXTO / FECHA | ✅ |
| Perfiles Sin Documentos / Con Documentos | ✅ |
| Ventajas | ⏳ Preparado, pendiente de implementación |
| Cancelaciones | ⏳ Preparado, pendiente de implementación |
| Subítems | ⏳ Visible en menú, todavía fijo en NO |
| Migración npm → pnpm | ⏳ Pendiente |

## Requisitos

- Node.js.
- npm.
- Acceso de red o VPN al ambiente DAI.
- Navegador compatible con Playwright.

## Instalación

~~~bash
npm install
npx playwright install
~~~

Validación TypeScript:

~~~bash
npx tsc --noEmit
~~~

Ejecución:

~~~bash
npm run start
~~~

En Windows también puede utilizarse:

~~~text
Ejecutar.bat
~~~

## Launcher

El punto de entrada es **launcher.ts**.

El menú principal permite elegir:

1. Ambiente.
2. Tipo de flujo: Operaciones, Oficialización o Learning Engine.
3. Configuración específica del escenario.
4. Navegador.
5. Confirmación antes de iniciar.

Los ambientes se definen en **config/ambientes.json**. También existe la opción **URL Manual**.

## Operaciones tradicionales

Los flujos tradicionales permiten:

- Ejecución individual IC04 o EC01.
- Ejecución paralela IC04 + EC01.
- Cantidades de 1, 5, 10, 15, 20, 50, 100, 200 o 250 ítems.
- Una posición para todos los ítems o varias posiciones distribuidas.
- Sufijos automáticos o asistidos.
- Operaciones con o sin facturas.

El generador central se encuentra en **src/utils/generador-items.ts**.

## Learning Engine

El Learning Engine tiene tres modos:

~~~text
[1] Nueva ejecución de aprendizaje
[2] Ejecutar operación aprendida
[3] Aprender nuevo camino de una operación
~~~

### Nueva ejecución

Después de seleccionar IC04 o EC01, el menú muestra:

~~~text
Subitems
  [1] NO | FIJO - próximamente

Cantidad de Items
  [1] 1
  [2] 2
  [3] 5
  [4] 9
  [5] 15
  [6] 30
  [7] 50
  [8] 90
  [9] 150
  [10] 200
  [11] 300
  [12] FULL LOAD | 350 items
~~~

Luego se configura navegador, FOB, posiciones, modo de sufijos y facturas.

Para múltiples ítems, la identidad de conocimiento utiliza una firma ordenada con todas las posiciones. Esto evita reutilizar respuestas de una operación simple en una combinación diferente.

### Detección y aprendizaje

El motor:

1. Detecta el modal presentado por DAI.
2. Identifica el tipo de control y sus opciones.
3. Construye el contexto de la pregunta.
4. Busca una coincidencia exacta en la base local.
5. Responde automáticamente sólo cuando la asociación es conocida.
6. Ante una pregunta desconocida, espera la intervención manual.
7. Aprende únicamente cuando DAI acepta la respuesta y avanza.

No utiliza fuzzy matching ni similitud semántica. Tampoco extrapola automáticamente respuestas entre perfiles, posiciones o combinaciones diferentes.

### FEMB-ORIGEN

Cuando se detecta FEMB-ORIGEN como control de fecha, el Loader sugiere dinámicamente:

~~~text
fecha actual - 15 días
~~~

La respuesta se valida contra el valor real ingresado en DAI.

### Persistencia transaccional

El conocimiento nuevo se mantiene temporalmente durante la ejecución y sólo se persiste cuando el recorrido queda validado.

Archivos locales:

~~~text
data/aprendizaje/conocimiento.json
data/aprendizaje/operaciones-aprendidas.json
~~~

Estos archivos contienen conocimiento generado en cada ambiente y no se versionan.

### Operaciones y caminos

Una operación se identifica por:

- Subrégimen.
- Cantidad de ítems.
- Posiciones arancelarias ordenadas.

La misma operación no se duplica. Si cambia el recorrido o se incorpora un escenario compatible, se actualiza y se agrega un camino dentro de ella.

Perfiles previstos:

- Documentos.
- Ventajas.
- Cancelaciones.

Actualmente el menú habilita:

- Sin Documentos.
- Con Documentos.

Ventajas y Cancelaciones quedan preparadas en el modelo para incorporarse paulatinamente.

### Comportamiento al finalizar

- Si hubo conocimiento nuevo, cambio o incertidumbre, la confirmación final es obligatoria antes de guardar y cerrar.
- Si la ejecución fue idéntica y completamente conocida, el Loader realiza un handoff a prueba manual y mantiene el navegador abierto.
- Si ocurre un error, genera evidencia y mantiene el navegador disponible para inspección hasta que el usuario presione ENTER.

El Learning Engine nunca debe guardar silenciosamente una operación incompleta.

## Navegación dinámica

El motor detecta y registra etapas como:

~~~text
REGISTRO
CARATULA
ITEMS
PREGUNTAS_ITEM
OTRA
PAC_ROM
BULTOS
DOCUMENTO_TRANSPORTE
PRESUPUESTO
~~~

Características:

- Cierra automáticamente modales informativos con el botón **Entendido**.
- Procesa nuevas tandas de preguntas antes de continuar.
- Considera exitosa una navegación sólo si cambia la etapa o aparecen preguntas compatibles.
- Limita a 3 los ciclos consecutivos sin progreso.
- Evita repetir Documento de Transporte después de haberlo completado.

## Bultos

La lógica compartida vive en **src/pages/BultosPage.ts**.

El Learning Engine reutiliza la carga trabajada para el escenario Herrero:

| Campo | Valor |
|---|---|
| Marcas | SM |
| Vía | 2 - AVION |
| Vencimiento de embarque | Fecha actual + 30 días |
| Bandera | 998 - INDET.(CONTINENTE) |
| Nombre del transporte | avion |
| Agente de transporte | INDET |
| Número de bultos | 1 |
| Código de embalaje | 99 - BULTOS |
| Cantidad | 1 |
| Tipo | N - No Retornable |
| Peso | 10 |

## Documento de Transporte

Cuando el recorrido llega a Documento de Transporte, el Loader solicita:

- Puerto o documento de procedencia.
- Número de documento de transporte.

Si DAI rechaza el documento, el usuario puede reintentar o guardar la operación para retomarla posteriormente.

## Documentos a presentar

Cuando EC01 muestra el modal **Documentos a presentar**, el Loader:

- Detecta todos los documentos solicitados dinámicamente.
- Muestra código, descripción, entrega y presencia.
- Solicita por consola una referencia no vacía para cada documento.
- Verifica el valor realmente ingresado en DAI.
- Continúa únicamente cuando el botón correspondiente queda habilitado.

La implementación se encuentra en **src/pages/DocumentoAPresentarPage.ts**.

## Oficialización

Se mantienen los perfiles:

- Herrero.
- Russo.

La ejecución puede realizarse en diferentes ambientes y conserva sus Page Objects específicos.

La lógica de Bultos fue extraída para ser compartida sin duplicación entre Oficialización y Learning Engine.

## Configuración

| Archivo | Responsabilidad |
|---|---|
| **config/ambientes.json** | Ambientes disponibles |
| **config/posiciones-arancelarias.json** | Posiciones soportadas |
| **config/sufijos-posiciones.json** | Configuración de sufijos por posición |
| **data/IC04/feliz.json** | Datos base IC04 |
| **data/EC01/feliz.json** | Datos base EC01 |

## Estructura principal

~~~text
DAI-QA-LOADER-
├── config/
├── data/
│   ├── IC04/
│   ├── EC01/
│   └── aprendizaje/          # generado localmente
├── src/
│   ├── flows/
│   ├── learning/
│   ├── pages/
│   └── utils/
├── launcher.ts
├── Ejecutar.bat
├── package.json
└── README.md
~~~

El módulo **src/learning/** contiene:

- Detector de preguntas.
- Construcción de contexto.
- Matcher exacto.
- Repositorios JSON.
- Aprendizaje manual y automático.
- Ejecutor completo de operaciones aprendidas.

## Manejo de errores

Los errores generan capturas bajo:

~~~text
screenshots/error-*.png
screenshots/error-LEARNING-*.png
~~~

Las capturas nuevas, los datos de aprendizaje y los archivos de runtime deben permanecer fuera del control de versiones.

## Validación antes de subir cambios

~~~bash
npx tsc --noEmit
git status
git diff --check
~~~

Pruebas recomendadas según el alcance:

- IC04 individual.
- EC01 individual.
- Multi-item.
- Sufijos automáticos.
- Oficialización Herrero/Russo.
- Learning Engine conocido.
- Learning Engine con pregunta nueva.
- Modal Documentos a presentar en EC01.
- Camino Sin Documentos.
- Camino Con Documentos.
- Transición por PAC/ROM, Bultos o Documento de Transporte.

## Roadmap

- [ ] Completar validación progresiva del Learning Engine multi-item hasta FULL LOAD (350).
- [ ] Implementar Subítems.
- [ ] Incorporar Ventajas.
- [ ] Incorporar Cancelaciones.
- [ ] Ampliar posiciones y sufijos configurados.
- [ ] Mejorar reportes y evidencias.
- [ ] Evaluar migración de npm a pnpm.
- [ ] Incorporar auto-healing de selectores en una etapa futura.

---

**DAI QA Loader v2.0.0 — automatización y aprendizaje controlado para la preparación de escenarios de prueba DAI.**
