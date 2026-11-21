import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, existsSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createCatalogCache,
  loadCachedCatalog,
  OfflineCacheMissError,
} from '../src/features/offline/data/cache.ts';

function fixture(t, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'aquabloom-sqlite-'));
  const filename = join(directory, 'catalog.db');
  let db = new DatabaseSync(filename);
  const adapter = {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, ...params) {
      return db.prepare(sql).run(...params);
    },
    async getFirstAsync(sql, ...params) {
      return db.prepare(sql).get(...params) ?? null;
    },
  };
  t.after(() => {
    db.close();
    for (const suffix of ['', '-wal', '-shm']) {
      const file = filename + suffix;
      if (existsSync(file)) unlinkSync(file);
    }
    rmdirSync(directory);
  });
  return {
    adapter,
    cache: createCatalogCache(async () => adapter, options),
    reopen() {
      db.close();
      db = new DatabaseSync(filename);
      return createCatalogCache(async () => adapter, options);
    },
  };
}
const value = { name: 'Ranco' };
function parse(data) {
  assert.equal(typeof data?.name, 'string');
  return { name: data.name };
}
class NetworkFailure extends Error {}
function query(cache, overrides = {}) {
  return loadCachedCatalog({
    cache,
    scope: 'api/user/public',
    key: 'detail/1',
    parse,
    load: async () => value,
    offline: false,
    isNetworkError: (error) => error instanceof NetworkFailure,
    invalidateOnError: (error) => [401, 403, 404].includes(error?.status),
    ...overrides,
  });
}

test('migrates and persists real SQLite data across closing and reopening', async (t) => {
  const f = fixture(t);
  await query(f.cache);
  const reopened = f.reopen();
  const result = await query(reopened, {
    offline: true,
    load: async () => assert.fail('network'),
  });
  assert.deepEqual(result.data, value);
  assert.equal(result.source, 'cache');
  assert.equal(
    (await f.adapter.getFirstAsync('PRAGMA user_version')).user_version,
    1,
  );
});
test('separates users, API environments and query filters', async (t) => {
  const { cache } = fixture(t);
  await query(cache);
  for (const changes of [
    { scope: 'api/other/public' },
    { scope: 'other-api/user/public' },
    { key: 'detail/2' },
  ]) {
    await assert.rejects(
      query(cache, { offline: true, ...changes }),
      OfflineCacheMissError,
    );
  }
});
test('expires data at the TTL boundary and removes it from disk', async (t) => {
  let now = 1000;
  const { cache, adapter } = fixture(t, { now: () => now, ttlMs: 100 });
  await query(cache);
  now = 1099;
  assert.equal((await query(cache, { offline: true })).source, 'cache');
  now = 1100;
  await assert.rejects(query(cache, { offline: true }), OfflineCacheMissError);
  assert.equal(
    (await adapter.getFirstAsync('SELECT count(*) AS count FROM catalog_cache'))
      .count,
    0,
  );
});
test('bounds stored entries and safely binds SQL parameters', async (t) => {
  const { cache, adapter } = fixture(t, { maxEntries: 2 });
  await query(cache, { key: 'one' });
  await query(cache, { key: 'two' });
  const key = "three'); DROP TABLE catalog_cache;--";
  await query(cache, { key });
  assert.equal(
    (await adapter.getFirstAsync('SELECT count(*) AS count FROM catalog_cache'))
      .count,
    2,
  );
  assert.deepEqual((await query(cache, { key, offline: true })).data, value);
  await assert.rejects(
    query(cache, { key: 'one', offline: true }),
    OfflineCacheMissError,
  );
});
test('clear invalidates stale writes and deletes all account scopes', async (t) => {
  const { cache } = fixture(t);
  const oldVersion = cache.version();
  await query(cache);
  await query(cache, { scope: 'second-user' });
  await cache.clear();
  await cache.write('api/user/public', 'detail/1', value, oldVersion);
  await assert.rejects(query(cache, { offline: true }), OfflineCacheMissError);
  await assert.rejects(
    query(cache, { scope: 'second-user', offline: true }),
    OfflineCacheMissError,
  );
});
test('a late network response after logout cannot repopulate SQLite', async (t) => {
  const { cache } = fixture(t);
  let resolve;
  const pending = query(cache, {
    load: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  await cache.clear();
  resolve(value);
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(await cache.read('api/user/public', 'detail/1'), null);
});
test('falls back only for transport failure and reports the stored timestamp', async (t) => {
  const { cache } = fixture(t, { now: () => 1234 });
  await query(cache);
  const result = await query(cache, {
    load: async () => {
      throw new NetworkFailure();
    },
  });
  assert.equal(result.source, 'cache');
  assert.equal(result.savedAt, 1234);
});
test('does not hide 401, 403, 404, 500 or validation errors with cached content', async (t) => {
  const { cache } = fixture(t);
  for (const status of [401, 403, 404, 500]) {
    await query(cache);
    await assert.rejects(
      query(cache, {
        load: async () => {
          throw { status };
        },
      }),
      (error) => error.status === status,
    );
    if (status !== 500)
      await assert.rejects(
        query(cache, { offline: true }),
        OfflineCacheMissError,
      );
  }
  await assert.rejects(
    query(cache, { load: async () => ({ unexpected: true }) }),
    /string/,
  );
});
test('discards corrupt JSON and schema-invalid cached data', async (t) => {
  const { cache, adapter } = fixture(t);
  await query(cache);
  await adapter.runAsync('UPDATE catalog_cache SET payload = ?', '{broken');
  await assert.rejects(query(cache, { offline: true }), OfflineCacheMissError);
  await cache.write('api/user/public', 'detail/1', {}, cache.version());
  await assert.rejects(query(cache, { offline: true }), OfflineCacheMissError);
  assert.equal(
    (await adapter.getFirstAsync('SELECT count(*) AS count FROM catalog_cache'))
      .count,
    0,
  );
});
test('successful online reads survive unavailable persistence', async () => {
  const cache = createCatalogCache(async () => {
    throw new Error('disk unavailable');
  });
  assert.deepEqual((await query(cache)).data, value);
  await assert.rejects(query(cache, { offline: true }), OfflineCacheMissError);
});
test('failed cache cleanup disables reads until cleanup succeeds', async (t) => {
  const f = fixture(t);
  let fail = false;
  const cache = createCatalogCache(async () => ({
    ...f.adapter,
    async runAsync(sql, ...params) {
      if (fail && sql === 'DELETE FROM catalog_cache')
        throw new Error('disk error');
      return f.adapter.runAsync(sql, ...params);
    },
  }));
  await query(cache);
  fail = true;
  await assert.rejects(cache.clear(), /disk error/);
  assert.equal(await cache.read('api/user/public', 'detail/1'), null);
  fail = false;
  await cache.clear();
  assert.equal(await cache.read('api/user/public', 'detail/1'), null);
});
test('respects cancellation and does not replace valid data with canceled results', async (t) => {
  const { cache } = fixture(t);
  await query(cache);
  const controller = new AbortController();
  await assert.rejects(
    query(cache, {
      signal: controller.signal,
      load: async () => {
        controller.abort();
        return { name: 'canceled' };
      },
    }),
    { name: 'AbortError' },
  );
  assert.deepEqual((await query(cache, { offline: true })).data, value);
});
test('updates persisted content after connectivity returns', async (t) => {
  const { cache } = fixture(t);
  await query(cache);
  const result = await query(cache, {
    load: async () => ({ name: 'updated' }),
  });
  assert.equal(result.source, 'network');
  assert.equal((await query(cache, { offline: true })).data.name, 'updated');
});
test('refuses newer database schemas without changing their version', async (t) => {
  const { cache, adapter } = fixture(t);
  await adapter.execAsync('PRAGMA user_version = 2');
  await assert.rejects(cache.read('a', 'b'), /no compatible/);
  assert.equal(
    (await adapter.getFirstAsync('PRAGMA user_version')).user_version,
    2,
  );
});
test('rejects cache entries saved in the future after a clock change', async (t) => {
  let now = 2000;
  const { cache } = fixture(t, { now: () => now });
  await query(cache);
  now = 1000;
  await assert.rejects(query(cache, { offline: true }), OfflineCacheMissError);
});
