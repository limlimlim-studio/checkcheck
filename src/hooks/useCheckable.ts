type CheckableTodayConfig = {
  mode: 'today';
  todoId: number;
  completedIds: Set<number>;
  toggleFn: (id: number) => void;
};

type CheckableToggleConfig = {
  mode: 'toggle';
  todoId: number;
  isCompleted: number;
  toggleFn: (args: { id: number; isCompleted: number }) => void;
};

type CheckableConfig = CheckableTodayConfig | CheckableToggleConfig;

export function useCheckable(config: CheckableConfig): { checked: boolean; onCheck: () => void } {
  if (config.mode === 'today') {
    return {
      checked: config.completedIds.has(config.todoId),
      onCheck: () => config.toggleFn(config.todoId),
    };
  }
  return {
    checked: config.isCompleted === 1,
    onCheck: () => config.toggleFn({ id: config.todoId, isCompleted: config.isCompleted }),
  };
}
