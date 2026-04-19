import { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { useTodosList, useTodayCompletionIds, useTodayToggle } from '../hooks/useTodos';
import { useCategories } from '../hooks/useCategories';
import { useCategoryMap } from '../hooks/useCategoryMap';
import { useCheckable } from '../hooks/useCheckable';
import TodoItem from './TodoItem';
import DateSeparator from './DateSeparator';
import { TodoStackParamList } from '../navigation/TodoStack';
import { Todo } from '../types';
import { toDateKey, formatDueDateLabel } from '../utils/date';
import { SortKey, sortTodos } from '../utils/sort';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;

const LIST_SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'deadline', label: '기한순' },
  { key: 'urgency', label: '긴급도순' },
  { key: 'importance', label: '중요도순' },
];

type ListItem =
  | { type: 'header'; key: string; label: string }
  | { type: 'todo'; key: string; todo: Todo };

function buildGroupedList(todos: Todo[], sortKey: SortKey): ListItem[] {
  if (sortKey === 'urgency' || sortKey === 'importance') {
    const sorted = sortTodos(todos, sortKey);
    return sorted.map((todo) => ({ type: 'todo', key: `todo-${todo.id}`, todo }));
  }

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

  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const categoryMap = useCategoryMap(categories);
  const getCheckable = useCheckable({ mode: 'today', completedIds, toggleFn: todayToggle });

  const listItems = useMemo(() => buildGroupedList(todos as Todo[], sortKey), [todos, sortKey]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return <DateSeparator label={item.label} />;
    }
    const { checked, onCheck } = getCheckable(item.todo);
    return (
      <TodoItem
        todo={item.todo}
        category={categoryMap.get(item.todo.categoryId)}
        checked={checked}
        onCheck={onCheck}
        onPress={() => navigation.navigate('TodoForm', { todo: item.todo })}
        showDescription
      />
    );
  };

  const currentLabel = LIST_SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? '기한순';

  return (
    <View style={styles.container}>
      <View style={styles.sortRow}>
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <TouchableOpacity style={styles.sortAnchor} onPress={() => setSortMenuVisible(true)}>
              <Text variant="labelSmall" style={styles.sortText}>{currentLabel} ▾</Text>
            </TouchableOpacity>
          }
        >
          {LIST_SORT_OPTIONS.map((opt) => (
            <Menu.Item
              key={opt.key}
              title={opt.label}
              onPress={() => { setSortKey(opt.key); setSortMenuVisible(false); }}
              trailingIcon={sortKey === opt.key ? 'check' : undefined}
            />
          ))}
        </Menu>
      </View>
      <FlatList
        data={listItems}
        keyExtractor={(item) => item.key}
        ItemSeparatorComponent={({ leadingItem }) =>
          leadingItem?.type === 'header' ? null : <Divider />
        }
        ListEmptyComponent={<Text style={styles.empty}>할 일이 없어요</Text>}
        renderItem={renderItem}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sortAnchor: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sortText: { color: Colors.textSecondary },
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
});
