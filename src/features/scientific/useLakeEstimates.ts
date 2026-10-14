import { useQuery, type QueryFunctionContext } from '@tanstack/react-query';
import { isCatalogId } from '../lakes/catalogSchemas';
import { fetchLakeEstimates } from './estimatesApi';

export const lakeEstimatesKey = (lakeId: string) =>
  ['scientific', 'estimates', lakeId.toLowerCase()] as const;

export function lakeEstimatesQueryOptions(
  lakeId: string,
  loader: typeof fetchLakeEstimates = fetchLakeEstimates,
) {
  return {
    queryKey: lakeEstimatesKey(lakeId),
    enabled: isCatalogId(lakeId),
    queryFn: ({ signal }: QueryFunctionContext) => loader(lakeId, signal),
  };
}

export function useLakeEstimates(lakeId: string) {
  return useQuery(lakeEstimatesQueryOptions(lakeId));
}
