import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Colors } from '../theme';
import { useTodosList, useTodayCompletionIds, useTodayToggle, useReorderTodos } from '../hooks/useTodos';
import { useCategories } from '../hooks/useCategories';
import { useCategoryMap } from '../hooks/useCategoryMap';
import { useCheckable } from '../hooks/useCheckable';
import { useDraggable } from '../hooks/useDraggable';
import TodoItem from './TodoItem';
import DateSeparator from './DateSeparator';
import { TodoStackParamList } from '../navigation/TodoStack';
import { Todo } from '../types';
import { toDateKey, formatDueDateLabel } from '../utils/date';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;

type ListItem =
  | { type: 'header'; key: string; label: string }
  | { type: 'todo'; key: string; todo: Todo };

function buildGroupedList(todos: Todo[]): ListItem[] {
  const sorted = [...todos].sort((a, b) => {
    if (a.dueDate === null && b.dueDate === null) return a.sortOrder - b.sortOrder;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate - b.dueDate || a.sortOrder - b.sortOrder;
  });

  const result: ListItem[] = [];
  let lastKey = '';
  for (const todo of sorted) {
    const key = toDateKey(todo.dueDate);
    if (key !== lastKey) {
      result.push({ type: 'header', key: `header-${key}`, label: formatDueDateLabel(todo.dueDate) });
      lastKey = key;
    }
    result.push({ type: 'todo', key: `todo-${todo.id}`, todo });
  }
  return result;
}

export default function TodoTabList() {
  const navigation = useNavigation<Nav>();
  const { data: todos = [] } = useTodosList();
  const { data: completedIds = new Set<number>() } = useTodayCompletionIds();
  const { data: categories = [] } = useCategories();
  const { mutate: todayToggle } = useTodayToggle();
  const { mutate: reorderTodos } = useReorderTodos();

  const categoryMap = useCategoryMap(categories);
  const getCheckable = useCheckable({ mode: 'today', completedIds, toggleFn: todayToggle });
  const { activationDistance, autoscrollThreshold, autoscrollSpeed } =
    useDraggable<Todo>({ reorderFn: reorderTodos });

  const listItems = useMemo(() => buildGroupedList(todos as Todo[]), [todos]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    if (item.type === 'header') {
      return <DateSeparator label={item.label} />;
    }
    const { checked, onCheck } = getCheckable(item.todo);
    return (
      <ScaleDecorator>
        <TodoItem
          todo={item.todo}
          category={categoryMap.get(item.todo.categoryId)}
          checked={checked}
          onCheck={onCheck}
          onPress={() => navigation.navigate('TodoForm', { todo: item.todo })}
          onDrag={drag}
          isDragging={isActive}
          showDescription
        />
      </ScaleDecorator>
    );
  };

  return (
    <DraggableFlatList
      data={listItems}
      keyExtractor={(item) => item.key}
      ItemSeparatorComponent={({ leadingItem }) =>
        leadingItem?.type === 'header' ? null : <Divider />
      }
      ListEmptyComponent={<Text style={styles.empty}>할 일이 없어요</Text>}
      renderItem={renderItem}
      onDragEnd={({ data }) => {
        const ids = data
          .filter((item): item is Extract<ListItem, { type: 'todo' }> => item.type === 'todo')
          .map((item) => item.todo.id);
        reorderTodos(ids);
      }}
      activationDistance={activationDistance}
      autoscrollThreshold={autoscrollThreshold}
      autoscrollSpeed={autoscrollSpeed}
      containerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
});
