import { api } from '../../lib/api';
import { catalogId, lakeDetailSchema, stationsSchema } from './catalogSchemas';

export type CatalogRequester = (
  path: string,
  init?: RequestInit,
) => Promise<unknown>;

export async function fetchLakeDetail(
  id: string,
  signal?: AbortSignal,
  request: CatalogRequester | null = api,
) {
  const lakeId = catalogId.parse(id).toLowerCase();
  if (!request)
    throw new Error('Configura EXPO_PUBLIC_API_URL para consultar los lagos.');
  return parseLakeDetail(lakeId, await request('/lakes/' + lakeId, { signal }));
}

export function parseLakeDetail(id: string, value: unknown) {
  const lake = lakeDetailSchema.parse(value);
  if (lake.id.toLowerCase() !== id.toLowerCase()) {
    throw new Error('La respuesta corresponde a otro lago.');
  }
  return lake;
}

export async function fetchStations(
  id: string,
  signal?: AbortSignal,
  request: CatalogRequester | null = api,
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

export function parseStationsForLake(id: string, value: unknown) {
  const lakeId = id.toLowerCase();
  const stations = stationsSchema.parse(value);
  if (stations.some((station) => station.lake_id.toLowerCase() !== lakeId)) {
    throw new Error('La respuesta contiene estaciones de otro lago.');
  }
  return stations;
}
