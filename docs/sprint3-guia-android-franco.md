# Instalación y recuperación en Android

AQU-355. Usar Android 16 en el emulador del equipo o un dispositivo de prueba.
Identificar el SHA del APK en la ejecución de GitHub Actions y descargar el
artefacto de Expo que corresponde a esa ejecución. El emulador del equipo
funciona con una imagen x86_64 y TalkBack 16.0.

## Instalación y arranque

Desde la carpeta de Platform Tools y con el emulador abierto, ejecutar:

```powershell
.\adb.exe devices -l
.\adb.exe -s emulator-5554 install -r C:\ruta\al\AquaBloom.apk
.\adb.exe -s emulator-5554 shell am start -W -n com.aquabloom.mobile/.MainActivity
```

Usar el identificador que muestra ADB si es distinto. Confirmar que Inicio
se ve y que la app abre el catálogo. Si el catálogo da error, pulsar
**Reintentar**. Si persiste, registrar la hora, el SHA y el estado de
`/health` y `/lakes` del entorno del build.

## Permisos y recuperación

1. Iniciar sesión con una cuenta de prueba, elegir un lago y abrir
   **Observaciones de terreno**. Escribir una fecha y nota sintéticas.
2. Pulsar la acción de cámara o ubicación. Si se rechaza, volver a la
   acción o pulsar **Abrir Ajustes** si el sistema ya agotó los avisos.
   Habilitar el permiso para AquaBloom mientras se usa la aplicación.
   Volver, comprobar fecha y nota y solicitar la captura de nuevo.
3. En el formulario, pulsar **Guardar borrador local** aun si faltan
   foto o posición. Esperar **Guardado local · Pendiente de envío**.
4. Tras reabrir la app, volver al mismo lago con la misma cuenta y tocar
   **Ver borradores guardados**. Elegir el borrador y comprobar los campos.
   Si un guardado falló, conservar la edición y reintentar antes de salir.

El arranque se verificó anteriormente en Android 16 con el APK
`f4b4b9f`. La guía de permisos y recuperación está pendiente de repetirse
en el APK con acceso funcional al catálogo, que devolvió HTTP 500 en
la última comprobación. La evidencia por tarjeta está en la
[matriz de cierre](./sprint3-franco-matriz.md).
