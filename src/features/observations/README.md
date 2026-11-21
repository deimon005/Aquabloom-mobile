# Observaciones de terreno

Expo Router mantiene la entrada en [lakes/[id]/observations](../../app/lakes/%5Bid%5D/observations.tsx). [ObservationScreen](presentation/ObservationScreen.tsx) resuelve cuenta y lago, abre el borrador y conecta el formulario con almacenamiento y fotos. [ObservationForm](presentation/ObservationForm.tsx) mantiene los valores en edición, los avisos de permisos y el foco de validación.

| Antes, en la raíz del módulo                                                                  | Ubicación actual                                                             | Responsabilidad                                                       |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `ObservationScreen`, `ObservationForm`, `DraftStatus`, `PhotoPreview`                         | [presentation](presentation)                                                 | Edición, estado visible, acciones y foco                              |
| `observationSchema`, `captureCompleteness`                                                    | [domain](domain)                                                             | Fecha local y UTC, campos válidos y condiciones para finalizar        |
| `saveObservation`, `deleteObservation`, `cameraCapture`, `captureTypes`                       | [application](application)                                                   | Secuencia de operaciones y contrato de captura                        |
| Tipo `ObservationStore` dentro de `draftStore`                                                | [observationStorePort](application/observationStorePort.ts)                  | Contrato de listar, recuperar, guardar y eliminar borradores          |
| `photoStorage` con interfaz y rutas                                                           | [photoStorage](application/photoStorage.ts) y [photoPath](data/photoPath.ts) | Contrato de fotos y codificación de rutas en archivos separados       |
| `draftStore`, `observationStore`, `photoPersistence`, `nativePhotoStorage`, `captureServices` | [data](data)                                                                 | SQLite, archivos y permisos de dispositivo, con variantes web al lado |

Para guardar, el caso de uso comprueba que la sesión de captura siga activa, prepara la foto bajo el ámbito `apiScope` + `ownerId` + ID del borrador y persiste el registro. Si falla la escritura, intenta eliminar únicamente la copia creada durante esa operación. Para eliminar, borra primero la carpeta administrada del borrador y luego su fila.

En Android e iOS se conservan el archivo `aquabloom-observation-form-v1.db`, la tabla `observation_form_drafts` y su migración a la versión 2. En web se usa el adaptador en memoria hasta que termina la sesión de la app.

`pnpm run test:offline` verifica reapertura y migración de SQLite con datos de prueba. Las [pruebas del módulo](__tests__) cubren errores de guardado, reemplazo de foto, eliminación y UI. Las pruebas de permisos del sistema y TalkBack se registran en la [matriz de cierre](../../../docs/sprint3-franco-matriz.md).
