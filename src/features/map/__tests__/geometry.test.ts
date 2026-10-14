import {
  estimateFeatures,
  lakeFeature,
  lakeBounds,
  stationFeatures,
} from '../geometry';
import { lake, station } from '../../lakes/__tests__/fixtures';
import type { EstimatePoint } from '../../scientific/estimatesApi';

it('maps only valid estimate coordinates and retains the result identifier', () => {
  const estimate: EstimatePoint = {
    id: '22222222-2222-4222-8222-222222222222',
    lake_id: lake.id,
    point_id: 'P-01',
    longitude: -72.1,
    latitude: -39.3,
    value: 4.2,
    unit: 'mg/m³',
    variable: 'chlorophyll-a',
    observed_at: '2026-10-14T12:30:00Z',
    status: 'experimental',
    warnings: [],
  };
  const result = estimateFeatures(
    [
      estimate,
      { ...estimate, id: 'missing', longitude: null },
      { ...estimate, id: 'invalid', latitude: 120 },
      { ...estimate, id: 'other-lake', lake_id: 'another-lake' },
    ],
    lake.id,
  );
  expect(result.features).toHaveLength(1);
  expect(result.features[0].properties).toEqual({
    id: estimate.id,
    pointId: 'P-01',
  });
  expect(result.features[0].geometry.coordinates).toEqual([-72.1, -39.3]);
});

it('retains station IDs and excludes invalid points and stations from other lakes', () => {
  const valid = {
    ...station,
    point: { type: 'Point', coordinates: [-72, -39] },
  };
  const result = stationFeatures(
    [
      valid,
      { ...valid, id: 'other', lake_id: 'other-lake' },
      { ...station, id: 'missing' },
      {
        ...valid,
        id: 'invalid',
        point: { type: 'Point', coordinates: [-72, 120] },
      },
    ],
    lake.id,
  );
  expect(result.features).toHaveLength(1);
  expect(result.features[0].id).toBe(station.id);
  expect(result.features[0].geometry.coordinates).toEqual([-72, -39]);
  expect(stationFeatures([valid], 'other-lake').features).toEqual([]);
});

const ring = [
  [-72, -39],
  [-71, -39],
  [-71, -38],
  [-72, -39],
];
it('preserves polygon holes and stable identifiers, and calculates camera bounds', () => {
  const feature = lakeFeature({
    ...lake,
    geom: { type: 'Polygon', coordinates: [ring, ring] },
  });
  expect(feature?.geometry.coordinates).toEqual([ring, ring]);
  expect(feature?.id).toBe(lake.id);
  expect(lakeBounds(feature!)).toEqual([-72, -39, -71, -38]);
});
it('accepts multi-polygons', () => {
  expect(
    lakeFeature({
      ...lake,
      geom: { type: 'MultiPolygon', coordinates: [[ring], [ring]] },
    })?.geometry.type,
  ).toBe('MultiPolygon');
});
it.each([
  {},
  { type: 'Point', coordinates: [-72, -39] },
  { type: 'Polygon', coordinates: [] },
  {
    type: 'Polygon',
    coordinates: [
      [
        [-72, -39],
        [-71, -39],
        [-71, -38],
        [-72, -38],
      ],
    ],
  },
  {
    type: 'Polygon',
    coordinates: [
      [
        [200, -39],
        [-71, -39],
        [-71, -38],
        [200, -39],
      ],
    ],
  },
  {
    type: 'Polygon',
    coordinates: [
      [
        [NaN, -39],
        [-71, -39],
        [-71, -38],
        [NaN, -39],
      ],
    ],
  },
])('rejects invalid geometry without crashing the map', (geom) => {
  expect(lakeFeature({ ...lake, geom })).toBeNull();
});
