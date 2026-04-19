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
  dueTime: int('due_time'), // minutes from midnight (0-1439), null = no time set
  notificationOffsets: text('notification_offsets'), // comma-separated offset minutes e.g. "0,10,30"
  urgency: int('urgency').default(0),
  importance: int('importance').default(0),
  sortOrder: int('sort_order').notNull().default(0),
  isCompleted: int('is_completed').notNull().default(0),
  completedAt: int('completed_at'),
  isDeleted: int('is_deleted').notNull().default(0),
  deletedAt: int('deleted_at'),
  createdAt: int('created_at').notNull(),
  updatedAt: int('updated_at').notNull(),
});

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const todoCompletions = sqliteTable('todo_completions', {
  id: int('id').primaryKey({ autoIncrement: true }),
  todoId: int('todo_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  completedDate: text('completed_date').notNull(), // 'YYYY-MM-DD'
});

export const routines = sqliteTable('routines', {
  id: int('id').primaryKey({ autoIncrement: true }),
  categoryId: int('category_id')
    .notNull()
    .references(() => categories.id),
  title: text('title').notNull(),
  description: text('description'),
  repeatType: text('repeat_type').notNull(), // 'daily' | 'weekly' | 'monthly'
  repeatValue: text('repeat_value'),         // weekly: '1,3,5' (0=일), monthly: '15' (날짜)
  alarmTime: int('alarm_time'), // minutes from midnight (0-1439), null = no alarm
  notificationOffsets: text('notification_offsets'), // comma-separated offset minutes e.g. "0,10,30"
  urgency: int('urgency').default(0),
  importance: int('importance').default(0),
  sortOrder: int('sort_order').notNull().default(0),
  isActive: int('is_active').notNull().default(1),
  createdAt: int('created_at').notNull(),
  updatedAt: int('updated_at').notNull(),
});

export const routineCompletions = sqliteTable('routine_completions', {
  id: int('id').primaryKey({ autoIncrement: true }),
  routineId: int('routine_id')
    .notNull()
    .references(() => routines.id, { onDelete: 'cascade' }),
  completedDate: text('completed_date').notNull(), // 'YYYY-MM-DD'
});
