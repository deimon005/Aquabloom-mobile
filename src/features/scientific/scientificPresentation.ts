import { OfflineCacheMissError } from '../offline/cache';
import { ApiError } from '../../lib/http';
import type { ScientificJobStatus } from './jobsApi';

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
export function scientificError(error: unknown) {
  if (error instanceof OfflineCacheMissError) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 401)
      return 'Tu sesión venció. Inicia sesión nuevamente.';
    if (error.status === 403)
      return 'No tienes permiso para consultar estos datos científicos.';
    if (error.status === 404)
      return 'No encontramos el resultado o trabajo solicitado.';
  }
  return 'No pudimos consultar los datos científicos. Reintenta; no se muestran resultados inventados.';
}
