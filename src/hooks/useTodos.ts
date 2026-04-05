import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { and, asc, desc, eq } from 'drizzle-orm';
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
