import { api } from '../../../infrastructure/http/api';
import { catalogId } from '../../../domain/catalogId';
import type { EstimateListResponse } from '../domain/estimate';
import { parseLakeEstimates } from './dto/estimateDto';

export type ScientificRequester = (
  path: string,
  init?: RequestInit,
) => Promise<unknown>;

// La ruta pertenece al OpenAPI propuesto y debe confirmarse con Web/API.
export async function fetchLakeEstimates(
  lakeId: string,
  signal?: AbortSignal,
  request: ScientificRequester | null = api,
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
