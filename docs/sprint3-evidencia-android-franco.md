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
