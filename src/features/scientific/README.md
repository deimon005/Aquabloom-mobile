# Consulta científica móvil

| Pieza anterior                                  | Ubicación actual                                                                                              | Responsabilidad                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `estimatesApi.ts` con HTTP, esquema y tipos     | [estimatesApi](data/estimatesApi.ts), [estimateDto](data/dto/estimateDto.ts) y [estimate](domain/estimate.ts) | GET, validación de respuesta y modelo de estimación             |
| `jobsApi.ts` con HTTP, esquema, tipos y estados | [jobsApi](data/jobsApi.ts), [jobDto](data/dto/jobDto.ts) y [job](domain/job.ts)                               | GET, validación de identidad y progreso y estados del trabajo   |
| `scientificSource.ts`, `useScientific.ts`       | [application](application)                                                                                    | Selección de fuente, consultas, caché y seguimiento de trabajos |
| Lista, ficha, trabajo y avisos                  | [presentation](presentation)                                                                                  | Unidades, procedencia, resultados vacíos y limitaciones         |

Las pantallas y el mapa usan los modelos del módulo. Los DTOs validan los datos externos y comprueban su compatibilidad con los tipos generados de la [propuesta científica](../../../contracts/scientific.proposal.openapi.json). Los parsers verifican el lago del resultado y el identificador del trabajo.

La aplicación mantiene separadas la consulta deshabilitada, el ejemplo sintético explícito y la propuesta remota. El ejemplo se resuelve localmente. En modo remoto, la caché de estimaciones se separa por API, cuenta y lago y vuelve a validar la respuesta antes de mostrarla. La [propuesta de contrato](../../../docs/scientific-mobile-contract.md) describe los acuerdos pendientes con Web/API.

Las [pruebas del módulo](__tests__) cubren esquemas, estados de trabajo, procedencia, permisos de consulta y estimaciones guardadas. [Playwright](../../../e2e/scientific.spec.ts) abre lista, ficha y trabajo de ejemplo sin consultar rutas científicas externas.
