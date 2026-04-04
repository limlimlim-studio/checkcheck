import { openDatabaseAsync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { Platform } from 'react-native';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

// eslint-disable-next-line prefer-const
export let db: Db = null as unknown as Db;

export const initDb = async () => {
  const sqlite = await openDatabaseAsync('todo.db');

  // WAL mode is not supported on web (sql.js)
  if (Platform.OS !== 'web') {
    await sqlite.execAsync('PRAGMA journal_mode = WAL;');
  }

  await sqlite.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6200ee',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS todo_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
      completed_date TEXT NOT NULL
    );
  `);

  db = drizzle(sqlite, { schema });
};
