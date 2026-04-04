import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

// eslint-disable-next-line prefer-const
export let db: Db = null as unknown as Db;

export const initDb = async () => {
  const sqlite = openDatabaseSync('todo.db');

  sqlite.execSync('PRAGMA journal_mode = WAL;');
  sqlite.execSync('PRAGMA foreign_keys = ON;');

  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL DEFAULT '#6200ee',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      title TEXT NOT NULL,
      description TEXT,
      due_date INTEGER,
      urgency INTEGER NOT NULL DEFAULT 0,
      importance INTEGER NOT NULL DEFAULT 0,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS todo_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
      completed_date TEXT NOT NULL
    );
  `);

  db = drizzle(sqlite, { schema });

  const existing = db.select().from(schema.categories).all();
  if (existing.length === 0) {
    const now = Date.now();
    db.insert(schema.categories).values([
      { name: '미분류', description: '카테고리 없는 할 일', color: '#9E9E9E', sortOrder: 0, isDefault: 1, createdAt: now },
      { name: '업무', description: '직장 관련 할 일', color: '#4285F4', sortOrder: 1, isDefault: 0, createdAt: now },
      { name: '개인', description: '개인적인 할 일', color: '#EA4335', sortOrder: 2, isDefault: 0, createdAt: now },
      { name: '운동', description: '운동 및 건강 관리', color: '#34A853', sortOrder: 3, isDefault: 0, createdAt: now },
      { name: '학습', description: '공부 및 자기계발', color: '#FBBC05', sortOrder: 4, isDefault: 0, createdAt: now },
      { name: '쇼핑', description: '구매 목록', color: '#9C27B0', sortOrder: 5, isDefault: 0, createdAt: now },
    ]).run();
  }
};
