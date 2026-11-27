import { act, cleanup, screen, waitFor } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { api } from '../../../composition/api';
import { CatalogScreen } from '../../lakes/CatalogScreen';
import { LakeDetailScreen } from '../../lakes/LakeDetailScreen';
import { lake, lakeId, station } from '../../lakes/__tests__/fixtures';
import {
  catalogCache,
  cachedCatalog,
  setCatalogIdentity,
} from '../../../composition/catalogCache';

jest.mock('../../../composition/api', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
  router: { push: jest.fn() },
}));

const request = jest.mocked(api!);
const list = { items: [lake], page: 1, page_size: 20, total: 1 };
const clients: QueryClient[] = [];
async function mount(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 60_000 } },
  });
  clients.push(client);
  await render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}
beforeEach(() => {
  request.mockReset();
  onlineManager.setOnline(false);
});
afterEach(async () => {
  await cleanup();
  for (const client of clients.splice(0)) client.clear();
  jest.restoreAllMocks();
  setCatalogIdentity(null);
  onlineManager.setOnline(true);
});

it('renders saved results offline and refreshes immediately on reconnect', async () => {
  jest
    .spyOn(catalogCache, 'read')
    .mockResolvedValue({ data: list, savedAt: Date.now() });
  request.mockResolvedValue({
    ...list,
    items: [{ ...lake, name: 'Lago actualizado' }],
  });
  await mount(<CatalogScreen />);
  expect(await screen.findByText('Lago Ranco')).toBeTruthy();
  expect(
    screen.getByText(/Sin conexión. Mostrando datos guardados/),
  ).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
  await act(async () => {
    onlineManager.setOnline(true);
  });
  expect(await screen.findByText('Lago actualizado')).toBeTruthy();
  expect(
    screen.queryByText(/Sin conexión. Mostrando datos guardados/),
  ).toBeNull();
});

it('shows an actionable cache miss instead of leaving an offline query paused', async () => {
  jest.spyOn(catalogCache, 'read').mockResolvedValue(null);
  await mount(<CatalogScreen />);
  expect(
    await screen.findByText(/No hay datos guardados vigentes/),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
});

it('opens saved lake details and their stations without a network request', async () => {
  jest.spyOn(catalogCache, 'read').mockImplementation(async (_scope, key) => ({
    data: JSON.parse(key)[1] === 'stations' ? [station] : lake,
    savedAt: Date.now(),
  }));
  await mount(<LakeDetailScreen id={lakeId} />);
  expect(await screen.findByText('Lago Ranco')).toBeTruthy();
  expect(
    await screen.findByRole('button', { name: 'Ver estación Estación norte' }),
  ).toBeTruthy();
  await waitFor(() =>
    expect(
      screen.getAllByText(/Sin conexión. Mostrando datos guardados/),
    ).toHaveLength(2),
  );
  expect(request).not.toHaveBeenCalled();
});

it('partitions requests by identity and clears once per identity transition', async () => {
  const clear = jest.spyOn(catalogCache, 'clear').mockResolvedValue(undefined);
  const read = jest
    .spyOn(catalogCache, 'read')
    .mockResolvedValue({ data: list, savedAt: Date.now() });
  const load = jest.fn();
  const parse = (value: unknown) => value;
  await cachedCatalog(['test'], load, parse);
  const guestScope = read.mock.calls[0][0];
  setCatalogIdentity('account-a');
  await cachedCatalog(['test'], load, parse);
  const accountScope = read.mock.calls[1][0];
  expect(accountScope).not.toBe(guestScope);
  expect(JSON.parse(accountScope)[2]).toBe('account-a');
  setCatalogIdentity('account-a');
  expect(clear).toHaveBeenCalledTimes(1);
  setCatalogIdentity('account-b');
  await cachedCatalog(['test'], load, parse);
  expect(JSON.parse(read.mock.calls[2][0])[2]).toBe('account-b');
  expect(clear).toHaveBeenCalledTimes(2);
  expect(load).not.toHaveBeenCalled();
});
