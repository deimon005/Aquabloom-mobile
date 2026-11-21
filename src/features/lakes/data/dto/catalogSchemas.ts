import { z } from 'zod';
import { catalogId } from '../../../../domain/catalogId';
import type { components } from '../../../../types/api.generated';

export const lakeSchema = z.object({
  id: catalogId,
  name: z.string().min(1),
  region: z.string().min(1),
  status: z.string(),
  description: z.string().nullable().optional(),
}) satisfies z.ZodType<components['schemas']['Lake']>;
export const lakeListSchema = z.object({
  items: z.array(lakeSchema),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1),
  total: z.number().int().min(0),
}) satisfies z.ZodType<components['schemas']['LakeListResponse']>;
export const lakeDetailSchema = lakeSchema.extend({
  geom: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
}) satisfies z.ZodType<components['schemas']['LakeDetail']>;
export const stationSchema = z.object({
  id: catalogId,
  lake_id: catalogId,
  code: z.string(),
  name: z.string(),
  point: z.unknown(),
  description: z.string().nullable().optional(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
}) satisfies z.ZodType<components['schemas']['Station']>;
export const stationsSchema = z.array(stationSchema);
