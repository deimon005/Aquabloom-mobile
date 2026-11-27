import {
  normalizeLakeFilters,
  serializeLakeFilters,
} from '../../domain/lakes/lakeFilters';
import { lakeListSchema } from '../../domain/lakes/catalogSchemas';
import type { LakeFilters } from '../../domain/lakes/types';

export type LakesRequester = (
  path: string,
  init?: RequestInit,
) => Promise<unknown>;

export async function fetchLakes(
  filters: LakeFilters = {},
  signal?: AbortSignal,
  request: LakesRequester | null = null,
) {
  if (!request) {
    throw new Error(
      'Configura EXPO_PUBLIC_API_URL para consultar el catálogo de lagos.',
    );
  }
  const query = serializeLakeFilters(normalizeLakeFilters(filters));
  return lakeListSchema.parse(await request(`/lakes?${query}`, { signal }));
}
