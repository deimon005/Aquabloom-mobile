import { catalogId, lakeDetailSchema } from '../../domain/lakes/catalogSchemas';

import { parseStationsForLake } from '../../domain/lakes/stations';

export type CatalogRequester = (
  path: string,
  init?: RequestInit,
) => Promise<unknown>;

export async function fetchLakeDetail(
  id: string,
  signal?: AbortSignal,
  request: CatalogRequester | null = null,
) {
  const lakeId = catalogId.parse(id).toLowerCase();
  if (!request)
    throw new Error('Configura EXPO_PUBLIC_API_URL para consultar los lagos.');
  return lakeDetailSchema.parse(await request('/lakes/' + lakeId, { signal }));
}

export async function fetchStations(
  id: string,
  signal?: AbortSignal,
  request: CatalogRequester | null = null,
) {
  const lakeId = catalogId.parse(id).toLowerCase();
  if (!request)
    throw new Error(
      'Configura EXPO_PUBLIC_API_URL para consultar las estaciones.',
    );
  return parseStationsForLake(
    lakeId,
    await request('/lakes/' + lakeId + '/stations', { signal }),
  );
}

export { parseStationsForLake } from '../../domain/lakes/stations';
