import { StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Colors } from '../theme';
import { useTodosOverdue, useToggleTodo, useReorderTodos } from '../hooks/useTodos';
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

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Todo>) => (
    <ScaleDecorator>
      <TodoItem
        todo={item}
        category={categoryMap.get(item.categoryId)}
        onToggle={() => toggleTodo({ id: item.id, isCompleted: item.isCompleted })}
        onPress={() => navigation.navigate('TodoForm', { todo: item })}
        onDrag={drag}
        isDragging={isActive}
      />
    </ScaleDecorator>
  );

  return (
    <DraggableFlatList
      data={todos as Todo[]}
      keyExtractor={(item) => String(item.id)}
      ItemSeparatorComponent={() => <Divider />}
      ListEmptyComponent={
        <Text style={styles.empty}>미완료 항목이 없어요</Text>
      }
      renderItem={renderItem}
      onDragEnd={({ data }) => reorderTodos(data.map((t) => t.id))}
      autoscrollThreshold={80}
      autoscrollSpeed={200}
      containerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
});
