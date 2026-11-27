import { stationsSchema } from './catalogSchemas';

export function parseStationsForLake(id: string, value: unknown) {
  const lakeId = id.toLowerCase();
  const stations = stationsSchema.parse(value);
  if (stations.some((station) => station.lake_id.toLowerCase() !== lakeId)) {
    throw new Error('La respuesta contiene estaciones de otro lago.');
  }
  return stations;
}
