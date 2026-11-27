import { ApiError, NetworkError } from '../../domain/shared/errors';
export { ApiError, NetworkError } from '../../domain/shared/errors';

export function createHttpClient(
  baseUrl: string,
  getToken: () => Promise<string | null> = async () => null,
  fetcher: typeof fetch = fetch,
) {
  return async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    // Keep credentials on the configured API origin.
    if (
      !path.startsWith('/') ||
      path.startsWith('//') ||
      path.includes('://')
    ) {
      throw new Error('La ruta debe ser relativa a la API.');
    }
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body && !headers.has('Content-Type'))
      headers.set('Content-Type', 'application/json');
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    // A caller's cancellation must not disable the request deadline.
    const controller = new AbortController();
    const cancel = () => controller.abort();
    init.signal?.addEventListener('abort', cancel, { once: true });
    if (init.signal?.aborted) cancel();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);
    try {
      const response = await fetcher(`${baseUrl.replace(/\/$/, '')}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ApiError(
          response.status,
          response.status === 401
            ? 'Tu sesión venció. Inicia sesión nuevamente.'
            : `No se pudo completar la solicitud (${response.status}).`,
        );
      }
      if (response.status === 204) return undefined as T;
      try {
        return (await response.json()) as T;
      } catch (error) {
        if (controller.signal.aborted) throw error;
        throw new ApiError(
          response.status,
          'La API devolvió una respuesta JSON inválida.',
        );
      }
    } catch (error) {
      if (init.signal?.aborted) throw error;
      if (timedOut) throw new Error('La API tardó demasiado en responder.');
      if (error instanceof ApiError) throw error;
      throw new NetworkError();
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener('abort', cancel);
    }
  };
}
