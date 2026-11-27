# Lagos (AQU-33–40)

Los modelos `Lake` y `LakeListResponse` pertenecen a `src/domain/lakes/`. Los casos de
uso en `src/application/lakes/catalogQueries.ts` normalizan los filtros, construyen las
claves de caché y propagan `AbortSignal`. Los hooks de `src/presentation/lakes/` conectan
esos casos de uso con React Query. La primera página usa 20 elementos y el contrato limita el máximo
a 100.

`useLakeDetail` y `useStations` consultan el detalle y las estaciones del lago.
Validan UUID, respuestas y pertenencia de estaciones. Las pantallas manejan
carga, errores, vacío y navegación mediante enlaces directos. La ficha de una
estación la busca dentro del listado del lago, según el contrato del backend.

Los tres hooks usan caché SQLite nativa para consultas sin conexión, muestran
la fecha de los datos guardados y vuelven a consultar al reconectar.
