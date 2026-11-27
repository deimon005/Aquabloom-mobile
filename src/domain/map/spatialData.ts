import { z } from 'zod';
import type { Feature, MultiPolygon, Position } from 'geojson';
import { catalogId } from '../lakes/catalogSchemas';
import {
  lakeBounds,
  polygonGeometrySchema,
  type LakeFeature,
} from './geometry';

export const measurementSchema = z.object({
  id: z.string().min(1),
  lake_id: catalogId,
  name: z.string().optional(),
  longitude: z.number().finite().min(-180).max(180),
  latitude: z.number().finite().min(-90).max(90),
  value: z.number().finite(),
  unit: z.string().min(1),
  variable: z.string().min(1),
  measured_at: z.iso.datetime(),
});
export const predictionSurfaceSchema = z.object({
  lake_id: catalogId,
  variable: z.string().min(1),
  unit: z.string().min(1),
  observed_at: z.iso.datetime(),
  model_version: z.string().min(1),
  scene_id: z.string().optional(),
  cells: z.object({
    type: z.literal('FeatureCollection'),
    features: z
      .array(
        z.object({
          type: z.literal('Feature'),
          geometry: polygonGeometrySchema,
          properties: z.object({
            id: z.string().min(1),
            value: z.number().finite(),
          }),
        }),
      )
      .max(50000)
      .refine(
        (cells) =>
          new Set(cells.map((cell) => cell.properties.id)).size ===
          cells.length,
        'Identificadores de celdas duplicados.',
      ),
  }),
});
export type Measurement = z.infer<typeof measurementSchema>;
export type PredictionSurface = z.infer<typeof predictionSurfaceSchema>;
export const surfaceColors = [
  '#286AC1',
  '#30B4C0',
  '#73C772',
  '#D9CD48',
  '#E8AB38',
] as const;

export function surfaceRange(
  surface: PredictionSurface | null | undefined,
): [number, number] | null {
  if (!surface?.cells.features.length) return null;
  let min = Infinity,
    max = -Infinity;
  for (const cell of surface.cells.features) {
    min = Math.min(min, cell.properties.value);
    max = Math.max(max, cell.properties.value);
  }
  return [min, max];
}
export function surfaceColor(value: number, min: number, max: number) {
  const ratio =
    max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const position = ratio * (surfaceColors.length - 1),
    index = Math.min(3, Math.floor(position)),
    fraction = position - index;
  const a = surfaceColors[index],
    b = surfaceColors[index + 1];
  const channels = [1, 3, 5].map((offset) =>
    Math.round(
      parseInt(a.slice(offset, offset + 2), 16) * (1 - fraction) +
        parseInt(b.slice(offset, offset + 2), 16) * fraction,
    ),
  );
  return `rgb(${channels.join(',')})`;
}
export function surfaceFill(
  surface: PredictionSurface,
):
  | string
  | [
      'interpolate',
      ['linear'],
      ['get', string],
      number,
      string,
      number,
      string,
      number,
      string,
      number,
      string,
      number,
      string,
    ] {
  const range = surfaceRange(surface);
  if (!range || range[0] === range[1]) return surfaceColors[2];
  const [min, max] = range,
    span = max - min;
  return [
    'interpolate',
    ['linear'],
    ['get', 'value'],
    min,
    surfaceColors[0],
    min + span * 0.25,
    surfaceColors[1],
    min + span * 0.5,
    surfaceColors[2],
    min + span * 0.75,
    surfaceColors[3],
    max,
    surfaceColors[4],
  ];
}

// An inverse polygon masks both shore-exterior cells and islands without altering model values.
export function lakeExteriorMask(
  lake: LakeFeature,
  surface?: PredictionSurface,
): Feature<MultiPolygon> {
  const polygons =
    lake.geometry.type === 'Polygon'
      ? [lake.geometry.coordinates]
      : lake.geometry.coordinates;
  let [west, south, east, north] = lakeBounds(lake);
  for (const cell of surface?.cells.features ?? []) {
    const rings =
      cell.geometry.type === 'Polygon'
        ? cell.geometry.coordinates
        : cell.geometry.coordinates.flat();
    for (const ring of rings)
      for (const [longitude, latitude] of ring) {
        west = Math.min(west, longitude);
        east = Math.max(east, longitude);
        south = Math.min(south, latitude);
        north = Math.max(north, latitude);
      }
  }
  // Keep the mask local: a world-spanning ring crosses MapLibre's longitude seam.
  const padding = Math.max(east - west, north - south, 0.01);
  west = Math.max(-180, west - padding);
  east = Math.min(180, east + padding);
  south = Math.max(-85.0511, south - padding);
  north = Math.min(85.0511, north + padding);
  const extent = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
  const winding = (ring: Position[], counterClockwise: boolean) => {
    const area = ring.reduce((sum, point, index) => {
      const next = ring[(index + 1) % ring.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0);
    return area > 0 === counterClockwise ? [...ring] : [...ring].reverse();
  };
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [extent, ...polygons.map((polygon) => winding(polygon[0], false))],
        ...polygons.flatMap((polygon) =>
          polygon.slice(1).map((hole) => [winding(hole, true)]),
        ),
      ],
    },
  };
}
function inRing(point: Position, ring: Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = point,
      [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
export function insideLake(point: Position, lake: LakeFeature) {
  const polygons =
    lake.geometry.type === 'Polygon'
      ? [lake.geometry.coordinates]
      : lake.geometry.coordinates;
  return polygons.some(
    (polygon) =>
      inRing(point, polygon[0]) &&
      !polygon.slice(1).some((hole) => inRing(point, hole)),
  );
}

// Explicitly requested visual example; never merged into remote results or written to storage.
export function lakeVisualizationExample(lake: LakeFeature): {
  surface: PredictionSurface;
  measurements: Measurement[];
} {
  const [west, south, east, north] = lakeBounds(lake);
  const features: PredictionSurface['cells']['features'] = [],
    measurements: Measurement[] = [];
  const columns = 40,
    rows = 24,
    dx = (east - west) / columns,
    dy = (north - south) / rows;
  for (let x = 0; x < columns; x++)
    for (let y = 0; y < rows; y++) {
      const left = west + dx * x,
        bottom = south + dy * y;
      const value =
        2 +
        (14 * x) / columns +
        3 *
          Math.exp(-((x / columns - 0.8) ** 2 + (y / rows - 0.3) ** 2) / 0.02);
      features.push({
        type: 'Feature',
        properties: { id: `example-${x}-${y}`, value },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [left, bottom],
              [left + dx, bottom],
              [left + dx, bottom + dy],
              [left, bottom + dy],
              [left, bottom],
            ],
          ],
        },
      });
      if (
        measurements.length < 4 &&
        x % 9 === 4 &&
        y % 7 === 3 &&
        !measurements.some((point) =>
          point.id.startsWith(`example-measurement-${x}-`),
        ) &&
        insideLake([left + dx / 2, bottom + dy / 2], lake)
      )
        measurements.push({
          id: `example-measurement-${x}-${y}`,
          lake_id: lake.properties.id,
          name: `Punto de ejemplo ${measurements.length + 1}`,
          longitude: left + dx / 2,
          latitude: bottom + dy / 2,
          value: Math.round(value * 10) / 10,
          unit: 'µg/L',
          variable: 'chlorophyll-a',
          measured_at: '2026-01-01T12:00:00Z',
        });
    }
  return {
    surface: {
      lake_id: lake.properties.id,
      variable: 'chlorophyll-a',
      unit: 'µg/L',
      observed_at: '2026-01-01T12:00:00Z',
      model_version: 'ejemplo-visual-sintético',
      cells: { type: 'FeatureCollection', features },
    },
    measurements,
  };
}
