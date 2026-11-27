import { useQuery, type QueryFunctionContext } from '@tanstack/react-query';
import { isCatalogId } from '../../domain/lakes/catalogSchemas';
import {
  lakeDetailKey,
  type DetailLoader,
} from '../../application/lakes/catalogQueries';
import { useAppServices } from '../shared/services/AppServicesProvider';
import type { AppServices } from '../../application/shared/AppServices';
export { lakeDetailKey } from '../../application/lakes/catalogQueries';
export function lakeDetailQueryOptions(
  catalogQueries: AppServices['catalogQueries'],
  id: string,
  loader?: DetailLoader,
) {
  return {
    queryKey: lakeDetailKey(id),
    enabled: isCatalogId(id),
    networkMode: 'always' as const,
    refetchOnReconnect: 'always' as const,
    queryFn: ({ signal }: QueryFunctionContext) =>
      catalogQueries.detail(id, signal, loader),
  };
}
export function useLakeDetail(id: string) {
  const { catalogQueries } = useAppServices();
  const query = useQuery(lakeDetailQueryOptions(catalogQueries, id));
  return {
    ...query,
    data: query.data?.data,
    isOffline: query.data?.source === 'cache',
    savedAt: query.data?.savedAt,
  };
}
