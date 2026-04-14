import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Divider, Button, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Colors } from '../theme';
import dayjs from 'dayjs';
import { useTodosCompleted, useToggleTodo } from '../hooks/useTodos';
import { useCategories } from '../hooks/useCategories';
import TodoItem from './TodoItem';
import { toDateKey, formatDateLabel } from '../utils/date';
import { TodoStackParamList } from '../navigation/TodoStack';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;

type Todo = {
  id: number;
  title: string;
  description?: string | null;
  dueDate?: number | null;
  urgency?: number | null;
  importance?: number | null;
  isCompleted: number;
  completedAt?: number | null;
  categoryId: number;
  sortOrder: number;
};

type ListItem =
  | { type: 'header'; label: string; key: string }
  | { type: 'todo'; todo: Todo };

function buildCompletedList(todos: Todo[]): ListItem[] {
  const result: ListItem[] = [];
  let lastKey = '';
  for (const todo of todos) {
    const key = toDateKey(todo.completedAt);
    if (key !== lastKey) {
      result.push({ type: 'header', label: formatDateLabel(todo.completedAt), key });
      lastKey = key;
    }
    result.push({ type: 'todo', todo });
  }
  return result;
}

type PeriodValue = '1m' | '6m' | '12m';
const PERIOD_OPTIONS: { value: PeriodValue; label: string; days: number }[] = [
  { value: '1m', label: '1개월', days: 30 },
  { value: '6m', label: '6개월', days: 180 },
  { value: '12m', label: '12개월', days: 365 },
];

export default function TodoTabCompleted() {
  const navigation = useNavigation<Nav>();
  const [period, setPeriod] = useState<PeriodValue>('1m');
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: allTodos = [] } = useTodosCompleted();
  const { data: categories = [] } = useCategories();
  const { mutate: toggleTodo } = useToggleTodo();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const todos = useMemo(() => {
    const days = PERIOD_OPTIONS.find((o) => o.value === period)?.days ?? 30;
    const cutoff = dayjs().subtract(days, 'day').startOf('day').valueOf();
    return (allTodos as Todo[]).filter((t) => t.completedAt != null && t.completedAt >= cutoff);
  }, [allTodos, period]);

  const completedList = buildCompletedList(todos);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return <Text style={styles.dateHeader}>{item.label}</Text>;
    }
    return (
      <>
        <TodoItem
          todo={item.todo}
          category={categoryMap.get(item.todo.categoryId)}
          showCheckbox={false}
          onToggle={() => toggleTodo({ id: item.todo.id, isCompleted: item.todo.isCompleted })}
          onPress={() => navigation.navigate('TodoForm', { todo: item.todo })}
        />
        <Divider />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="text"
              compact
              icon="chevron-down"
              contentStyle={styles.filterBtnContent}
              labelStyle={styles.filterBtnLabel}
              onPress={() => setMenuVisible(true)}
            >
              {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
            </Button>
          }
          anchorPosition="bottom"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <Menu.Item
              key={opt.value}
              title={opt.label}
              titleStyle={period === opt.value ? styles.menuItemActive : undefined}
              onPress={() => { setPeriod(opt.value); setMenuVisible(false); }}
            />
          ))}
        </Menu>
      </View>

      <FlatList
        data={completedList}
        keyExtractor={(item) =>
          item.type === 'header' ? `header-${item.key}` : `todo-${item.todo.id}`
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>완료된 항목이 없어요</Text>
        }
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  filterBtnContent: { flexDirection: 'row-reverse' },
  filterBtnLabel: { fontSize: 13, color: Colors.textSecondary },
  menuItemActive: { color: Colors.primary },
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
