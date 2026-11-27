import type { StoredObservation } from '../../domain/observations/observationSchema';
import type { ObservationStore } from '../../domain/observations/ObservationStore';

export type DraftDatabase = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (
    sql: string,
    ...params: (string | number | null)[]
  ) => Promise<unknown>;
  getFirstAsync: <T>(
    sql: string,
    ...params: (string | number | null)[]
  ) => Promise<T | null>;
  getAllAsync: <T>(
    sql: string,
    ...params: (string | number | null)[]
  ) => Promise<T[]>;
};
export type { ObservationStore } from '../../domain/observations/ObservationStore';

// Dedicated UI adapter; does not migrate or clear the shared catalog cache.
export function createDraftStore(
  open: () => Promise<DraftDatabase>,
  parse: (data: unknown) => StoredObservation,
): ObservationStore {
  let database: Promise<DraftDatabase> | undefined;
  const db = () =>
    (database ??= open()
      .then(async (value) => {
        const version = await value.getFirstAsync<{ user_version: number }>(
          'PRAGMA user_version',
        );
        if ((version?.user_version ?? 0) > 2)
          throw new Error('Versión de borradores no compatible.');
        if (version?.user_version === 2) return value;
        await value.execAsync('BEGIN IMMEDIATE;');
        try {
          await value.execAsync(`
      CREATE TABLE IF NOT EXISTS observation_form_drafts (
        api_scope TEXT NOT NULL, owner_id TEXT NOT NULL, id TEXT NOT NULL,
        lake_id TEXT NOT NULL, payload TEXT NOT NULL, saved_at TEXT NOT NULL,
        PRIMARY KEY (api_scope, owner_id, id)
      );
      CREATE INDEX IF NOT EXISTS observation_form_lake ON observation_form_drafts(api_scope, owner_id, lake_id, saved_at);
      ALTER TABLE observation_form_drafts ADD COLUMN observed_at TEXT;
      ALTER TABLE observation_form_drafts ADD COLUMN latitude REAL;
      ALTER TABLE observation_form_drafts ADD COLUMN longitude REAL;
      ALTER TABLE observation_form_drafts ADD COLUMN accuracy REAL;
      ALTER TABLE observation_form_drafts ADD COLUMN note TEXT;
      ALTER TABLE observation_form_drafts ADD COLUMN photo_uri TEXT;
      ALTER TABLE observation_form_drafts ADD COLUMN local_status TEXT;
      UPDATE observation_form_drafts SET
        observed_at = strftime('%Y-%m-%dT%H:%M:%fZ', json_extract(payload, '$.values.observedAt')),
        latitude = json_extract(payload, '$.values.location.latitude'),
        longitude = json_extract(payload, '$.values.location.longitude'),
        accuracy = json_extract(payload, '$.values.location.accuracy'),
        note = json_extract(payload, '$.values.note'),
        photo_uri = json_extract(payload, '$.values.photoUri'),
        local_status = json_extract(payload, '$.status');
      PRAGMA user_version = 2;
    `);
          await value.execAsync('COMMIT;');
        } catch (error) {
          await value.execAsync('ROLLBACK;');
          throw error;
        }
        return value;
      })
      .catch((error: unknown) => {
        database = undefined;
        throw error;
      }));
  return {
    durability: 'device',
    async save(input) {
      const record = parse(input);
      const value = await db();
      await value.runAsync(
        `INSERT INTO observation_form_drafts(api_scope, owner_id, id, lake_id, payload, saved_at, observed_at, latitude, longitude, accuracy, note, photo_uri, local_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(api_scope, owner_id, id) DO UPDATE SET lake_id = excluded.lake_id, payload = excluded.payload, saved_at = excluded.saved_at,
         observed_at = excluded.observed_at, latitude = excluded.latitude, longitude = excluded.longitude, accuracy = excluded.accuracy,
         note = excluded.note, photo_uri = excluded.photo_uri, local_status = excluded.local_status`,
        record.apiScope,
        record.ownerId,
        record.id,
        record.values.lakeId,
        JSON.stringify(record),
        record.savedAt,
        new Date(record.values.observedAt).toISOString(),
        record.values.location?.latitude ?? null,
        record.values.location?.longitude ?? null,
        record.values.location?.accuracy ?? null,
        record.values.note,
        record.values.photoUri,
        record.status,
      );
    },
    async remove(apiScope, ownerId, id) {
      const value = await db();
      await value.runAsync(
        'DELETE FROM observation_form_drafts WHERE api_scope = ? AND owner_id = ? AND id = ?',
        apiScope,
        ownerId,
        id,
      );
    },
    async list(apiScope, ownerId, lakeId) {
      const value = await db();
      const rows = await value.getAllAsync<{ id: string; payload: string }>(
        'SELECT id, payload FROM observation_form_drafts WHERE api_scope = ? AND owner_id = ? AND lake_id = ? ORDER BY saved_at DESC, rowid DESC',
        apiScope,
        ownerId,
        lakeId,
      );
      return rows.map((row) => {
        const record = parse(JSON.parse(row.payload));
        if (
          record.id !== row.id ||
          record.apiScope !== apiScope ||
          record.ownerId !== ownerId ||
          record.values.lakeId !== lakeId
        )
          throw new Error('El borrador no corresponde al contexto actual.');
        return record;
      });
    },
    async latest(apiScope, ownerId, lakeId) {
      const value = await db();
      const row = await value.getFirstAsync<{ id: string; payload: string }>(
        'SELECT id, payload FROM observation_form_drafts WHERE api_scope = ? AND owner_id = ? AND lake_id = ? ORDER BY saved_at DESC, rowid DESC LIMIT 1',
        apiScope,
        ownerId,
        lakeId,
      );
      if (!row) return null;
      const record = parse(JSON.parse(row.payload));
      if (
        record.id !== row.id ||
        record.apiScope !== apiScope ||
        record.ownerId !== ownerId ||
        record.values.lakeId !== lakeId
      )
        throw new Error('El borrador no corresponde al contexto actual.');
      return record;
    },
  };
}

export function createSessionDraftStore(
  parse: (data: unknown) => StoredObservation,
): ObservationStore {
  const records = new Map<string, StoredObservation>();
  return {
    durability: 'session',
    async save(input) {
      const record = parse(input);
      records.set(
        JSON.stringify([record.apiScope, record.ownerId, record.id]),
        record,
      );
    },
    async remove(apiScope, ownerId, id) {
      records.delete(JSON.stringify([apiScope, ownerId, id]));
    },
    async list(apiScope, ownerId, lakeId) {
      return [...records.values()]
        .filter(
          (record) =>
            record.apiScope === apiScope &&
            record.ownerId === ownerId &&
            record.values.lakeId === lakeId,
        )
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    },
    async latest(apiScope, ownerId, lakeId) {
      return (
        [...records.values()]
          .filter(
            (record) =>
              record.apiScope === apiScope &&
              record.ownerId === ownerId &&
              record.values.lakeId === lakeId,
          )
          .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
          .at(0) ?? null
      );
    },
  };
}
