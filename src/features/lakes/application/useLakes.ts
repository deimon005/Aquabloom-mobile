import {
  keepPreviousData,
  useQuery,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { normalizeLakeFilters } from './lakeFilters';
import { fetchLakes } from '../data/lakesApi';
import type { LakeFilters } from '../domain/types';
import { cachedCatalog } from '../../offline/data/catalogCache';
import { lakeListSchema } from '../data/dto/catalogSchemas';
import { catalogRetryDelay, shouldRetryCatalog } from './catalogRecovery';

export const lakeKeys = {
  all: ['lakes'] as const,
  list: (filters: LakeFilters = {}) =>
    [...lakeKeys.all, 'list', normalizeLakeFilters(filters)] as const,
};

export type LakesQueryKey = ReturnType<typeof lakeKeys.list>;
export type LakesLoader = typeof fetchLakes;

export function lakesQueryOptions(
  filters: LakeFilters = {},
  loader: LakesLoader = fetchLakes,
) {
  const normalizedFilters = normalizeLakeFilters(filters);
  const queryKey = lakeKeys.list(normalizedFilters);
  return {
    queryKey,
    networkMode: 'always' as const,
    refetchOnReconnect: 'always' as const,
    retry: shouldRetryCatalog,
    retryDelay: catalogRetryDelay,
    queryFn: ({ signal }: QueryFunctionContext<LakesQueryKey>) =>
      cachedCatalog(
        queryKey,
        () => loader(normalizedFilters, signal),
        (value) => lakeListSchema.parse(value),
        signal,
      ),
    placeholderData: keepPreviousData,
  };
}

export function useLakes(filters: LakeFilters = {}) {
  const query = useQuery(lakesQueryOptions(filters));
  return {
    ...query,
    data: query.data?.data,
    isOffline: query.data?.source === 'cache',
    savedAt: query.data?.savedAt,
  };
}
