DAI QA Loader

Herramienta de automatización para generar y cargar datos de prueba sobre DAI.

Versión actual

v1.5.0

Principales capacidades de esta versión

Flujos de Operaciones para IC04 y EC01.

Ejecución individual o paralela IC04 + EC01.

Ejecución en Chrome, Firefox y Edge.

Ambientes configurados: QA, MOCKDEVNOKIT, AUTOMATION, prod y OFICIALIZACION, más URL Manual.

Carga de 1, 5, 10, 15, 20, 50, 100, 200 o 250 ítems.

Un único ítem con una única posición arancelaria.

Multi-item con una misma posición o varias posiciones.

Distribución automática del FOB entre ítems.

Validación de que el FOB acumulado de los ítems coincida con el FOB de Carátula.

Operaciones con o sin facturas.

Carga de sufijos en modo Automático o Asistido.

10 posiciones arancelarias configuradas.

Flujo de Oficialización Herrero/Russo.

Oficialización ejecutable en cualquier ambiente disponible.

Tecnologías

TypeScript

Playwright

Node.js

TSX

npm

Mejora futura prevista: evaluar migración de npm a pnpm para la gestión de dependencias.

Instalación

npm install

Validar TypeScript:

npx tsc --noEmit

Ejecutar:

npm run start

Ambientes

El Launcher permite seleccionar:

QA

MOCKDEVNOKIT

AUTOMATION

prod

OFICIALIZACION

URL Manual

URL Manual permite ejecutar el Loader contra una URL ingresada por el usuario.

Operaciones

Los subregímenes actualmente soportados son:

IC04

EC01

El flujo automatiza principalmente:

Login → Nueva Operación → Registro → Carátula → Ítems

Modos de ejecución

Individual

Ejecuta IC04 o EC01 de manera independiente.

Paralelo

Permite ejecutar:

IC04 + EC01

Cada flujo puede configurarse independientemente y al finalizar se informa el resultado de cada ejecución.

Navegadores

Chrome

Firefox

Edge

En ejecución paralela se utilizan navegadores diferentes para IC04 y EC01.

Ítems

Cantidades disponibles:

1
5
10
15
20
50
100
200
250

Un solo ítem

Cuando se selecciona 1, el Launcher solicita directamente una única posición arancelaria.

Multi-item

Para múltiples ítems puede seleccionarse:

Misma posición para todos los ítems.

Varias posiciones arancelarias.

Las posiciones seleccionadas se distribuyen entre los ítems generados.

FOB

El FOB total se ingresa a nivel de Carátula.

Ejemplo:

FOB Carátula: 10000
Items: 5

001 | FOB 2000.00
002 | FOB 2000.00
003 | FOB 2000.00
004 | FOB 2000.00
005 | FOB 2000.00

El generador distribuye también los centavos cuando la división no es exacta.

La validación final comprueba:

FOB ITEMS == FOB CARATULA

La generación se encuentra centralizada en:

src/utils/generador-items.ts

Posiciones arancelarias

Actualmente existen 10 posiciones configuradas:

#

Posición

1

7318.15.00.620M

2

3812.39.29.990C

3

3208.10.10.000L

4

3003.10.12.000W

5

8703.23.10.190E

6

7318.11.00.100F

7

8409.99.99.900C

8

8483.10.20.900Z

9

3926.90.90.919Z

10

8708.29.99.990J

Configuración:

config/posiciones-arancelarias.json

Sufijos

La configuración de sufijos se encuentra en:

config/sufijos-posiciones.json

Esto permite definir los campos requeridos por cada posición sin incorporar lógica específica de cada posición al flujo principal.

Ejemplo:

{
  "POSICION": [
    {
      "tipo": "texto",
      "nombreAccesible": "Campo",
      "valor": "Valor"
    },
    {
      "tipo": "combo",
      "nombreAccesible": "Seleccionar",
      "valor": "XX00 - Ninguno"
    }
  ]
}

Se soportan:

Campos de texto.

Combos.

Valores correlativos por ítem.

Valores fijos mediante correlativo: false.

Posiciones con múltiples combos.

Automático

El Loader valida antes de comenzar que las posiciones seleccionadas tengan configuración de sufijos.

Asistido

Permite detener la automatización para completar manualmente los sufijos cuando sea necesario.

Facturas

El flujo permite seleccionar:

[1] Con facturas
[2] Sin facturas

Oficialización

El flujo de Oficialización utiliza actualmente:

Subrégimen: EC01
Posición:   7318.11.00.100F
Items:      1
Facturas:   Sin facturas

Perfiles

Herrero

Russo

Empresas configuradas

Baterias Moura

Malba Textil

Flujos de preguntas

Herrero

Russo

Perfil, empresa y flujo de preguntas pueden combinarse según el escenario que se quiera validar.

Oficialización multi-ambiente

El flujo ya no está limitado al ambiente OFICIALIZACION.

Puede ejecutarse en cualquiera de los ambientes ofrecidos por el Launcher, incluyendo URL Manual.

Estructura principal

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
│   ├── pages
│   │   ├── LoginPage.ts
│   │   ├── HomePage.ts
│   │   ├── RegistroPage.ts
│   │   ├── CaratulaEC01Page.ts
│   │   ├── ItemPage.ts
│   │   ├── ItemsEC01Page.ts
│   │   ├── OficializacionHerreroPage.ts
│   │   └── OficializacionRussoPage.ts
│   └── utils
│       └── generador-items.ts
│
├── screenshots
├── launcher.ts
├── package.json
└── README.md

Validación antes de subir cambios

Compilar:

npx tsc --noEmit

Ejecutar:

npm run start

Para cambios compartidos de Items, sufijos o posiciones se recomienda validar:

IC04

EC01

Paralelo IC04 + EC01

Para cambios de Oficialización, validar también el flujo Herrero/Russo en el ambiente objetivo.

Cobertura actual

Actualmente el Loader cubre:

Login Mock.

Nueva Operación.

Registro.

Carátula.

Ítems.

Ejecución de un único ítem.

Multi-item.

Distribución y validación de FOB.

10 posiciones arancelarias.

Sufijos automáticos.

Sufijos asistidos.

Con/Sin facturas.

IC04.

EC01.

Paralelo IC04 + EC01.

Oficialización Herrero.

Oficialización Russo.

Oficialización multi-ambiente.

La matriz actual documenta aproximadamente 60 Test Cases lógicos, además de las múltiples combinaciones parametrizables disponibles desde el Launcher.

Próximas mejoras

Incorporar nuevas posiciones arancelarias.

Continuar ampliando la cobertura de sufijos.

Incorporar soporte para SubItems.

Ampliar automatización posterior a Items.

Mejorar reportes y evidencias.

Evaluar migración de npm a pnpm.

Mantener actualizada la matriz de cobertura de Test Cases.

Estado

DAI QA LOADER v1.5.0

IC04                         OK
EC01                         OK
1 Item                       OK
Multi-item                   OK
10 posiciones arancelarias   OK
Sufijos automáticos          OK
Paralelo IC04 + EC01         OK
Oficialización Herrero       OK
Oficialización Russo         OK
Oficialización multi-ambiente OK

Herramienta interna de soporte QA para acelerar la preparación y ejecución de escenarios de prueba sobre DAI.