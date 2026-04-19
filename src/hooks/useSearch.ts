import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { todos, routines } from '../db/schema';

export function useSearch(query: string) {
  const { data: allTodos = [] } = useQuery({
    queryKey: ['todos', 'all'],
    queryFn: () =>
      db.select().from(todos)
        .where(and(eq(todos.isDeleted, 0), eq(todos.isCompleted, 0)))
        .all(),
  });

  const { data: allRoutines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: () =>
      db.select().from(routines)
        .where(eq(routines.isActive, 1))
        .all(),
  });

  const q = query.trim().toLowerCase();

  const filteredTodos = useMemo(() => {
    if (!q) return [];
    return allTodos.filter((t) => t.title.toLowerCase().includes(q));
  }, [allTodos, q]);

  const filteredRoutines = useMemo(() => {
    if (!q) return [];
    return allRoutines.filter((r) => r.title.toLowerCase().includes(q));
  }, [allRoutines, q]);

  return { todos: filteredTodos, routines: filteredRoutines };
}
