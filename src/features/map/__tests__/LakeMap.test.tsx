import { fireEvent, render, screen } from '@testing-library/react-native';
import { LakeMap } from '../LakeMap';

jest.mock('@maplibre/maplibre-react-native', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Map: View,
    Camera: () => null,
    GeoJSONSource: View,
    Layer: (props: object) => <View testID="map-layer" {...props} />,
  };
});

it('renders estimate points with a different marker style from stations', async () => {
  await render(
    <LakeMap
      stations={{ type: 'FeatureCollection', features: [] }}
      estimates={{ type: 'FeatureCollection', features: [] }}
    />,
  );
  const layers = screen.getAllByTestId('map-layer');
  const station = layers.find((layer) => layer.props.id === 'station-markers');
  const estimate = layers.find(
    (layer) => layer.props.id === 'estimate-markers',
  );
  expect(station?.props.paint['circle-color']).not.toBe(
    estimate?.props.paint['circle-color'],
  );
});

it('shows loading, accepts native success and recovers from a failed load', async () => {
  await render(<LakeMap />);
  expect(screen.getByText('Cargando mapa…')).toBeTruthy();
  await fireEvent(screen.getByTestId('lake-map'), 'onDidFinishLoadingMap');
  expect(screen.queryByText('Cargando mapa…')).toBeNull();
  await fireEvent(screen.getByTestId('lake-map'), 'onDidFailLoadingMap');
  expect(screen.getByText(/No se pudo cargar el mapa/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Reintentar'));
  expect(screen.getByText('Cargando mapa…')).toBeTruthy();
  await fireEvent(screen.getByTestId('lake-map'), 'onDidFinishLoadingMap');
  expect(screen.queryByText('Reintentar')).toBeNull();
});
