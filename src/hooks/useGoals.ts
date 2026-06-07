import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { goals, goalTodos } from '../db/schema';

export const useGoal = (id: number) =>
  useQuery({
    queryKey: ['goals', 'detail', id],
    queryFn: () => db.select().from(goals).where(eq(goals.id, id)).get() ?? null,
  });

export const useGoalsActive = () =>
  useQuery({
    queryKey: ['goals', 'active'],
    queryFn: () =>
      db.select().from(goals)
        .where(eq(goals.isCompleted, 0))
        .orderBy(asc(goals.sortOrder))
        .all(),
  });

export const useGoalsDone = () =>
  useQuery({
    queryKey: ['goals', 'done'],
    queryFn: () =>
      db.select().from(goals)
        .where(eq(goals.isCompleted, 1))
        .orderBy(desc(goals.completedAt))
        .all(),
  });

export const useGoalTodos = (goalId: number) =>
  useQuery({
    queryKey: ['goalTodos', goalId],
    queryFn: () =>
      db.select().from(goalTodos)
        .where(eq(goalTodos.goalId, goalId))
        .orderBy(asc(goalTodos.sortOrder))
        .all(),
  });

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      title,
      description,
      dueDate,
    }: {
      categoryId: number;
      title: string;
      description?: string;
      dueDate?: number;
    }) => {
      const all = db.select().from(goals).where(eq(goals.isCompleted, 0)).all();
      const minOrder = all.reduce((min, g) => Math.min(min, g.sortOrder), 0);
      const now = Date.now();
      await db.insert(goals).values({
        categoryId,
        title,
        description: description ?? null,
        dueDate: dueDate ?? null,
        sortOrder: minOrder - 1,
        createdAt: now,
        updatedAt: now,
      }).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      categoryId,
      title,
      description,
      dueDate,
    }: {
      id: number;
      categoryId: number;
      title: string;
      description?: string;
      dueDate?: number;
    }) => {
      await db.update(goals).set({
        categoryId,
        title,
        description: description ?? null,
        dueDate: dueDate ?? null,
        updatedAt: Date.now(),
      }).where(eq(goals.id, id)).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await db.delete(goals).where(eq(goals.id, id)).run();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};

export const useCreateGoalTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      goalId,
      title,
      description,
      urgency,
      importance,
    }: {
      goalId: number;
      title: string;
      description?: string;
      urgency?: number;
      importance?: number;
    }) => {
      const all = db.select().from(goalTodos).where(eq(goalTodos.goalId, goalId)).all();
      const maxOrder = all.reduce((max, t) => Math.max(max, t.sortOrder), -1);
      const now = Date.now();
      await db.insert(goalTodos).values({
        goalId,
        title,
        description: description ?? null,
        urgency: urgency ?? 0,
        importance: importance ?? 0,
        sortOrder: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      }).run();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['goalTodos', vars.goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

export const useUpdateGoalTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      goalId,
      title,
      description,
      urgency,
      importance,
    }: {
      id: number;
      goalId: number;
      title: string;
      description?: string;
      urgency?: number;
      importance?: number;
    }) => {
      await db.update(goalTodos).set({
        title,
        description: description ?? null,
        urgency: urgency ?? 0,
        importance: importance ?? 0,
        updatedAt: Date.now(),
      }).where(eq(goalTodos.id, id)).run();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['goalTodos', vars.goalId] });
    },
  });
};

export const useDeleteGoalTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, goalId }: { id: number; goalId: number }) => {
      await db.delete(goalTodos).where(eq(goalTodos.id, id)).run();
      await syncGoalCompletion(goalId);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['goalTodos', vars.goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

export const useToggleGoalTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, goalId, isCompleted }: { id: number; goalId: number; isCompleted: number }) => {
      const newCompleted = isCompleted === 1 ? 0 : 1;
      const now = Date.now();
      await db.update(goalTodos).set({
        isCompleted: newCompleted,
        completedAt: newCompleted === 1 ? now : null,
        updatedAt: now,
      }).where(eq(goalTodos.id, id)).run();
      await syncGoalCompletion(goalId);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['goalTodos', vars.goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

async function syncGoalCompletion(goalId: number) {
  const all = db.select().from(goalTodos).where(eq(goalTodos.goalId, goalId)).all();
  if (all.length === 0) {
    await db.update(goals).set({ isCompleted: 0, completedAt: null, updatedAt: Date.now() })
      .where(eq(goals.id, goalId)).run();
    return;
  }
  const allDone = all.every(t => t.isCompleted === 1);
  const now = Date.now();
  await db.update(goals).set({
    isCompleted: allDone ? 1 : 0,
    completedAt: allDone ? now : null,
    updatedAt: now,
  }).where(eq(goals.id, goalId)).run();
}
