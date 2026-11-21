import { z } from 'zod';

export const catalogId = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export function isCatalogId(value: string | undefined): value is string {
  return catalogId.safeParse(value).success;
}
