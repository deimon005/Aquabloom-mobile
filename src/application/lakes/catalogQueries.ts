import type { CachedCatalogReader } from '../../domain/offline/cache';
import { normalizeLakeFilters } from '../../domain/lakes/lakeFilters';
import {
  lakeDetailSchema,
  lakeListSchema,
} from '../../domain/lakes/catalogSchemas';
import { parseStationsForLake } from '../../domain/lakes/stations';
import type {
  LakeFilters,
  LakeListResponse,
  LakeDetail,
  Station,
} from '../../domain/lakes/types';
export type LakesLoader = (
  filters?: LakeFilters,
  signal?: AbortSignal,
) => Promise<LakeListResponse>;
export type DetailLoader = (
  id: string,
  signal?: AbortSignal,
) => Promise<LakeDetail>;
export type StationsLoader = (
  id: string,
  signal?: AbortSignal,
) => Promise<Station[]>;
export type CatalogGateway = {
  list: LakesLoader;
  detail: DetailLoader;
  stations: StationsLoader;
};
export const lakeKeys = {
  all: ['lakes'] as const,
  list: (filters: LakeFilters = {}) =>
    ['lakes', 'list', normalizeLakeFilters(filters)] as const,
};
export const lakeDetailKey = (id: string) =>
  ['lakes', 'detail', id.toLowerCase()] as const;
export const stationsKey = (id: string) =>
  ['lakes', 'stations', id.toLowerCase()] as const;
export function createCatalogQueries(
  gateway: CatalogGateway,
  cached: CachedCatalogReader,
) {
  return {
    list(filters: LakeFilters = {}, signal?: AbortSignal, load = gateway.list) {
      const normalized = normalizeLakeFilters(filters);
      return cached(
        lakeKeys.list(normalized),
        () => load(normalized, signal),
        (value) => lakeListSchema.parse(value),
        signal,
      );
    },
    detail(id: string, signal?: AbortSignal, load = gateway.detail) {
      return cached(
        lakeDetailKey(id),
        () => load(id, signal),
        (value) => lakeDetailSchema.parse(value),
        signal,
      );
    },
    stations(id: string, signal?: AbortSignal, load = gateway.stations) {
      return cached(
        stationsKey(id),
        () => load(id, signal),
        (value) => parseStationsForLake(id, value),
        signal,
      );
    },
  };
}
