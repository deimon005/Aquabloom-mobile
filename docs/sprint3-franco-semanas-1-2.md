# Sprint 3 móvil — Franco Oyarzo, semanas 1 y 2

Lineup contrastado con el proyecto **Sprint 3 - Mobile** en Linear el
13 de noviembre de 2026. Se excluyen las semanas 3 y 4 y las tareas de
otros integrantes. La entrega se prepara en `franco`, sin merge a `main`.

| Tarea                                                                                                          | Criterio y evidencia de esta entrega                                                                                                                                                  | Qué falta comprobar                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [AQU-317](https://linear.app/aquabloom/issue/AQU-317/m3-05-revisar-estados-de-catalogo)                        | Carga, error, vacío real, filtro sin resultados y reintento distinguibles. Pruebas de roles, filtros y navegación web.                                                                | No se requiere consulta a producción para estos estados.                                                  |
| [AQU-318](https://linear.app/aquabloom/issue/AQU-318/m3-06-mejorar-la-espera-al-arrancar-la-api)               | Límite de dos reintentos automáticos para timeout/502/503/504; E2E de tres 503 y recuperación manual sin recargar.                                                                    | El arranque de la API real no se mide con el fixture.                                                     |
| [AQU-319](https://linear.app/aquabloom/issue/AQU-319/m3-07-revisar-la-ficha-movil-de-panguipulli)              | Nombre, región y vacío de estaciones visibles; error de estaciones no es vacío y no oculta la ficha. Comprobado con Panguipulli como fixture.                                         | Contrastar el catálogo real en el piloto.                                                                 |
| [AQU-320](https://linear.app/aquabloom/issue/AQU-320/m3-08-fijar-la-linea-base-de-accesibilidad)               | Línea base priorizada abajo: foco visible, texto ampliado y orden de avisos. Pruebas de componentes y teclado web.                                                                    | Completar recorrido y registro de TalkBack y escala del sistema en Android.                               |
| [AQU-329](https://linear.app/aquabloom/issue/AQU-329/m3-17-validar-camara-denegada-en-android)                 | Rechazo temporal/permanente mantiene fecha y nota; aviso junto a cámara, reintento explícito y ausencia de guardado automático.                                                       | Rechazo real en Android y adjuntar evidencia a AQU-289.                                                   |
| [AQU-330](https://linear.app/aquabloom/issue/AQU-330/m3-18-validar-ubicacion-denegada-y-retorno-desde-ajustes) | Ajustes sólo ante permiso permanente, fallo seguro y lectura del permiso en el siguiente toque. Pruebas con dobles.                                                                   | Volver de Ajustes en Android, conceder permiso y obtener una posición real; adjuntar evidencia a AQU-289. |
| [AQU-331](https://linear.app/aquabloom/issue/AQU-331/m3-19-aclarar-el-estado-local-del-borrador)               | Estado de persistencia separado de integridad de foto/ubicación. Error de catálogo no desmonta una edición iniciada; reconectar no implica envío. Pruebas de UI y E2E offline/online. | El navegador usa almacenamiento de sesión, no SQLite del APK.                                             |
| [AQU-332](https://linear.app/aquabloom/issue/AQU-332/m3-20-corregir-la-accesibilidad-del-formulario)           | Siguiente mueve el foco de fecha a nota. Guardar inválido vuelve al primer error; corregir un campo no oculta el error del otro.                                                      | Completar el mismo recorrido con TalkBack, teclado del teléfono y texto del sistema ampliado.             |

## Línea base de accesibilidad (AQU-320)

- **Alta — errores de formulario:** un error de campo podía quedar lejos del
  foco, y cambiar un dato limpiaba todos los avisos. El foco vuelve al primer
  inválido; cada error tiene texto, estado inválido y aviso accesible.
- **Alta — rechazo y recuperación:** el aviso de cámara/ubicación estaba
  separado del control. Ahora se anuncia junto a la acción; volver de Ajustes
  no autoriza capturar ni guardar automáticamente.
- **Media — foco de acciones:** las acciones compartidas tenían área táctil
  mínima, pero no un contorno explícito en sus estilos. Se añade un contorno
  sin desplazar los controles. Verificado con teclado en navegador.
- **Media — escala y desplazamiento:** las cabeceras limitaban el tamaño
  del sistema a 2×. Se elimina ese tope; el contenido sigue en una vista
  desplazable y los filtros usan el diseño apilado cuando aumenta la escala.
  Falta inspección visual nativa con fuente y visualización ampliadas.

La revisión de propiedades accesibles y teclado web no certifica anuncios,
orden de exploración ni foco de TalkBack. Referencia para la implementación:
[accesibilidad de React Native](https://reactnative.dev/docs/accessibility).

## Protocolo de verificación nativa pendiente

En este entorno no se encontró ADB ni un Android SDK configurado. No se
instaló un APK ni se probó hardware. Cuando haya dispositivo, usar un build
del commit a verificar y una cuenta y observaciones de prueba:

1. En Panguipulli, escribir fecha y nota. Pulsar **Tomar fotografía** y
   denegar. Comprobar que se anuncia cómo continuar, los campos siguen
   presentes y no se abre cámara ni se guarda.
2. Denegar ubicación hasta que el sistema exija Ajustes. Usar **Abrir
   Ajustes de ubicación**, habilitar el permiso de primer plano y volver.
   Confirmar que no hay captura automática. Pulsar **Capturar ubicación** y
   comprobar posición/precisión sin pérdida de datos.
3. Activar TalkBack, ampliar el texto en Ajustes y recorrer título, campos,
   errores, acciones y estado de guardado. Provocar fecha imposible, corregir
   y guardar. Registrar orden, texto leído, alcance con teclado y recortes.
4. Registrar modelo, versión Android, escala de texto, commit y resultado
   de cada caso; adjuntar a AQU-289 la evidencia real de permisos. Omitir
   ubicación personal, credenciales y fotos privadas de las capturas.

## Comandos

```sh
pnpm run check
pnpm run test:e2e
pnpm run export:android
```

Los E2E interceptan HTTP para provocar 503, falta de estaciones y reconexión;
no consumen producción. Los resultados de Jest, SQLite y la introspección de
permisos no reemplazan el ensayo nativo. La exportación genera un bundle,
no un APK instalado.

### Resultado local del 13 de noviembre

- `pnpm run check`: formato, ESLint, TypeScript, 282 pruebas Jest en 47
  suites, 29 pruebas SQLite/archivos temporales y 2 controles de permisos
  generados.
- `pnpm run test:e2e`: 4 recorridos aprobados. Incluye los tres 503 y la
  recuperación sin reinicio, la ficha vacía de Panguipulli, foco de fecha y
  nota, y guardado offline con reconexión sin escrituras HTTP.
- `pnpm run export:android`: bundle Hermes de 4,9 MB, 1667 módulos y 30
  assets. No equivale a instalación ni prueba de permisos físicos.

**Total: 317 comprobaciones automatizadas aprobadas.** Se instaló el
Chromium de la versión local de Playwright mediante pnpm; el primer intento
de E2E no arrancó por falta de ese binario. Los recorridos también
detectaron dos problemas reales: el scroll web quitaba el foco solicitado
y la suscripción web no reaccionaba siempre a `offline`. Se corrigieron
ambos y se repitió la suite sin quitar aserciones.

El lineup se confirmó en Linear. No se cambiaron estados de tarjetas,
no se abrió PR y no se modificó `main` en esta entrega.
