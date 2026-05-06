import { useQuery } from '@tanstack/react-query';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from '../db';
import { todoCompletions, todos, routineCompletions, routines, categories } from '../db/schema';

export type RoutineCompletionRecord = {
  completionId: number;
  routineId: number;
  title: string;
  urgency: number | null;
  importance: number | null;
  completedDate: string; // YYYY-MM-DD
};

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

export const useRoutineCompletionsByCategory = (categoryId: number) =>
  useQuery({
    queryKey: ['completions', 'routine', categoryId],
    queryFn: (): RoutineCompletionRecord[] =>
      db.select({
        completionId: routineCompletions.id,
        routineId: routineCompletions.routineId,
        title: routines.title,
        urgency: routines.urgency,
        importance: routines.importance,
        completedDate: routineCompletions.completedDate,
      })
      .from(routineCompletions)
      .innerJoin(routines, eq(routineCompletions.routineId, routines.id))
      .where(eq(routines.categoryId, categoryId))
      .orderBy(desc(routineCompletions.completedDate))
      .all(),
  });

export type AllRoutineCompletionRecord = RoutineCompletionRecord & {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
};

export const useAllRoutineCompletions = () =>
  useQuery({
    queryKey: ['completions', 'routine', 'all'],
    queryFn: (): AllRoutineCompletionRecord[] =>
      db.select({
        completionId: routineCompletions.id,
        routineId: routineCompletions.routineId,
        title: routines.title,
        urgency: routines.urgency,
        importance: routines.importance,
        completedDate: routineCompletions.completedDate,
        categoryId: routines.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(routineCompletions)
      .innerJoin(routines, eq(routineCompletions.routineId, routines.id))
      .innerJoin(categories, eq(routines.categoryId, categories.id))
      .orderBy(desc(routineCompletions.completedDate))
      .all(),
  });

// 전체 잔디 전용: 0=빈셀, 1~7=10%~100% 균등 7단계
const ALL_OPACITY_HEX = ['', '1A', '40', '66', '8C', 'B3', 'D9', 'FF'];

// 전체 카테고리 날짜별 지배 카테고리 색상 맵 (전체 잔디용)
// { 'YYYY-MM-DD': '#RRGGBBAA', ... }
export const useAllCompletionsByYear = (year: number) =>
  useQuery({
    queryKey: ['completions', 'all', year],
    queryFn: () => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const todoRows = db
        .select({
          completedDate: todoCompletions.completedDate,
          categoryId: todos.categoryId,
          categoryColor: categories.color,
          count: sql<number>`count(*)`,
        })
        .from(todoCompletions)
        .innerJoin(todos, eq(todoCompletions.todoId, todos.id))
        .innerJoin(categories, eq(todos.categoryId, categories.id))
        .where(and(
          gte(todoCompletions.completedDate, startDate),
          lte(todoCompletions.completedDate, endDate),
        ))
        .groupBy(todoCompletions.completedDate, todos.categoryId)
        .all();

      const routineRows = db
        .select({
          completedDate: routineCompletions.completedDate,
          categoryId: routines.categoryId,
          categoryColor: categories.color,
          count: sql<number>`count(*)`,
        })
        .from(routineCompletions)
        .innerJoin(routines, eq(routineCompletions.routineId, routines.id))
        .innerJoin(categories, eq(routines.categoryId, categories.id))
        .where(and(
          gte(routineCompletions.completedDate, startDate),
          lte(routineCompletions.completedDate, endDate),
        ))
        .groupBy(routineCompletions.completedDate, routines.categoryId)
        .all();

      const dateMap: Record<string, Record<number, { color: string; count: number }>> = {};

      for (const row of [...todoRows, ...routineRows]) {
        if (!dateMap[row.completedDate]) dateMap[row.completedDate] = {};
        const entry = dateMap[row.completedDate][row.categoryId];
        if (entry) entry.count += row.count;
        else dateMap[row.completedDate][row.categoryId] = { color: row.categoryColor, count: row.count };
      }

      const result: Record<string, string> = {};
      for (const [date, cats] of Object.entries(dateMap)) {
        let maxCount = 0;
        let dominantColor = '';
        let totalCount = 0;
        for (const { color, count } of Object.values(cats)) {
          totalCount += count;
          if (count > maxCount) { maxCount = count; dominantColor = color; }
        }
        result[date] = dominantColor + ALL_OPACITY_HEX[Math.min(totalCount, 7)];
      }
      return result;
    },
  });
