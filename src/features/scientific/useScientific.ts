import { useConnectivity } from '../../providers/ConnectivityProvider';
import { ApiError, NetworkError } from '../../lib/http';
import { loadCachedCatalog } from '../offline/cache';
import { catalogCache } from '../offline/catalogCache';
import { parseLakeEstimates } from './estimatesApi';
import { onlineManager, useQuery } from '@tanstack/react-query';
import { env } from '../../config/env';
import { useCurrentUser } from '../auth/useCurrentUser';
import { isCatalogId } from '../lakes/catalogSchemas';
import {
  loadEstimates,
  loadJob,
  type ScientificSource,
} from './scientificSource';

export function useEstimates(lakeId: string, source: ScientificSource) {
  const { user } = useCurrentUser();
  const connectivity = useConnectivity();
  const query = useQuery({
    queryKey: [
      'scientific',
      env.apiUrl,
      user?.id,
      source,
      'estimates',
      lakeId.toLowerCase(),
    ],
    enabled: Boolean(user) && isCatalogId(lakeId) && source !== 'disabled',
    networkMode: 'always',
    refetchOnReconnect: 'always',
    queryFn: async ({ signal }) => {
      const load = () => loadEstimates(source, lakeId, signal);
      if (!user) throw new ApiError(401, 'Sesión requerida.');
      if (source !== 'proposal') {
        return {
          data: await load(),
          source: 'demo' as const,
          savedAt: undefined,
        };
      }
      const id = lakeId.toLowerCase();
      return loadCachedCatalog({
        cache: catalogCache,
        scope: JSON.stringify([env.apiUrl, 'scientific-estimates-v1', user.id]),
        key: id,
        load,
        parse: (value) => parseLakeEstimates(id, value),
        offline: !onlineManager.isOnline(),
        isNetworkError: (error) => error instanceof NetworkError,
        invalidateOnError: (error) =>
          error instanceof ApiError && [401, 403, 404].includes(error.status),
        signal,
      });
    },
    retry: false,
  });
  return {
    ...query,
    data: query.data?.data,
    savedAt:
      query.data?.source === 'cache' ||
      (query.data?.source === 'network' && connectivity === 'offline')
        ? query.data.savedAt
        : undefined,
  };
}
export function useScientificJob(jobId: string, source: ScientificSource) {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: [
      'scientific',
      env.apiUrl,
      user?.id,
      source,
      'job',
      jobId.toLowerCase(),
    ],
    enabled: Boolean(user) && isCatalogId(jobId) && source !== 'disabled',
    queryFn: ({ signal }) => loadJob(source, jobId, signal),
    retry: false,
    // Manual refresh: no guessed progress and no training/job creation request.
    staleTime: 0,
  });
}
