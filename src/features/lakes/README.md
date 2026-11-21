# Lagos (AQU-33–40)

El contrato versionado genera `Lake` y `LakeListResponse`. `useLakes` normaliza
los filtros, los incorpora en la `queryKey` y propaga `AbortSignal` hasta el
cliente HTTP. La primera página usa 20 elementos y el contrato limita el máximo
a 100.

`useLakeDetail` y `useStations` consultan el detalle y las estaciones del lago.
Validan UUID, respuestas y pertenencia de estaciones. Las pantallas manejan
carga, errores, vacío y navegación mediante enlaces directos. La ficha de una
estación la busca dentro del listado del lago, según el contrato del backend.

Los tres hooks usan caché SQLite nativa para consultas sin conexión, muestran
la fecha de los datos guardados y vuelven a consultar al reconectar.

## Rutas de código después del refactor

| Antes, en la raíz del módulo                         | Ahora                                                    | Qué contiene                                                              |
| ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `types.ts`                                           | [domain/types.ts](domain/types.ts)                       | Modelos de lago y estación y tipos de filtros para la app                 |
| `catalogSchemas.ts`                                  | [data/dto/catalogSchemas.ts](data/dto/catalogSchemas.ts) | Validación Zod de respuestas HTTP y compatibilidad de tipos con OpenAPI   |
| Validación de identificadores en `catalogSchemas.ts` | [src/domain/catalogId.ts](../../domain/catalogId.ts)     | Regla compartida por catálogo, login, observaciones y ciencia             |
| `lakesApi.ts`, `catalogApi.ts`                       | [data](data)                                             | Transporte para lista, detalle y estaciones                               |
| Hooks, filtros y reintentos                          | [application](application)                               | Normalización, claves de consulta, cancelación y política de recuperación |
| Pantallas, tarjetas y mensajes                       | [presentation](presentation)                             | Entrada de filtros, navegación, estados y ficha                           |

La lista traduce `search` y `page_size` a `text` y `limit` al llegar a HTTP. Para el detalle, se compara el identificador solicitado con el devuelto. Para estaciones, cada fila debe pertenecer al lago pedido. La caché vuelve a pasar las respuestas recuperadas por el parser de la consulta.

Las [pruebas del catálogo](__tests__) cubren filtros, UUID, pertenencia, estados y reintento. [Playwright](../../../e2e/catalog-recovery.spec.ts) comprueba arranque con fallos transitorios y recuperación en la ficha con datos de prueba.
