import { ApiError } from '../../infrastructure/shared/http';
import {
  createAppQueryClient,
  queryCachePolicy,
  shouldRetryQuery,
} from '../AppProviders';

describe('QueryClient de la aplicación', () => {
  it('centraliza tiempos de caché y revalidación para consultas móviles', () => {
    const defaults = createAppQueryClient().getDefaultOptions();

    expect(defaults.queries).toMatchObject({
      staleTime: queryCachePolicy.staleTime,
      gcTime: queryCachePolicy.gcTime,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    });
    expect(defaults.queries?.retry).toBe(shouldRetryQuery);
    expect(defaults.mutations?.retry).toBe(false);
  });

  it('no repite errores de cliente ni solicitudes canceladas', () => {
    const aborted = new Error('cancelled');
    aborted.name = 'AbortError';

    expect(shouldRetryQuery(0, new ApiError(401, 'Sesión vencida'))).toBe(
      false,
    );
    expect(shouldRetryQuery(0, new ApiError(422, 'Filtros inválidos'))).toBe(
      false,
    );
    expect(shouldRetryQuery(0, aborted)).toBe(false);
  });

  it('limita los reintentos de red y de servidor', () => {
    expect(shouldRetryQuery(0, new ApiError(503, 'No disponible'))).toBe(true);
    expect(shouldRetryQuery(1, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetryQuery(2, new ApiError(503, 'No disponible'))).toBe(false);
  });
});
