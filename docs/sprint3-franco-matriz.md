# Matriz de cierre móvil del Sprint 3

Responsable Franco Oyarzo. Estado de la evidencia al 26 de noviembre de 2026.
Los enlaces identifican las tarjetas del proyecto Sprint 3 - Mobile.

| Tarjeta                                               | Resultado y evidencia                                                                                                       | Pendiente de aceptación             |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [AQU-317](https://linear.app/aquabloom/issue/AQU-317) | Done. Prueba web de carga, vacío, filtros y reintento.                                                                      | —                                   |
| [AQU-318](https://linear.app/aquabloom/issue/AQU-318) | Done. Prueba web con tres respuestas 503 y recuperación manual.                                                             | —                                   |
| [AQU-319](https://linear.app/aquabloom/issue/AQU-319) | Done. Ficha web con Panguipulli y estaciones vacías de prueba.                                                              | —                                   |
| [AQU-320](https://linear.app/aquabloom/issue/AQU-320) | Línea base priorizada con foco de TalkBack y texto al 150 % en Android 16.                                                  | Validado en Android.                |
| [AQU-329](https://linear.app/aquabloom/issue/AQU-329) | Diálogo nativo denegado, aviso de recuperación y nota conservada.                                                           | Validado en Android.                |
| [AQU-330](https://linear.app/aquabloom/issue/AQU-330) | Permiso desde Ajustes, retorno sin captura automática y posición simulada sólo tras pulsar la acción.                       | Validado en Android.                |
| [AQU-331](https://linear.app/aquabloom/issue/AQU-331) | Done. Prueba web de guardado local incompleto y reconexión.                                                                 | —                                   |
| [AQU-332](https://linear.app/aquabloom/issue/AQU-332) | TalkBack al 150 %, error de fecha anunciado, foco en Nota y reapertura del borrador.                                        | Validado en Android.                |
| [AQU-341](https://linear.app/aquabloom/issue/AQU-341) | Pruebas de componentes y web verifican punto, valor, unidad, fecha UTC, escena, modelo, dataset y ausencias.                | Done en Linear.                     |
| [AQU-342](https://linear.app/aquabloom/issue/AQU-342) | Pruebas de componentes para vacío, coordenadas ausentes, HTTP 503 y HTTP 403. El ejemplo sin coordenadas conserva su ficha. | Done en Linear.                     |
| [AQU-343](https://linear.app/aquabloom/issue/AQU-343) | Recorrido con etiqueta de datos sintéticos y condición experimental, sin tráfico a rutas científicas.                       | Done en Linear.                     |
| [AQU-344](https://linear.app/aquabloom/issue/AQU-344) | Lectura de la lista, ficha, trabajo y aviso sin conexión con TalkBack.                                                      | Validado con la demostración local. |
| [AQU-353](https://linear.app/aquabloom/issue/AQU-353) | Revisión de permisos, foco, texto al 150 % y persistencia. Hallazgos priorizados.                                           | Validado en Android.                |
| [AQU-354](https://linear.app/aquabloom/issue/AQU-354) | [Guion de presentación](./sprint3-guion-demo-franco.md) con sesión, mapa, captura y recuperación.                           | Done en Linear.                     |
| [AQU-355](https://linear.app/aquabloom/issue/AQU-355) | [Guía de Android](./sprint3-guia-android-franco.md) contrastada con el APK de QA, reintento, permisos y reapertura.         | Validado en Android.                |
| [AQU-356](https://linear.app/aquabloom/issue/AQU-356) | Esta matriz registra evidencia o bloqueo para cada tarjeta asignada.                                                        | Done en Linear.                     |

La [evidencia de Android](./sprint3-evidencia-android-franco.md) contiene el
recorrido, la revisión de accesibilidad y los enlaces de cada captura. El
[APK de QA de la rama](https://expo.dev/accounts/deimon005/projects/aquabloom-mobile/builds/c5706537-4034-42b7-a8ba-06a0c76b898d)
se generó desde `57d30fb`. Usa un paquete separado y datos sintéticos.

El 26 de noviembre el preview conectado al backend seguía devolviendo
HTTP 500 en `/lakes?page=1&limit=1` y `/health` informaba `degraded`. La
comprobación de la integración con el catálogo real sigue pendiente.
