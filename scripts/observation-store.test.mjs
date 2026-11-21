import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createDraftStore,
  createSessionDraftStore,
} from '../src/features/observations/data/draftStore.ts';
import { saveObservation } from '../src/features/observations/application/saveObservation.ts';
import { deleteObservation } from '../src/features/observations/application/deleteObservation.ts';

const parse = (value) => value;
const record = (overrides = {}) => ({
  version: 1,
  id: '11111111-1111-4111-8111-111111111111',
  ownerId: 'franco',
  apiScope: 'api-a',
  values: {
    lakeId: '22222222-2222-4222-8222-222222222222',
    observedAt: '2026-10-07T12:00:00Z',
    note: 'Nota inicial',
    location: null,
    photoUri: null,
  },
  savedAt: '2026-10-07T12:01:00Z',
  status: 'pending_send',
  ...overrides,
});
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'aquabloom-observation-test-'));
  const filename = join(directory, 'drafts.db');
  let database = new DatabaseSync(filename);
  const adapter = {
    async execAsync(sql) {
      database.exec(sql);
    },
    async runAsync(sql, ...params) {
      return database.prepare(sql).run(...params);
    },
    async getFirstAsync(sql, ...params) {
      return database.prepare(sql).get(...params) ?? null;
    },
    async getAllAsync(sql, ...params) {
      return database.prepare(sql).all(...params);
    },
  };
  t.after(() => {
    database.close();
    rmSync(directory, { recursive: true });
  });
  return {
    directory,
    adapter,
    store: createDraftStore(async () => adapter, parse),
    reopen() {
      database.close();
      database = new DatabaseSync(filename);
      return createDraftStore(async () => adapter, parse);
    },
  };
}
test('recovers the same pending draft after closing and reopening SQLite', async (t) => {
  const f = fixture(t);
  const input = record();
  await f.store.save(input);
  assert.deepEqual(
    await f.reopen().latest(input.apiScope, input.ownerId, input.values.lakeId),
    input,
  );
});

test('migrates a v1 draft transactionally, preserves payload and existing catalog cache', async (t) => {
  const f = fixture(t);
  const input = record({
    values: {
      ...record().values,
      observedAt: '2026-10-14T09:00:00-03:00',
      photoUri: 'file:///documents/old.jpg',
      location: {
        latitude: -39.6,
        longitude: -72.3,
        accuracy: 4,
        capturedAt: '2026-10-14T12:00:00Z',
      },
    },
  });
  await f.adapter
    .execAsync(`CREATE TABLE observation_form_drafts (api_scope TEXT NOT NULL, owner_id TEXT NOT NULL, id TEXT NOT NULL, lake_id TEXT NOT NULL, payload TEXT NOT NULL, saved_at TEXT NOT NULL, PRIMARY KEY (api_scope, owner_id, id));
    CREATE TABLE catalog_cache (payload TEXT); INSERT INTO catalog_cache VALUES ('catalog preserved'); PRAGMA user_version = 1;`);
  await f.adapter.runAsync(
    'INSERT INTO observation_form_drafts VALUES (?, ?, ?, ?, ?, ?)',
    input.apiScope,
    input.ownerId,
    input.id,
    input.values.lakeId,
    JSON.stringify(input),
    input.savedAt,
  );
  assert.deepEqual(
    await f.store.latest(input.apiScope, input.ownerId, input.values.lakeId),
    input,
  );
  const row = await f.adapter.getFirstAsync(
    'SELECT * FROM observation_form_drafts',
  );
  assert.equal(row.observed_at, '2026-10-14T12:00:00.000Z');
  assert.equal(row.latitude, -39.6);
  assert.equal(row.longitude, -72.3);
  assert.equal(row.accuracy, 4);
  assert.equal(row.note, input.values.note);
  assert.equal(row.photo_uri, input.values.photoUri);
  assert.equal(row.local_status, 'pending_send');
  assert.equal(
    (await f.adapter.getFirstAsync('PRAGMA user_version')).user_version,
    2,
  );
  assert.equal(
    (await f.adapter.getFirstAsync('SELECT payload FROM catalog_cache'))
      .payload,
    'catalog preserved',
  );
  assert.deepEqual(
    await f.reopen().list(input.apiScope, input.ownerId, input.values.lakeId),
    [input],
  );
});

test('failed migration rolls back columns and version without destroying the old draft', async (t) => {
  const f = fixture(t);
  await f.adapter
    .execAsync(`CREATE TABLE observation_form_drafts (api_scope TEXT NOT NULL, owner_id TEXT NOT NULL, id TEXT NOT NULL, lake_id TEXT NOT NULL, payload TEXT NOT NULL, saved_at TEXT NOT NULL, PRIMARY KEY (api_scope, owner_id, id));
    INSERT INTO observation_form_drafts VALUES ('a','b','c','d','{broken','date'); PRAGMA user_version = 1;`);
  await assert.rejects(f.store.latest('a', 'b', 'd'), /malformed JSON/);
  assert.equal(
    (await f.adapter.getFirstAsync('PRAGMA user_version')).user_version,
    1,
  );
  assert.equal(
    (
      await f.adapter.getFirstAsync(
        'SELECT payload FROM observation_form_drafts',
      )
    ).payload,
    '{broken',
  );
  assert.equal(
    (
      await f.adapter.getAllAsync('PRAGMA table_info(observation_form_drafts)')
    ).some((column) => column.name === 'observed_at'),
    false,
  );
});

test('lists all own drafts after restart and deletes only the selected owner/API/UUID', async (t) => {
  const f = fixture(t);
  const first = record();
  const second = record({
    id: '33333333-3333-4333-8333-333333333333',
    savedAt: '2026-10-14T12:00:00Z',
  });
  await f.store.save(first);
  await f.store.save(second);
  await f.store.save(record({ ownerId: 'other' }));
  await f.store.save(record({ apiScope: 'other-api' }));
  const reopened = f.reopen();
  assert.deepEqual(
    await reopened.list(first.apiScope, first.ownerId, first.values.lakeId),
    [second, first],
  );
  assert.deepEqual(
    await reopened.list(first.apiScope, 'signed-out', first.values.lakeId),
    [],
  );
  await reopened.remove(first.apiScope, first.ownerId, first.id);
  await reopened.remove(first.apiScope, first.ownerId, first.id);
  assert.deepEqual(
    await reopened.list(first.apiScope, first.ownerId, first.values.lakeId),
    [second],
  );
  assert.equal(
    (await reopened.latest(first.apiScope, 'other', first.values.lakeId))
      .ownerId,
    'other',
  );
  assert.equal(
    (await reopened.latest('other-api', first.ownerId, first.values.lakeId))
      .apiScope,
    'other-api',
  );
});

test('offline capture with a real photo survives SQLite restart and deletes only its managed directory', async (t) => {
  const f = fixture(t);
  const temporary = join(f.directory, 'camera.jpg');
  writeFileSync(temporary, 'photo fixture bytes');
  const scopeDirectory = (scope) =>
    join(f.directory, 'documents', scope.ownerId, scope.draftId);
  const photos = {
    async prepare(uri, scope) {
      const dir = scopeDirectory(scope);
      mkdirSync(dir, { recursive: true });
      const target = join(dir, 'photo.jpg');
      if (fileURLToPath(uri) === target) return { uri, created: false };
      copyFileSync(fileURLToPath(uri), target);
      return { uri: pathToFileURL(target).href, created: true };
    },
    async removeCreated(uri) {
      rmSync(fileURLToPath(uri));
    },
    async removeDraft(scope) {
      rmSync(scopeDirectory(scope), { recursive: true, force: true });
    },
  };
  const input = record({
    values: {
      ...record().values,
      photoUri: pathToFileURL(temporary).href,
      location: {
        latitude: -39.6,
        longitude: -72.3,
        accuracy: 5,
        capturedAt: '2026-10-14T12:00:00Z',
      },
    },
  });
  const saved = await saveObservation(input, f.store, photos);
  await saveObservation(saved, f.store, photos);
  await saveObservation({ ...input, ownerId: 'other' }, f.store, photos);
  rmSync(temporary);
  const reopened = f.reopen();
  const recovered = await reopened.latest(
    saved.apiScope,
    saved.ownerId,
    saved.values.lakeId,
  );
  assert.deepEqual(recovered, saved);
  assert.equal(
    readFileSync(fileURLToPath(recovered.values.photoUri), 'utf8'),
    'photo fixture bytes',
  );
  assert.equal(
    (await reopened.list(saved.apiScope, saved.ownerId, saved.values.lakeId))
      .length,
    1,
  );
  const other = await reopened.latest(
    saved.apiScope,
    'other',
    saved.values.lakeId,
  );
  await deleteObservation(
    { apiScope: saved.apiScope, ownerId: saved.ownerId, draftId: saved.id },
    reopened,
    photos,
  );
  assert.equal(
    await reopened.latest(saved.apiScope, saved.ownerId, saved.values.lakeId),
    null,
  );
  assert.equal(existsSync(fileURLToPath(saved.values.photoUri)), false);
  assert.equal(existsSync(fileURLToPath(other.values.photoUri)), true);
});

test('session adapter supports multiple scoped drafts and selected deletion', async () => {
  const store = createSessionDraftStore(parse);
  await store.save(record());
  await store.save(record({ ownerId: 'other' }));
  await store.remove('other-api', record().ownerId, record().id);
  assert.equal(
    (
      await store.list(
        record().apiScope,
        record().ownerId,
        record().values.lakeId,
      )
    ).length,
    1,
  );
  await store.remove(record().apiScope, record().ownerId, record().id);
  assert.deepEqual(
    await store.list(
      record().apiScope,
      record().ownerId,
      record().values.lakeId,
    ),
    [],
  );
  assert.equal(
    (await store.list(record().apiScope, 'other', record().values.lakeId))
      .length,
    1,
  );
});
test('persists complete capture fields and the durable photo reference after reopening SQLite', async (t) => {
  const f = fixture(t);
  const input = record({
    values: {
      ...record().values,
      photoUri: 'file:///camera/temp.jpg',
      location: {
        latitude: -39.64,
        longitude: -72.33,
        accuracy: 5,
        capturedAt: '2026-10-14T12:00:00Z',
      },
    },
  });
  const photos = {
    async prepare() {
      return { uri: 'file:///documents/managed.jpg', created: true };
    },
    async removeCreated() {
      assert.fail('successful save must not remove its photo');
    },
  };
  const saved = await saveObservation(input, f.store, photos);
  const recovered = await f
    .reopen()
    .latest(input.apiScope, input.ownerId, input.values.lakeId);
  assert.deepEqual(recovered, saved);
  assert.equal(recovered.values.photoUri, 'file:///documents/managed.jpg');
  assert.equal(recovered.status, 'pending_send');
});
test('a failed photo preparation preserves the preceding SQLite draft and its photograph', async (t) => {
  const f = fixture(t);
  const previous = record({
    values: { ...record().values, photoUri: 'file:///documents/old.jpg' },
  });
  await f.store.save(previous);
  const changed = record({
    values: {
      ...previous.values,
      photoUri: 'file:///camera/missing.jpg',
      note: 'Unsaved change',
    },
  });
  await assert.rejects(
    saveObservation(changed, f.store, {
      async prepare() {
        throw new Error('source missing');
      },
      async removeCreated() {
        assert.fail('nothing was copied');
      },
    }),
    /source missing/,
  );
  assert.deepEqual(
    await f
      .reopen()
      .latest(previous.apiScope, previous.ownerId, previous.values.lakeId),
    previous,
  );
});
test('updates a UUID without duplicating it and binds the note safely', async (t) => {
  const f = fixture(t);
  await f.store.save(record());
  const updated = record({
    values: {
      ...record().values,
      note: "'); DROP TABLE observation_form_drafts;--",
    },
  });
  await f.store.save(updated);
  assert.deepEqual(
    await f.store.latest(
      updated.apiScope,
      updated.ownerId,
      updated.values.lakeId,
    ),
    updated,
  );
  assert.equal(
    (
      await f.adapter.getFirstAsync(
        'SELECT count(*) AS count FROM observation_form_drafts',
      )
    ).count,
    1,
  );
});
test('isolates user, API environment and lake while preserving other owners records', async (t) => {
  const { store } = fixture(t);
  const input = record();
  await store.save(input);
  assert.equal(
    await store.latest(input.apiScope, 'other', input.values.lakeId),
    null,
  );
  assert.equal(
    await store.latest('other-api', input.ownerId, input.values.lakeId),
    null,
  );
  assert.equal(
    await store.latest(input.apiScope, input.ownerId, 'other-lake'),
    null,
  );
  await store.save(record({ ownerId: 'other' }));
  assert.equal(
    (await store.latest(input.apiScope, input.ownerId, input.values.lakeId))
      .ownerId,
    'franco',
  );
});
test('does not overwrite or silently discard malformed stored content', async (t) => {
  const f = fixture(t);
  const input = record();
  await f.store.save(input);
  await f.adapter.runAsync(
    'UPDATE observation_form_drafts SET payload = ?',
    '{broken',
  );
  await assert.rejects(
    f.store.latest(input.apiScope, input.ownerId, input.values.lakeId),
    SyntaxError,
  );
  assert.equal(
    (
      await f.adapter.getFirstAsync(
        'SELECT count(*) AS count FROM observation_form_drafts',
      )
    ).count,
    1,
  );
});
test('rejects a payload that claims another owner despite the scoped row', async (t) => {
  const f = fixture(t);
  const input = record();
  await f.store.save(input);
  await f.adapter.runAsync(
    'UPDATE observation_form_drafts SET payload = ?',
    JSON.stringify(record({ ownerId: 'other' })),
  );
  await assert.rejects(
    f.store.latest(input.apiScope, input.ownerId, input.values.lakeId),
    /contexto/,
  );
});
test('retries opening storage after failure and does not downgrade a newer schema', async (t) => {
  const f = fixture(t);
  let attempts = 0;
  const store = createDraftStore(async () => {
    if (++attempts === 1) throw new Error('disk unavailable');
    return f.adapter;
  }, parse);
  await assert.rejects(store.save(record()), /disk unavailable/);
  await store.save(record());
  await f.adapter.execAsync('PRAGMA user_version = 3');
  await assert.rejects(f.reopen().save(record()), /no compatible/);
  assert.equal(
    (await f.adapter.getFirstAsync('PRAGMA user_version')).user_version,
    3,
  );
});
test('browser adapter declares session storage and isolates identities', async () => {
  const store = createSessionDraftStore(parse);
  const input = record();
  await store.save(input);
  assert.equal(store.durability, 'session');
  assert.equal(
    await store.latest(input.apiScope, 'other', input.values.lakeId),
    null,
  );
  assert.deepEqual(
    await store.latest(input.apiScope, input.ownerId, input.values.lakeId),
    input,
  );
  assert.equal(
    await createSessionDraftStore(parse).latest(
      input.apiScope,
      input.ownerId,
      input.values.lakeId,
    ),
    null,
  );
});
