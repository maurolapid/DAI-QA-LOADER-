# DAI QA Loader

> Herramienta interna de QA para automatizar la creación y preparación de operaciones DAI, reduciendo tareas repetitivas y permitiendo generar escenarios de prueba parametrizados para **IC04**, **EC01** y flujos de **Oficialización**.

---

## Versión actual

### `v1.5.0`

La versión actual incorpora soporte para ejecución **multi-item**, múltiples **posiciones arancelarias**, configuración dinámica de **sufijos**, ejecución **IC04 + EC01 en paralelo** y ejecución del flujo de **Oficialización en diferentes ambientes**.

---

## Estado del proyecto

| Funcionalidad | Estado |
|---|:---:|
| Login Mock | ✅ |
| Nueva Operación | ✅ |
| IC04 | ✅ |
| EC01 | ✅ |
| Ejecución individual | ✅ |
| Ejecución paralela IC04 + EC01 | ✅ |
| 1 ítem | ✅ |
| Multi-item | ✅ |
| Hasta 250 ítems | ✅ |
| Una posición arancelaria | ✅ |
| Múltiples posiciones arancelarias | ✅ |
| Distribución automática de FOB | ✅ |
| Validación FOB Carátula / Ítems | ✅ |
| Sufijos automáticos | ✅ |
| Sufijos asistidos | ✅ |
| Con facturas / Sin facturas | ✅ |
| Oficialización Herrero | ✅ |
| Oficialización Russo | ✅ |
| Oficialización multi-ambiente | ✅ |
| Chrome | ✅ |
| Firefox | ✅ |
| Edge | ✅ |

---

## Objetivo

DAI QA Loader fue creado para acelerar la preparación de datos y operaciones utilizadas durante las pruebas de DAI.

La herramienta permite reemplazar gran parte de la carga manual necesaria para preparar escenarios de testing y generar operaciones repetibles con diferentes combinaciones de:

- Ambiente.
- Subrégimen.
- Navegador.
- Cantidad de ítems.
- FOB.
- Posiciones arancelarias.
- Sufijos.
- Facturas.
- Perfiles y flujos de Oficialización.

El objetivo principal es que QA y desarrollo puedan preparar operaciones de prueba de manera rápida y consistente.

---

# Flujo general

```text
DAI QA Loader
      │
      ▼
 Selección de ambiente
      │
      ▼
 Modo de ejecución
      │
      ├───────────────┐
      ▼               ▼
 Individual       Paralelo
      │           IC04 + EC01
      ▼
 Subrégimen
      │
      ▼
 Navegador
      │
      ▼
 Configuración del escenario
      │
      ▼
 Login Mock
      │
      ▼
 Nueva Operación
      │
      ▼
 Registro
      │
      ▼
 Carátula
      │
      ▼
 Ítems
      │
      ▼
 Sufijos
      │
      ▼
 Carga de Ítems
```

En los escenarios de Oficialización el flujo continúa con las preguntas correspondientes al perfil seleccionado.

---

# Tecnologías

| Tecnología | Uso |
|---|---|
| TypeScript | Desarrollo principal |
| Playwright | Automatización de navegador |
| Node.js | Runtime |
| TSX | Ejecución directa de TypeScript |
| npm | Gestión actual de dependencias |
| JSON | Configuración y datos |

> **Roadmap:** evaluar posteriormente la migración de `npm` a `pnpm`.

---

# Requisitos

Antes de utilizar el proyecto se necesita:

- Node.js instalado.
- npm disponible.
- Acceso al repositorio.
- Acceso de red/VPN a los ambientes DAI correspondientes.
- Chrome, Firefox o Edge según el navegador que se quiera utilizar.

---

# Instalación

Clonar el repositorio y ubicarse en la raíz del proyecto.

Instalar dependencias:

```bash
npm install
```

Validar TypeScript:

```bash
npx tsc --noEmit
```

Si no se informan errores, ejecutar:

```bash
npm run start
```

---

# Launcher

La ejecución se controla desde:

```text
launcher.ts
```

Al iniciar se muestra:

```text
==========================================
          DAI QA LOADER v1.5.0
==========================================
Carga automatizada de datos de prueba DAI
```

El Launcher guía al usuario paso a paso y construye la configuración que utilizará el flujo automatizado.

---

# Ambientes

Los ambientes se encuentran configurados en:

```text
config/ambientes.json
```

Actualmente el Launcher ofrece:

| Opción | Ambiente |
|---:|---|
| 1 | QA |
| 2 | MOCKDEVNOKIT |
| 3 | AUTOMATION |
| 4 | prod |
| 5 | OFICIALIZACION |
| 6 | URL Manual |

## URL Manual

La opción `URL Manual` permite indicar manualmente una URL de DAI.

Esto permite utilizar la herramienta contra ambientes que no estén registrados permanentemente en `ambientes.json`.

---

# Modos de ejecución

## Individual

Permite seleccionar:

```text
IC04
```

o:

```text
EC01
```

y ejecutar el flujo de manera independiente.

---

## Paralelo IC04 + EC01

El Launcher permite ejecutar ambos subregímenes en paralelo:

```text
IC04 + EC01
```

Esto permite preparar dos operaciones simultáneamente y ampliar la cobertura sin tener que realizar dos ejecuciones manuales consecutivas.

---

# Navegadores

Actualmente se soportan:

```text
Chrome
Firefox
Edge
```

Playwright inicia el navegador seleccionado en modo visible para permitir seguir la ejecución.

---

# IC04

El flujo automatizado de IC04 contempla actualmente:

```text
Login Mock
    ↓
Operaciones
    ↓
Nueva Operación
    ↓
Registro IC04
    ↓
Carátula
    ↓
Items
    ↓
Posición arancelaria
    ↓
Cabecera
    ↓
Sin SubItems
    ↓
FOB Item
    ↓
Valores del Item
    ↓
Sufijos
    ↓
CARGAR ITEMS
```

Soporta tanto un único ítem como cargas multi-item.

---

# EC01

El flujo automatizado de EC01 contempla actualmente:

```text
Login Mock
    ↓
Operaciones
    ↓
Nueva Operación
    ↓
Registro EC01
    ↓
Carátula
    ↓
Items
    ↓
Posición arancelaria
    ↓
Datos del Item
    ↓
Sufijos
    ↓
CARGAR ITEMS
```

También soporta cargas multi-item y diferentes posiciones arancelarias dentro de una misma operación.

---

# Cantidad de ítems

El Launcher permite seleccionar:

| Opción | Cantidad |
|---:|---:|
| 1 | 1 |
| 2 | 5 |
| 3 | 10 |
| 4 | 15 |
| 5 | 20 |
| 6 | 50 |
| 7 | 100 |
| 8 | 200 |
| 9 | 250 |

---

## Ejecución con un solo ítem

Cuando se selecciona:

```text
Items: 1
```

el Launcher solicita directamente una posición arancelaria.

Ejemplo:

```text
Cantidad de items: 1
FOB Total: 10000
Posición: 8703.23.10.190E
```

El resultado será:

```text
001 | 8703.23.10.190E | FOB 10000.00
```

---

## Ejecución multi-item

Cuando existen varios ítems puede utilizarse:

```text
[1] Misma posición para todos los items
[2] Utilizar varias posiciones
```

### Misma posición

Todos los ítems utilizan la posición seleccionada.

### Varias posiciones

Las posiciones seleccionadas se distribuyen entre los ítems.

Ejemplo:

```text
Items: 5
Posiciones:
7318.15.00.620M
3812.39.29.990C
3208.10.10.000L
```

Plan generado:

```text
001 | 7318.15.00.620M
002 | 3812.39.29.990C
003 | 3208.10.10.000L
004 | 7318.15.00.620M
005 | 3812.39.29.990C
```

---

# Generador de ítems

La generación se encuentra centralizada en:

```text
src/utils/generador-items.ts
```

El generador recibe:

```text
cantidadItems
posiciones
fobTotal
itemBase
```

y genera automáticamente los ítems necesarios.

Esto evita duplicar lógica entre IC04 y EC01.

---

# Distribución de FOB

El usuario ingresa el FOB total de Carátula.

Ejemplo:

```text
FOB Carátula: 10000
Items: 5
```

El Loader distribuye automáticamente el valor:

```text
001 | FOB 2000.00
002 | FOB 2000.00
003 | FOB 2000.00
004 | FOB 2000.00
005 | FOB 2000.00
```

También contempla divisiones que requieren distribución de centavos.

Al finalizar se valida:

```text
FOB ITEMS == FOB CARATULA
```

Ejemplo:

```text
FOB ITEMS:     10000.00
FOB CARATULA:  10000.00
VALIDACION:    OK
```

---

# Posiciones arancelarias

Las posiciones disponibles se configuran en:

```text
config/posiciones-arancelarias.json
```

Actualmente existen **10 posiciones arancelarias configuradas**.

| # | Posición arancelaria | Estado |
|---:|---|:---:|
| 1 | `7318.15.00.620M` | ✅ |
| 2 | `3812.39.29.990C` | ✅ |
| 3 | `3208.10.10.000L` | ✅ |
| 4 | `3003.10.12.000W` | ✅ |
| 5 | `8703.23.10.190E` | ✅ |
| 6 | `7318.11.00.100F` | ✅ |
| 7 | `8409.99.99.900C` | ✅ |
| 8 | `8483.10.20.900Z` | ✅ |
| 9 | `3926.90.90.919Z` | ✅ |
| 10 | `8708.29.99.990J` | ✅ |

Las posiciones pueden utilizarse tanto individualmente como combinadas dentro de operaciones multi-item, según corresponda al flujo.

---

# Sufijos por posición arancelaria

Los sufijos se encuentran desacoplados del código principal.

Configuración:

```text
config/sufijos-posiciones.json
```

Cada posición define los campos que necesita completar.

Ejemplo conceptual:

```json
{
  "POSICION": [
    {
      "tipo": "texto",
      "nombreAccesible": "Ingresá MARCA",
      "valor": "MARCA"
    },
    {
      "tipo": "combo",
      "nombreAccesible": "Seleccionar",
      "valor": "NA00 - Ninguno"
    }
  ]
}
```

Esto permite agregar nuevas posiciones principalmente mediante configuración, evitando introducir lógica específica innecesaria en los Page Objects.

---

## Tipos de sufijos

Actualmente se contemplan:

### Texto

```json
{
  "tipo": "texto",
  "nombreAccesible": "Ingresá MARCA",
  "valor": "MARCA"
}
```

### Combo

```json
{
  "tipo": "combo",
  "nombreAccesible": "Seleccionar",
  "valor": "NA00 - Ninguno"
}
```

### Valor fijo

Algunos campos no deben modificarse según el número de ítem.

```json
{
  "tipo": "texto",
  "nombreAccesible": "AAAA",
  "valor": "1982",
  "correlativo": false
}
```

---

# Modos de carga de sufijos

El Launcher permite seleccionar:

```text
[1] Automatico
[2] Asistido
```

## Automático

Antes de iniciar la ejecución se valida que todas las posiciones seleccionadas tengan configuración.

Ejemplo:

```text
==========================================
   VALIDACION DE SUFIJOS AUTOMATICOS
==========================================
7318.15.00.620M -> OK
3812.39.29.990C -> OK
3208.10.10.000L -> OK
==========================================
```

Luego Playwright completa los sufijos automáticamente.

---

## Asistido

Cuando se utiliza modo asistido, la automatización puede detenerse para permitir que el usuario complete manualmente los sufijos requeridos.

Esto resulta útil para:

- Posiciones todavía no parametrizadas.
- Investigación de nuevas posiciones.
- Campos especiales.
- Desarrollo incremental de cobertura.

---

# Facturas

El Launcher permite ejecutar operaciones:

```text
[1] Con facturas
[2] Sin facturas
```

Esto agrega otra dimensión de escenarios disponibles para los flujos soportados.

---

# Oficialización

DAI QA Loader incluye automatización del flujo de Oficialización.

La configuración utilizada actualmente contempla:

```text
Subrégimen: EC01
Items: 1
Posición: 7318.11.00.100F
Facturas: Sin facturas
```

---

## Perfiles de Oficialización

Actualmente existen:

```text
Herrero
Russo
```

---

## Flujos de preguntas

Se encuentran automatizados:

```text
Preguntas Herrero
Preguntas Russo
```

Esto permite desacoplar el perfil utilizado para crear la operación del flujo de preguntas que se desea ejecutar.

---

## Empresas

Actualmente el Launcher contempla las empresas configuradas para los escenarios de Oficialización, entre ellas:

```text
Baterias Moura
Malba Textil
```

---

## Oficialización multi-ambiente

El flujo de Oficialización **no está limitado al ambiente OFICIALIZACION**.

El Launcher permite seleccionar el ambiente donde se quiere realizar la prueba.

Por ejemplo:

```text
QA
MOCKDEVNOKIT
AUTOMATION
prod
OFICIALIZACION
URL Manual
```

Esto permite reutilizar exactamente el mismo escenario de Oficialización en diferentes deployments.

---

# Ejemplo de ejecución

```text
==========================================
          DAI QA LOADER v1.5.0
==========================================

Ambiente
  [1] QA
  [2] MOCKDEVNOKIT
  [3] AUTOMATION
  [4] prod
  [5] OFICIALIZACION
  [6] URL Manual

Modo de ejecucion
  [1] Individual
  [2] Paralelo IC04 + EC01

Subregimen
  [1] IC04
  [2] EC01

Navegador
  [1] Chrome
  [2] Firefox
  [3] Edge
```

Después el Launcher solicita la configuración específica del escenario.

Antes de abrir el navegador muestra un resumen para permitir verificar los datos seleccionados.

---

# Validaciones

DAI QA Loader realiza validaciones antes y durante la ejecución.

Entre ellas:

- Cantidad de ítems válida.
- Existencia de posiciones arancelarias.
- Cantidad de posiciones compatible con la cantidad de ítems.
- FOB válido.
- Distribución de FOB.
- Coincidencia entre FOB de Carátula y suma de ítems.
- Existencia de configuración automática de sufijos.
- Navegación entre pasos.
- Carga de ítems.
- Flujos específicos de Oficialización.

---

# Manejo de errores

Cuando una ejecución falla, el Loader informa el punto del flujo donde ocurrió el error.

Ejemplo:

```text
ERROR IC04/chrome:
...
```

Además, los flujos pueden generar screenshots para facilitar el diagnóstico.

Los screenshots generados durante pruebas locales **no deben versionarse** salvo que exista una razón específica para hacerlo.

---

# Estructura del proyecto

```text
DAI-QA-LOADER
│
├── config
│   ├── ambientes.json
│   ├── posiciones-arancelarias.json
│   └── sufijos-posiciones.json
│
├── data
│   ├── IC04
│   │   └── feliz.json
│   ├── EC01
│   │   └── feliz.json
│   └── oficializacion-contador.json
│
├── src
│   ├── flows
│   │   ├── ic04-hasta-paso2.ts
│   │   └── ec01-hasta-items.ts
│   │
│   ├── pages
│   │   ├── LoginPage.ts
│   │   ├── HomePage.ts
│   │   ├── RegistroPage.ts
│   │   ├── CaratulaEC01Page.ts
│   │   ├── ItemPage.ts
│   │   ├── ItemsEC01Page.ts
│   │   ├── OficializacionHerreroPage.ts
│   │   └── OficializacionRussoPage.ts
│   │
│   └── utils
│       └── generador-items.ts
│
├── screenshots
├── launcher.ts
├── package.json
└── README.md
```

---

# Cómo agregar una nueva posición arancelaria

La arquitectura actual permite ampliar progresivamente la cobertura.

## 1. Registrar la posición

Agregarla en:

```text
config/posiciones-arancelarias.json
```

## 2. Obtener el flujo de sufijos

Puede utilizarse Playwright Codegen para registrar los campos requeridos por la posición.

Interesan principalmente las acciones posteriores a:

```text
Agregar sufijo
```

No es necesario conservar acciones circunstanciales como:

```text
page.goto(...)
ControlOrMeta+V
```

si no forman parte real del flujo.

## 3. Parametrizar los sufijos

Agregar la posición en:

```text
config/sufijos-posiciones.json
```

## 4. Validar TypeScript

```bash
npx tsc --noEmit
```

## 5. Probar primero con un ítem

```text
Cantidad: 1
Posición: nueva posición
Sufijos: Automático
```

## 6. Incorporarla a una prueba multi-item

Una vez validada individualmente, probarla junto con otras posiciones.

## 7. Validar IC04 y EC01

Cuando corresponda, verificar que la configuración funcione correctamente en ambos subregímenes.

---

# Checklist antes de subir cambios

Antes de realizar un push:

```bash
npx tsc --noEmit
```

Luego ejecutar las pruebas relevantes.

Para cambios compartidos de posiciones, sufijos o ítems:

- [ ] IC04 individual
- [ ] EC01 individual
- [ ] Multi-item
- [ ] Sufijos automáticos
- [ ] FOB correcto
- [ ] Paralelo IC04 + EC01

Para cambios de Oficialización:

- [ ] Herrero
- [ ] Russo
- [ ] Ambiente objetivo

Finalmente:

```bash
git status
```

Revisar cuidadosamente qué archivos serán incluidos.

---

# Archivos generados durante ejecución

Algunos archivos pueden modificarse o generarse como consecuencia de una ejecución local.

Por ejemplo:

```text
screenshots/
data/oficializacion-contador.json
```

Antes de realizar un commit se recomienda verificar:

```bash
git status
```

Si `data/oficializacion-contador.json` cambió solamente por una ejecución y no se desea versionar ese cambio:

```bash
git restore data/oficializacion-contador.json
```

No utilizar `git add .` automáticamente sin revisar previamente los cambios.

---

# Flujo recomendado para subir cambios

Ver estado:

```bash
git status
```

Agregar únicamente los archivos deseados:

```bash
git add <archivo>
```

Validar:

```bash
git status
```

Crear commit:

```bash
git commit -m "descripcion del cambio"
```

Subir:

```bash
git push origin main
```

Comprobar finalmente:

```bash
git status
```

Resultado esperado:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

---

# Cobertura de pruebas

El Loader permite generar múltiples escenarios a partir de una misma automatización parametrizada.

Las dimensiones principales de cobertura son:

| Dimensión | Variantes |
|---|---|
| Subrégimen | IC04 / EC01 |
| Ejecución | Individual / Paralela |
| Navegador | Chrome / Firefox / Edge |
| Cantidad de ítems | 1 / 5 / 10 / 15 / 20 / 50 / 100 / 200 / 250 |
| Posiciones | Única / múltiples |
| Posiciones configuradas | 10 |
| Sufijos | Automático / Asistido |
| Facturas | Con / Sin |
| Oficialización | Herrero / Russo |
| Ambiente | Configurados + URL Manual |

Por este motivo, la cantidad de combinaciones posibles es considerablemente mayor que la cantidad de flujos implementados físicamente.

La cobertura funcional debe mantenerse documentada en una matriz de Test Cases a medida que se incorporen nuevos escenarios.

---

# Roadmap

## Próximas mejoras

- [ ] Incorporar nuevas posiciones arancelarias.
- [ ] Continuar ampliando la cobertura automática de sufijos.
- [ ] Incorporar SubItems.
- [ ] Ampliar el flujo posterior a Ítems.
- [ ] Mejorar reportes de ejecución.
- [ ] Mejorar evidencias automáticas.
- [ ] Evaluar migración de `npm` a `pnpm`.
- [ ] Mantener actualizada la matriz de Test Cases.
- [ ] Continuar reduciendo pasos manuales.
- [ ] Facilitar el uso de la herramienta por QA y desarrolladores.

---

# Resumen v1.5.0

```text
DAI QA LOADER v1.5.0
────────────────────────────────────────

IC04                            ✅
EC01                            ✅

Individual                      ✅
Paralelo IC04 + EC01            ✅

1 Item                          ✅
Multi-item                      ✅
Hasta 250 Items                 ✅

Distribución FOB                ✅
Validación FOB                  ✅

10 Posiciones Arancelarias      ✅
Sufijos Automáticos             ✅
Sufijos Asistidos               ✅

Con Facturas                    ✅
Sin Facturas                    ✅

Chrome                          ✅
Firefox                         ✅
Edge                            ✅

Oficialización Herrero          ✅
Oficialización Russo            ✅
Oficialización Multi-Ambiente   ✅
```

---

## DAI QA Loader

**Automatización orientada a reducir tiempos de preparación, ampliar cobertura y facilitar la generación repetible de datos de prueba para DAI.**
