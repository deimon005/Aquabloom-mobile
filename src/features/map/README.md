# Mapa móvil

[MapScreen](presentation/MapScreen.tsx) compone consultas de lago, estaciones y estimaciones y entrega las capas a [LakeMap](presentation/LakeMap.tsx). El componente nativo renderiza MapLibre. Metro selecciona [LakeMap.web](presentation/LakeMap.web.tsx) para el navegador.

La reorganización movió `geometry.ts` y `mapTypes.ts` a [domain](domain). Allí se validan polígonos y puntos y se preparan las colecciones GeoJSON. Las capas comprueban el lago y las coordenadas válidas. Una estimación sin coordenadas sigue disponible en la lista científica.

`MapScreen`, las dos variantes de `LakeMap`, `MapInfoSheet` y `EstimateInfoSheet` pasaron a [presentation](presentation). El contrato de selección sigue identificando el elemento y su tipo, lago, estación o estimación.

Las [pruebas del módulo](__tests__) verifican geometrías válidas e inválidas, selección y estados de la pantalla. El [registro anterior de MapLibre](../../../docs/demian-map.md) describe el alcance del mapa nativo.
