import { catalogId } from '../../domain/lakes/catalogSchemas';
import {
  parseLakeEstimates,
  type EstimateListResponse,
} from '../../domain/scientific/estimates';
export { parseLakeEstimates } from '../../domain/scientific/estimates';
export type {
  EstimatePoint,
  EstimateListResponse,
} from '../../domain/scientific/estimates';
export type ScientificRequester = (
  path: string,
  init?: RequestInit,
) => Promise<unknown>;

// La ruta pertenece al OpenAPI propuesto y debe confirmarse con Web/API.
export async function fetchLakeEstimates(
  lakeId: string,
  signal?: AbortSignal,
  request: ScientificRequester | null = null,
): Promise<EstimateListResponse> {
  const id = catalogId.parse(lakeId).toLowerCase();
  if (!request) {
    throw new Error(
      'Configura EXPO_PUBLIC_API_URL para consultar estimaciones.',
    );
  }
  return parseLakeEstimates(
    id,
    await request(`/lakes/${id}/estimates`, { signal }),
  );
}
