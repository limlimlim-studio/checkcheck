import { useState, useCallback } from 'react';
import { View, SectionList, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, Searchbar, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useSearch } from '../hooks/useSearch';
import { useCategories } from '../hooks/useCategories';
import { useCategoryMap } from '../hooks/useCategoryMap';
import { TodoStackParamList } from '../navigation/TodoStack';
import { formatDueDateLabel } from '../utils/date';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'Search'>;

type SectionItem =
  | { kind: 'todo'; id: number; title: string; categoryId: number; dueDate: number | null; isCompleted: number; item: any }
  | { kind: 'routine'; id: number; title: string; categoryId: number; repeatType: string; item: any };

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { top } = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { data: categories = [] } = useCategories();
  const categoryMap = useCategoryMap(categories);
  const { todos, routines } = useSearch(query);

  const sections = [
    ...(todos.length > 0
      ? [{
          title: '할 일',
          data: todos.map((t): SectionItem => ({
            kind: 'todo', id: t.id, title: t.title,
            categoryId: t.categoryId, dueDate: t.dueDate,
            isCompleted: t.isCompleted, item: t,
          })),
        }]
      : []),
    ...(routines.length > 0
      ? [{
          title: '루틴',
          data: routines.map((r): SectionItem => ({
            kind: 'routine', id: r.id, title: r.title,
            categoryId: r.categoryId, repeatType: r.repeatType, item: r,
          })),
        }]
      : []),
  ];

  const handleTodoPress = useCallback((item: any) => {
    navigation.navigate('TodoForm', { todo: item });
  }, [navigation]);

  const handleRoutinePress = useCallback((item: any) => {
    (navigation as any).navigate('RoutineRoot', {
      screen: 'RoutineForm',
      params: { routine: item },
    });
  }, [navigation]);

  const renderItem = ({ item }: { item: SectionItem }) => {
    const category = categoryMap.get(item.categoryId);
    const onPress = item.kind === 'todo'
      ? () => handleTodoPress(item.item)
      : () => handleRoutinePress(item.item);

    return (
      <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.dot, { backgroundColor: category?.color ?? Colors.textMuted }]} />
        <View style={styles.itemContent}>
          <Text
            style={[styles.itemTitle, item.kind === 'todo' && item.isCompleted === 1 && styles.itemCompleted]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.itemMeta} numberOfLines={1}>
            {category?.name ?? '미분류'}
            {item.kind === 'todo' && item.dueDate
              ? `  ·  ${formatDueDateLabel(item.dueDate)}`
              : item.kind === 'routine'
              ? `  ·  ${repeatLabel(item.repeatType)}`
              : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const isEmpty = query.trim().length > 0 && todos.length === 0 && routines.length === 0;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Searchbar
          placeholder="할 일, 루틴 검색"
          value={query}
          onChangeText={setQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          autoFocus
        />
      </Appbar.Header>

      {isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>검색 결과가 없어요</Text>
        </View>
      ) : query.trim().length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>제목으로 검색하세요</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={() => <Divider />}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
        />
      )}
    </View>
  );
}

function repeatLabel(repeatType: string): string {
  if (repeatType === 'daily') return '매일';
  if (repeatType === 'weekly') return '매주';
  if (repeatType === 'monthly') return '매월';
  return repeatType;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 64,
    paddingHorizontal: 4,
    backgroundColor: Colors.background,
    elevation: 0,
  },
  searchbar: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 10,
    marginRight: 8,
    height: 44,
  },
  searchInput: {
    fontSize: 15,
    color: Colors.text,
    minHeight: 0,
  },
  list: { flex: 1 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemContent: { flex: 1 },
  itemTitle: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  itemCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
