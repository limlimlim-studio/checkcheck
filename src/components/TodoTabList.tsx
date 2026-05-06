import { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider, Menu, FAB } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import { useTodosList, useTodayAllTodos, useTodayCompletionIds, useTodayToggle, useCleanupChecked } from '../hooks/useTodos';
import { useCategories } from '../hooks/useCategories';
import { useCategoryMap } from '../hooks/useCategoryMap';
import { useCheckable } from '../hooks/useCheckable';
import TodoItem from './TodoItem';
import DateSeparator from './DateSeparator';
import TodayProgressBar from './TodayProgressBar';
import { TodoStackParamList } from '../navigation/TodoStack';
import { Todo } from '../types';
import { toDateKey, formatDueDateLabel } from '../utils/date';
import { SortKey, sortTodos } from '../utils/sort';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;

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
  const { t } = useTranslation();
  const { data: todos = [] } = useTodosList();
  const { data: allTodayTodos = [] } = useTodayAllTodos();
  const { data: completedIds = new Set<number>() } = useTodayCompletionIds();
  const { data: categories = [] } = useCategories();
  const { mutate: todayToggle } = useTodayToggle();
  const { mutate: cleanup } = useCleanupChecked();
  const isFocused = useIsFocused();

  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const categoryMap = useCategoryMap(categories);
  const getCheckable = useCheckable({ mode: 'today', completedIds, toggleFn: todayToggle });

  const listItems = useMemo(() => buildGroupedList(todos as Todo[], sortKey), [todos, sortKey]);

  const progressSegments = useMemo(() => {
    const map = new Map<number, { color: string; count: number }>();
    for (const todo of allTodayTodos as Todo[]) {
      if (!completedIds.has(todo.id)) continue;
      const cat = categoryMap.get(todo.categoryId);
      const color = cat?.color ?? Colors.primary;
      const key = todo.categoryId ?? 0;
      map.set(key, { color, count: (map.get(key)?.count ?? 0) + 1 });
    }
    return [...map.entries()].map(([categoryId, { color, count }]) => ({ categoryId, color, count }));
  }, [allTodayTodos, completedIds, categoryMap]);

  const progressTotal = (allTodayTodos as Todo[]).length;
  const progressCompleted = progressSegments.reduce((s, seg) => s + seg.count, 0);

  const LIST_SORT_OPTIONS = [
    { key: 'deadline' as SortKey, label: t('todo.sort_deadline') },
    { key: 'urgency' as SortKey, label: t('todo.sort_urgency') },
    { key: 'importance' as SortKey, label: t('todo.sort_importance') },
  ];

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

  const currentLabel = LIST_SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? t('todo.sort_deadline');

  return (
    <View style={styles.container}>
      <TodayProgressBar
        segments={progressSegments}
        totalCompleted={progressCompleted}
        total={progressTotal}
      />
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
        ListEmptyComponent={<Text style={styles.empty}>{t('todo.empty_list')}</Text>}
        renderItem={renderItem}
        style={styles.list}
      />

      <FAB.Group
        open={fabOpen}
        visible={isFocused}
        icon={fabOpen ? 'close' : 'dots-vertical'}
        fabStyle={styles.fab}
        actions={[
          ...(completedIds.size > 0 ? [{ icon: 'broom', label: t('todo.menu_clear'), onPress: () => { cleanup(); setFabOpen(false); }, size: 'small' as const }] : []),
          { icon: 'plus', label: t('todo.title_new'), onPress: () => { navigation.navigate('TodoForm'); setFabOpen(false); }, size: 'small' as const },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
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
  fab: { transform: [{ scale: 0.85 }] },
});
