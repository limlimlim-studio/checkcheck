import { StyleSheet, View } from 'react-native';
import { Appbar, Text, FAB, Button, Divider, Dialog, Portal } from 'react-native-paper';
import { Colors } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTodos, useToggleTodo, useClearCompleted, useReorderTodos } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';
import { TodoStackParamList } from '../navigation/TodoStack';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;
type Tab = 'active' | 'completed';

type Todo = {
  id: number;
  title: string;
  description?: string | null;
  dueDate?: number | null;
  urgency?: number | null;
  importance?: number | null;
  isCompleted: number;
  categoryId: number;
  sortOrder: number;
};

export default function TodoScreen() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  const { data: activeTodos = [] } = useTodos(0);
  const { data: completedTodos = [] } = useTodos(1);
  const { data: categories = [] } = useCategories();
  const { mutate: toggleTodo } = useToggleTodo();
  const { mutate: clearCompleted } = useClearCompleted();
  const { mutate: reorderTodos } = useReorderTodos();

  const currentTodos = activeTab === 'active' ? activeTodos : completedTodos;
  const getCategoryById = (id: number) => categories.find((c) => c.id === id);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Todo>) => (
    <ScaleDecorator>
      <TodoItem
        todo={item}
        category={getCategoryById(item.categoryId)}
        onToggle={() => toggleTodo({ id: item.id, isCompleted: item.isCompleted })}
        onPress={() => navigation.navigate('TodoForm', { todo: item })}
        onDrag={activeTab === 'active' ? drag : undefined}
        isDragging={isActive}
      />
    </ScaleDecorator>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="할 일" />
        {activeTab === 'completed' && completedTodos.length > 0 && (
          <Appbar.Action icon="delete-sweep" onPress={() => setClearDialogVisible(true)} />
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

      <DraggableFlatList
        data={currentTodos as Todo[]}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {activeTab === 'active' ? '할 일이 없어요' : '완료된 항목이 없어요'}
          </Text>
        }
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          if (activeTab === 'active') {
            reorderTodos(data.map((t) => t.id));
          }
        }}
        autoscrollThreshold={80}
        autoscrollSpeed={200}
        containerStyle={{ flex: 1 }}
      />

      {activeTab === 'active' && (
        <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('TodoForm')} />
      )}

      <Portal>
        <Dialog visible={clearDialogVisible} onDismiss={() => setClearDialogVisible(false)}>
          <Dialog.Title>완료 목록 비우기</Dialog.Title>
          <Dialog.Content>
            <Text>완료된 할 일이 목록에서 삭제됩니다.{'\n'}완료 기록은 기록 탭에 유지됩니다.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>취소</Button>
            <Button
              textColor={Colors.danger}
              onPress={() => { clearCompleted(); setClearDialogVisible(false); }}
            >
              비우기
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabBorder,
  },
  tabBtn: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
