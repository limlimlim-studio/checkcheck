import { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Divider, Button, FAB, Dialog, Portal, Snackbar, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import { useTodosOverdue, useToggleTodo, useBulkMoveToToday, useBulkDeleteTodos } from '../hooks/useTodos';
import { useCategories } from '../hooks/useCategories';
import { useCategoryMap } from '../hooks/useCategoryMap';
import { useSelectable } from '../hooks/useSelectable';
import TodoItem from './TodoItem';
import DateSeparator from './DateSeparator';
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

export default function TodoTabOverdue() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { data: todos = [] } = useTodosOverdue();
  const { data: categories = [] } = useCategories();
  const { mutate: toggleTodo } = useToggleTodo();
  const { mutate: bulkMoveToToday } = useBulkMoveToToday();
  const { mutate: bulkDelete } = useBulkDeleteTodos();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const categoryMap = useCategoryMap(categories);
  const { isSelecting, selectedIds, startSelecting, clearSelection, toggleSelection } =
    useSelectable(todos as Todo[]);

  const listItems = useMemo(() => buildGroupedList(todos as Todo[], sortKey), [todos, sortKey]);

  const OVERDUE_SORT_OPTIONS = [
    { key: 'deadline' as SortKey, label: t('todo.sort_deadline') },
    { key: 'urgency' as SortKey, label: t('todo.sort_urgency') },
    { key: 'importance' as SortKey, label: t('todo.sort_importance') },
  ];

  const handleMoveToToday = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    bulkMoveToToday([...selectedIds]);
    clearSelection();
    setSnackbarMessage(t('todo.move_to_today_msg', { count }));
    setSnackbarVisible(true);
  };

  const handleDeleteConfirm = () => {
    bulkDelete([...selectedIds]);
    setShowDeleteDialog(false);
    clearSelection();
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return <DateSeparator label={item.label} />;
    }
    const { todo } = item;
    const checked = isSelecting ? selectedIds.has(todo.id) : false;
    const onCheck = isSelecting
      ? () => toggleSelection(todo.id)
      : () => toggleTodo({ id: todo.id, isCompleted: todo.isCompleted });
    const onPress = isSelecting
      ? () => toggleSelection(todo.id)
      : () => navigation.navigate('TodoForm', { todo });

    return (
      <TodoItem
        todo={todo}
        category={categoryMap.get(todo.categoryId)}
        checked={checked}
        onCheck={onCheck}
        onPress={onPress}
        checkboxVisible={isSelecting}
        showDescription
      />
    );
  };

  const currentLabel = OVERDUE_SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? t('todo.sort_deadline');

  return (
    <View style={styles.container}>
      {!isSelecting && (
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
            {OVERDUE_SORT_OPTIONS.map((opt) => (
              <Menu.Item
                key={opt.key}
                title={opt.label}
                onPress={() => { setSortKey(opt.key); setSortMenuVisible(false); }}
                trailingIcon={sortKey === opt.key ? 'check' : undefined}
              />
            ))}
          </Menu>
        </View>
      )}
      <FlatList
        data={listItems}
        keyExtractor={(item) => item.key}
        ItemSeparatorComponent={({ leadingItem }) =>
          leadingItem?.type === 'header' ? null : <Divider />
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('todo.empty_overdue')}</Text>}
        renderItem={renderItem}
        style={styles.list}
      />

      {isSelecting ? (
        <View style={styles.actionColumn}>
          <FAB
            icon="calendar-arrow-right"
            style={[styles.fabAction, selectedIds.size === 0 && styles.fabDisabled]}
            onPress={handleMoveToToday}
            disabled={selectedIds.size === 0}
          />
          <FAB
            icon="trash-can-outline"
            style={[styles.fabAction, styles.fabDanger, selectedIds.size === 0 && styles.fabDisabled]}
            color={Colors.danger}
            onPress={() => selectedIds.size > 0 && setShowDeleteDialog(true)}
            disabled={selectedIds.size === 0}
          />
          <FAB
            icon="close-circle-outline"
            style={styles.fabAction}
            onPress={clearSelection}
          />
        </View>
      ) : (
        <FAB
          icon="check-circle-outline"
          style={styles.fab}
          onPress={startSelecting}
        />
      )}

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>{t('todo.delete_selected_title')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('todo.delete_selected_msg', { count: selectedIds.size })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>{t('common.cancel')}</Button>
            <Button textColor={Colors.danger} onPress={handleDeleteConfirm}>{t('common.delete')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  sortAnchor: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sortText: { color: Colors.textSecondary },
  list: { flex: 1, backgroundColor: Colors.background },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
  snackbar: { marginBottom: 80 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  actionColumn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  fabAction: {},
  fabDanger: { backgroundColor: Colors.surfaceVariant },
  fabDisabled: { opacity: 0.4 },
});
