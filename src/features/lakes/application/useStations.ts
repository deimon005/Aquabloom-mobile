import { useQuery, type QueryFunctionContext } from '@tanstack/react-query';
import { fetchStations, parseStationsForLake } from '../data/catalogApi';
import { cachedCatalog } from '../../offline/data/catalogCache';
import { isCatalogId } from '../../../domain/catalogId';

export const stationsKey = (id: string) =>
  ['lakes', 'stations', id.toLowerCase()] as const;
export function stationsQueryOptions(id: string, loader = fetchStations) {
  return {
    queryKey: stationsKey(id),
    enabled: isCatalogId(id),
    networkMode: 'always' as const,
    refetchOnReconnect: 'always' as const,
    queryFn: ({ signal }: QueryFunctionContext) =>
      cachedCatalog(
        stationsKey(id),
        () => loader(id, signal),
        (value) => parseStationsForLake(id, value),
        signal,
      ),
  };
}
export function useStations(id: string) {
  const query = useQuery(stationsQueryOptions(id));
  return {
    ...query,
    data: query.data?.data,
    isOffline: query.data?.source === 'cache',
    savedAt: query.data?.savedAt,
  };
}
