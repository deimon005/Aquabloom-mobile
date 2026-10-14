import { useQuery, type QueryFunctionContext } from '@tanstack/react-query';
import { isCatalogId } from '../lakes/catalogSchemas';
import { fetchScientificJob, type ScientificJob } from './jobsApi';

const POLL_INTERVAL_MS = 5_000;
const MAX_UPDATES = 30;
const activeStatuses = new Set<ScientificJob['status']>(['queued', 'running']);

export const scientificJobKey = (id: string) =>
  ['scientific', 'job', id.toLowerCase()] as const;

export function scientificJobQueryOptions(
  id: string,
  loader: typeof fetchScientificJob = fetchScientificJob,
) {
  return {
    queryKey: scientificJobKey(id),
    enabled: isCatalogId(id),
    queryFn: ({ signal }: QueryFunctionContext) => loader(id, signal),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: (query: {
      state: {
        data?: ScientificJob;
        dataUpdateCount: number;
        status: string;
      };
    }) => {
      const { data, dataUpdateCount, status } = query.state;
      if (
        status === 'error' ||
        dataUpdateCount >= MAX_UPDATES ||
        (data && !activeStatuses.has(data.status))
      )
        return false;
      return POLL_INTERVAL_MS;
    },
  };
}

// React Query cancels the observer's interval when its screen unmounts.
export function useScientificJob(id: string, enabled = true) {
  return useQuery({
    ...scientificJobQueryOptions(id),
    enabled: enabled && isCatalogId(id),
  });
}
