import { openDatabaseAsync } from 'expo-sqlite';
import { createDraftStore } from './draftStore';
import { storedObservationSchema } from '../domain/observationSchema';

export const observationStore = createDraftStore(
  () => openDatabaseAsync('aquabloom-observation-form-v1.db'),
  (data) => storedObservationSchema.parse(data),
);
