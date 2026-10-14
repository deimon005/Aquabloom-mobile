import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import {
  lakeEstimatesKey,
  lakeEstimatesQueryOptions,
  useLakeEstimates,
} from '../useLakeEstimates';
import type { EstimateListResponse } from '../estimatesApi';

const lakeId = '11111111-1111-4111-8111-111111111111';

it('keys estimates by lake and passes cancellation to the scientific adapter', async () => {
  const response: EstimateListResponse = { items: [] };
  const loader = jest.fn(async () => response);
  const options = lakeEstimatesQueryOptions(lakeId, loader);
  const controller = new AbortController();
  expect(options.queryKey).toEqual(lakeEstimatesKey(lakeId));
  await expect(
    options.queryFn({ signal: controller.signal } as never),
  ).resolves.toEqual(response);
  expect(loader).toHaveBeenCalledWith(lakeId, controller.signal);
});

it('uses the shared QueryClient cache and does not query without a valid lake', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const invalid = await renderHook(() => useLakeEstimates('../wrong'), {
    wrapper,
  });
  expect(invalid.result.current.fetchStatus).toBe('idle');
  await invalid.unmount();

  client.setQueryData(lakeEstimatesKey(lakeId), { items: [] });
  const valid = await renderHook(() => useLakeEstimates(lakeId), { wrapper });
  await waitFor(() => expect(valid.result.current.data).toEqual({ items: [] }));
  await valid.unmount();
  client.clear();
});
