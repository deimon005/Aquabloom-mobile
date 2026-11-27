# Contrato API

`openapi.json` versiona el contrato consumido por el cliente móvil para el
catálogo de lagos. Los tipos se regeneran con:
El detalle y las estaciones se contrastaron con el backend en el commit
`160cf95e95ed916e9cc9ce19244f56f268d0154d` de AquaBloomSur2do/aquabloom-sur.
Este archivo es un subconjunto móvil mantenido manualmente; las rutas son
relativas al prefijo `/api/v1`. Ver `docs/catalog-delivery.md`.

```sh
pnpm run api:setup
pnpm run api:generate -- ./contracts/openapi.json
```

El archivo no contiene tokens ni datos privados. Cualquier cambio incompatible
del backend debe actualizar primero el contrato, regenerar
`src/infrastructure/shared/contracts/api.generated.ts` y ejecutar las pruebas del cliente.

`scientific.proposal.openapi.json` es una **propuesta local**, separada del
catálogo existente. Sus rutas y nombres de campos aún requieren confirmación
de Web/API en AQU-158/159. Permite preparar tipos y adaptadores sin atribuir
al servidor una API científica que todavía no publica. Regenerar sus tipos con:

```sh
pnpm run api:generate -- ./contracts/scientific.proposal.openapi.json ./src/infrastructure/shared/contracts/scientific.proposal.generated.ts
```

Al recibir el OpenAPI oficial, reemplazar esta propuesta y ajustar los
adaptadores antes de conectarlos a las pantallas o a staging.
