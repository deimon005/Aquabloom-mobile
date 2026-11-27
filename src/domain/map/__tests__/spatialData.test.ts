import type { LakeFeature } from '../geometry';
import {
  insideLake,
  lakeExteriorMask,
  lakeVisualizationExample,
  surfaceRange,
  surfaceFill,
  surfaceColor,
} from '../spatialData';
import { parseLakeEstimates } from '../../scientific/estimates';

const lakeId = '11111111-1111-4111-8111-111111111111';
const boundary = [
  [0, 0],
  [3, 0],
  [3, 3],
  [0, 3],
  [0, 0],
];
const island = [
  [1, 1],
  [2, 1],
  [2, 2],
  [1, 2],
  [1, 1],
];
const lake: LakeFeature = {
  type: 'Feature',
  properties: { id: lakeId, name: 'Lago de prueba' },
  geometry: { type: 'Polygon', coordinates: [boundary, island] },
};

it('preserves islands and produces a shore-exterior mask without changing source geometry', () => {
  const before = JSON.stringify(lake);
  const mask = lakeExteriorMask(lake);
  expect(mask.geometry.coordinates).toHaveLength(2);
  expect(mask.geometry.coordinates[0]).toHaveLength(2);
  expect(insideLake([0.5, 0.5], lake)).toBe(true);
  expect(insideLake([1.5, 1.5], lake)).toBe(false);
  expect(insideLake([4, 1], lake)).toBe(false);
  const maskedArea = { ...lake, geometry: mask.geometry };
  expect(insideLake([0.5, 0.5], maskedArea)).toBe(false);
  expect(insideLake([1.5, 1.5], maskedArea)).toBe(true);
  expect(insideLake([4, 1], maskedArea)).toBe(true);
  const extent = mask.geometry.coordinates[0][0];
  expect(
    Math.max(...extent.map(([longitude]) => longitude)) -
      Math.min(...extent.map(([longitude]) => longitude)),
  ).toBeLessThan(180);
  expect(JSON.stringify(lake)).toBe(before);
});
it('accepts multipolygons and masks all shorelines', () => {
  const multi: LakeFeature = {
    ...lake,
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [boundary, island],
        [
          [
            [5, 0],
            [6, 0],
            [6, 1],
            [5, 0],
          ],
        ],
      ],
    },
  };
  const mask = lakeExteriorMask(multi);
  expect(mask.geometry.coordinates[0]).toHaveLength(3);
  expect(insideLake([5.5, 0.1], multi)).toBe(true);
});
it('does not fabricate a surface from point predictions and keeps old responses compatible', () => {
  expect(parseLakeEstimates(lakeId, { items: [] })).toEqual({ items: [] });
  expect(surfaceRange(null)).toBeNull();
});
it('rejects cells or measurements from another lake, invalid cells, and duplicate IDs', () => {
  const { surface, measurements } = lakeVisualizationExample(lake);
  const otherId = '22222222-2222-4222-8222-222222222222';
  expect(() => parseLakeEstimates(otherId, { items: [], surface })).toThrow(
    'otro lago',
  );
  expect(() =>
    parseLakeEstimates(otherId, { items: [], measurements }),
  ).toThrow('otro lago');
  const cell = surface.cells.features[0];
  expect(() =>
    parseLakeEstimates(lakeId, {
      items: [],
      surface: {
        ...surface,
        cells: { ...surface.cells, features: [cell, cell] },
      },
    }),
  ).toThrow();
  expect(() =>
    parseLakeEstimates(lakeId, {
      items: [],
      surface: {
        ...surface,
        cells: {
          ...surface.cells,
          features: [
            { ...cell, properties: { ...cell.properties, value: Infinity } },
          ],
        },
      },
    }),
  ).toThrow();
});
it('uses the actual value range and handles a constant field without inventing a gradient', () => {
  const { surface } = lakeVisualizationExample(lake);
  const cells = surface.cells.features.slice(0, 2).map((cell, i) => ({
    ...cell,
    properties: { ...cell.properties, value: i === 0 ? 5 : 12 },
  }));
  const data = { ...surface, cells: { ...surface.cells, features: cells } };
  expect(surfaceRange(data)).toEqual([5, 12]);
  expect(surfaceFill(data)).toEqual(expect.arrayContaining([5, 12]));
  const constant = {
    ...data,
    cells: {
      ...data.cells,
      features: cells.map((cell) => ({
        ...cell,
        properties: { ...cell.properties, value: 7 },
      })),
    },
  };
  expect(surfaceRange(constant)).toEqual([7, 7]);
  expect(typeof surfaceFill(constant)).toBe('string');
  expect(surfaceColor(7, 7, 7)).toBe('rgb(115,199,114)');
});
it('generates an explicit example with measurements inside the lake and outside its islands', () => {
  const { surface, measurements } = lakeVisualizationExample(lake);
  expect(surface.cells.features).toHaveLength(960);
  expect(surface.model_version).toBe('ejemplo-visual-sintético');
  expect(measurements.length).toBeGreaterThan(0);
  for (const measurement of measurements)
    expect(
      insideLake([measurement.longitude, measurement.latitude], lake),
    ).toBe(true);
});
