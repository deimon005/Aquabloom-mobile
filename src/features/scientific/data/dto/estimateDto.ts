import { z } from 'zod';
import { catalogId } from '../../../../domain/catalogId';
import type { components } from '../../../../types/scientific.proposal.generated';
import type { EstimateListResponse } from '../../domain/estimate';

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
}) satisfies z.ZodType<components['schemas']['EstimatePoint']>;

const estimateListSchema = z.object({
  items: z.array(estimatePointSchema),
});

export function parseLakeEstimates(
  lakeId: string,
  value: unknown,
): EstimateListResponse {
  const response = estimateListSchema.parse(value);
  if (response.items.some((item) => item.lake_id.toLowerCase() !== lakeId)) {
    throw new Error('La respuesta contiene estimaciones de otro lago.');
  }
  return response;
}
