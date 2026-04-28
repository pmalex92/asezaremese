import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'seating-planner.sqlite');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const STATE_ID = 'current-event';

const EMPTY_EVENT = {
  name: '',
  tables: [],
  guests: [],
  updatedAt: null,
};

export const normalizeEvent = (input = {}) => ({
  name: typeof input.name === 'string' ? input.name : '',
  tables: Array.isArray(input.tables) ? input.tables : [],
  guests: Array.isArray(input.guests) ? input.guests : [],
  updatedAt: input.updatedAt ?? null,
});

export const getEvent = () => {
  const row = db.prepare('SELECT data, updated_at FROM app_state WHERE id = ?').get(STATE_ID);
  if (!row) return { ...EMPTY_EVENT };

  try {
    const parsed = JSON.parse(row.data);
    return normalizeEvent({ ...parsed, updatedAt: row.updated_at });
  } catch {
    return { ...EMPTY_EVENT };
  }
};

export const saveEvent = (event) => {
  const now = new Date().toISOString();
  const normalized = normalizeEvent({ ...event, updatedAt: now });

  db.prepare(`
    INSERT INTO app_state (id, data, updated_at)
    VALUES (@id, @data, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at
  `).run({
    id: STATE_ID,
    data: JSON.stringify(normalized),
    updated_at: now,
  });

  return normalized;
};

export const resetEvent = () => {
  db.prepare('DELETE FROM app_state WHERE id = ?').run(STATE_ID);
  return { ...EMPTY_EVENT };
};

export { DB_PATH };
