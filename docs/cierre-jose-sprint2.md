# Entrega móvil de José · Sprint 2

Rama `jose/sprint2-cierre-movil`, con base en `6e55e08` de `main`.
La evidencia automatizada usa datos sintéticos.

| Objetivo                                        | Tareas                    | Evidencia                                                                                                                                               |
| ----------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capturar offline y recuperar pendientes         | AQU-292                   | `scripts/observation-store.test.mjs` comprueba persistencia de campos y fotos, recuperación tras reapertura y guardado repetido por UUID.               |
| Aislar datos locales por cuenta                 | AQU-293                   | Pruebas del almacén y del cambio de sesión, más prueba del alcance de caché científico por usuario y lago.                                              |
| Consultar resultados con procedencia y unidades | AQU-279, AQU-280, AQU-281 | Ejemplos sintéticos y pruebas de pantallas y adaptadores en `src/features/scientific/__tests__/`.                                                       |
| Recuperar la consulta ante una caída de red     | AQU-283, AQU-292          | `useScientific.test.tsx` verifica la lectura fechada del caché y la consulta al reconectar. La lista y el detalle indican que muestran datos guardados. |
| Verificar la entrega y dejar evidencia          | AQU-294, AQU-295          | Verificaciones locales de este documento y [protocolo Android](verificacion-android-franco.md).                                                         |

## Respuestas sintéticas de demostración

Los ejemplos con datos salen de `loadEstimates('demo', lakeId)`, con el punto
`P-DEMO-01`, valor `4.2 mg/m³` y estado experimental. El ejemplo vacío usa
`{ "items": [] }`. `loadJob('demo', jobId)` valida ejemplos de la misma forma
que los adaptadores remotos, incluidos los estados `running`, `completed` y
`failed`. Los identificadores de esos ejemplos están en `demoJobIds`.

## Evidencia de aceptación pendiente

- Android físico: registrar el ID del APK, el dispositivo y una captura con el
  borrador recuperado tras reiniciar en modo avión. Repetir con dos cuentas y
  comprobar el acceso a sus fotos y borradores.
- Consulta real: confirmar las rutas y permisos con el equipo API. En un
  entorno autorizado, guardar la evidencia en línea, activar modo avión,
  verificar la fecha del resultado guardado y comprobar la recarga al volver
  la conexión.
- La sincronización remota de observaciones sigue pendiente. Los borradores
  permanecen locales y se identifican como pendientes.
- Horas efectivas y referencia del APK pendientes de registrar con el ensayo
  nativo.

## Verificación local

Con Node 24 y pnpm 11.5.0 pasaron formato, ESLint, TypeScript (app y E2E),
269 pruebas Jest, 29 pruebas de almacenamiento y 2 de configuración nativa.
La instalación de las herramientas OpenAPI y la revisión de dependencias Expo
pasaron. La exportación Android generó el bundle Hermes de 4,9 MB con 1664
módulos y 30 recursos. La exportación comprueba el empaquetado JavaScript.

El caché científico reutiliza el almacenamiento SQLite del catálogo en Android.
La cuenta y el lago delimitan cada consulta. La limpieza de caché de sesión
también elimina las estimaciones guardadas, mientras los borradores siguen
disponibles para su propietario. Los casos de error HTTP o esquema inválido
muestran un estado de error; la caída de transporte permite consultar el caché.

Los tres recorridos Playwright pasaron en Chromium con datos de prueba:
inicio de sesión y navegación, guardado y recuperación de borradores, y
demostración científica.
