import { demoEstimateId, demoJobIds } from '../../domain/scientific/source';
import { catalogId } from '../../domain/lakes/catalogSchemas';
import {
  parseLakeEstimates,
  type EstimatePoint,
  type EstimateListResponse,
} from '../../domain/scientific/estimates';
import {
  parseScientificJob,
  scientificJobStatuses,
  type ScientificJob,
} from '../../domain/scientific/jobs';
import type { ScientificSource } from '../../domain/scientific/source';
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
export function createScientificDataSource(
  fetchLakeEstimates: (
    id: string,
    signal?: AbortSignal,
  ) => Promise<EstimateListResponse>,
  fetchScientificJob: (
    id: string,
    signal?: AbortSignal,
  ) => Promise<ScientificJob>,
) {
  async function loadEstimates(
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
  async function loadJob(
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

  return { loadEstimates, loadJob };
}
