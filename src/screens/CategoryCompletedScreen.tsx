import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Appbar, Text, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Colors } from '../theme';
import { useTodosCompletedByCategory, useToggleTodo } from '../hooks/useTodos';
import { useCategories } from '../hooks/useCategories';
import TodoItem from '../components/TodoItem';
import { toDateKey, formatDateLabel } from '../utils/date';
import { RecordStackParamList } from '../navigation/RecordStack';
import { TodoStackParamList } from '../navigation/TodoStack';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;
type Route = RouteProp<RecordStackParamList, 'CategoryCompleted'>;

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

export default function CategoryCompletedScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { categoryId, categoryName, categoryColor } = route.params;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTodosCompletedByCategory(categoryId);
  const { data: categories = [] } = useCategories();
  const { mutate: toggleTodo } = useToggleTodo();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const flatTodos = useMemo(
    () => (data?.pages.flat() ?? []) as Todo[],
    [data],
  );

  const listItems = useMemo(() => buildCompletedList(flatTodos), [flatTodos]);

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
          onPress={() => {}}
        />
        <Divider />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <View style={[styles.dot, { backgroundColor: categoryColor }]} />
        <Appbar.Content title={categoryName} titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      <FlatList
        data={listItems}
        keyExtractor={(item) =>
          item.type === 'header' ? `header-${item.key}` : `todo-${item.todo.id}`
        }
        renderItem={renderItem}
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} color={Colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.empty}>완료된 항목이 없어요</Text>
        }
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 72 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
  footer: { paddingVertical: 16 },
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
