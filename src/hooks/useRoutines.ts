import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { and, asc, eq } from 'drizzle-orm';
import dayjs from 'dayjs';
import { db } from '../db';
import { routines, routineCompletions } from '../db/schema';
import { scheduleRoutineNotifications, cancelRoutineNotifications, offsetsToString } from '../utils/notifications';

export const useRoutines = () =>
  useQuery({
    queryKey: ['routines'],
    queryFn: () =>
      db.select().from(routines)
        .where(eq(routines.isActive, 1))
        .orderBy(asc(routines.sortOrder))
        .all(),
  });

export const useCreateRoutine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      title,
      description,
      repeatType,
      repeatValue,
      alarmTime,
      notificationOffsets,
      urgency,
      importance,
    }: {
      categoryId: number;
      title: string;
      description?: string;
      repeatType: string;
      repeatValue?: string;
      alarmTime?: number | null;
      notificationOffsets?: number[];
      urgency?: number;
      importance?: number;
    }) => {
      const all = db.select().from(routines).all();
      const maxOrder = all.reduce((max, r) => Math.max(max, r.sortOrder), 0);
      const now = Date.now();
      const offsets = notificationOffsets ?? [];
      const result = await db.insert(routines).values({
        categoryId,
        title,
        description: description ?? null,
        repeatType,
        repeatValue: repeatValue ?? null,
        alarmTime: alarmTime ?? null,
        notificationOffsets: offsets.length > 0 ? offsetsToString(offsets) : null,
        urgency: urgency ?? 0,
        importance: importance ?? 0,
        sortOrder: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      }).returning({ id: routines.id }).get();
      if (result && alarmTime != null && offsets.length > 0) {
        scheduleRoutineNotifications({ id: result.id, title, alarmTime, notificationOffsets: offsets }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routinesToday'] });
    },
  });
};

export const useUpdateRoutine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      categoryId,
      title,
      description,
      repeatType,
      repeatValue,
      alarmTime,
      notificationOffsets,
      urgency,
      importance,
    }: {
      id: number;
      categoryId: number;
      title: string;
      description?: string;
      repeatType: string;
      repeatValue?: string;
      alarmTime?: number | null;
      notificationOffsets?: number[];
      urgency?: number;
      importance?: number;
    }) => {
      const offsets = notificationOffsets ?? [];
      await db.update(routines).set({
        categoryId,
        title,
        description: description ?? null,
        repeatType,
        repeatValue: repeatValue ?? null,
        alarmTime: alarmTime ?? null,
        notificationOffsets: offsets.length > 0 ? offsetsToString(offsets) : null,
        urgency: urgency ?? 0,
        importance: importance ?? 0,
        updatedAt: Date.now(),
      }).where(eq(routines.id, id)).run();
      await cancelRoutineNotifications(id);
      if (alarmTime != null && offsets.length > 0) {
        scheduleRoutineNotifications({ id, title, alarmTime, notificationOffsets: offsets }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routinesToday'] });
    },
  });
};

export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await db.update(routines).set({
        isActive: 0,
        updatedAt: Date.now(),
      }).where(eq(routines.id, id)).run();
      cancelRoutineNotifications(id).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routinesToday'] });
    },
  });
};

export const useReorderRoutines = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: number[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.update(routines).set({ sortOrder: i }).where(eq(routines.id, orderedIds[i])).run();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routinesToday'] });
    },
  });
};

export const useToggleRoutineCompletion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ routineId, date }: { routineId: number; date: string }) => {
      const existing = db.select().from(routineCompletions)
        .where(and(
          eq(routineCompletions.routineId, routineId),
          eq(routineCompletions.completedDate, date),
        ))
        .get();
      if (existing) {
        await db.delete(routineCompletions)
          .where(and(
            eq(routineCompletions.routineId, routineId),
            eq(routineCompletions.completedDate, date),
          ))
          .run();
      } else {
        await db.insert(routineCompletions).values({ routineId, completedDate: date }).run();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routineCompletions'] });
      queryClient.invalidateQueries({ queryKey: ['routinesToday'] });
      queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
    },
  });
};

/** 오늘 해당하는 루틴 목록 + 완료 여부 */
export const useRoutinesToday = () => {
  const today = dayjs().format('YYYY-MM-DD');
  const dayOfWeek = String(dayjs().day());   // 0=일 ~ 6=토
  const dayOfMonth = String(dayjs().date()); // 1~31

  return useQuery({
    queryKey: ['routinesToday', today],
    queryFn: () => {
      const allRoutines = db.select().from(routines)
        .where(eq(routines.isActive, 1))
        .orderBy(asc(routines.sortOrder))
        .all();

      const todayRoutines = allRoutines.filter((r) => {
        if (r.repeatType === 'daily') return true;
        if (r.repeatType === 'weekly') {
          return r.repeatValue?.split(',').includes(dayOfWeek) ?? false;
        }
        if (r.repeatType === 'monthly') {
          const values = r.repeatValue?.split(',') ?? [];
          const isLastDay = dayjs().date() === dayjs().daysInMonth();
          return values.includes(dayOfMonth) || (isLastDay && values.includes('last'));
        }
        return false;
      });

      const completedIds = new Set(
        db.select().from(routineCompletions)
          .where(eq(routineCompletions.completedDate, today))
          .all()
          .map((rc) => rc.routineId),
      );

      return todayRoutines.map((r) => ({
        ...r,
        isCompletedToday: completedIds.has(r.id),
      }));
    },
  });
};
