import { fireEvent, screen } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { api } from '../../../composition/api';
import { ApiError } from '../../../infrastructure/shared/http';
import { LakeDetailScreen } from '../LakeDetailScreen';
import { StationScreen } from '../StationScreen';
import { lake, lakeId, station, stationId } from './fixtures';

jest.mock('../../../composition/api', () => ({ api: jest.fn() }));
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
  router: { push: jest.fn() },
}));
const request = api as jest.Mock;
async function mount(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  await render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}
beforeEach(() => {
  request.mockReset();
  request.mockImplementation(async (path: string) =>
    path.endsWith('/stations') ? [station] : lake,
  );
});

it('loads lake details and navigates to a station through the common route', async () => {
  await mount(<LakeDetailScreen id={lakeId} />);
  expect(await screen.findByText('Lago Ranco')).toBeTruthy();
  expect(screen.getByText('Región: Los Ríos')).toBeTruthy();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Ver estación Estación norte' }),
  );
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/lakes/[id]/stations/[stationId]',
    params: { id: lakeId, stationId },
  });
});

it('opens a station deep link by querying its parent lake', async () => {
  await mount(<StationScreen lakeId={lakeId} stationId={stationId} />);
  expect(await screen.findByText('Estación norte')).toBeTruthy();
  expect(screen.getByText('Código: N-01')).toBeTruthy();
  expect(request).toHaveBeenCalledWith(
    '/lakes/' + lakeId + '/stations',
    expect.anything(),
  );
  expect(screen.getByText('Volver al lago').props.href.params.id).toBe(lakeId);
});

it('opens observations with the selected lake without inventing another identity', async () => {
  await mount(<LakeDetailScreen id={lakeId} />);
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Observaciones de terreno' }),
  );
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/lakes/[id]/observations',
    params: { id: lakeId },
  });
});

it('shows an empty station list', async () => {
  request.mockImplementation(async (path: string) =>
    path.endsWith('/stations') ? [] : lake,
  );
  await mount(<LakeDetailScreen id={lakeId} />);
  expect(
    await screen.findByText('Este lago no tiene estaciones registradas.'),
  ).toBeTruthy();
});

it('handles a station that does not belong to the route', async () => {
  request.mockResolvedValue([]);
  await mount(<StationScreen lakeId={lakeId} stationId={stationId} />);
  expect(
    await screen.findByText(
      'La estación no pertenece a este lago o ya no está disponible.',
    ),
  ).toBeTruthy();
});

it('shows a loading state while waiting for the detail', async () => {
  request.mockReturnValue(new Promise(() => {}));
  await mount(<LakeDetailScreen id={lakeId} />);
  expect(screen.getByText('Cargando lago…')).toBeTruthy();
});

it('does not query malformed links', async () => {
  await mount(<LakeDetailScreen id="../invalid" />);
  expect(screen.getByText('El enlace del lago no es válido.')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
});

it('reports a missing lake without exposing server details and permits retry', async () => {
  request.mockRejectedValueOnce(new ApiError(404, 'internal SQL trace'));
  await mount(<LakeDetailScreen id={lakeId} />);
  expect(await screen.findByText('No encontramos el lago.')).toBeTruthy();
  expect(screen.queryByText('internal SQL trace')).toBeNull();
  await fireEvent.press(screen.getByText('Reintentar'));
  expect(await screen.findByText('Lago Ranco')).toBeTruthy();
});
it.each([401, 403])(
  'does not hide authorization failure %s',
  async (status) => {
    request.mockRejectedValue(new ApiError(status, 'private'));
    await mount(<StationScreen lakeId={lakeId} stationId={stationId} />);
    expect(
      await screen.findByText(
        status === 401
          ? 'Tu sesión venció. Inicia sesión nuevamente.'
          : 'No tienes permiso para consultar la estación.',
      ),
    ).toBeTruthy();
  },
);
