import { Todo } from '../types';

export type SortKey = 'default' | 'deadline' | 'urgency' | 'importance';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: '기본순' },
  { key: 'deadline', label: '기한순' },
  { key: 'urgency', label: '긴급도순' },
  { key: 'importance', label: '중요도순' },
];

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
