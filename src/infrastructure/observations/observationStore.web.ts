import { createSessionDraftStore } from './draftStore';
import { storedObservationSchema } from '../../domain/observations/observationSchema';

// Browser previews keep drafts only during this app session, never on disk.
export const observationStore = createSessionDraftStore((data) =>
  storedObservationSchema.parse(data),
);
