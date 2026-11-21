# Offline (AQU-49–52)

SQLite persiste respuestas validadas del catálogo público en Android/iOS.
El esquema v1 se crea con migración transaccional y consultas parametrizadas.
Las claves incluyen API, identidad y consulta normalizada; TTL de 24 horas,
máximo 200 respuestas y 2 millones de caracteres por respuesta.

Solo se recuperan datos sin conexión o ante un fallo de transporte. Nunca se
ocultan errores HTTP, respuestas inválidas o cancelaciones. Un 401/403/404
elimina la copia de esa consulta. Las pantallas indican el origen guardado y
la fecha; al reconectar vuelven a consultar la API.

La generación de caché cancela resultados tardíos al limpiar. Los cambios de
identidad y el cierre de sesión borran lo persistido. Si la limpieza falla,
se deshabilita la lectura/escritura para evitar reutilizar datos anteriores.
No se guardan tokens ni perfiles. Los endpoints actuales son públicos y no
tienen contexto de organización; este módulo no es caché de datos privados.

Web funciona sin persistencia. `pnpm run test:offline` verifica el motor SQLite
real en Node; Jest verifica la integración de pantallas y autenticación.
Consultar [alcance y validación](../../../docs/offline-delivery.md).

## Rutas de código después del refactor

- [data/cache.ts](data/cache.ts) contiene la política de caché y la persistencia. [data/catalogCache.ts](data/catalogCache.ts) decide el ámbito del catálogo y conecta la consulta. [database.ts](data/database.ts) abre `aquabloom-catalog-v1.db` para la caché que administra la tabla `catalog_cache`, y [database.web.ts](data/database.web.ts) ofrece la variante sin persistencia.
- [presentation/OfflineNotice.tsx](presentation/OfflineNotice.tsx) muestra el origen guardado y la fecha.
- [ConnectivityProvider](../../providers/ConnectivityProvider.tsx) escucha [NetInfo](../connectivity/data/subscribeConnectivity.ts) en móvil y [eventos online y offline](../connectivity/data/subscribeConnectivity.web.ts) en web. Publica el estado a React Query y al [aviso global](../connectivity/presentation/ConnectivityBanner.tsx).

La caché guarda respuestas de consultas. Los [borradores de observaciones](../observations/README.md) guardan capturas del usuario en una base separada, con otra migración y sus propias operaciones. La reconexión vuelve a consultar el catálogo. El estado de un borrador sigue indicando guardado local y pendiente de envío.

[La suite de SQLite](../../../scripts/offline.test.mjs) comprueba TTL, aislamiento, limpieza, migraciones y respuestas tardías. Las [pruebas de conectividad](../connectivity/__tests__) verifican la proyección del estado y el aviso.
