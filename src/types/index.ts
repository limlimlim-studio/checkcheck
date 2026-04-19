export interface Category {
  id: number;
  name: string;
  color: string;
  createdAt: number;
}

export interface Todo {
  id: number;
  categoryId: number;
  title: string;
  description: string | null;
  dueDate: number | null;
  dueTime: number | null; // minutes from midnight (0-1439), null = no time set
  urgency: number | null;
  importance: number | null;
  isCompleted: number; // 0 | 1 (SQLite boolean)
  completedAt: number | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface TodoCompletion {
  id: number;
  todoId: number;
  completedDate: string; // 'YYYY-MM-DD'
}
