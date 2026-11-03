import { z } from 'zod';
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson';
import type { LakeDetail, Station } from '../lakes/types';
import type { EstimatePoint } from '../scientific/estimatesApi';

const position = z
  .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
  .rest(z.number());
const ring = z
  .array(position)
  .min(4)
  .refine((points) => {
    const first = points[0];
    const last = points[points.length - 1];
    return (
      first.length === last.length &&
      first.every((value, index) => value === last[index])
    );
  }, 'El anillo debe estar cerrado');
const polygon = z.array(ring).min(1);
const geometry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: polygon }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(polygon).min(1),
  }),
]);
export type LakeFeature = Feature<
  Polygon | MultiPolygon,
  { id: string; name: string }
>;

const point = z.object({ type: z.literal('Point'), coordinates: position });
export type StationFeatures = FeatureCollection<
  Point,
  { id: string; name: string }
>;
export type EstimateFeatures = FeatureCollection<
  Point,
  { id: string; pointId: string }
>;

export function estimateFeatures(
  estimates: EstimatePoint[],
  lakeId: string,
): EstimateFeatures {
  const features: EstimateFeatures['features'] = [];
  for (const estimate of estimates) {
    if (estimate.lake_id.toLowerCase() !== lakeId.toLowerCase()) continue;
    if (
      typeof estimate.longitude !== 'number' ||
      typeof estimate.latitude !== 'number'
    )
      continue;
    const parsed = point.safeParse({
      type: 'Point',
      coordinates: [estimate.longitude, estimate.latitude],
    });
    if (!parsed.success) continue;
    features.push({
      type: 'Feature',
      id: estimate.id,
      properties: { id: estimate.id, pointId: estimate.point_id },
      geometry: parsed.data,
    });
  }
  return { type: 'FeatureCollection', features };
}
export function stationFeatures(
  stations: Station[],
  lakeId: string,
): StationFeatures {
  const features: StationFeatures['features'] = [];
  for (const station of stations) {
    if (station.lake_id.toLowerCase() !== lakeId.toLowerCase()) continue;
    const parsed = point.safeParse(station.point);
    if (parsed.success)
      features.push({
        type: 'Feature',
        id: station.id,
        properties: { id: station.id, name: station.name },
        geometry: parsed.data,
      });
  }
  return { type: 'FeatureCollection', features };
}

export function lakeFeature(lake: LakeDetail): LakeFeature | null {
  const parsed = geometry.safeParse(lake.geom);
  if (!parsed.success) return null;
  return {
    type: 'Feature',
    id: lake.id,
    properties: { id: lake.id, name: lake.name },
    geometry: parsed.data,
  };
}

export function lakeBounds(
  feature: LakeFeature,
): [number, number, number, number] {
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  let west = Infinity,
    south = Infinity,
    east = -Infinity,
    north = -Infinity;
  for (const rings of polygons)
    for (const points of rings)
      for (const [lng, lat] of points) {
        west = Math.min(west, lng);
        east = Math.max(east, lng);
        south = Math.min(south, lat);
        north = Math.max(north, lat);
      }
  return [west, south, east, north];
}
