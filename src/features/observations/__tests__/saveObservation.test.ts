import { saveObservation } from '../application/saveObservation';
import type { StoredObservation } from '../domain/observationSchema';
const record: StoredObservation = {
  version: 1,
  id: '11111111-1111-4111-8111-111111111111',
  ownerId: 'franco',
  apiScope: 'test',
  values: {
    lakeId: '22222222-2222-4222-8222-222222222222',
    observedAt: '2026-10-14T12:00:00Z',
    note: 'Nota',
    photoUri: 'file:///camera/new.jpg',
    location: null,
  },
  savedAt: '2026-10-14T12:01:00Z',
  status: 'pending_send',
};
function fixture(created = true) {
  const order: string[] = [];
  const store = {
    durability: 'device' as const,
    latest: jest.fn(),
    save: jest.fn(async () => {
      order.push('sqlite');
    }),
  };
  const photos = {
    prepare: jest.fn(async () => {
      order.push('copy');
      return { uri: 'file:///documents/new.jpg', created };
    }),
    removeCreated: jest.fn(async () => {}),
  };
  return { order, store, photos };
}
it('copies the photo before committing SQLite and returns the durable reference', async () => {
  const { order, store, photos } = fixture();
  const saved = await saveObservation(record, store, photos);
  expect(order).toEqual(['copy', 'sqlite']);
  expect(saved.values.photoUri).toBe('file:///documents/new.jpg');
  expect(store.save).toHaveBeenCalledWith(saved);
  expect(photos.removeCreated).not.toHaveBeenCalled();
  expect(record.values.photoUri).toBe('file:///camera/new.jpg');
});
it('does not commit or claim success when copying fails', async () => {
  const { store, photos } = fixture();
  photos.prepare.mockRejectedValueOnce(new Error('disk full'));
  await expect(saveObservation(record, store, photos)).rejects.toThrow(
    'disk full',
  );
  expect(store.save).not.toHaveBeenCalled();
  expect(photos.removeCreated).not.toHaveBeenCalled();
});
it.each([true, false])(
  'rolls back only a newly copied photo on SQLite failure, created=%s',
  async (created) => {
    const { store, photos } = fixture(created);
    store.save.mockRejectedValueOnce(new Error('sqlite failed'));
    await expect(saveObservation(record, store, photos)).rejects.toThrow(
      'sqlite failed',
    );
    expect(photos.removeCreated).toHaveBeenCalledTimes(created ? 1 : 0);
  },
);
it('rejects a session change after copying and preserves the previous database record', async () => {
  const { store, photos } = fixture();
  const active = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
  await expect(saveObservation(record, store, photos, active)).rejects.toThrow(
    'sesión',
  );
  expect(store.save).not.toHaveBeenCalled();
  expect(photos.removeCreated).toHaveBeenCalledTimes(1);
});
it('saves an incomplete text draft without touching photos', async () => {
  const { store, photos } = fixture();
  await saveObservation(
    { ...record, values: { ...record.values, photoUri: null } },
    store,
    photos,
  );
  expect(photos.prepare).not.toHaveBeenCalled();
  expect(store.save).toHaveBeenCalledTimes(1);
});
