import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: int('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6200ee'),
  createdAt: int('created_at').notNull(),
});

export const todos = sqliteTable('todos', {
  id: int('id').primaryKey({ autoIncrement: true }),
  categoryId: int('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: int('due_date'),             // timestamp
  urgency: int('urgency').default(0),   // 0~3
  importance: int('importance').default(0), // 0~3
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
