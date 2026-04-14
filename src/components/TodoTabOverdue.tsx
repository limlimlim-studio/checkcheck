import { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider, Button, FAB, Dialog, Portal, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Colors } from '../theme';
import { useTodosOverdue, useToggleTodo, useReorderTodos, useBulkMoveToToday, useBulkDeleteTodos } from '../hooks/useTodos';
import { useCategories } from '../hooks/useCategories';
import TodoItem from './TodoItem';
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

export default function TodoTabOverdue() {
  const navigation = useNavigation<Nav>();
  const { data: todos = [] } = useTodosOverdue();
  const { data: categories = [] } = useCategories();
  const { mutate: toggleTodo } = useToggleTodo();
  const { mutate: reorderTodos } = useReorderTodos();
  const { mutate: bulkMoveToToday } = useBulkMoveToToday();
  const { mutate: bulkDelete } = useBulkDeleteTodos();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCancelSelect = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handleMoveToToday = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    bulkMoveToToday([...selectedIds]);
    handleCancelSelect();
    setSnackbarMessage(`${count}개 항목을 오늘 할 일로 이동했어요`);
    setSnackbarVisible(true);
  };

  const handleDeleteConfirm = () => {
    bulkDelete([...selectedIds]);
    setShowDeleteDialog(false);
    handleCancelSelect();
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Todo>) => (
    <ScaleDecorator>
      <TodoItem
        todo={item}
        category={categoryMap.get(item.categoryId)}
        showCheckbox={false}
        showDescription
        onToggle={
          isSelecting
            ? () => toggleSelection(item.id)
            : () => toggleTodo({ id: item.id, isCompleted: item.isCompleted })
        }
        onPress={() => {
          if (isSelecting) toggleSelection(item.id);
          else navigation.navigate('TodoForm', { todo: item });
        }}
        onDrag={drag}
        isDragging={isActive}
        isSelecting={isSelecting}
        isSelected={selectedIds.has(item.id)}
      />
    </ScaleDecorator>
  );

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={todos as Todo[]}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <Text style={styles.empty}>미완료 항목이 없어요</Text>
        }
        renderItem={renderItem}
        onDragEnd={({ data }) => reorderTodos(data.map((t) => t.id))}
        activationDistance={isSelecting ? 9999 : 20}
        autoscrollThreshold={80}
        autoscrollSpeed={200}
        containerStyle={styles.list}
      />

      {/* 선택 모드 액션 */}
      {isSelecting ? (
        <View style={styles.actionColumn}>
          <FAB
            size="small"
            icon="calendar-today"
            style={[styles.fabAction, selectedIds.size === 0 && styles.fabDisabled]}
            onPress={handleMoveToToday}
            disabled={selectedIds.size === 0}
          />
          <FAB
            size="small"
            icon="delete-outline"
            style={[styles.fabAction, styles.fabDanger, selectedIds.size === 0 && styles.fabDisabled]}
            color={Colors.danger}
            onPress={() => selectedIds.size > 0 && setShowDeleteDialog(true)}
            disabled={selectedIds.size === 0}
          />
          <FAB
            size="small"
            icon="close"
            style={styles.fabAction}
            onPress={handleCancelSelect}
          />
        </View>
      ) : (
        <FAB
          size="small"
          icon="checkbox-multiple-outline"
          style={styles.fab}
          onPress={() => setIsSelecting(true)}
        />
      )}

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>선택 항목 삭제</Dialog.Title>
          <Dialog.Content>
            <Text>{selectedIds.size}개 항목을 삭제하시겠습니까?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>취소</Button>
            <Button textColor={Colors.danger} onPress={handleDeleteConfirm}>삭제</Button>
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
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
  snackbar: { marginBottom: 80 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  actionColumn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  fabAction: {},
  fabDanger: {
    backgroundColor: Colors.surfaceVariant,
  },
  fabDisabled: {
    opacity: 0.4,
  },
});
