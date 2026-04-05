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
  isCompleted: number; // 0 | 1 (SQLite boolean)
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface TodoCompletion {
  id: number;
  todoId: number;
  completedDate: string; // 'YYYY-MM-DD'
}
