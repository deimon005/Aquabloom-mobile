import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { MapScreen } from '../MapScreen';
import { LakeMap } from '../LakeMap';
import { useLakes } from '../../lakes/useLakes';
import { useLakeDetail } from '../../lakes/useLakeDetail';
import { useStations } from '../../lakes/useStations';
import { useLakeEstimates } from '../../scientific/useLakeEstimates';
import { lake, station } from '../../lakes/__tests__/fixtures';

jest.mock('../LakeMap', () => ({ LakeMap: jest.fn(() => null) }));
jest.mock('../../lakes/useLakes');
jest.mock('../../lakes/useLakeDetail');
jest.mock('../../lakes/useStations');
jest.mock('../../scientific/useLakeEstimates');
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
}));
const validLake = {
  ...lake,
  geom: {
    type: 'Polygon',
    coordinates: [
      [
        [-72, -39],
        [-71, -39],
        [-71, -38],
        [-72, -39],
      ],
    ],
  },
};
const latestMap = () => jest.mocked(LakeMap).mock.calls.at(-1)![0];
beforeEach(() => {
  jest.mocked(useLakeEstimates).mockReturnValue({
    data: { items: [] },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLakeEstimates>);
  jest.mocked(useStations).mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useStations>);
  jest.mocked(useLakes).mockReturnValue({
    data: { items: [lake], total: 21 },
    isPending: false,
    isError: false,
    isFetching: false,
  } as unknown as ReturnType<typeof useLakes>);
  jest.mocked(useLakeDetail).mockImplementation(
    (id) =>
      ({
        data: id ? validLake : undefined,
        isPending: false,
        isError: false,
      }) as unknown as ReturnType<typeof useLakeDetail>,
  );
});
it('passes coordinate-bearing estimates as map points separate from stations', async () => {
  jest.mocked(useLakeEstimates).mockReturnValue({
    data: {
      items: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          lake_id: lake.id,
          point_id: 'P-01',
          latitude: -39.3,
          longitude: -72.1,
          value: 4.2,
          unit: 'mg/m³',
          variable: 'chlorophyll-a',
          observed_at: '2026-10-14T12:30:00Z',
          status: 'experimental',
          warnings: [],
        },
      ],
    },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLakeEstimates>);
  await render(<MapScreen />);
  await fireEvent.press(
    screen.getByLabelText(`Mostrar ${lake.name} en el mapa`),
  );
  expect(latestMap().estimates?.features[0].properties.id).toBe(
    '22222222-2222-4222-8222-222222222222',
  );
  expect(latestMap().estimates?.features[0].geometry.coordinates).toEqual([
    -72.1, -39.3,
  ]);
  expect(latestMap().stations?.features).toEqual([]);
  expect(
    screen.getByText('1 estimaciones con coordenadas válidas'),
  ).toBeTruthy();
  await act(async () =>
    latestMap().onSelect?.({
      kind: 'estimate',
      id: '22222222-2222-4222-8222-222222222222',
    }),
  );
  expect(screen.getByText('Estimación P-01')).toBeTruthy();
  expect(
    screen.getByText('Identificador: 22222222-2222-4222-8222-222222222222'),
  ).toBeTruthy();
  expect(screen.getByText(/4.2 mg\/m³/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Cerrar estimación'));
  expect(screen.queryByText('Estimación P-01')).toBeNull();
}, 15000);
it('loads a selected lake, passes its polygon to the map and supports pagination', async () => {
  await render(<MapScreen />);
  expect(latestMap().feature).toBeNull();
  await fireEvent.press(
    screen.getByLabelText(`Mostrar ${lake.name} en el mapa`),
  );
  expect(useLakeDetail).toHaveBeenLastCalledWith(lake.id);
  expect(latestMap().feature?.id).toBe(lake.id);
  await fireEvent.press(screen.getByText('Siguiente'));
  expect(useLakes).toHaveBeenLastCalledWith({ page: 2, page_size: 20 });
});
it('does not pass unavailable geometry to the native renderer', async () => {
  jest.mocked(useLakeDetail).mockReturnValue({
    data: lake,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLakeDetail>);
  await render(<MapScreen />);
  await fireEvent.press(
    screen.getByLabelText(`Mostrar ${lake.name} en el mapa`),
  );
  expect(screen.getByText(/no tiene un polígono válido/)).toBeTruthy();
  expect(latestMap().feature).toBeNull();
});

it('shows the selected station, closes its sheet and replaces it with lake information', async () => {
  jest.mocked(useStations).mockReturnValue({
    data: [{ ...station, point: { type: 'Point', coordinates: [-72, -39] } }],
    isError: false,
    isPending: false,
  } as unknown as ReturnType<typeof useStations>);
  await render(<MapScreen />);
  await fireEvent.press(
    screen.getByLabelText(`Mostrar ${lake.name} en el mapa`),
  );
  expect(
    screen.getByLabelText(`Ver detalle de ${lake.name}`).props.href.params,
  ).toEqual({ id: lake.id });
  await fireEvent.press(
    screen.getByLabelText(`Seleccionar estación ${station.name}`),
  );
  expect(screen.getByText(station.description)).toBeTruthy();
  expect(
    screen.getByLabelText(`Ver detalle de ${station.name}`).props.href.params,
  ).toEqual({ id: lake.id, stationId: station.id });
  await fireEvent.press(screen.getByText('Cerrar ficha'));
  expect(screen.queryByText(station.description)).toBeNull();
  await fireEvent.press(
    screen.getByLabelText(`Mostrar ${lake.name} en el mapa`),
  );
  expect(screen.getByText(lake.description)).toBeTruthy();
  expect(screen.queryByText(station.description)).toBeNull();
});
