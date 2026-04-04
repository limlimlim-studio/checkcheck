import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: int('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6200ee'),
  sortOrder: int('sort_order').notNull().default(0),
  isDefault: int('is_default').notNull().default(0), // 1 = 미분류 (삭제/수정 불가)
  createdAt: int('created_at').notNull(),
});

export const todos = sqliteTable('todos', {
  id: int('id').primaryKey({ autoIncrement: true }),
  categoryId: int('category_id')
    .notNull()
    .references(() => categories.id), // cascade delete 제거 → 앱에서 미분류로 재배정
  title: text('title').notNull(),
  description: text('description'),
  dueDate: int('due_date'),
  urgency: int('urgency').default(0),
  importance: int('importance').default(0),
  isCompleted: int('is_completed').notNull().default(0),
  completedAt: int('completed_at'),
  createdAt: int('created_at').notNull(),
  updatedAt: int('updated_at').notNull(),
});

export const todoCompletions = sqliteTable('todo_completions', {
  id: int('id').primaryKey({ autoIncrement: true }),
  todoId: int('todo_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  completedDate: text('completed_date').notNull(), // 'YYYY-MM-DD'
});
