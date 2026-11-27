import { z } from 'zod';
export const catalogId = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
export const lakeSchema = z.object({
  id: catalogId,
  name: z.string().min(1),
  region: z.string().min(1),
  status: z.string(),
  description: z.string().nullable().optional(),
});
export const lakeListSchema = z.object({
  items: z.array(lakeSchema),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1),
  total: z.number().int().min(0),
});
export const lakeDetailSchema = lakeSchema.extend({
  geom: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
});
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
});
export const stationsSchema = z.array(stationSchema);
export function isCatalogId(value: string | undefined): value is string {
  return catalogId.safeParse(value).success;
}
