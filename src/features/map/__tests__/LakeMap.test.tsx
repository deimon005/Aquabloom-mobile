import { fireEvent, render, screen } from '@testing-library/react-native';
import { LakeMap } from '../LakeMap';

jest.mock('@maplibre/maplibre-react-native', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Map: View,
    Camera: (props: object) => <View testID="map-camera" {...props} />,
    GeoJSONSource: (props: object) => <View testID="map-source" {...props} />,
    Layer: (props: object) => <View testID="map-layer" {...props} />,
  };
});

it('selects only a marker that belongs to the displayed estimate collection', async () => {
  const onSelect = jest.fn();
  await render(
    <LakeMap
      estimates={{
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { id: 'estimate-1', pointId: 'P-01' },
            geometry: { type: 'Point', coordinates: [-72, -39] },
          },
        ],
      }}
      onSelect={onSelect}
    />,
  );
  const source = screen
    .getAllByTestId('map-source')
    .find((item) => item.props.id === 'estimates');
  const stopPropagation = jest.fn();
  await fireEvent(source!, 'onPress', {
    stopPropagation,
    nativeEvent: { features: [{ properties: { id: 'estimate-1' } }] },
  });
  expect(onSelect).toHaveBeenCalledWith({ kind: 'estimate', id: 'estimate-1' });
  await fireEvent(source!, 'onPress', {
    stopPropagation,
    nativeEvent: { features: [{ properties: { id: 'unknown' } }] },
  });
  expect(onSelect).toHaveBeenCalledTimes(1);
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

it('shows the captured position and includes it in the selected lake bounds', async () => {
  const feature = {
    type: 'Feature' as const,
    properties: { id: 'lake-1', name: 'Panguipulli' },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [-72.4, -39.7],
          [-72.3, -39.7],
          [-72.3, -39.6],
          [-72.4, -39.7],
        ],
      ],
    },
  };
  await render(
    <LakeMap
      feature={feature}
      observationLocation={{ longitude: -72.5, latitude: -39.8 }}
    />,
  );
  expect(screen.getByTestId('map-camera').props.bounds).toEqual([
    -72.5, -39.8, -72.3, -39.6,
  ]);
  const marker = screen
    .getAllByTestId('map-source')
    .find((source) => source.props.id === 'captured-location');
  expect(marker?.props.data.geometry.coordinates).toEqual([-72.5, -39.8]);
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
