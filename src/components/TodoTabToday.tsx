import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import dayjs from 'dayjs';
import { Colors } from '../theme';
import { useTodosToday, useTodayCompletionIds, useTodayToggle, useReorderTodos } from '../hooks/useTodos';
import { useRoutinesToday, useToggleRoutineCompletion } from '../hooks/useRoutines';
import { useCategories } from '../hooks/useCategories';
import TodoItem from './TodoItem';
import RoutineItem from './RoutineItem';
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

export default function TodoTabToday() {
  const navigation = useNavigation<Nav>();
  const { data: todos = [] } = useTodosToday();
  const { data: completedIds = new Set<number>() } = useTodayCompletionIds();
  const { data: routines = [] } = useRoutinesToday();
  const { data: categories = [] } = useCategories();
  const { mutate: todayToggle } = useTodayToggle();
  const { mutate: reorderTodos } = useReorderTodos();
  const { mutate: toggleRoutine } = useToggleRoutineCompletion();

  const today = dayjs().format('YYYY-MM-DD');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const renderTodoItem = ({ item, drag, isActive }: RenderItemParams<Todo>) => (
    <ScaleDecorator>
      <TodoItem
        todo={item}
        category={categoryMap.get(item.categoryId)}
        forceCompleted={completedIds.has(item.id)}
        onToggle={() => todayToggle(item.id)}
        onPress={() => navigation.navigate('TodoForm', { todo: item })}
        onDrag={drag}
        isDragging={isActive}
      />
    </ScaleDecorator>
  );

  const isEmpty = routines.length === 0 && todos.length === 0;

  return (
    <DraggableFlatList
      data={todos as Todo[]}
      keyExtractor={(item) => `todo-${item.id}`}
      ItemSeparatorComponent={() => <Divider />}
      renderItem={renderTodoItem}
      onDragEnd={({ data }) => reorderTodos(data.map((t) => t.id))}
      autoscrollThreshold={80}
      autoscrollSpeed={200}
      containerStyle={styles.list}
      ListHeaderComponent={
        <>
          {routines.length > 0 && (
            <>
              <Text variant="labelSmall" style={styles.sectionLabel}>루틴</Text>
              {routines.map((routine, index) => (
                <View key={`routine-${routine.id}`}>
                  <RoutineItem
                    routineId={routine.id}
                    title={routine.title}
                    urgency={routine.urgency}
                    importance={routine.importance}
                    category={categoryMap.get(routine.categoryId)}
                    isCompletedToday={routine.isCompletedToday}
                    onToggle={() => toggleRoutine({ routineId: routine.id, date: today })}
                  />
                  {index < routines.length - 1 && <Divider />}
                </View>
              ))}
              {todos.length > 0 && (
                <>
                  <Divider style={styles.sectionDivider} />
                  <Text variant="labelSmall" style={styles.sectionLabel}>할 일</Text>
                </>
              )}
            </>
          )}
          {isEmpty && (
            <Text style={styles.empty}>오늘 할 일이 없어요</Text>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  sectionLabel: {
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionDivider: { marginTop: 8, backgroundColor: Colors.surfaceVariant },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
});
