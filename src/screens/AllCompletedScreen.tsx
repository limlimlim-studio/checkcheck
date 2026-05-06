import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Appbar, Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import { useAllTodosCompleted } from '../hooks/useTodos';
import { useAllRoutineCompletions, AllRoutineCompletionRecord } from '../hooks/useCompletions';
import { useCategories } from '../hooks/useCategories';
import TodoItem from '../components/TodoItem';
import TodoItemMeta from '../components/TodoItem/TodoItemMeta';
import { toDateKey, formatDateLabel } from '../utils/date';
import { RecordStackParamList } from '../navigation/RecordStack';
import { Todo } from '../types';

type Nav = NativeStackNavigationProp<RecordStackParamList, 'AllCompleted'>;

type ListItem =
  | { type: 'header'; label: string; key: string }
  | { type: 'todo'; key: string; todo: Todo }
  | { type: 'routine'; key: string; record: AllRoutineCompletionRecord };

function buildMergedList(todos: Todo[], routineRecords: AllRoutineCompletionRecord[]): ListItem[] {
  type Entry = { dateKey: string; sortTs: number; item: ListItem };
  const entries: Entry[] = [];

  for (const todo of todos) {
    const dateKey = toDateKey(todo.completedAt);
    entries.push({ dateKey, sortTs: todo.completedAt ?? 0, item: { type: 'todo', key: `todo-${todo.id}`, todo } });
  }

  for (const record of routineRecords) {
    const ts = dayjs(record.completedDate).valueOf();
    const dateKey = toDateKey(ts);
    entries.push({ dateKey, sortTs: ts, item: { type: 'routine', key: `routine-${record.completionId}`, record } });
  }

  entries.sort((a, b) => b.sortTs - a.sortTs);

  const result: ListItem[] = [];
  let lastKey = '';
  for (const entry of entries) {
    if (entry.dateKey !== lastKey) {
      const ts = entry.item.type === 'todo'
        ? (entry.item.todo.completedAt ?? 0)
        : dayjs((entry.item as { record: AllRoutineCompletionRecord }).record.completedDate).valueOf();
      result.push({ type: 'header', label: formatDateLabel(ts), key: entry.dateKey });
      lastKey = entry.dateKey;
    }
    result.push(entry.item);
  }
  return result;
}

function RoutineItem({ record }: { record: AllRoutineCompletionRecord }) {
  const { t } = useTranslation();
  const category = { id: record.categoryId, name: record.categoryName, color: record.categoryColor };
  return (
    <View style={styles.routineRow}>
      <View style={styles.routineContent}>
        <Text variant="bodyLarge" style={styles.routineTitle}>{record.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.routineTag}>
            <Text style={styles.routineTagText}>{t('todo.tab_routine')}</Text>
          </View>
          <TodoItemMeta category={category} urgency={record.urgency} importance={record.importance} />
        </View>
      </View>
    </View>
  );
}

export default function AllCompletedScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useAllTodosCompleted();
  const { data: routineRecords = [] } = useAllRoutineCompletions();
  const { data: categoriesList = [] } = useCategories();

  const categoryMap = useMemo(
    () => Object.fromEntries(categoriesList.map((c) => [c.id, c])),
    [categoriesList],
  );

  const flatTodos = useMemo(
    () => (data?.pages.flat() ?? []) as Todo[],
    [data],
  );

  const listItems = useMemo(
    () => buildMergedList(flatTodos, routineRecords),
    [flatTodos, routineRecords],
  );

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return <Text style={styles.dateHeader}>{item.label}</Text>;
    }
    if (item.type === 'routine') {
      return (
        <>
          <RoutineItem record={item.record} />
          <Divider />
        </>
      );
    }
    const category = categoryMap[item.todo.categoryId];
    return (
      <>
        <TodoItem
          todo={item.todo}
          category={category}
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
        <Appbar.Content title={t('record.all_title')} titleStyle={styles.titleText} />
      </Appbar.Header>

      <FlatList
        data={listItems}
        keyExtractor={(item) => item.type === 'header' ? `header-${item.key}` : item.key}
        renderItem={renderItem}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator style={styles.footer} color={Colors.primary} />
            : null
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{t('record.empty_completed')}</Text>
        }
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 72 },
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
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  routineContent: { flex: 1 },
  routineTitle: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4, gap: 6 },
  routineTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.primary + '22',
  },
  routineTagText: { fontSize: 10, fontWeight: '600', color: Colors.primary },
});
