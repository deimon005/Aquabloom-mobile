import { api } from '../../../lib/api';
import {
  normalizeLakeFilters,
  serializeLakeFilters,
} from '../application/lakeFilters';
import type { LakeFilters, LakeListResponse } from '../domain/types';

export type LakesRequester = (
  path: string,
  init?: RequestInit,
) => Promise<LakeListResponse>;

const configuredApi = api as LakesRequester | null;

export async function fetchLakes(
  filters: LakeFilters = {},
  signal?: AbortSignal,
  request: LakesRequester | null = configuredApi,
) {
  if (!request) {
    throw new Error(
      'Configura EXPO_PUBLIC_API_URL para consultar el catálogo de lagos.',
    );
  }
  const query = serializeLakeFilters(normalizeLakeFilters(filters));
  return request(`/lakes?${query}`, { signal });
}
