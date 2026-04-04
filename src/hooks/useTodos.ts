import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { todos, todoCompletions } from '../db/schema';

export const useTodos = (isCompleted: 0 | 1) =>
  useQuery({
    queryKey: ['todos', isCompleted],
    queryFn: () =>
      db.select().from(todos).where(eq(todos.isCompleted, isCompleted)).all(),
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
      const now = Date.now();
      await db.insert(todos).values({
        categoryId,
        title,
        description: description ?? null,
        dueDate: dueDate ?? null,
        urgency: urgency ?? 0,
        importance: importance ?? 0,
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

      if (newCompleted === 1) {
        const today = new Date().toISOString().split('T')[0];
        await db.insert(todoCompletions).values({ todoId: id, completedDate: today }).run();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['completions'] });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await db.delete(todos).where(eq(todos.id, id)).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useClearCompleted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await db.delete(todos).where(eq(todos.isCompleted, 1)).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};
