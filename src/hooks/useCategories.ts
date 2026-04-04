import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { categories, todos } from '../db/schema';

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: () => db.select().from(categories).orderBy(asc(categories.sortOrder)).all(),
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description, color }: { name: string; description?: string; color: string }) => {
      const all = await db.select().from(categories).all();
      const maxOrder = all.reduce((max, c) => Math.max(max, c.sortOrder), 0);
      await db.insert(categories).values({ name, description, color, sortOrder: maxOrder + 1, createdAt: Date.now() }).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, description, color }: { id: number; name: string; description?: string; color: string }) => {
      await db.update(categories).set({ name, description, color }).where(eq(categories.id, id)).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useReorderCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: number[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.update(categories).set({ sortOrder: i }).where(eq(categories.id, orderedIds[i])).run();
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, defaultCategoryId }: { id: number; defaultCategoryId: number }) => {
      // 해당 카테고리의 할 일을 미분류로 재배정
      await db.update(todos).set({ categoryId: defaultCategoryId }).where(eq(todos.categoryId, id)).run();
      await db.delete(categories).where(eq(categories.id, id)).run();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};
