import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Divider, Button, Dialog, Portal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Colors } from '../theme';
import { useTodosCompleted, useToggleTodo, useClearCompleted } from '../hooks/useTodos';
import { useCategories } from '../hooks/useCategories';
import TodoItem from './TodoItem';
import { toDateKey, formatDateLabel } from '../utils/date';
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

export default function TodoTabCompleted() {
  const navigation = useNavigation<Nav>();
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const { data: todos = [] } = useTodosCompleted();
  const { data: categories = [] } = useCategories();
  const { mutate: toggleTodo } = useToggleTodo();
  const { mutate: clearCompleted } = useClearCompleted();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const completedList = buildCompletedList(todos as Todo[]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return <Text style={styles.dateHeader}>{item.label}</Text>;
    }
    return (
      <>
        <TodoItem
          todo={item.todo}
          category={categoryMap.get(item.todo.categoryId)}
          onToggle={() => toggleTodo({ id: item.todo.id, isCompleted: item.todo.isCompleted })}
          onPress={() => navigation.navigate('TodoForm', { todo: item.todo })}
        />
        <Divider />
      </>
    );
  };

  return (
    <View style={styles.container}>
      {todos.length > 0 && (
        <View style={styles.clearRow}>
          <Button
            icon="delete-sweep"
            mode="text"
            textColor={Colors.textMuted}
            compact
            onPress={() => setClearDialogVisible(true)}
          >
            전체 삭제
          </Button>
        </View>
      )}
      <FlatList
        data={completedList}
        keyExtractor={(item) =>
          item.type === 'header' ? `header-${item.key}` : `todo-${item.todo.id}`
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>완료된 항목이 없어요</Text>
        }
        style={styles.list}
      />

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
  container: { flex: 1 },
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
  clearRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabBorder,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
