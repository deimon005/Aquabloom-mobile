import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import {
  scientificJobQueryOptions,
  useScientificJob,
} from '../useScientificJob';
import type { ScientificJob } from '../jobsApi';

const id = '44444444-4444-4444-8444-444444444444';
const job = (status: ScientificJob['status']): ScientificJob => ({
  id,
  status,
  updated_at: '2026-10-14T12:30:00Z',
});

it('polls only active jobs and stops at terminal states or its limit', () => {
  const interval = scientificJobQueryOptions(id).refetchInterval;
  const state = (data: ScientificJob, dataUpdateCount = 1) => ({
    state: { data, dataUpdateCount, status: 'success' },
  });
  expect(interval(state(job('queued')))).toBe(5_000);
  expect(interval(state(job('running')))).toBe(5_000);
  for (const status of ['completed', 'failed', 'cancelled'] as const)
    expect(interval(state(job(status)))).toBe(false);
  expect(interval(state(job('running'), 30))).toBe(false);
  expect(interval({ state: { status: 'error', dataUpdateCount: 0 } })).toBe(
    false,
  );
});

it('does not observe an invalid or disabled job and releases its observer on unmount', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const disabled = await renderHook(() => useScientificJob(id, false), {
    wrapper,
  });
  expect(disabled.result.current.fetchStatus).toBe('idle');
  await disabled.unmount();
  const invalid = await renderHook(() => useScientificJob('../wrong'), {
    wrapper,
  });
  expect(invalid.result.current.fetchStatus).toBe('idle');
  await invalid.unmount();
  client.setQueryData(scientificJobQueryOptions(id).queryKey, job('running'));
  const active = await renderHook(() => useScientificJob(id), { wrapper });
  await waitFor(() =>
    expect(
      client
        .getQueryCache()
        .find({ queryKey: scientificJobQueryOptions(id).queryKey })
        ?.getObserversCount(),
    ).toBe(1),
  );
  await act(async () => active.unmount());
  expect(
    client
      .getQueryCache()
      .find({ queryKey: scientificJobQueryOptions(id).queryKey })
      ?.getObserversCount(),
  ).toBe(0);
  client.clear();
});
