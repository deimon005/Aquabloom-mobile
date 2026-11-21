import { ApiError } from '../../../lib/http';
import { OfflineCacheMissError } from '../../offline/data/cache';
export function catalogError(error: unknown, resource: string) {
  if (error instanceof OfflineCacheMissError) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 404) return 'No encontramos ' + resource + '.';
    if (error.status === 401)
      return 'Tu sesión venció. Inicia sesión nuevamente.';
    if (error.status === 403)
      return 'No tienes permiso para consultar ' + resource + '.';
  }
  return (
    'No pudimos cargar ' +
    resource +
    '. Revisa tu conexión e inténtalo nuevamente.'
  );
}
