import { useConnectivity } from '../connectivity/ConnectivityProvider';
import { useQuery } from '@tanstack/react-query';
import { useAppServices } from '../shared/services/AppServicesProvider';
import { useCurrentUser } from '../auth/useCurrentUser';
import { isCatalogId } from '../../domain/lakes/catalogSchemas';
import type { ScientificSource } from '../../domain/scientific/source';

export function useEstimates(lakeId: string, source: ScientificSource) {
  const { config, scientificQueries } = useAppServices();
  const { user } = useCurrentUser();
  const connectivity = useConnectivity();
  const query = useQuery({
    queryKey: [
      'scientific',
      config.apiUrl,
      user?.id,
      source,
      'estimates',
      lakeId.toLowerCase(),
    ],
    enabled: Boolean(user) && isCatalogId(lakeId) && source !== 'disabled',
    networkMode: 'always',
    refetchOnReconnect: 'always',
    queryFn: ({ signal }) =>
      scientificQueries.estimates(source, lakeId, user?.id ?? null, signal),
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
  const { config, scientificQueries } = useAppServices();
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: [
      'scientific',
      config.apiUrl,
      user?.id,
      source,
      'job',
      jobId.toLowerCase(),
    ],
    enabled: Boolean(user) && isCatalogId(jobId) && source !== 'disabled',
    queryFn: ({ signal }) =>
      scientificQueries.job(source, jobId, user?.id ?? null, signal),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: ({ state }) => {
      if (
        source !== 'proposal' ||
        state.status === 'error' ||
        state.dataUpdateCount >= 30
      )
        return false;
      return state.data?.status === 'queued' || state.data?.status === 'running'
        ? 5_000
        : false;
    },
  });
}
