import { catalogId } from '../../domain/lakes/catalogSchemas';
import {
  parseScientificJob,
  type ScientificJob,
} from '../../domain/scientific/jobs';
import type { ScientificRequester } from './estimatesApi';
export {
  parseScientificJob,
  scientificJobStatuses,
} from '../../domain/scientific/jobs';
export type {
  ScientificJob,
  ScientificJobStatus,
} from '../../domain/scientific/jobs';

// La ruta pertenece al OpenAPI propuesto y debe confirmarse con Web/API.
export async function fetchScientificJob(
  jobId: string,
  signal?: AbortSignal,
  request: ScientificRequester | null = null,
): Promise<ScientificJob> {
  const id = catalogId.parse(jobId).toLowerCase();
  if (!request) {
    throw new Error('Configura EXPO_PUBLIC_API_URL para consultar trabajos.');
  }
  return parseScientificJob(
    id,
    await request(`/scientific/jobs/${id}`, { signal }),
  );
}
