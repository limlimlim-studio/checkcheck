import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Appbar, Text, FAB, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabView, TabBar } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Colors } from '../theme';
import { useGoalsActive, useGoalsDone, useGoalTodos } from '../hooks/useGoals';
import { useCategoryMap } from '../hooks/useCategoryMap';
import { useCategories } from '../hooks/useCategories';
import { GoalStackParamList } from '../navigation/GoalStack';
import { Goal, Category } from '../types';
import PageHelpModal from '../components/PageHelpModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<GoalStackParamList, 'GoalList'>;

function GoalItem({
  goal,
  categoryMap,
  onPress,
}: {
  goal: Goal;
  categoryMap: Map<number, Category>;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { data: todos = [] } = useGoalTodos(goal.id);

  const completedCount = todos.filter(todo => todo.isCompleted === 1).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const category = categoryMap.get(goal.categoryId);

  return (
    <TouchableOpacity style={styles.goalItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.goalItemHeader}>
        <Text variant="bodyLarge" style={styles.goalTitle} numberOfLines={1}>
          {goal.title}
        </Text>
        <Text style={styles.progressText}>{completedCount}/{totalCount}</Text>
      </View>

      <View style={styles.goalItemMeta}>
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
      </View>

      <ProgressBar
        progress={progress}
        color={Colors.primary}
        style={styles.progressBar}
      />
    </TouchableOpacity>
  );
}

function ActiveTab({ onNavigate }: { onNavigate: (goalId: number) => void }) {
  const { t } = useTranslation();
  const { data: goals = [] } = useGoalsActive();
  const { data: categories = [] } = useCategories();
  const categoryMap = useCategoryMap(categories);

  return (
    <View style={styles.tabContainer}>
      <FlatList
        data={goals}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <GoalItem goal={item} categoryMap={categoryMap} onPress={() => onNavigate(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('goal.empty_active')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function DoneTab({ onNavigate }: { onNavigate: (goalId: number) => void }) {
  const { t } = useTranslation();
  const { data: goals = [] } = useGoalsDone();
  const { data: categories = [] } = useCategories();
  const categoryMap = useCategoryMap(categories);

  const sections = useMemo(() => {
    const grouped = goals.reduce<Record<string, Goal[]>>((acc, goal) => {
      const key = goal.completedAt
        ? dayjs(goal.completedAt).format(t('goal.completed_group_format'))
        : t('goal.completed_badge');
      if (!acc[key]) acc[key] = [];
      acc[key].push(goal);
      return acc;
    }, {});
    return Object.entries(grouped);
  }, [goals, t]);

  return (
    <View style={styles.tabContainer}>
      <FlatList
        data={sections}
        keyExtractor={([key]) => key}
        renderItem={({ item: [monthKey, monthGoals] }) => (
          <View>
            <Text style={styles.sectionHeader}>{monthKey}</Text>
            {monthGoals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} categoryMap={categoryMap} onPress={() => onNavigate(goal.id)} />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('goal.empty_done')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

export default function GoalScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const layout = useWindowDimensions();
  const [tabIndex, setTabIndex] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);

  const ROUTES = [
    { key: 'active', title: t('goal.tab_active') },
    { key: 'done', title: t('goal.tab_done') },
  ];

  const handleNavigateToDetail = useCallback((goalId: number) => {
    navigation.navigate('GoalDetail', { goalId });
  }, [navigation]);

  const renderScene = useCallback(({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'active': return <ActiveTab onNavigate={handleNavigateToDetail} />;
      case 'done': return <DoneTab onNavigate={handleNavigateToDetail} />;
      default: return null;
    }
  }, [handleNavigateToDetail]);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbarHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>CheckCheck</Text>
          <TouchableOpacity style={styles.subtitleRow} onPress={() => setHelpVisible(true)} activeOpacity={0.6}>
            <Text style={styles.headerSubtitle}>{t('help.goal_subtitle')}</Text>
            <MaterialCommunityIcons name="help-circle-outline" size={13} color={Colors.textMuted} style={styles.helpIcon} />
          </TouchableOpacity>
        </View>
        <Appbar.Action icon="cog-outline" onPress={() => navigation.navigate('SettingsRoot' as never)} style={styles.action} />
      </Appbar.Header>

      <PageHelpModal
        visible={helpVisible}
        onDismiss={() => setHelpVisible(false)}
        title={t('help.goal_title')}
        body={t('help.goal_body')}
      />

      <TabView
        navigationState={{ index: tabIndex, routes: ROUTES }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.indicator}
            activeColor={Colors.primary}
            inactiveColor={Colors.textMuted}
            pressColor={Colors.surfaceVariant}
          />
        )}
      />

      {tabIndex === 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('GoalForm', undefined)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appbarHeader: { height: 88 },
  action: { marginHorizontal: -2 },
  headerContent: { flex: 1, paddingLeft: 16, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted },
  helpIcon: { marginLeft: 4 },
  tabBar: { backgroundColor: Colors.surface },
  indicator: { backgroundColor: Colors.primary },
  tabContainer: { flex: 1 },
  listContent: { paddingTop: 12, paddingBottom: 100 },
  goalItem: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
  },
  goalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: { flex: 1, fontWeight: '600', marginRight: 8 },
  progressText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  goalItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  dueDateText: { fontSize: 12, color: Colors.textSecondary },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceVariant },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  emptyContainer: { padding: 48, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    transform: [{ scale: 0.85 }],
  },
});
