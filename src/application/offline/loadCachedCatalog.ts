import {
  aborted,
  OfflineCacheMissError,
  type CachedValue,
  type CatalogCache,
} from '../../domain/offline/cache.ts';

export async function loadCachedCatalog<T>({
  cache,
  scope,
  key,
  load,
  parse,
  offline,
  isNetworkError,
  invalidateOnError = () => false,
  signal,
}: {
  cache: CatalogCache;
  scope: string;
  key: string;
  load: () => Promise<unknown>;
  parse: (data: unknown) => T;
  offline: boolean;
  isNetworkError: (error: unknown) => boolean;
  invalidateOnError?: (error: unknown) => boolean;
  signal?: AbortSignal;
}): Promise<CachedValue<T>> {
  const version = cache.version();
  const check = () => {
    if (signal?.aborted || version !== cache.version()) throw aborted();
  };
  check();
  if (!offline) {
    let response: unknown;
    let failedNetwork = false;
    try {
      response = await load();
    } catch (error) {
      check();
      if (invalidateOnError(error))
        await cache.remove(scope, key).catch(() => undefined);
      if (!isNetworkError(error)) throw error;
      failedNetwork = true;
    }
    check();
    if (!failedNetwork) {
      const data = parse(response);
      await cache
        .write(scope, key, data, version, signal)
        .catch(() => undefined);
      check();
      return { data, source: 'network', savedAt: cache.now() };
    }
  }
  const stored = await cache.read(scope, key).catch(() => null);
  check();
  if (stored) {
    try {
      return {
        data: parse(stored.data),
        source: 'cache',
        savedAt: stored.savedAt,
      };
    } catch {
      await cache.remove(scope, key).catch(() => undefined);
    }
  }
  throw new OfflineCacheMissError();
}
