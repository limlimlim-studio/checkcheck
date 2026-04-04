import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { categories } from '../db/schema';

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: () => db.select().from(categories).all(),
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description, color }: { name: string; description?: string; color: string }) => {
      await db.insert(categories).values({ name, description, color, createdAt: Date.now() }).run();
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

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await db.delete(categories).where(eq(categories.id, id)).run();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};
