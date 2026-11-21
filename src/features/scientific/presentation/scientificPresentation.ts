import { OfflineCacheMissError } from '../../offline/data/cache';
import { ApiError } from '../../../lib/http';
import type { EstimatePoint } from '../domain/estimate';
import type { ScientificJobStatus } from '../domain/job';

export const jobLabels: Record<ScientificJobStatus, string> = {
  queued: 'En cola',
  running: 'En ejecución',
  completed: 'Completado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
};
export function metadata(value: string | null | undefined) {
  return value?.trim() || 'No informado';
}
export function scientificDate(value: string) {
  return new Date(value).toLocaleString('es-CL', { timeZone: 'UTC' }) + ' UTC';
}
export function hasEstimateCoordinates(estimate: EstimatePoint) {
  return estimate.latitude != null && estimate.longitude != null;
}

export function canRetryScientific(error: unknown) {
  return !(error instanceof ApiError && [401, 403, 404].includes(error.status));
}

export function scientificError(error: unknown) {
  if (error instanceof OfflineCacheMissError) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 401)
      return 'Tu sesión venció. Inicia sesión nuevamente.';
    if (error.status === 403)
      return 'No tienes permiso para consultar estos datos científicos.';
    if ([408, 429, 500, 502, 503, 504].includes(error.status))
      return 'Servicio científico temporalmente no disponible. Puedes reintentar.';
    if (error.status === 404)
      return 'No encontramos el resultado o trabajo solicitado.';
  }
  return 'No pudimos consultar los datos científicos. Reintenta; no se muestran resultados inventados.';
}
