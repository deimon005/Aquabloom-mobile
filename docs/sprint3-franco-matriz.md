# Matriz de cierre móvil del Sprint 3

Responsable Franco Oyarzo. Estado de la evidencia al 21 de noviembre de 2026.
Los enlaces identifican las tarjetas del proyecto Sprint 3 - Mobile.

| Tarjeta                                               | Resultado y evidencia                                                                                                       | Pendiente de aceptación                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [AQU-317](https://linear.app/aquabloom/issue/AQU-317) | Done. Prueba web de carga, vacío, filtros y reintento.                                                                      | —                                                                    |
| [AQU-318](https://linear.app/aquabloom/issue/AQU-318) | Done. Prueba web con tres respuestas 503 y recuperación manual.                                                             | —                                                                    |
| [AQU-319](https://linear.app/aquabloom/issue/AQU-319) | Done. Ficha web con Panguipulli y estaciones vacías de prueba.                                                              | —                                                                    |
| [AQU-320](https://linear.app/aquabloom/issue/AQU-320) | Línea base priorizada en [semanas 1 y 2](./sprint3-franco-semanas-1-2.md).                                                  | Registrar TalkBack, escala y foco con la app abierta en Android.     |
| [AQU-329](https://linear.app/aquabloom/issue/AQU-329) | Pruebas del formulario conservan fecha y nota al denegar cámara.                                                            | Capturar el diálogo y adjuntar evidencia a AQU-289.                  |
| [AQU-330](https://linear.app/aquabloom/issue/AQU-330) | Pruebas con dobles verifican el retorno de Ajustes y la captura por acción explícita.                                       | Ejecutar el recorrido y adjuntar evidencia a AQU-289.                |
| [AQU-331](https://linear.app/aquabloom/issue/AQU-331) | Done. Prueba web de guardado local incompleto y reconexión.                                                                 | —                                                                    |
| [AQU-332](https://linear.app/aquabloom/issue/AQU-332) | Pruebas de foco, corrección y guardado con teclado web.                                                                     | Completar y guardar con TalkBack y fuente ampliada en Android.       |
| [AQU-341](https://linear.app/aquabloom/issue/AQU-341) | Pruebas de componentes y web verifican punto, valor, unidad, fecha UTC, escena, modelo, dataset y ausencias.                | Revisión de la PR.                                                   |
| [AQU-342](https://linear.app/aquabloom/issue/AQU-342) | Pruebas de componentes para vacío, coordenadas ausentes, HTTP 503 y HTTP 403. El ejemplo sin coordenadas conserva su ficha. | Revisión de la PR.                                                   |
| [AQU-343](https://linear.app/aquabloom/issue/AQU-343) | Recorrido con etiqueta de datos sintéticos y condición experimental, sin tráfico a rutas científicas.                       | Revisión de la PR.                                                   |
| [AQU-344](https://linear.app/aquabloom/issue/AQU-344) | Prueba web de lista, ficha y trabajo de ejemplo, con aviso sin conexión.                                                    | Leer lista, ficha, trabajo y avisos con TalkBack en Android.         |
| [AQU-353](https://linear.app/aquabloom/issue/AQU-353) | Casos críticos identificados en la línea base y en esta matriz.                                                             | Repetirlos con TalkBack y texto ampliado y registrar hallazgos.      |
| [AQU-354](https://linear.app/aquabloom/issue/AQU-354) | [Guion de presentación](./sprint3-guion-demo-franco.md) con sesión, mapa, captura y recuperación.                           | Revisión de la PR.                                                   |
| [AQU-355](https://linear.app/aquabloom/issue/AQU-355) | [Guía de Android](./sprint3-guia-android-franco.md) escrita. Instalación y arranque observados con un APK previo.           | Validar permisos, reintentos y recuperación de borradores en la app. |
| [AQU-356](https://linear.app/aquabloom/issue/AQU-356) | Esta matriz registra evidencia o bloqueo para cada tarjeta asignada.                                                        | Revisión de la PR.                                                   |

El entorno de preview volvió a responder HTTP 500 en `/lakes?page=1&limit=1`
el 21 de noviembre. `/health` reportó estado `degraded`. Seleccionar un lago
y abrir un borrador requiere un catálogo de prueba operativo. Para continuar
las pruebas nativas se necesita además una cuenta de prueba. La ejecución
de TypeScript, Jest y Playwright y la exportación JavaScript no sustituyen
el recorrido de TalkBack ni las pruebas del diálogo del sistema Android.
