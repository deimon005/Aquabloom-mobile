import { useQuery, type QueryFunctionContext } from '@tanstack/react-query';
import { fetchLakeDetail, parseLakeDetail } from '../data/catalogApi';
import { isCatalogId } from '../../../domain/catalogId';
import { cachedCatalog } from '../../offline/data/catalogCache';

export const lakeDetailKey = (id: string) =>
  ['lakes', 'detail', id.toLowerCase()] as const;
export function lakeDetailQueryOptions(id: string, loader = fetchLakeDetail) {
  return {
    queryKey: lakeDetailKey(id),
    enabled: isCatalogId(id),
    networkMode: 'always' as const,
    refetchOnReconnect: 'always' as const,
    queryFn: ({ signal }: QueryFunctionContext) =>
      cachedCatalog(
        lakeDetailKey(id),
        () => loader(id, signal),
        (value) => parseLakeDetail(id, value),
        signal,
      ),
  };
}
export function useLakeDetail(id: string) {
  const query = useQuery(lakeDetailQueryOptions(id));
  return {
    ...query,
    data: query.data?.data,
    isOffline: query.data?.source === 'cache',
    savedAt: query.data?.savedAt,
  };
}
