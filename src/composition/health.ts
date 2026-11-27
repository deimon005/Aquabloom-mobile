import { api } from './api';
import { checkHealth } from '../application/health/checkHealth';
export const healthConfigured = Boolean(api);
export const loadHealth = (signal?: AbortSignal) => {
  const request = api;
  return checkHealth(
    request
      ? { check: (signal) => request<unknown>('/health', { signal }) }
      : null,
    signal,
  );
};
