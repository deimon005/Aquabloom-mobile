import { ApiError, RequestTimeoutError } from '../../../lib/http';

export function isCatalogStartupError(error: unknown) {
  return (
    error instanceof RequestTimeoutError ||
    (error instanceof ApiError && [502, 503, 504].includes(error.status))
  );
}

export function shouldRetryCatalog(failureCount: number, error: unknown) {
  return failureCount < 2 && isCatalogStartupError(error);
}

export function catalogRetryDelay(attempt: number) {
  return Math.min(1000 * 2 ** attempt, 2000);
}
