import { fetchLakeEstimates, parseLakeEstimates } from '../estimatesApi';

const lakeId = '11111111-1111-4111-8111-111111111111';
const estimate = {
  id: '22222222-2222-4222-8222-222222222222',
  lake_id: lakeId,
  point_id: 'P-01',
  latitude: -39.274,
  longitude: -72.104,
  value: 4.2,
  unit: 'mg/m³',
  variable: 'chlorophyll-a',
  observed_at: '2026-10-06T12:30:00Z',
  status: 'experimental',
  scene_id: 'scene-demo',
  model_id: 'model-demo',
  model_version: '1.0',
  dataset_id: 'dataset-demo',
  dataset_version: '1.0',
  warnings: ['Resultado experimental'],
};

it('adapta una respuesta de ejemplo usando la ruta propuesta y cancelación', async () => {
  const response = { items: [estimate] };
  const request = jest.fn(async () => response);
  const controller = new AbortController();

  await expect(
    fetchLakeEstimates(lakeId, controller.signal, request),
  ).resolves.toEqual(response);
  expect(request).toHaveBeenCalledWith(`/lakes/${lakeId}/estimates`, {
    signal: controller.signal,
  });
});

it('acepta un resultado sin coordenadas sin inventarlas', () => {
  const response = parseLakeEstimates(lakeId, {
    items: [{ ...estimate, latitude: null, longitude: null }],
  });
  expect(response.items[0].latitude).toBeNull();
  expect(response.items[0].longitude).toBeNull();
});

it('rechaza respuestas inválidas o de otro lago', () => {
  expect(() =>
    parseLakeEstimates(lakeId, { items: [{ ...estimate, unit: '' }] }),
  ).toThrow();
  expect(() =>
    parseLakeEstimates(lakeId, {
      items: [{ ...estimate, lake_id: '33333333-3333-4333-8333-333333333333' }],
    }),
  ).toThrow('otro lago');
});

it('rechaza identificadores inválidos antes de solicitar datos', async () => {
  const request = jest.fn();
  await expect(
    fetchLakeEstimates('../other', undefined, request),
  ).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});
