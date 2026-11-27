import { ApiError, NetworkError } from '../../domain/shared/errors';
import { loadCachedCatalog } from '../offline/loadCachedCatalog';
import type { CatalogCache } from '../../domain/offline/cache';
import {
  parseLakeEstimates,
  type EstimateListResponse,
} from '../../domain/scientific/estimates';
import type { ScientificJob } from '../../domain/scientific/jobs';
import type { ScientificSource } from '../../domain/scientific/source';
export type ScientificGateway = {
  loadEstimates: (
    source: ScientificSource,
    id: string,
    signal?: AbortSignal,
  ) => Promise<EstimateListResponse>;
  loadJob: (
    source: ScientificSource,
    id: string,
    signal?: AbortSignal,
  ) => Promise<ScientificJob>;
};
export function createScientificQueries(
  gateway: ScientificGateway,
  cache: CatalogCache,
  apiUrl: string | undefined,
  isOnline: () => boolean,
) {
  return {
    async estimates(
      source: ScientificSource,
      lakeId: string,
      userId: string | null,
      signal?: AbortSignal,
    ) {
      if (!userId) throw new ApiError(401, 'Sesión requerida.');
      const load = () => gateway.loadEstimates(source, lakeId, signal);
      if (source !== 'proposal')
        return {
          data: await load(),
          source: 'demo' as const,
          savedAt: undefined,
        };
      const id = lakeId.toLowerCase();
      return loadCachedCatalog({
        cache,
        scope: JSON.stringify([apiUrl, 'scientific-estimates-v1', userId]),
        key: id,
        load,
        parse: (value) => parseLakeEstimates(id, value),
        offline: !isOnline(),
        isNetworkError: (error) => error instanceof NetworkError,
        invalidateOnError: (error) =>
          error instanceof ApiError && [401, 403, 404].includes(error.status),
        signal,
      });
    },
    job(
      source: ScientificSource,
      id: string,
      userId: string | null,
      signal?: AbortSignal,
    ) {
      if (!userId)
        return Promise.reject(new ApiError(401, 'Sesión requerida.'));
      return gateway.loadJob(source, id, signal);
    },
  };
}
