import dayjs from 'dayjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { categories, todos, routines, todoCompletions, routineCompletions } from '../db/schema';

export type SampleLocale = 'ko' | 'en' | 'zh' | 'ja';

const sampleFiles: Record<SampleLocale, () => SampleData> = {
  ko: () => require('../data/sample/ko.json'),
  en: () => require('../data/sample/en.json'),
  zh: () => require('../data/sample/zh.json'),
  ja: () => require('../data/sample/ja.json'),
};

interface SampleCategory {
  key: string;
  name: string;
  color: string;
  description: string;
  sortOrder: number;
}

interface SampleRoutine {
  categoryKey: string;
  title: string;
  description: string | null;
  repeatType: string;
  repeatValue: string | null;
  alarmTime: number | null;
  urgency: number;
  importance: number;
  sortOrder: number;
  completionRate: number;
  completionDays: number;
}

interface SampleTodo {
  categoryKey: string;
  title: string;
  description: string | null;
  dueDateOffset: number;
  dueTime?: number | null;
  urgency: number;
  importance: number;
  isCompleted: boolean;
  completedAtOffset: number | null;
  sortOrder: number;
}

interface SampleData {
  defaultCategoryName: string;
  categories: SampleCategory[];
  routines: SampleRoutine[];
  todos: SampleTodo[];
}

function makeDailyCompletions(
  routineId: number,
  days: number,
  rate: number,
): { routineId: number; completedDate: string }[] {
  const records: { routineId: number; completedDate: string }[] = [];
  const seed = routineId * 7919;
  const today = dayjs().startOf('day');
  for (let i = days; i >= 1; i--) {
    const pseudo = Math.abs(Math.sin(seed + i * 13));
    if (pseudo < rate) {
      records.push({ routineId, completedDate: today.subtract(i, 'day').format('YYYY-MM-DD') });
    }
  }
  return records;
}

function makeWeeklyCompletions(
  routineId: number,
  days: number,
  weekdays: number[],
  rate: number,
): { routineId: number; completedDate: string }[] {
  const records: { routineId: number; completedDate: string }[] = [];
  const seed = routineId * 6271;
  const today = dayjs().startOf('day');
  for (let i = days; i >= 1; i--) {
    const d = today.subtract(i, 'day');
    if (!weekdays.includes(d.day())) continue;
    const pseudo = Math.abs(Math.sin(seed + i * 17));
    if (pseudo < rate) {
      records.push({ routineId, completedDate: d.format('YYYY-MM-DD') });
    }
  }
  return records;
}

export function applySampleData(locale: SampleLocale): {
  categories: number;
  routines: number;
  todos: number;
  routineCompletions: number;
  todoCompletions: number;
} {
  const data = sampleFiles[locale]();
  const now = Date.now();
  const today = dayjs().startOf('day');

  // 1. 기존 데이터 삭제 (todos → cascade todoCompletions, routines → cascade routineCompletions)
  db.delete(todos).run();
  db.delete(routines).run();
  db.delete(categories).where(eq(categories.isDefault, 0)).run();

  // 2. 기본 카테고리 이름 로컬라이즈
  db.update(categories)
    .set({ name: data.defaultCategoryName })
    .where(eq(categories.isDefault, 1))
    .run();

  const defaultCat = db.select({ id: categories.id }).from(categories).where(eq(categories.isDefault, 1)).get();
  const defaultId = defaultCat?.id ?? 1;

  // 3. 카테고리 삽입 & key→id 맵 생성
  const catKeyToId: Record<string, number> = {};
  for (const cat of data.categories) {
    const result = db.insert(categories).values({
      name: cat.name,
      description: cat.description,
      color: cat.color,
      sortOrder: cat.sortOrder,
      isDefault: 0,
      createdAt: now,
    }).returning({ id: categories.id }).get();
    if (result) catKeyToId[cat.key] = result.id;
  }

  // 4. 루틴 삽입 + 완료 이력 생성
  const routineCompletionInserts: { routineId: number; completedDate: string }[] = [];
  let routineCount = 0;

  for (const r of data.routines) {
    const categoryId = catKeyToId[r.categoryKey] ?? defaultId;
    const result = db.insert(routines).values({
      categoryId,
      title: r.title,
      description: r.description ?? null,
      repeatType: r.repeatType,
      repeatValue: r.repeatValue ?? null,
      alarmTime: r.alarmTime ?? null,
      urgency: r.urgency,
      importance: r.importance,
      sortOrder: r.sortOrder,
      isActive: 1,
      createdAt: now - 86400000 * r.completionDays,
      updatedAt: now,
    }).returning({ id: routines.id }).get();

    if (!result) continue;
    routineCount++;

    if (r.repeatType === 'daily') {
      routineCompletionInserts.push(...makeDailyCompletions(result.id, r.completionDays, r.completionRate));
    } else if (r.repeatType === 'weekly' && r.repeatValue) {
      const weekdays = r.repeatValue.split(',').map(Number);
      routineCompletionInserts.push(...makeWeeklyCompletions(result.id, r.completionDays, weekdays, r.completionRate));
    }
  }

  if (routineCompletionInserts.length > 0) {
    db.insert(routineCompletions).values(routineCompletionInserts).run();
  }

  // 5. 할 일 삽입 + 완료 이력 생성
  const todoCompletionInserts: { todoId: number; completedDate: string }[] = [];
  let todoCount = 0;

  for (const todo of data.todos) {
    const categoryId = catKeyToId[todo.categoryKey] ?? defaultId;
    const dueDate = today.add(todo.dueDateOffset, 'day').valueOf();
    const completedAt = todo.completedAtOffset != null
      ? today.add(todo.completedAtOffset, 'day').valueOf()
      : null;

    const result = db.insert(todos).values({
      categoryId,
      title: todo.title,
      description: todo.description ?? null,
      dueDate,
      dueTime: todo.dueTime ?? null,
      urgency: todo.urgency,
      importance: todo.importance,
      sortOrder: todo.sortOrder,
      isCompleted: todo.isCompleted ? 1 : 0,
      completedAt,
      isDeleted: 0,
      createdAt: now - Math.floor(Math.abs(Math.sin(todo.sortOrder * 1234)) * 86400000 * 30),
      updatedAt: now,
    }).returning({ id: todos.id, isCompleted: todos.isCompleted, completedAt: todos.completedAt }).get();

    if (!result) continue;
    todoCount++;

    if (result.isCompleted === 1 && result.completedAt) {
      todoCompletionInserts.push({
        todoId: result.id,
        completedDate: dayjs(result.completedAt).format('YYYY-MM-DD'),
      });
    }
  }

  if (todoCompletionInserts.length > 0) {
    db.insert(todoCompletions).values(todoCompletionInserts).run();
  }

  return {
    categories: data.categories.length,
    routines: routineCount,
    todos: todoCount,
    routineCompletions: routineCompletionInserts.length,
    todoCompletions: todoCompletionInserts.length,
  };
}
