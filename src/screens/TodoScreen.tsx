import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, Text, FAB, Button, Divider } from 'react-native-paper';
import { Colors } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTodos, useToggleTodo, useClearCompleted } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';
import { TodoStackParamList } from '../navigation/TodoStack';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;
type Tab = 'active' | 'completed';

export default function TodoScreen() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  const { data: activeTodos = [] } = useTodos(0);
  const { data: completedTodos = [] } = useTodos(1);
  const { data: categories = [] } = useCategories();
  const { mutate: toggleTodo } = useToggleTodo();
  const { mutate: clearCompleted } = useClearCompleted();

  const currentTodos = activeTab === 'active' ? activeTodos : completedTodos;
  const getCategoryById = (id: number) => categories.find((c) => c.id === id);

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
            onPress={() => navigation.navigate('TodoForm', { todo: item })}
          />
        )}
      />

      {activeTab === 'active' && (
        <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('TodoForm')} />
      )}
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
