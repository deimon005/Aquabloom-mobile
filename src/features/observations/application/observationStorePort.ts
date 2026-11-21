import type { StoredObservation } from '../domain/observationSchema';

export type ObservationStore = {
  durability: 'device' | 'session';
  save: (record: StoredObservation) => Promise<void>;
  list: (
    apiScope: string,
    ownerId: string,
    lakeId: string,
  ) => Promise<StoredObservation[]>;
  remove: (apiScope: string, ownerId: string, id: string) => Promise<void>;
  latest: (
    apiScope: string,
    ownerId: string,
    lakeId: string,
  ) => Promise<StoredObservation | null>;
};
