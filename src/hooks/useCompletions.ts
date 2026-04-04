import { useQuery } from '@tanstack/react-query';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { todoCompletions, todos } from '../db/schema';

// 특정 카테고리 + 년도 범위의 날짜별 완료 수 반환
// { '2026-01-03': 2, '2026-01-05': 1, ... }
export const useCompletionsByCategory = (categoryId: number, year: number) =>
  useQuery({
    queryKey: ['completions', categoryId, year],
    queryFn: () => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const rows = db
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

      const map: Record<string, number> = {};
      for (const row of rows) {
        map[row.completedDate] = row.count;
      }
      return map;
    },
  });
