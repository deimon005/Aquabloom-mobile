export type CacheDatabase = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (
    sql: string,
    ...params: (string | number | null)[]
  ) => Promise<unknown>;
  getFirstAsync: <T>(
    sql: string,
    ...params: (string | number | null)[]
  ) => Promise<T | null>;
};
export type CachedValue<T> = {
  data: T;
  source: 'network' | 'cache';
  savedAt: number;
};
export class OfflineCacheMissError extends Error {
  constructor() {
    super(
      'No hay datos guardados vigentes para esta consulta. Conéctate a internet e inténtalo nuevamente.',
    );
    this.name = 'OfflineCacheMissError';
  }
}
export function aborted() {
  return Object.assign(new Error('Consulta cancelada.'), {
    name: 'AbortError',
  });
}

export async function migrateCache(db: CacheDatabase) {
  const version = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  if ((version?.user_version ?? 0) > 1)
    throw new Error('Versión de caché no compatible.');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  if (version?.user_version === 1) return;
  await db.execAsync('BEGIN IMMEDIATE;');
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS catalog_cache (
        scope TEXT NOT NULL, cache_key TEXT NOT NULL, payload TEXT NOT NULL,
        saved_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
        PRIMARY KEY (scope, cache_key)
      );
      CREATE INDEX IF NOT EXISTS catalog_cache_expiry ON catalog_cache(expires_at);
      PRAGMA user_version = 1;
    `);
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

export function createCatalogCache(
  open: () => Promise<CacheDatabase | null>,
  { ttlMs = 24 * 60 * 60 * 1000, maxEntries = 200, now = Date.now } = {},
) {
  let database: Promise<CacheDatabase | null> | undefined;
  let queue: Promise<unknown> = Promise.resolve();
  let generation = 0;
  let disabled = false;
  const db = () =>
    (database ??= open().then(async (value) => {
      if (value) await migrateCache(value);
      return value;
    }));
  const serial = <T>(work: () => Promise<T>) => {
    const result = queue.then(work);
    queue = result.catch(() => undefined);
    return result;
  };
  const remove = (scope: string, key: string) =>
    serial(async () => {
      const value = await db();
      if (value)
        await value.runAsync(
          'DELETE FROM catalog_cache WHERE scope = ? AND cache_key = ?',
          scope,
          key,
        );
    });
  return {
    now,
    version: () => generation,
    clear() {
      generation += 1;
      return serial(async () => {
        try {
          const value = await db();
          if (value) await value.runAsync('DELETE FROM catalog_cache');
          disabled = false;
        } catch (error) {
          disabled = true;
          throw error;
        }
      });
    },
    remove,
    read(scope: string, key: string) {
      return serial(async () => {
        if (disabled) return null;
        const value = await db();
        if (!value) return null;
        const row = await value.getFirstAsync<{
          payload: string;
          saved_at: number;
          expires_at: number;
        }>(
          'SELECT payload, saved_at, expires_at FROM catalog_cache WHERE scope = ? AND cache_key = ?',
          scope,
          key,
        );
        if (!row) return null;
        if (row.expires_at <= now() || row.saved_at > now()) {
          await value.runAsync(
            'DELETE FROM catalog_cache WHERE scope = ? AND cache_key = ?',
            scope,
            key,
          );
          return null;
        }
        try {
          return {
            data: JSON.parse(row.payload) as unknown,
            savedAt: row.saved_at,
          };
        } catch {
          await value.runAsync(
            'DELETE FROM catalog_cache WHERE scope = ? AND cache_key = ?',
            scope,
            key,
          );
          return null;
        }
      });
    },
    write(
      scope: string,
      key: string,
      payload: unknown,
      version: number,
      signal?: AbortSignal,
    ) {
      return serial(async () => {
        if (disabled || signal?.aborted || generation !== version) return;
        const value = await db();
        if (!value || signal?.aborted || generation !== version) return;
        const json = JSON.stringify(payload);
        if (!json || json.length > 2_000_000) return;
        const savedAt = now();
        await value.runAsync(
          'DELETE FROM catalog_cache WHERE expires_at <= ?',
          savedAt,
        );
        if (signal?.aborted || generation !== version) return;
        await value.runAsync(
          'INSERT INTO catalog_cache(scope, cache_key, payload, saved_at, expires_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(scope, cache_key) DO UPDATE SET payload = excluded.payload, saved_at = excluded.saved_at, expires_at = excluded.expires_at',
          scope,
          key,
          json,
          savedAt,
          savedAt + ttlMs,
        );
        await value.runAsync(
          'DELETE FROM catalog_cache WHERE rowid NOT IN (SELECT rowid FROM catalog_cache ORDER BY saved_at DESC, rowid DESC LIMIT ?)',
          maxEntries,
        );
      });
    },
  };
}
export type CatalogCache = ReturnType<typeof createCatalogCache>;

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
