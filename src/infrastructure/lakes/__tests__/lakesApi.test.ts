import { fetchLakes, type LakesRequester } from '../lakesApi';
import type { LakeListResponse } from '../../../domain/lakes/types';

const response: LakeListResponse = {
  items: [],
  page: 1,
  page_size: 20,
  total: 0,
};

describe('cliente del catálogo de lagos', () => {
  it('envía filtros normalizados y la señal de cancelación', async () => {
    const controller = new AbortController();
    const request = jest.fn(async () => response) as LakesRequester;

    await expect(
      fetchLakes(
        { search: '  Villarrica ', region: ' Araucanía ' },
        controller.signal,
        request,
      ),
    ).resolves.toEqual(response);

    expect(request).toHaveBeenCalledWith(
      '/lakes?text=Villarrica&region=Araucan%C3%ADa&page=1&limit=20',
      { signal: controller.signal },
    );
  });

  it('falla de forma accionable cuando la API no está configurada', async () => {
    await expect(fetchLakes({}, undefined, null)).rejects.toThrow(
      'EXPO_PUBLIC_API_URL',
    );
  });
});
