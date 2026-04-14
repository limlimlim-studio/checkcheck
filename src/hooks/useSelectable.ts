import { useState, useCallback } from 'react';

export function useSelectable<T extends { id: number }>(items: T[]) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const startSelecting = useCallback(() => setIsSelecting(true), []);

  const clearSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((t) => t.id)));
  }, [items]);

  return { isSelecting, selectedIds, startSelecting, clearSelection, toggleSelection, selectAll };
}
