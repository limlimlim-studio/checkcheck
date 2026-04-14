import { useMemo } from 'react';
import { Category } from '../types';

export function useCategoryMap(categories: Category[]): Map<number, Category> {
  return useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
}
