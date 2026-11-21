import type { ObservationStore } from './observationStorePort';
import type { PhotoStorage } from './photoStorage';
import type { StoredObservation } from '../domain/observationSchema';

export async function saveObservation(
  record: StoredObservation,
  store: Pick<ObservationStore, 'save'>,
  photos: Pick<PhotoStorage, 'prepare' | 'removeCreated'>,
  isActive: () => boolean = () => true,
): Promise<StoredObservation> {
  if (!isActive()) throw new Error('La sesión de captura cambió.');
  const scope = {
    ownerId: record.ownerId,
    apiScope: record.apiScope,
    draftId: record.id,
  };
  let prepared: { uri: string; created: boolean } | undefined;
  try {
    if (record.values.photoUri)
      prepared = await photos.prepare(record.values.photoUri, scope);
    if (!isActive()) throw new Error('La sesión de captura cambió.');
    const stored = {
      ...record,
      values: { ...record.values, photoUri: prepared?.uri ?? null },
    };
    await store.save(stored);
    return stored;
  } catch (error) {
    // Only a new copy from this attempt can be rolled back. Never remove an old
    // persisted photo or the system camera source when the SQLite update fails.
    if (prepared?.created)
      await photos.removeCreated(prepared.uri, scope).catch(() => undefined);
    throw error;
  }
}
