import { catalogQueries } from '../../../composition/lakes';
import { fetchLakeDetail, fetchStations } from '../catalogApi';
import { lakeDetailQueryOptions } from '../../../presentation/lakes/useLakeDetail';
import { stationsQueryOptions } from '../../../presentation/lakes/useStations';
import {
  lake,
  lakeId,
  station,
} from '../../../presentation/lakes/__tests__/fixtures';

it('loads and validates lake detail with cancellation', async () => {
  const request = jest.fn(async () => lake);
  const controller = new AbortController();
  await expect(
    fetchLakeDetail(lakeId, controller.signal, request),
  ).resolves.toEqual(lake);
  expect(request).toHaveBeenCalledWith('/lakes/' + lakeId, {
    signal: controller.signal,
  });
});
it('loads stations from the existing lake endpoint', async () => {
  const request = jest.fn(async () => [station]);
  await expect(fetchStations(lakeId, undefined, request)).resolves.toEqual([
    station,
  ]);
  expect(request).toHaveBeenCalledWith('/lakes/' + lakeId + '/stations', {
    signal: undefined,
  });
});
it('rejects malformed responses and stations belonging to another lake', async () => {
  await expect(
    fetchLakeDetail(lakeId, undefined, async () => ({ name: 'bad' })),
  ).rejects.toThrow();
  await expect(
    fetchStations(lakeId, undefined, async () => [
      { ...station, lake_id: station.id },
    ]),
  ).rejects.toThrow('otro lago');
});
it('rejects invalid identifiers before making requests', async () => {
  const request = jest.fn();
  await expect(
    fetchLakeDetail('../other', undefined, request),
  ).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
  expect(lakeDetailQueryOptions(catalogQueries, '').enabled).toBe(false);
  expect(stationsQueryOptions(catalogQueries, '').enabled).toBe(false);
});
it('separates detail and station caches and forwards the query signal', async () => {
  const controller = new AbortController();
  const detailLoader = jest.fn(async () => lake);
  const stationsLoader = jest.fn(async () => [station]);
  const detail = lakeDetailQueryOptions(catalogQueries, lakeId, detailLoader);
  const stations = stationsQueryOptions(catalogQueries, lakeId, stationsLoader);
  expect(detail.queryKey).not.toEqual(stations.queryKey);
  await detail.queryFn({ signal: controller.signal } as never);
  await stations.queryFn({ signal: controller.signal } as never);
  expect(detailLoader).toHaveBeenCalledWith(lakeId, controller.signal);
  expect(stationsLoader).toHaveBeenCalledWith(lakeId, controller.signal);
});
it('reports missing API configuration', async () => {
  await expect(fetchLakeDetail(lakeId, undefined, null)).rejects.toThrow(
    'EXPO_PUBLIC_API_URL',
  );
  await expect(fetchStations(lakeId, undefined, null)).rejects.toThrow(
    'EXPO_PUBLIC_API_URL',
  );
});
