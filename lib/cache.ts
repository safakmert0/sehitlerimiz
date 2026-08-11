import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('sehitlerimiz.db');
  }
  return dbPromise;
}

export async function initCache() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS hero_cache (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      saved_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS conflicts_cache (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
  `);
}

export async function cacheHeroes(heroes: { id: string; data: unknown }[]) {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const h of heroes) {
      await db.runAsync(
        'INSERT OR REPLACE INTO hero_cache (id, data, saved_at) VALUES (?, ?, ?)',
        h.id,
        JSON.stringify(h.data),
        now
      );
    }
  });
}

export async function getCachedHeroes(): Promise<unknown[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM hero_cache ORDER BY saved_at DESC');
  return rows.map((r) => JSON.parse(r.data));
}

export async function cacheConflicts(conflicts: { id: string; name: string; sort_order: number }[]) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const c of conflicts) {
      await db.runAsync(
        'INSERT OR REPLACE INTO conflicts_cache (id, name, sort_order) VALUES (?, ?, ?)',
        c.id,
        c.name,
        c.sort_order
      );
    }
  });
}

export async function getCachedConflicts() {
  const db = await getDb();
  return db.getAllAsync<{ id: string; name: string; sort_order: number }>(
    'SELECT id, name, sort_order FROM conflicts_cache ORDER BY sort_order'
  );
}

export async function clearCache() {
  const db = await getDb();
  await db.execAsync('DELETE FROM hero_cache; DELETE FROM conflicts_cache;');
}
