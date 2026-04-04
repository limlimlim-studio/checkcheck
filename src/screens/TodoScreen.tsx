import { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, Text, FAB, Button, Divider } from 'react-native-paper';
import { useCategories } from '../hooks/useCategories';
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo, useToggleTodo, useClearCompleted } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';
import TodoFormSheet from '../components/TodoFormSheet';

type Tab = 'active' | 'completed';

type TodoData = {
  id: number;
  title: string;
  description?: string | null;
  dueDate?: number | null;
  urgency?: number | null;
  importance?: number | null;
  isCompleted: number;
  categoryId: number;
};

export default function TodoScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoData | null>(null);

  const { data: activeTodos = [] } = useTodos(0);
  const { data: completedTodos = [] } = useTodos(1);
  const { data: categories = [] } = useCategories();

  const { mutate: createTodo } = useCreateTodo();
  const { mutate: updateTodo } = useUpdateTodo();
  const { mutate: deleteTodo } = useDeleteTodo();
  const { mutate: toggleTodo } = useToggleTodo();
  const { mutate: clearCompleted } = useClearCompleted();

  const currentTodos = activeTab === 'active' ? activeTodos : completedTodos;

  const getCategoryById = (id: number) => categories.find((c) => c.id === id);

  const openCreate = () => {
    setSelectedTodo(null);
    setSheetVisible(true);
  };

  const openEdit = (todo: TodoData) => {
    setSelectedTodo(todo);
    setSheetVisible(true);
  };

  const handleSave = (data: {
    title: string;
    description?: string;
    dueDate?: number;
    urgency: number;
    importance: number;
    categoryId: number;
  }) => {
    if (selectedTodo) {
      updateTodo({ id: selectedTodo.id, ...data });
    } else {
      createTodo(data);
    }
    setSheetVisible(false);
  };

  const handleDelete = () => {
    if (selectedTodo) {
      deleteTodo(selectedTodo.id);
      setSheetVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="할 일" />
        {activeTab === 'completed' && completedTodos.length > 0 && (
          <Appbar.Action icon="delete-sweep" onPress={() => clearCompleted()} />
        )}
      </Appbar.Header>

      <View style={styles.tabs}>
        <Button
          mode={activeTab === 'active' ? 'contained' : 'text'}
          onPress={() => setActiveTab('active')}
          style={styles.tabBtn}
          compact
        >
          진행 중 {activeTodos.length > 0 ? `(${activeTodos.length})` : ''}
        </Button>
        <Button
          mode={activeTab === 'completed' ? 'contained' : 'text'}
          onPress={() => setActiveTab('completed')}
          style={styles.tabBtn}
          compact
        >
          완료 {completedTodos.length > 0 ? `(${completedTodos.length})` : ''}
        </Button>
      </View>

      <FlatList
        data={currentTodos}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {activeTab === 'active' ? '할 일이 없어요' : '완료된 항목이 없어요'}
          </Text>
        }
        renderItem={({ item }) => (
          <TodoItem
            todo={item}
            category={getCategoryById(item.categoryId)}
            onToggle={() => toggleTodo({ id: item.id, isCompleted: item.isCompleted })}
            onPress={() => openEdit(item)}
          />
        )}
      />

      {activeTab === 'active' && (
        <FAB icon="plus" style={styles.fab} onPress={openCreate} />
      )}

      <TodoFormSheet
        visible={sheetVisible}
        todo={selectedTodo}
        onDismiss={() => setSheetVisible(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabBtn: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: '#aaa' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
