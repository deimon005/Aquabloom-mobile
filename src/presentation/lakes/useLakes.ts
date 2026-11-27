import {
  keepPreviousData,
  useQuery,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { normalizeLakeFilters } from '../../domain/lakes/lakeFilters';
import type { LakeFilters } from '../../domain/lakes/types';
import {
  lakeKeys,
  type LakesLoader,
} from '../../application/lakes/catalogQueries';
import { useAppServices } from '../shared/services/AppServicesProvider';
import type { AppServices } from '../../application/shared/AppServices';
export { lakeKeys } from '../../application/lakes/catalogQueries';
export type { LakesLoader } from '../../application/lakes/catalogQueries';
export type LakesQueryKey = ReturnType<typeof lakeKeys.list>;
export function lakesQueryOptions(
  catalogQueries: AppServices['catalogQueries'],
  filters: LakeFilters = {},
  loader?: LakesLoader,
) {
  const normalized = normalizeLakeFilters(filters);
  return {
    queryKey: lakeKeys.list(normalized),
    networkMode: 'always' as const,
    refetchOnReconnect: 'always' as const,
    queryFn: ({ signal }: QueryFunctionContext<LakesQueryKey>) =>
      catalogQueries.list(normalized, signal, loader),
    placeholderData: keepPreviousData,
  };
}
export function useLakes(filters: LakeFilters = {}) {
  const { catalogQueries } = useAppServices();
  const query = useQuery(lakesQueryOptions(catalogQueries, filters));
  return {
    ...query,
    data: query.data?.data,
    isOffline: query.data?.source === 'cache',
    savedAt: query.data?.savedAt,
  };
}
