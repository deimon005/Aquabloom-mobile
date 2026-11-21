import { lakeKeys, lakesQueryOptions } from '../application/useLakes';
import type { LakeListResponse } from '../domain/types';

const response: LakeListResponse = {
  items: [],
  page: 1,
  page_size: 20,
  total: 0,
};

describe('useLakes', () => {
  it('incluye los filtros normalizados en la queryKey', () => {
    expect(lakeKeys.list({ search: '  Ranco ', page: 2 })).toEqual([
      'lakes',
      'list',
      {
        search: 'Ranco',
        region: undefined,
        page: 2,
        page_size: 20,
      },
    ]);
  });

  it('propaga AbortSignal desde React Query hasta el cliente', async () => {
    const loader = jest.fn(async () => response);
    const controller = new AbortController();
    const options = lakesQueryOptions({ region: 'Los Lagos' }, loader);

    await options.queryFn({ signal: controller.signal } as never);

    expect(loader).toHaveBeenCalledWith(
      {
        search: undefined,
        region: 'Los Lagos',
        page: 1,
        page_size: 20,
      },
      controller.signal,
    );
  });
});
