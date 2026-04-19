import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Colors } from '../theme';
import { useTodosToday, useTodayCompletionIds, useTodayToggle } from '../hooks/useTodos';
import { useRoutinesToday, useToggleRoutineCompletion } from '../hooks/useRoutines';
import { useCategories } from '../hooks/useCategories';
import { useCategoryMap } from '../hooks/useCategoryMap';
import { useCheckable } from '../hooks/useCheckable';
import TodoItem from './TodoItem';
import RoutineItem from './RoutineItem';
import TodayProgressBar from './TodayProgressBar';
import { TodoStackParamList } from '../navigation/TodoStack';
import { Todo } from '../types';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;

export default function TodoTabToday() {
  const navigation = useNavigation<Nav>();
  const { data: todos = [] } = useTodosToday();
  const { data: completedIds = new Set<number>() } = useTodayCompletionIds();
  const { data: routines = [] } = useRoutinesToday();
  const { data: categories = [] } = useCategories();
  const { mutate: todayToggle } = useTodayToggle();
  const { mutate: toggleRoutine } = useToggleRoutineCompletion();

  const today = dayjs().format('YYYY-MM-DD');

  const categoryMap = useCategoryMap(categories);
  const getCheckable = useCheckable({ mode: 'today', completedIds, toggleFn: todayToggle });

  const progressData = useMemo(() => {
    const countMap = new Map<number, number>();
    for (const r of routines) {
      if (r.isCompletedToday) {
        countMap.set(r.categoryId, (countMap.get(r.categoryId) ?? 0) + 1);
      }
    }
    for (const t of todos) {
      if (completedIds.has(t.id)) {
        countMap.set(t.categoryId, (countMap.get(t.categoryId) ?? 0) + 1);
      }
    }
    const segments = [...countMap.entries()].map(([categoryId, count]) => ({
      categoryId,
      color: categoryMap.get(categoryId)?.color ?? Colors.textMuted,
      count,
    }));
    const totalCompleted = segments.reduce((sum, s) => sum + s.count, 0);
    const total = routines.length + todos.length;
    return { segments, totalCompleted, total };
  }, [routines, todos, completedIds, categoryMap]);

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const { checked, onCheck } = getCheckable(item);
    return (
      <TodoItem
        todo={item}
        category={categoryMap.get(item.categoryId)}
        checked={checked}
        onCheck={onCheck}
        onPress={() => navigation.navigate('TodoForm', { todo: item })}
        showDescription
      />
    );
  };

  const isEmpty = routines.length === 0 && todos.length === 0;

  return (
    <View style={styles.container}>
      <TodayProgressBar
        segments={progressData.segments}
        totalCompleted={progressData.totalCompleted}
        total={progressData.total}
      />
      <FlatList
        data={todos as Todo[]}
        keyExtractor={(item) => `todo-${item.id}`}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={renderTodoItem}
        style={styles.list}
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
                      alarmTime={routine.alarmTime}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1, backgroundColor: Colors.background },
  sectionLabel: {
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionDivider: { marginTop: 8, backgroundColor: Colors.surfaceVariant },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
});
