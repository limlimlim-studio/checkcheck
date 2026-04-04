import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { todos, todoCompletions } from '../db/schema';

export const useTodos = (categoryId?: number) =>
  useQuery({
    queryKey: ['todos', categoryId],
    queryFn: () => {
      if (categoryId !== undefined) {
        return db.select().from(todos).where(eq(todos.categoryId, categoryId)).all();
      }
      return db.select().from(todos).all();
    },
  });

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      title,
      description,
    }: {
      categoryId: number;
      title: string;
      description?: string;
    }) => {
      const now = Date.now();
      await db
        .insert(todos)
        .values({ categoryId, title, description: description ?? null, createdAt: now, updatedAt: now })
        .run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
    }: {
      id: number;
      title: string;
      description?: string;
    }) => {
      await db
        .update(todos)
        .set({ title, description: description ?? null, updatedAt: Date.now() })
        .where(eq(todos.id, id))
        .run();
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
      await db
        .update(todos)
        .set({
          isCompleted: newCompleted,
          completedAt: newCompleted === 1 ? now : null,
          updatedAt: now,
        })
        .where(eq(todos.id, id))
        .run();

      if (newCompleted === 1) {
        const today = new Date().toISOString().split('T')[0];
        await db
          .insert(todoCompletions)
          .values({ todoId: id, completedDate: today })
          .run();
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

export const useCompletions = (todoId: number) =>
  useQuery({
    queryKey: ['completions', todoId],
    queryFn: () =>
      db.select().from(todoCompletions).where(eq(todoCompletions.todoId, todoId)).all(),
  });
