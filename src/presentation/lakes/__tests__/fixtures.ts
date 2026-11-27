export const lakeId = '11111111-1111-4111-8111-111111111111';
export const stationId = '22222222-2222-4222-8222-222222222222';
export const lake = {
  id: lakeId,
  name: 'Lago Ranco',
  region: 'Los Ríos',
  status: 'active',
  description: 'Lago de monitoreo',
  geom: { type: 'Polygon', coordinates: [] },
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};
export const station = {
  id: stationId,
  lake_id: lakeId,
  name: 'Estación norte',
  code: 'N-01',
  status: 'active',
  point: null,
  description: 'Sector norte',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};
