# Seguridad y arquitectura de la aplicación móvil

## Alcance de esta entrega

La aplicación organiza reglas y contratos en `src/domain`, casos de uso en
`src/application`, adaptadores en `src/infrastructure` e interfaz en
`src/presentation`. `src/composition` crea e inyecta las implementaciones mediante
`AppServicesProvider`. Las verificaciones de arquitectura rechazan dependencias
desde las capas internas hacia React, Expo, SQLite o Supabase, y desde la
presentación hacia infraestructura o composición.

La rama publica código y documentación. No instala un APK, publica un backend ni
acredita controles de un servicio de producción. La validación de un APK candidato
y su actualización conserva sus propios criterios de aceptación.

## Controles aplicados

- La configuración pública se valida antes de crear clientes. Una combinación
  inválida deja el servicio sin configurar. `EXPO_PUBLIC_*` no admite secretos.
- Supabase conserva su almacenamiento nativo mediante SecureStore. El proveedor
  local provisional exige desarrollo, una URL válida y un ámbito independiente;
  no se habilita en producción. Sus límites están en
  [Cuentas locales provisionales](../local-provisional-auth.md).
- En web, las credenciales de sesión permanecen en memoria. No se guardan
  contraseñas, tokens ni perfiles en la caché SQLite del catálogo.
- El servidor debe autenticar y autorizar cada operación privada. La protección
  de rutas del cliente y los roles visibles no sustituyen esa autorización.
- Las consultas HTTP usan rutas relativas, cancelación y un plazo de respuesta.
  Las respuestas del catálogo y científicas se validan antes de utilizarlas.
- La caché distingue API, cuenta y consulta. Los errores de autorización no se
  ocultan mediante datos guardados. Cerrar sesión invalida resultados tardíos y
  limpia la caché compartida.
- Los borradores usan una base separada y consultas parametrizadas, con alcance
  por API, cuenta, lago y UUID. Las fotografías se guardan en directorios
  administrados por observación; la eliminación se limita al ámbito solicitado.
- Las demostraciones científicas y espaciales se identifican como sintéticas.
  No son mediciones ambientales ni reemplazan silenciosamente un fallo remoto.
- Los archivos de entorno privados, bases locales, dependencias instaladas,
  carpetas nativas generadas y APK/AAB no forman parte de esta publicación.
  El README externo solicitado por el propietario permanece fuera del repositorio.

## Evidencia y recuperación

`pnpm run check` reúne formato, lint, tipos, Jest, pruebas con SQLite real,
configuración de permisos y límites de capas. `pnpm run test:e2e` recorre la
interfaz con servicios simulados. La exportación Android verifica el bundle;
no sustituye la ejecución de cámara, GPS, persistencia o actualización en Android.

Los cambios se entregan en una rama propia con commits separados. La rama conserva
la base de trabajo local y no modifica `main`. Para integrar con una base que haya
avanzado, revisar las diferencias y resolver la migración de carpetas antes de
fusionar. Para revertir una integración, usar los commits de Git y preservar las
bases y fotografías del dispositivo; no borrar datos de usuario como mecanismo
de actualización.

## Pendientes y límites

- Confirmar la integración con las rutas científicas reales antes de activar su
  bandera. El contrato espacial documentado sigue siendo una propuesta.
- Repetir las verificaciones físicas y de actualización sobre el APK candidato,
  registrando versión, dispositivo y resultados sin datos personales ni tokens.
- Definir retención y borrado de borradores/fotografías conforme al uso de terreno;
  esta entrega no incorpora una eliminación automática de pendientes.
- Revisar los parches de Expo y el árbol efectivo antes de distribuir un APK.
  Actualizar el código de la app no demuestra que los controles del backend,
  hosting, copias de seguridad o MFA estén configurados.
