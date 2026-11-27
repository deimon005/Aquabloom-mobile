# Visualización espacial del lago

Desde la ficha de un lago, **Ver mapa del lago** abre su geometría real. El mapa
admite una superficie de predicción azul–turquesa–verde–amarillo y mediciones
puntuales blancas con borde petróleo. Al seleccionar una celda o una medición se
muestran su valor, unidad y fecha; las celdas también conservan la versión del modelo.

La superficie se recorta visualmente al contorno y respeta las islas. Las zonas
sin celdas quedan grises. La leyenda usa el mínimo y máximo de la superficie;
un campo constante tiene un único color. Los colores no son una clasificación
de toxicidad o de seguridad del agua.

## Estado de la integración

El backend de esta entrega todavía no publica una superficie georreferenciada.
La consulta científica continúa deshabilitada por defecto. No se agregaron rutas
ficticias, ni se convirtió una lista de predicciones puntuales en una superficie.

El contrato móvil propuesto de estimaciones admite dos campos opcionales junto
a `items`, sin romper las respuestas actuales:

- `surface`: `lake_id`, `variable`, `unit`, `observed_at` (UTC), `model_version`,
  `scene_id` opcional y `cells`, una `FeatureCollection` GeoJSON de polígonos o
  multipolígonos con `properties.id` único y `properties.value` finito.
- `measurements`: lista de `id`, `lake_id`, `longitude`, `latitude`, `value`,
  `unit`, `variable`, `measured_at` (UTC) y `name` opcional.

Cada superficie representa una variable, unidad, fecha y versión del modelo.
La API debe recortar sus celdas al lago y omitir las celdas sin datos; el cliente
añade una máscara de costa. La validación rechaza geometrías inválidas, valores
no finitos, identificadores duplicados y datos de otros lagos. Las mediciones se
presentan por separado y no se mezclan con el resultado del modelo.

## Revisar el aspecto sin resultados científicos

**Ver ejemplo de visualización** genera únicamente un ejemplo en memoria sobre
el contorno del lago seleccionado. El aviso **EJEMPLO VISUAL · Datos sintéticos**
y la leyenda permanecen visibles. No consulta servicios científicos, no guarda
mediciones y no reemplaza un fallo remoto. **Cerrar ejemplo visual** restaura el
estado sin predicciones. Si llegan datos espaciales del servidor, tienen prioridad.

Los controles **Predicciones** y **Mediciones** permiten ocultar cada capa. Las
estaciones de monitoreo conservan su identidad y su ficha independiente.

Android utiliza MapLibre; la vista web de revisión usa el mismo GeoJSON y una
representación SVG con recorte por anillos, sin dependencias cartográficas nuevas.

## Contornos del catálogo provisional

Desde el 25 de noviembre de 2026, la API local entrega los contornos del Catastro
de Lagos DGA/MOP publicado en [IDE Chile](https://geoportal.cl/geoportal/catalog/35252/Catastro%20de%20Lagos),
recurso fechado 2020-09-01. Reemplaza los rectángulos iniciales en los cuatro lagos.
Se conservan costa e islas, en WGS84 longitud/latitud. La descripción atribuye la
fuente; el mapa y la máscara de predicciones usan exactamente esa geometría.
No modifica las coordenadas originales de estaciones ni añade mediciones.
