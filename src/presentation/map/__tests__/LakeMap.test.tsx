import { fireEvent, screen } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import { LakeMap } from '../LakeMap';
import { lakeVisualizationExample } from '../../../domain/map/spatialData';
import type { LakeFeature } from '../../../domain/map/geometry';

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

const exampleLake: LakeFeature = {
  type: 'Feature',
  properties: { id: '11111111-1111-4111-8111-111111111111', name: 'Lago' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ],
  },
};
it('renders colored cells beneath a shore mask and white measurement markers only when spatial data exists', async () => {
  const data = lakeVisualizationExample(exampleLake);
  const onSelect = jest.fn();
  await render(
    <LakeMap
      feature={exampleLake}
      surface={data.surface}
      measurements={data.measurements}
      example
      onSelect={onSelect}
    />,
  );
  const sources = screen.getAllByTestId('map-source');
  expect(sources.map((source) => source.props.id)).toEqual(
    expect.arrayContaining([
      'prediction-surface',
      'prediction-shore-mask',
      'measurements',
    ]),
  );
  const layer = screen
    .getAllByTestId('map-layer')
    .find((item) => item.props.id === 'measurement-markers');
  expect(layer?.props.paint['circle-color']).toBe('#FFFFFF');
  const layers = screen.getAllByTestId('map-layer');
  const afterId = (id: string) =>
    layers.find((item) => item.props.id === id)?.props.afterId;
  expect(afterId('prediction-colors')).toBe('lake-fill');
  expect(afterId('prediction-mask')).toBe('prediction-colors');
  expect(afterId('lake-outline-white')).toBe('prediction-mask');
  expect(afterId('lake-outline')).toBe('lake-outline-white');
  expect(afterId('measurement-markers')).toBe('lake-outline');
  const measurements = sources.find((item) => item.props.id === 'measurements');
  await fireEvent(measurements!, 'onPress', {
    stopPropagation: jest.fn(),
    nativeEvent: {
      features: [{ properties: { id: data.measurements[0].id } }],
    },
  });
  expect(onSelect).toHaveBeenCalledWith({
    kind: 'measurement',
    id: data.measurements[0].id,
  });
  expect(screen.getByText('EJEMPLO SINTÉTICO')).toBeTruthy();
});
it('does not render a surface for a different lake or from isolated estimate points', async () => {
  const data = lakeVisualizationExample(exampleLake);
  await render(
    <LakeMap
      feature={exampleLake}
      surface={{
        ...data.surface,
        lake_id: '22222222-2222-4222-8222-222222222222',
      }}
    />,
  );
  expect(
    screen
      .getAllByTestId('map-source')
      .some((source) => source.props.id === 'prediction-surface'),
  ).toBe(false);
});
