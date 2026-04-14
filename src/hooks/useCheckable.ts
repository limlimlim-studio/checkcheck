type CheckableTodayConfig = {
  mode: 'today';
  completedIds: Set<number>;
  toggleFn: (id: number) => void;
};

type CheckableToggleConfig = {
  mode: 'toggle';
  toggleFn: (args: { id: number; isCompleted: number }) => void;
};

type CheckableConfig = CheckableTodayConfig | CheckableToggleConfig;

type TodoLike = { id: number; isCompleted: number };

/**
 * 컴포넌트 레벨에서 호출해 per-item 팩토리 함수를 반환한다.
 * renderItem 안에서는 반환된 함수를 호출하면 됨.
 *
 * const getCheckable = useCheckable({ mode: 'today', completedIds, toggleFn: todayToggle });
 * // renderItem:
 * const { checked, onCheck } = getCheckable(item);
 */
export function useCheckable(config: CheckableConfig) {
  if (config.mode === 'today') {
    const { completedIds, toggleFn } = config;
    return (todo: TodoLike) => ({
      checked: completedIds.has(todo.id),
      onCheck: () => toggleFn(todo.id),
    });
  }
  const { toggleFn } = config;
  return (todo: TodoLike) => ({
    checked: todo.isCompleted === 1,
    onCheck: () => toggleFn({ id: todo.id, isCompleted: todo.isCompleted }),
  });
}
