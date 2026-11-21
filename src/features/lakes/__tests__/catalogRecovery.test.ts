import {
  ApiError,
  NetworkError,
  RequestTimeoutError,
} from '../../../infrastructure/http/http';
import { OfflineCacheMissError } from '../../offline/data/cache';
import {
  catalogRetryDelay,
  shouldRetryCatalog,
} from '../application/catalogRecovery';
import { lakesQueryOptions } from '../application/useLakes';

it.each([502, 503, 504])(
  'reintenta %s dos veces con espera acotada',
  (status) => {
    const error = new ApiError(status, 'internal diagnostic');
    expect([0, 1, 2].map((n) => shouldRetryCatalog(n, error))).toEqual([
      true,
      true,
      false,
    ]);
    expect([0, 1, 2].map(catalogRetryDelay)).toEqual([1000, 2000, 2000]);
  },
);
it('admite el plazo HTTP sin tratarlo como falta de conexión', () => {
  const options = lakesQueryOptions();
  expect(options.retry(0, new RequestTimeoutError())).toBe(true);
  expect(options.retry(2, new RequestTimeoutError())).toBe(false);
  expect(options.retry(0, new NetworkError())).toBe(false);
});
it.each([401, 403, 404, 429, 500])(
  'no disfraza el error %s como arranque',
  (status) => {
    expect(shouldRetryCatalog(0, new ApiError(status, 'error'))).toBe(false);
  },
);
it('no repite errores de caché, contrato o cancelación', () => {
  const errors = [
    new OfflineCacheMissError(),
    new Error('respuesta inválida'),
    Object.assign(new Error('cancelled'), { name: 'AbortError' }),
  ];
  expect(errors.every((error) => !shouldRetryCatalog(0, error))).toBe(true);
});
