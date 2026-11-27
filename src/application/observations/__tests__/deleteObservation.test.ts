import { deleteObservation } from '../deleteObservation';

const scope = { apiScope: 'api-a', ownerId: 'jose', draftId: 'draft-a' };
it('removes managed photos before removing the scoped row', async () => {
  const order: string[] = [];
  const photos = {
    removeDraft: jest.fn(async () => {
      order.push('photos');
    }),
  };
  const store = {
    remove: jest.fn(async () => {
      order.push('sqlite');
    }),
  };
  await deleteObservation(scope, store, photos);
  expect(order).toEqual(['photos', 'sqlite']);
  expect(photos.removeDraft).toHaveBeenCalledWith(scope);
  expect(store.remove).toHaveBeenCalledWith('api-a', 'jose', 'draft-a');
});
it('keeps the database row for retry if photo deletion fails', async () => {
  const store = { remove: jest.fn() };
  const photos = {
    removeDraft: jest.fn().mockRejectedValue(new Error('disk unavailable')),
  };
  await expect(deleteObservation(scope, store, photos)).rejects.toThrow(
    'disk unavailable',
  );
  expect(store.remove).not.toHaveBeenCalled();
});
it('reports SQLite failure instead of claiming a successful deletion', async () => {
  const store = {
    remove: jest.fn().mockRejectedValue(new Error('SQLite unavailable')),
  };
  const photos = { removeDraft: jest.fn().mockResolvedValue(undefined) };
  await expect(deleteObservation(scope, store, photos)).rejects.toThrow(
    'SQLite unavailable',
  );
});
