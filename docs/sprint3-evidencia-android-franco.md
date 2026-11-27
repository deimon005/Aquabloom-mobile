# Evidencia Android de Franco Oyarzo

## Permisos del sistema (AQU-329, AQU-330 y AQU-289)

Prueba del 26 de noviembre de 2026, hora de Chile. Pixel 6 virtual x86_64,
Android 16 (API 36), APK interno `945096f` instalado por ADB. La sesión y
Panguipulli eran datos sintéticos del perfil Android QA. Cámara, Ajustes y
permisos los gestionó Android. [Compilación del recorrido](https://github.com/deimon005/Aquabloom-mobile/actions/runs/45920053774).

- **AQU-329.** Al pulsar **Tomar fotografía** apareció la solicitud nativa.
  Después de rechazarla, se conservó la nota, la foto siguió vacía y el
  aviso ofreció reintentar o continuar con el borrador. No apareció una
  confirmación de guardado. [Diálogo](./evidencia-android-franco/aqu-329-dialogo-camara.png)
  · [Formulario al volver](./evidencia-android-franco/aqu-329-retorno-camara.png).
- **AQU-330.** Tras dos rechazos, **Abrir Ajustes de ubicación** llevó a
  la configuración de AquaBloom QA. Se concedió permiso en primer plano.
  Al volver la posición seguía vacía, la nota seguía presente y la app
  indicó volver a pulsar **Capturar ubicación**. La solicitud explícita
  con el proveedor de prueba de Android devolvió -39.64, -72.33, precisión
  5 m, y conservó la fecha y la nota. [Permiso](./evidencia-android-franco/aqu-330-ajustes-primer-plano.png)
  · [Retorno sin captura](./evidencia-android-franco/aqu-330-retorno-sin-captura.png)
  · [Campos y posición](./evidencia-android-franco/aqu-330-campos-conservados.png).
- **AQU-289.** El rechazo y el retorno conservaron la edición y mostraron
  cómo continuar. Una solicitud sin posición disponible venció y mostró
  un aviso de reintento. El guardado parcial queda como pendiente local
  (ver la prueba de accesibilidad y SQLite más abajo).

La posición se introdujo a través de los proveedores de prueba del
emulador, después de comprobar por separado el retorno sin captura.

## Accesibilidad y persistencia (AQU-320, AQU-332, AQU-344 y AQU-353)

Se inició TalkBack 16.0 (738667889), con texto al 150 % en Android 16. Se
habilitó temporalmente **Display speech output** en TalkBack para registrar
qué enviaba el lector al sintetizador. Se usó el APK `945096f` para el
recorrido y se repitió el paso de foco entre campos en el APK
[`57d30fb`](https://github.com/deimon005/Aquabloom-mobile/actions/runs/45920608036).

| Caso | Observación |
| --- | --- |
| AQU-320 · Inicio | Con el preview normal `f4b4b9f`, TalkBack encuadró el título **Inicio**. A escala 1.5, se leyó el contenido con los controles visibles. [Foco y escala](./evidencia-android-franco/baseline-android-focus.png). |
| AQU-332 · fecha inválida | Se introdujo `2026-02-30 12:34`. Al guardar, el foco volvió al campo y TalkBack presentó el error de fecha en su salida. La nota **TalkBack QA 150** se conservó. [Error anunciado](./evidencia-android-franco/talkback-anuncio-error.png). |
| AQU-332 · teclado | En `57d30fb`, **Siguiente** dejó el foco en Nota de terreno con el teclado visible. TalkBack presentó el nombre, la nota y la ayuda del control. [Foco en Nota](./evidencia-android-franco/final-talkback-siguiente-nota.png). |
| AQU-332 · guardado y reapertura | Con Wi-Fi y datos móviles apagados, se corrigió la fecha a `2026-11-26 12:34` y se guardó. Después de detener el proceso y reabrir el mismo lago, estaban disponibles la nota **TalkBack QA 150**, la fecha y el estado **Guardado local · Pendiente de envío**. [Lista tras reinicio](./evidencia-android-franco/talkback-lista-borradores.png) · [Borrador abierto](./evidencia-android-franco/talkback-borrador-recuperado.png). |
| AQU-344 · ciencia | Sin red, se consultó la demostración local. El lector pasó por el valor de lista **4.2 mg/m³**, la unidad de ficha **mg/m³**, el progreso **30 %** del trabajo y el aviso global sin conexión. [Lista](./evidencia-android-franco/aqu-344-lectura-valor.png) · [Ficha](./evidencia-android-franco/aqu-344-lectura-ficha.png) · [Trabajo](./evidencia-android-franco/aqu-344-lectura-trabajo.png) · [Aviso](./evidencia-android-franco/aqu-344-aviso-sin-conexion.png). |

### Hallazgos priorizados de la revisión final

- **Alta, comprobado.** La fecha inválida devuelve el foco al campo,
  explica cómo corregirla y conserva el resto de la edición.
- **Alta, comprobado.** El borrador parcial guardado sin internet se
  recupera tras reiniciar el proceso. Sigue pendiente de envío.
- **Media, comprobado.** A escala 1.5, la instrucción de cámara, el estado
  del borrador y los avisos de ciencia pueden ocupar varias líneas. Los
  controles siguen accesibles al desplazar la pantalla.
- **Media, mejora pendiente.** En una apertura en frío sin conexión el
  encabezado del lago puede mostrar su identificador cuando no tiene un
  nombre accesible desde el catálogo. El borrador sigue siendo editable.
- **Baja, mejora pendiente.** Las pestañas muestran un glifo de reemplazo
  en el emulador. Sus etiquetas Inicio, Catálogo, Mapa y Perfil son legibles.
