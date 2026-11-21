import type { ObservationStore } from './observationStorePort';
import type { PhotoStorage, PhotoScope } from './photoStorage';

// Remove only this draft's managed directory, including old replacements.
// A filesystem failure keeps the row available for retry. If SQLite fails after
// file removal, the retained row can still be recovered with a replacement photo.
export async function deleteObservation(
  scope: PhotoScope,
  store: Pick<ObservationStore, 'remove'>,
  photos: Pick<PhotoStorage, 'removeDraft'>,
) {
  await photos.removeDraft(scope);
  await store.remove(scope.apiScope, scope.ownerId, scope.draftId);
}
