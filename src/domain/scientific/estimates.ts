import { z } from 'zod';
import { catalogId } from '../lakes/catalogSchemas';
import { measurementSchema, predictionSurfaceSchema } from '../map/spatialData';

const estimatePointSchema = z.object({
  id: catalogId,
  lake_id: catalogId,
  point_id: z.string().min(1),
  latitude: z.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.number().finite().min(-180).max(180).nullable().optional(),
  value: z.number().finite(),
  unit: z.string().min(1),
  variable: z.string().min(1),
  observed_at: z.iso.datetime(),
  status: z.string().min(1),
  scene_id: z.string().nullable().optional(),
  model_id: z.string().nullable().optional(),
  model_version: z.string().nullable().optional(),
  dataset_id: z.string().nullable().optional(),
  dataset_version: z.string().nullable().optional(),
  warnings: z.array(z.string()),
});

const estimateListSchema = z.object({
  items: z.array(estimatePointSchema),
  surface: predictionSurfaceSchema.optional(),
  measurements: z.array(measurementSchema).optional(),
});

export function parseLakeEstimates(
  lakeId: string,
  value: unknown,
): EstimateListResponse {
  const response = estimateListSchema.parse(value);
  const normalizedLakeId = lakeId.toLowerCase();
  if (
    (response.surface &&
      response.surface.lake_id.toLowerCase() !== normalizedLakeId) ||
    response.measurements?.some(
      (item) => item.lake_id.toLowerCase() !== normalizedLakeId,
    )
  )
    throw new Error('La respuesta espacial contiene datos de otro lago.');
  if (
    response.items.some(
      (item) => item.lake_id.toLowerCase() !== normalizedLakeId,
    )
  ) {
    throw new Error('La respuesta contiene estimaciones de otro lago.');
  }
  return response;
}

export type EstimatePoint = z.infer<typeof estimatePointSchema>;
export type EstimateListResponse = z.infer<typeof estimateListSchema>;
