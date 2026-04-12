import { useQuery } from '@tanstack/react-query';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { todoCompletions, todos, routineCompletions, routines } from '../db/schema';

const CURRENT_YEAR = new Date().getFullYear();

export const useEarliestCompletionYear = () =>
  useQuery({
    queryKey: ['completions', 'earliest-year'],
    queryFn: () => {
      const todoRow = db
        .select({ minDate: sql<string>`min(${todoCompletions.completedDate})` })
        .from(todoCompletions)
        .get();
      const routineRow = db
        .select({ minDate: sql<string>`min(${routineCompletions.completedDate})` })
        .from(routineCompletions)
        .get();

      const dates = [todoRow?.minDate, routineRow?.minDate].filter(Boolean) as string[];
      if (dates.length === 0) return CURRENT_YEAR;
      const earliest = dates.sort()[0];
      return parseInt(earliest.slice(0, 4), 10);
    },
  });

// 특정 카테고리 + 년도 범위의 날짜별 완료 수 반환 (todo + routine 합산)
// { '2026-01-03': 2, '2026-01-05': 1, ... }
export const useCompletionsByCategory = (categoryId: number, year: number) =>
  useQuery({
    queryKey: ['completions', categoryId, year],
    queryFn: () => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const todoRows = db
        .select({
          completedDate: todoCompletions.completedDate,
          count: sql<number>`count(*)`,
        })
        .from(todoCompletions)
        .innerJoin(todos, eq(todoCompletions.todoId, todos.id))
        .where(
          and(
            eq(todos.categoryId, categoryId),
            gte(todoCompletions.completedDate, startDate),
            lte(todoCompletions.completedDate, endDate)
          )
        )
        .groupBy(todoCompletions.completedDate)
        .all();

      const routineRows = db
        .select({
          completedDate: routineCompletions.completedDate,
          count: sql<number>`count(*)`,
        })
        .from(routineCompletions)
        .innerJoin(routines, eq(routineCompletions.routineId, routines.id))
        .where(
          and(
            eq(routines.categoryId, categoryId),
            gte(routineCompletions.completedDate, startDate),
            lte(routineCompletions.completedDate, endDate)
          )
        )
        .groupBy(routineCompletions.completedDate)
        .all();

      const map: Record<string, number> = {};
      for (const row of todoRows) {
        map[row.completedDate] = (map[row.completedDate] ?? 0) + row.count;
      }
      for (const row of routineRows) {
        map[row.completedDate] = (map[row.completedDate] ?? 0) + row.count;
      }
      return map;
    },
  });
