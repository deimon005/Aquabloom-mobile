# Verificación Android de Franco — AQU-288 y AQU-289

El 26 de noviembre de 2026 se ejecutaron los casos en un Pixel 6 virtual
con Android 16 (API 36). El [perfil Android QA](./sprint3-guia-android-franco.md)
incluye sesión y catálogo sintéticos. Los permisos, el selector de cámara,
el proceso de la aplicación y los archivos y registros locales corresponden
a Android en el emulador. La imagen de cámara y la posición son sintéticas.

## Evidencia mínima a registrar al ejecutar

Dispositivo/modelo, versión Android, commit instalado, tipo y fecha del APK,
cuenta de prueba (sin contraseña/token), conectividad y resultado por caso.
Guardar capturas sin ubicación personal o datos sensibles; una foto de prueba
debe ser deliberadamente no sensible. Registrar incidencia y repetición si falla.

| Caso              | Pasos sobre datos de prueba desechables                              | Resultado esperado                                                              | Resultado en Android |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------- |
| AQU-288 crear     | Con sesión y lago, capturar foto/GPS, fecha/nota; guardar offline    | Foto durable + registro local `pending_send`; confirmación posterior al disco   | Verificado.          |
| AQU-288 recuperar | Cerrar/reabrir proceso y abrir el borrador                           | Misma foto, ubicación/precisión, fecha y nota; no duplicación                   | Verificado.          |
| AQU-288 editar    | Cambiar nota y reemplazar foto; guardar                              | Actualiza mismo UUID; cancelar reemplazo conserva anterior                      | Verificado.          |
| AQU-288 eliminar  | Crear dos borradores; cancelar eliminación y luego confirmar uno     | Sólo desaparece el seleccionado y su carpeta; el otro permanece                 | Verificado.          |
| AQU-289 cámara    | Rechazar permiso temporal/permanente y cancelar cámara               | Campos intactos, guía para reintentar/Ajustes; finalizar deshabilitado sin foto | Verificado.          |
| AQU-289 ubicación | Rechazar permiso, apagar GPS, probar demora                          | Conserva campos, no inventa coordenadas; informa cómo continuar                 | Verificado.          |
| AQU-289 parcial   | Guardar sin foto o posición                                          | Se etiqueta como borrador incompleto, nunca captura finalizada/enviada/validada | Verificado.          |
| Teclado/lector    | Fecha/nota con teclado abierto, botones de captura/guardar, TalkBack | Etiquetas y avisos legibles; acciones alcanzables y foco usable                 | Verificado.          |

Eliminar desde la aplicación es irreversible. Usar sólo registros creados y
confirmados como desechables para este ensayo; no eliminar datos de terreno reales.

## Preparación comprobable sin dispositivo

Las suites `captureFlow`, `captureServices`, `cameraCapture`, `saveObservation`,
`nativePhotoStorage`, `deleteObservation` y `ObservationScreen` comprueban la
coordinación con dobles de sensores/Expo. `scripts/observation-store.test.mjs`
comprueba migración, recuperación, aislamiento y operaciones SQLite con archivos
temporales reales; eso no certifica SQLite dentro de un APK Android.

`scripts/capture-config.test.mjs` introspecciona permisos nativos generados.
Los E2E verifican navegador y memoria de sesión, no permisos físicos. La
exportación Hermes acredita empaquetado JavaScript, no compilación nativa.

## Resultado de permisos (AQU-289)

Las pruebas de [rechazo, retorno de Ajustes y guardado parcial](./sprint3-evidencia-android-franco.md)
se ejecutaron en los APK `945096f` y `57d30fb`. También se observó que
salir del selector de cámara preserva la edición y que cancelar el aviso
de ubicación global desactivada informa cómo recuperar la captura.
[Cancelación de cámara](./evidencia-android-franco/aqu-289-camara-cancelada.png)
· [Ubicación desactivada](./evidencia-android-franco/aqu-289-retorno-sin-gps.png).

## Fallo al conservar una foto (AQU-288)

El APK `57d30fb` mostró la escena de cámara y la posición inyectada, pero
[el guardado informó un fallo](./evidencia-android-franco/aqu-288-respuesta-guardar.png).
La API de Expo copia el archivo de forma asíncrona. La verificación del
tamaño del destino se disparaba antes de que terminara esa copia. El doble
síncrono ocultaba la condición en Jest. Se actualizó el doble, se reprodujo
el fallo y se corrigió la espera en `7fb2cc2`. El recorrido se repitió con la compilación corregida.

## Repetición con el APK corregido (AQU-288)

El [APK de QA de `7fb2cc2`](https://expo.dev/accounts/deimon005/projects/aquabloom-mobile/builds/30f847f7-66a2-4413-9338-d05d1f95c65e)
se instaló con ADB sobre la instalación anterior y conservó el borrador
de control. Los cuatro casos se ejecutaron con Wi-Fi y datos móviles
desactivados.

1. **Crear.** Se tomó una foto de la escena virtual y el proveedor de
   prueba devolvió -39.64, -72.33 con precisión de 5 m. Se guardó
   **QA288VALIDADO** y la aplicación mostró **Guardado local · Pendiente
   de envío**. [Confirmación](./evidencia-android-franco/aqu-288-guardado-completo.png).
2. **Recuperar.** Tras detener y reabrir la aplicación se recuperaron la
   fecha **2026-11-27 01:54** del emulador, la nota, la foto y la posición.
   [Fecha, nota y posición](./evidencia-android-franco/aqu-288-recuperado-campos.png)
   · [Foto recuperada](./evidencia-android-franco/aqu-288-recuperado-foto.png).
3. **Editar.** Se reemplazó la foto con una segunda captura y se guardó
   **QA288EDITADO**. Tras otro reinicio aparecieron sólo el borrador
   editado y **TalkBack QA 150**, el registro de control. La nota
   anterior dejó de aparecer. [Lista tras editar](./evidencia-android-franco/aqu-288-edicion-sin-duplicado.png).
4. **Eliminar.** Al cancelar, la foto y el botón de eliminación siguieron
   presentes. Al confirmar, la aplicación indicó que eliminó el borrador
   y sus fotos locales. La lista conservó únicamente el registro de control.
   [Confirmación](./evidencia-android-franco/aqu-288-cuadro-eliminado.png)
   · [Lista final](./evidencia-android-franco/aqu-288-eliminacion-selectiva.png).

El cambio pasó `pnpm run check` y `pnpm run test:e2e` (334 casos) y la
exportación de Android. La implementación de `File.copy` devuelve una
promesa que se resuelve una vez completada la copia.
[Referencia de Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/#copydestination-options).
