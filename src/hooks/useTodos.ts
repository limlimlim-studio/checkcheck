import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { and, asc, desc, eq, gte, isNull, lt, or } from 'drizzle-orm';
import dayjs from 'dayjs';
import { db } from '../db';
import { todos, todoCompletions } from '../db/schema';

export const useTodos = (isCompleted: 0 | 1) =>
  useQuery({
    queryKey: ['todos', isCompleted],
    queryFn: () =>
      db.select().from(todos)
        .where(and(eq(todos.isCompleted, isCompleted), eq(todos.isDeleted, 0)))
        .orderBy(isCompleted === 1 ? desc(todos.completedAt) : asc(todos.sortOrder))
        .all(),
  });

/** 오늘 탭: 기한 == 오늘 AND 미완료 */
export const useTodosToday = () => {
  const todayStart = dayjs().startOf('day').valueOf();
  const todayEnd = dayjs().endOf('day').valueOf();
  return useQuery({
    queryKey: ['todos', 'today'],
    queryFn: () =>
      db.select().from(todos)
        .where(and(
          eq(todos.isCompleted, 0),
          eq(todos.isDeleted, 0),
          gte(todos.dueDate, todayStart),
          lt(todos.dueDate, todayEnd + 1),
        ))
        .orderBy(asc(todos.sortOrder))
        .all(),
  });
};

/** 할 일 탭: 기한 >= 오늘 AND 미완료 (기한 없는 항목도 포함) */
export const useTodosList = () => {
  const todayStart = dayjs().startOf('day').valueOf();
  return useQuery({
    queryKey: ['todos', 'list'],
    queryFn: () =>
      db.select().from(todos)
        .where(and(
          eq(todos.isCompleted, 0),
          eq(todos.isDeleted, 0),
          or(isNull(todos.dueDate), gte(todos.dueDate, todayStart)),
        ))
        .orderBy(asc(todos.sortOrder))
        .all(),
  });
};

/** 미완료 탭: 기한 < 오늘 AND 미완료 */
export const useTodosOverdue = () => {
  const todayStart = dayjs().startOf('day').valueOf();
  return useQuery({
    queryKey: ['todos', 'overdue'],
    queryFn: () =>
      db.select().from(todos)
        .where(and(
          eq(todos.isCompleted, 0),
          eq(todos.isDeleted, 0),
          lt(todos.dueDate, todayStart),
        ))
        .orderBy(asc(todos.sortOrder))
        .all(),
  });
};

/** 완료 탭: 완료된 항목, 최신순 */
export const useTodosCompleted = () =>
  useQuery({
    queryKey: ['todos', 'completed'],
    queryFn: () =>
      db.select().from(todos)
        .where(and(eq(todos.isCompleted, 1), eq(todos.isDeleted, 0)))
        .orderBy(desc(todos.completedAt))
        .all(),
  });

/** 오늘 탭 전용: 오늘 완료 체크된 todoId Set */
export const useTodayCompletionIds = () => {
  const today = dayjs().format('YYYY-MM-DD');
  return useQuery({
    queryKey: ['todayCompletionIds', today],
    queryFn: () => {
      const records = db.select().from(todoCompletions)
        .where(eq(todoCompletions.completedDate, today))
        .all();
      return new Set(records.map((r) => r.todoId));
    },
  });
};

/** 오늘 탭 전용 토글: isCompleted 변경 없이 todo_completions만 기록 */
export const useTodayToggle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const today = dayjs().format('YYYY-MM-DD');
      const existing = db.select().from(todoCompletions)
        .where(and(eq(todoCompletions.todoId, id), eq(todoCompletions.completedDate, today)))
        .get();
      if (existing) {
        await db.delete(todoCompletions)
          .where(and(eq(todoCompletions.todoId, id), eq(todoCompletions.completedDate, today)))
          .run();
      } else {
        await db.insert(todoCompletions).values({ todoId: id, completedDate: today }).run();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayCompletionIds'] });
      queryClient.invalidateQueries({ queryKey: ['todos', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
    },
  });
};

/** 기한/완료 체크: 아래 두 조건 중 하나라도 해당하면 isCompleted=1로 이동.
 *  1. 기한이 지난 항목 중 완료 기록이 있는 경우
 *  2. 기한에 관계없이 이전 날짜에 완료 기록된 항목 (어제 이전에 체크한 항목)
 *  앱 포그라운드 진입 및 탭 포커스 시 실행, 하루 1회만 실제 처리 */
let _lastDueDateCheckDate = '';

export const runDueDateCheck = async (): Promise<boolean> => {
  const today = dayjs().format('YYYY-MM-DD');
  if (_lastDueDateCheckDate === today) return false;
  _lastDueDateCheckDate = today;

  const todayStart = dayjs().startOf('day').valueOf();
  let changed = false;

  // 1. 기한이 지난 항목 중 완료 기록 있는 경우
  const overdueTodos = db.select().from(todos)
    .where(and(eq(todos.isCompleted, 0), eq(todos.isDeleted, 0), lt(todos.dueDate, todayStart)))
    .all();

  for (const todo of overdueTodos) {
    const completion = db.select().from(todoCompletions)
      .where(eq(todoCompletions.todoId, todo.id))
      .get();
    if (completion) {
      const now = Date.now();
      await db.update(todos).set({
        isCompleted: 1,
        completedAt: now,
        updatedAt: now,
      }).where(eq(todos.id, todo.id)).run();
      changed = true;
    }
  }

  // 2. 이전 날짜에 체크된 항목 (오늘 이전 completedDate 기록이 있는 미완료 항목)
  const prevCompletions = db.select({ todoId: todoCompletions.todoId })
    .from(todoCompletions)
    .where(lt(todoCompletions.completedDate, today))
    .all();

  const prevIds = [...new Set(prevCompletions.map((r) => r.todoId))];
  for (const id of prevIds) {
    const todo = db.select().from(todos)
      .where(and(eq(todos.id, id), eq(todos.isCompleted, 0), eq(todos.isDeleted, 0)))
      .get();
    if (todo) {
      const now = Date.now();
      await db.update(todos).set({
        isCompleted: 1,
        completedAt: now,
        updatedAt: now,
      }).where(eq(todos.id, id)).run();
      changed = true;
    }
  }

  return changed;
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      title,
      description,
      dueDate,
      urgency,
      importance,
    }: {
      categoryId: number;
      title: string;
      description?: string;
      dueDate?: number;
      urgency?: number;
      importance?: number;
    }) => {
      const all = db.select().from(todos)
        .where(and(eq(todos.isCompleted, 0), eq(todos.isDeleted, 0)))
        .all();
      const minOrder = all.reduce((min, t) => Math.min(min, t.sortOrder), 0);
      const now = Date.now();
      await db.insert(todos).values({
        categoryId,
        title,
        description: description ?? null,
        dueDate: dueDate ?? null,
        urgency: urgency ?? 0,
        importance: importance ?? 0,
        sortOrder: minOrder - 1,
        createdAt: now,
        updatedAt: now,
      }).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      categoryId,
      title,
      description,
      dueDate,
      urgency,
      importance,
    }: {
      id: number;
      categoryId: number;
      title: string;
      description?: string;
      dueDate?: number;
      urgency?: number;
      importance?: number;
    }) => {
      await db.update(todos).set({
        categoryId,
        title,
        description: description ?? null,
        dueDate: dueDate ?? null,
        urgency: urgency ?? 0,
        importance: importance ?? 0,
        updatedAt: Date.now(),
      }).where(eq(todos.id, id)).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useToggleTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: number }) => {
      const newCompleted = isCompleted === 1 ? 0 : 1;
      const now = Date.now();
      await db.update(todos).set({
        isCompleted: newCompleted,
        completedAt: newCompleted === 1 ? now : null,
        updatedAt: now,
      }).where(eq(todos.id, id)).run();

      const today = new Date().toISOString().split('T')[0];
      if (newCompleted === 1) {
        await db.insert(todoCompletions).values({ todoId: id, completedDate: today }).run();
      } else {
        await db.delete(todoCompletions)
          .where(and(eq(todoCompletions.todoId, id), eq(todoCompletions.completedDate, today)))
          .run();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todayCompletionIds'] });
      queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await db.update(todos).set({
        isDeleted: 1,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      }).where(eq(todos.id, id)).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useClearCompleted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const now = Date.now();
      await db.update(todos).set({
        isDeleted: 1,
        deletedAt: now,
        updatedAt: now,
      }).where(and(eq(todos.isCompleted, 1), eq(todos.isDeleted, 0))).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useReorderTodos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: number[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.update(todos).set({ sortOrder: i }).where(eq(todos.id, orderedIds[i])).run();
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};
