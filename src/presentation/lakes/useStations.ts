import { useQuery, type QueryFunctionContext } from '@tanstack/react-query';
import { isCatalogId } from '../../domain/lakes/catalogSchemas';
import {
  stationsKey,
  type StationsLoader,
} from '../../application/lakes/catalogQueries';
import { useAppServices } from '../shared/services/AppServicesProvider';
import type { AppServices } from '../../application/shared/AppServices';
export { stationsKey } from '../../application/lakes/catalogQueries';
export function stationsQueryOptions(
  catalogQueries: AppServices['catalogQueries'],
  id: string,
  loader?: StationsLoader,
) {
  return {
    queryKey: stationsKey(id),
    enabled: isCatalogId(id),
    networkMode: 'always' as const,
    refetchOnReconnect: 'always' as const,
    queryFn: ({ signal }: QueryFunctionContext) =>
      catalogQueries.stations(id, signal, loader),
  };
}
export function useStations(id: string) {
  const { catalogQueries } = useAppServices();
  const query = useQuery(stationsQueryOptions(catalogQueries, id));
  return {
    ...query,
    data: query.data?.data,
    isOffline: query.data?.source === 'cache',
    savedAt: query.data?.savedAt,
  };
}
