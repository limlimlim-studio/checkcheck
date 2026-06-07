import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Appbar, Text, Checkbox, ProgressBar, FAB } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Colors } from '../theme';
import { useGoal, useGoalTodos, useToggleGoalTodo } from '../hooks/useGoals';
import { useCategoryMap } from '../hooks/useCategoryMap';
import { useCategories } from '../hooks/useCategories';
import { GoalStackParamList } from '../navigation/GoalStack';
import TodoItemMeta from '../components/TodoItem/TodoItemMeta';

type Nav = NativeStackNavigationProp<GoalStackParamList, 'GoalDetail'>;
type Route = RouteProp<GoalStackParamList, 'GoalDetail'>;

export default function GoalDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { goalId } = route.params;
  const { t } = useTranslation();

  const { data: goal } = useGoal(goalId);
  const { data: todos = [] } = useGoalTodos(goalId);
  const { data: categories = [] } = useCategories();
  const categoryMap = useCategoryMap(categories);
  const { mutate: toggleTodo } = useToggleGoalTodo();

  const completedCount = todos.filter(item => item.isCompleted === 1).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const category = goal ? categoryMap.get(goal.categoryId) : undefined;

  if (!goal) return null;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={goal.title} titleStyle={styles.headerTitle} />
        <Appbar.Action
          icon="pencil-outline"
          onPress={() =>
            navigation.navigate('GoalForm', {
              goal: {
                id: goal.id,
                title: goal.title,
                description: goal.description,
                dueDate: goal.dueDate,
                categoryId: goal.categoryId,
              },
            })
          }
        />
      </Appbar.Header>

      <FlatList
        data={todos}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.metaRow}>
              {category && (
                <View style={[styles.categoryChip, { backgroundColor: category.color + '28' }]}>
                  <Text style={[styles.categoryChipText, { color: category.color }]}>{category.name}</Text>
                </View>
              )}
              {goal.dueDate && (
                <Text style={styles.dueDateText}>
                  {t('goal.due_date_label', { date: dayjs(goal.dueDate).format(t('date.format_short')) })}
                </Text>
              )}
              {goal.isCompleted === 1 && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>{t('goal.completed_badge')}</Text>
                </View>
              )}
            </View>

            {goal.description ? (
              <Text style={styles.description}>{goal.description}</Text>
            ) : null}

            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>{t('goal.progress')}</Text>
                <Text style={styles.progressCount}>{completedCount} / {totalCount}</Text>
              </View>
              <ProgressBar
                progress={progress}
                color={Colors.primary}
                style={styles.progressBar}
              />
              <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <Checkbox.Android
              status={item.isCompleted === 1 ? 'checked' : 'unchecked'}
              color={Colors.primary}
              onPress={() => toggleTodo({ id: item.id, goalId, isCompleted: item.isCompleted })}
            />
            <TouchableOpacity
              style={styles.todoContent}
              onPress={() =>
                navigation.navigate('GoalTodoForm', {
                  goalId,
                  todo: {
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    urgency: item.urgency,
                    importance: item.importance,
                  },
                })
              }
              activeOpacity={0.7}
            >
              <Text
                variant="bodyLarge"
                style={[styles.todoTitle, item.isCompleted === 1 && styles.todoCompleted]}
              >
                {item.title}
              </Text>
              {item.description ? (
                <Text variant="bodySmall" style={styles.todoDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <TodoItemMeta urgency={item.urgency} importance={item.importance} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('goal.empty_todos')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('GoalTodoForm', { goalId })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  listContent: { paddingBottom: 100 },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  dueDateText: { fontSize: 13, color: Colors.textSecondary },
  completedBadge: {
    backgroundColor: Colors.primary + '33',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completedBadgeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  progressSection: { marginTop: 4 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 13, color: Colors.textSecondary },
  progressCount: { fontSize: 13, color: Colors.textSecondary },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: Colors.surfaceVariant },
  progressPercent: {
    fontSize: 12,
    color: Colors.primary,
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '600',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  todoContent: { flex: 1, marginLeft: 4, paddingVertical: 6 },
  todoTitle: { flexShrink: 1 },
  todoCompleted: { textDecorationLine: 'line-through', color: Colors.textMuted },
  todoDesc: { color: Colors.textSecondary, marginTop: 2 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    transform: [{ scale: 0.85 }],
  },
});
