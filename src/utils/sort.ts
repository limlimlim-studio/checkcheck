import { Todo } from '../types';
import i18next from 'i18next';

export type SortKey = 'default' | 'deadline' | 'urgency' | 'importance';

export function getSortOptions(): { key: SortKey; label: string }[] {
  return [
    { key: 'default', label: i18next.t('todo.sort_default') },
    { key: 'deadline', label: i18next.t('todo.sort_deadline') },
    { key: 'urgency', label: i18next.t('todo.sort_urgency') },
    { key: 'importance', label: i18next.t('todo.sort_importance') },
  ];
}

export const SORT_OPTIONS = getSortOptions();

export function sortTodos(todos: Todo[], key: SortKey): Todo[] {
  if (key === 'default') {
    return [...todos].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  if (key === 'deadline') {
    return [...todos].sort((a, b) => {
      if (a.dueDate == null) return 1;
      if (b.dueDate == null) return -1;
      return a.dueDate - b.dueDate;
    });
  }
  if (key === 'urgency') {
    return [...todos].sort((a, b) => (b.urgency ?? 0) - (a.urgency ?? 0));
  }
  return [...todos].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
}
