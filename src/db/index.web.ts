// Web: sql.js ASM.js 버전 사용 (SharedArrayBuffer 불필요)
import initSqlJs from 'sql.js/dist/sql-asm.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

// eslint-disable-next-line prefer-const
export let db: Db = null as unknown as Db;

const DDL = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
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
`;

export const initDb = async () => {
  const SQL = await initSqlJs();
  const client = new SQL.Database();

  client.run('PRAGMA foreign_keys = ON;');
  client.run(DDL);

  db = drizzle(client, { schema });

  // 기본 카테고리 시드
  const existing = db.select().from(schema.categories).all();
  if (existing.length === 0) {
    const now = Date.now();
    db.insert(schema.categories).values([
      { name: '업무', description: '직장 관련 할 일', color: '#4285F4', createdAt: now },
      { name: '개인', description: '개인적인 할 일', color: '#EA4335', createdAt: now },
      { name: '운동', description: '운동 및 건강 관리', color: '#34A853', createdAt: now },
      { name: '학습', description: '공부 및 자기계발', color: '#FBBC05', createdAt: now },
      { name: '쇼핑', description: '구매 목록', color: '#9C27B0', createdAt: now },
    ]).run();
  }
};
