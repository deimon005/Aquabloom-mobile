import { api } from '../../../infrastructure/http/api';
import { catalogId } from '../../../domain/catalogId';
import type { ScientificJob } from '../domain/job';
import { parseScientificJob } from './dto/jobDto';
import type { ScientificRequester } from './estimatesApi';

// La ruta pertenece al OpenAPI propuesto y debe confirmarse con Web/API.
export async function fetchScientificJob(
  jobId: string,
  signal?: AbortSignal,
  request: ScientificRequester | null = api,
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
