import { fetchLakeEstimates } from '../data/estimatesApi';
import { parseLakeEstimates } from '../data/dto/estimateDto';
import type { EstimatePoint } from '../domain/estimate';
import { fetchScientificJob } from '../data/jobsApi';
import { parseScientificJob } from '../data/dto/jobDto';
import { scientificJobStatuses } from '../domain/job';
import { catalogId } from '../../../domain/catalogId';

export type ScientificSource = 'disabled' | 'proposal' | 'demo';
// Enable only after the proposed routes/permissions have been agreed with Web/API.
export const scientificApiEnabled =
  process.env.EXPO_PUBLIC_SCIENTIFIC_API_ENABLED === 'true';
export function scientificSource(demo: unknown): ScientificSource {
  return demo === '1' ? 'demo' : scientificApiEnabled ? 'proposal' : 'disabled';
}
export const demoEstimateId = '22222222-2222-4222-8222-222222222222';
export const demoJobIds = scientificJobStatuses.map(
  (_, index) => `44444444-4444-4444-8444-44444444444${index}`,
);
function demoEstimate(lakeId: string): EstimatePoint {
  return {
    id: demoEstimateId,
    lake_id: lakeId,
    point_id: 'P-DEMO-01',
    value: 4.2,
    unit: 'mg/m³',
    variable: 'chlorophyll-a',
    observed_at: '2026-10-21T12:30:00Z',
    status: 'experimental',
    scene_id: 'scene-demo',
    model_id: 'model-demo',
    model_version: '0.0-demo',
    dataset_id: null,
    dataset_version: null,
    warnings: [
      'Ejemplo sintético para demostrar la interfaz; no usar como dato ambiental.',
    ],
  };
}
export async function loadEstimates(
  source: ScientificSource,
  lakeId: string,
  signal?: AbortSignal,
) {
  const id = catalogId.parse(lakeId).toLowerCase();
  if (signal?.aborted) throw new Error('Consulta cancelada.');
  if (source === 'demo')
    return parseLakeEstimates(id, { items: [demoEstimate(id)] });
  if (source === 'proposal') return fetchLakeEstimates(id, signal);
  throw new Error('Contrato científico pendiente de acuerdo.');
}
export async function loadJob(
  source: ScientificSource,
  jobId: string,
  signal?: AbortSignal,
) {
  const id = catalogId.parse(jobId).toLowerCase();
  if (signal?.aborted) throw new Error('Consulta cancelada.');
  if (source === 'demo') {
    const index = demoJobIds.indexOf(id);
    if (index < 0) throw new Error('Trabajo de demostración inexistente.');
    return parseScientificJob(id, {
      id,
      status: scientificJobStatuses[index],
      updated_at: '2026-10-21T12:35:00Z',
      ...(index === 1 ? { progress: 30 } : {}),
    });
  }
  if (source === 'proposal') return fetchScientificJob(id, signal);
  throw new Error('Contrato científico pendiente de acuerdo.');
}
