import { api } from './api';
import { fetchLakeEstimates } from '../infrastructure/scientific/estimatesApi';
import { fetchScientificJob } from '../infrastructure/scientific/jobsApi';
import { createScientificDataSource } from '../infrastructure/scientific/scientificDataSource';
import {
  scientificSource as selectSource,
  type ScientificSource,
} from '../domain/scientific/source';
export type { ScientificSource } from '../domain/scientific/source';
export { demoEstimateId, demoJobIds } from '../domain/scientific/source';
// Enable only after the proposed routes/permissions have been agreed with Web/API.
export const scientificApiEnabled =
  process.env.EXPO_PUBLIC_SCIENTIFIC_API_ENABLED === 'true';
export function scientificSource(demo: unknown): ScientificSource {
  return selectSource(demo, scientificApiEnabled);
}

export const { loadEstimates, loadJob } = createScientificDataSource(
  (id, signal) => fetchLakeEstimates(id, signal, api),
  (id, signal) => fetchScientificJob(id, signal, api),
);
