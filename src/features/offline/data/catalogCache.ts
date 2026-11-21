import { onlineManager } from '@tanstack/react-query';
import { env } from '../../../config/env';
import { ApiError, NetworkError } from '../../../infrastructure/http/http';
import { createCatalogCache, loadCachedCatalog } from './cache';
import { openCacheDatabase } from './database';

export const catalogCache = createCatalogCache(openCacheDatabase);
let identity: string | null = null;
export function setCatalogIdentity(userId: string | null) {
  if (identity === userId) return;
  identity = userId;
  // clear() invalidates in-flight writes synchronously. The queued DELETE runs
  // before any subsequent read/write; failure disables persistent cache access.
  void catalogCache.clear().catch(() => undefined);
}
export const clearCatalogCache = () => catalogCache.clear();

export function cachedCatalog<T>(
  key: readonly unknown[],
  load: () => Promise<unknown>,
  parse: (value: unknown) => T,
  signal?: AbortSignal,
) {
  // These endpoints are public and have no organization context in the API.
  // Never use this namespace for profiles, tokens or organization-private data.
  const scope = JSON.stringify([
    env.apiUrl ?? '',
    'public-catalog-v1',
    identity ?? 'guest',
  ]);
  return loadCachedCatalog({
    cache: catalogCache,
    scope,
    key: JSON.stringify(key),
    load,
    parse,
    signal,
    offline: !onlineManager.isOnline(),
    isNetworkError: (error) => error instanceof NetworkError,
    invalidateOnError: (error) =>
      error instanceof ApiError && [401, 403, 404].includes(error.status),
  });
}
