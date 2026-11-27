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

## Repetir el recorrido cuando el catálogo de preview falla

Ejecutar **Android Preview (Expo)** en la rama que se está probando con el
perfil **android-qa**. Usar el enlace de Expo del job y registrar el SHA.
El paquete de QA se instala como `com.aquabloom.mobile.qa` y usa el nombre
**AquaBloom QA**. En las instrucciones de ADB, cambiar el nombre del paquete
por el de QA. La cuenta de prueba es `franco@example.test` con la contraseña
sintética `fixture-password`.

El catálogo de QA provoca tres respuestas 503 al consultar la lista por
primera vez. Esperar el mensaje de error, pulsar **Reintentar** y abrir
**Panguipulli (prueba QA)**. Los permisos, preferencias de accesibilidad
y SQLite pertenecen al sistema Android del emulador. La cuenta, el
catálogo, la escena de cámara y la posición del emulador son de prueba.

1. Anotar la fecha y la nota antes y después de denegar cámara. Capturar
   el diálogo del sistema, el aviso de AquaBloom y la nota conservada.
2. Denegar ubicación hasta que la app ofrezca Ajustes. Habilitar ubicación
   en primer plano y volver. Comprobar que la posición sigue vacía hasta
   pulsar **Capturar ubicación**. Usar una posición simulada conocida.
3. Activar TalkBack y texto al 150 %. Recorrer fecha, nota, error de fecha
   y acción de guardar. Comprobar el texto anunciado y el foco cuando
   aparece el error. Corregirlo, guardar y salir de la app. Al reabrirla,
   recuperar el mismo borrador y verificar la nota.
4. Con TalkBack, recorrer la lista, ficha y trabajo científico del ejemplo.
   Cortar la red en la app virtual y comprobar la lectura del aviso.
5. Registrar los resultados por criterio y restaurar red, fuente y
   TalkBack del emulador. Distinguir cualquier falla de preview o del
   servicio real de la evidencia obtenida en QA.
