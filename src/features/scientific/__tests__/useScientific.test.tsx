import { ApiError, NetworkError } from '../../../lib/http';
import { catalogCache } from '../../offline/catalogCache';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { onlineManager, useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../../auth/useCurrentUser';
import { useEstimates, useScientificJob } from '../useScientific';
import {
  loadEstimates,
  loadJob,
  type ScientificSource,
} from '../scientificSource';
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({})),
  onlineManager: { isOnline: jest.fn() },
}));
jest.mock('../../offline/catalogCache', () => ({
  catalogCache: {
    version: () => 0,
    now: () => 100,
    read: jest.fn(),
    write: jest.fn(async () => undefined),
    remove: jest.fn(async () => undefined),
  },
}));
jest.mock('../../auth/useCurrentUser', () => ({ useCurrentUser: jest.fn() }));
jest.mock('../scientificSource', () => ({
  loadEstimates: jest.fn(),
  loadJob: jest.fn(),
}));
jest.mock('../../../config/env', () => ({
  env: { apiUrl: 'https://api.example.test' },
}));
const query = useQuery as jest.Mock;
const session = useCurrentUser as jest.Mock;
const id = '11111111-1111-4111-8111-111111111111';
function Probe({
  source,
  value = id,
}: {
  source: ScientificSource;
  value?: string;
}) {
  useEstimates(value, source);
  useScientificJob(value, source);
  return <Text>Query probe</Text>;
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(catalogCache.read).mockReset();
  jest.mocked(onlineManager.isOnline).mockReturnValue(true);
  jest.mocked(loadEstimates).mockResolvedValue({ items: [] });
  jest.mocked(catalogCache.write).mockResolvedValue(undefined);
  jest.mocked(catalogCache.remove).mockResolvedValue(undefined);
  session.mockReturnValue({ user: { id: 'franco' } });
});
it.each(['demo', 'proposal'] as const)(
  'keys %s reads by API, user, source and identity, and propagates cancellation',
  async (source) => {
    await render(<Probe source={source} />);
    const options = query.mock.calls.map(([value]) => value);
    expect(options[0].queryKey).toEqual([
      'scientific',
      'https://api.example.test',
      'franco',
      source,
      'estimates',
      id,
    ]);
    expect(options[1].queryKey).toEqual([
      'scientific',
      'https://api.example.test',
      'franco',
      source,
      'job',
      id,
    ]);
    expect(options.every((option) => option.enabled)).toBe(true);
    const controller = new AbortController();
    await options[0].queryFn({ signal: controller.signal });
    await options[1].queryFn({ signal: controller.signal });
    expect(loadEstimates).toHaveBeenCalledWith(source, id, controller.signal);
    expect(loadJob).toHaveBeenCalledWith(source, id, controller.signal);
  },
);
it('does not enable requests before a user session is available', async () => {
  session.mockReturnValue({ user: null });
  await render(<Probe source="proposal" />);
  expect(query.mock.calls.every(([options]) => options.enabled === false)).toBe(
    true,
  );
});
it.each([
  { source: 'disabled', value: id },
  { source: 'proposal', value: '../bad' },
] as const)('disables reads for $source / $value', async (props) => {
  await render(<Probe {...props} />);
  expect(query.mock.calls.every(([options]) => options.enabled === false)).toBe(
    true,
  );
});
it('changes the query scope when the account changes, rather than sharing private data', async () => {
  const view = await render(<Probe source="proposal" />);
  session.mockReturnValue({ user: { id: 'other' } });
  await view.rerender(<Probe source="proposal" />);
  expect(
    query.mock.calls
      .slice(-2)
      .every(([options]) => options.queryKey[2] === 'other'),
  ).toBe(true);
});

it('uses a dated, account- and lake-scoped snapshot offline and refreshes on reconnect', async () => {
  const view = await render(<Probe source="proposal" />);
  const options = query.mock.calls[0][0];
  const signal = new AbortController().signal;
  const scope = JSON.stringify([
    'https://api.example.test',
    'scientific-estimates-v1',
    'franco',
  ]);
  const items = { items: [] };
  await expect(options.queryFn({ signal })).resolves.toMatchObject({
    source: 'network',
  });
  expect(catalogCache.write).toHaveBeenCalledWith(scope, id, items, 0, signal);

  jest
    .mocked(catalogCache.read)
    .mockImplementation(async (owner, lake) =>
      owner === scope && lake === id ? { data: items, savedAt: 100 } : null,
    );
  jest.mocked(onlineManager.isOnline).mockReturnValue(false);
  await expect(options.queryFn({ signal })).resolves.toEqual({
    data: items,
    savedAt: 100,
    source: 'cache',
  });
  expect(loadEstimates).toHaveBeenCalledTimes(1);

  session.mockReturnValue({ user: { id: 'other' } });
  await view.rerender(<Probe source="proposal" />);
  await expect(query.mock.calls.at(-2)![0].queryFn({ signal })).rejects.toThrow(
    'No hay datos guardados',
  );

  expect(options.refetchOnReconnect).toBe('always');
  jest.mocked(onlineManager.isOnline).mockReturnValue(true);
  await expect(options.queryFn({ signal })).resolves.toMatchObject({
    source: 'network',
  });
});

it.each([401, 403, 422, 503])(
  'does not expose stored results after HTTP %s',
  async (status) => {
    await render(<Probe source="proposal" />);
    const error = new ApiError(status, 'restricted detail');
    jest.mocked(loadEstimates).mockRejectedValue(error);
    await expect(query.mock.calls[0][0].queryFn({})).rejects.toBe(error);
    expect(catalogCache.read).not.toHaveBeenCalled();
    expect(catalogCache.remove).toHaveBeenCalledTimes(
      status === 401 || status === 403 ? 1 : 0,
    );
  },
);

it('uses the authorized snapshot if connectivity drops during a request', async () => {
  await render(<Probe source="proposal" />);
  jest.mocked(loadEstimates).mockRejectedValue(new NetworkError());
  jest
    .mocked(catalogCache.read)
    .mockResolvedValue({ data: { items: [] }, savedAt: 100 });
  await expect(query.mock.calls[0][0].queryFn({})).resolves.toMatchObject({
    source: 'cache',
  });
});
