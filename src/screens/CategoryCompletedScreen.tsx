import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Appbar, Text, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Colors } from '../theme';
import { useTodosCompletedByCategory } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';
import { toDateKey, formatDateLabel } from '../utils/date';
import { RecordStackParamList } from '../navigation/RecordStack';
import { Todo } from '../types';

type Nav = NativeStackNavigationProp<RecordStackParamList, 'CategoryCompleted'>;
type Route = RouteProp<RecordStackParamList, 'CategoryCompleted'>;

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
          checked={false}
          onCheck={() => {}}
          checkboxVisible={false}
          showDescription
        />
        <Divider />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title={
            <View style={styles.titleRow}>
              <View style={[styles.dot, { backgroundColor: categoryColor }]} />
              <Text style={styles.titleText}>{categoryName}</Text>
            </View>
          }
        />
      </Appbar.Header>

      <FlatList
        data={listItems}
        keyExtractor={(item) =>
          item.type === 'header' ? `header-${item.key}` : `todo-${item.todo.id}`
        }
        renderItem={renderItem}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  titleText: { fontWeight: '700', fontSize: 18, color: Colors.text },
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
