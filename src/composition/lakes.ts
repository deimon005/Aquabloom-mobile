import { api } from './api';
import { cachedCatalog } from './catalogCache';
import {
  createCatalogQueries,
  type CatalogGateway,
} from '../application/lakes/catalogQueries';
import { fetchLakes } from '../infrastructure/lakes/lakesApi';
import {
  fetchLakeDetail,
  fetchStations,
} from '../infrastructure/lakes/catalogApi';
export const catalogGateway: CatalogGateway = {
  list: (filters, signal) => fetchLakes(filters, signal, api),
  detail: (id, signal) => fetchLakeDetail(id, signal, api),
  stations: (id, signal) => fetchStations(id, signal, api),
};
export const catalogQueries = createCatalogQueries(
  catalogGateway,
  cachedCatalog,
);
