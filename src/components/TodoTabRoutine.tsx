import { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Divider, FAB } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import { useRoutinesToday, useToggleRoutineCompletion } from '../hooks/useRoutines';
import { useCategories } from '../hooks/useCategories';
import { useCategoryMap } from '../hooks/useCategoryMap';
import { useDayStartStore } from '../stores/dayStartStore';
import TodayProgressBar from './TodayProgressBar';
import RoutineItem from './RoutineItem';

export default function TodoTabRoutine() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { data: routines = [] } = useRoutinesToday();
  const { data: categories = [] } = useCategories();
  const { mutate: toggleRoutine } = useToggleRoutineCompletion();
  const effectiveToday = useDayStartStore(s => s.effectiveToday);
  const categoryMap = useCategoryMap(categories);
  const isFocused = useIsFocused();
  const [cleanedUp, setCleanedUp] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const displayRoutines = cleanedUp ? routines.filter(r => !r.isCompletedToday) : routines;
  const hasCompleted = routines.some(r => r.isCompletedToday);

  const segments = useMemo(() => {
    const map = new Map<number, { color: string; count: number }>();
    for (const r of routines) {
      if (!r.isCompletedToday) continue;
      const cat = categoryMap.get(r.categoryId);
      const color = cat?.color ?? Colors.primary;
      const key = r.categoryId ?? 0;
      map.set(key, { color, count: (map.get(key)?.count ?? 0) + 1 });
    }
    return [...map.entries()].map(([categoryId, { color, count }]) => ({ categoryId, color, count }));
  }, [routines, categoryMap]);

  const total = routines.length;
  const totalCompleted = segments.reduce((s, seg) => s + seg.count, 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={displayRoutines}
        keyExtractor={(item) => `routine-${item.id}`}
        ListHeaderComponent={
          <TodayProgressBar segments={segments} totalCompleted={totalCompleted} total={total} />
        }
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={<Text style={styles.empty}>{t('routine.empty_today')}</Text>}
        renderItem={({ item }) => (
          <RoutineItem
            routineId={item.id}
            title={item.title}
            urgency={item.urgency}
            importance={item.importance}
            alarmTime={item.alarmTime}
            category={categoryMap.get(item.categoryId)}
            isCompletedToday={item.isCompletedToday}
            onToggle={() => toggleRoutine({ routineId: item.id, date: effectiveToday })}
          />
        )}
        style={styles.list}
      />

      <FAB.Group
        open={fabOpen}
        visible={isFocused}
        icon={fabOpen ? 'close' : 'plus'}
        fabStyle={styles.fab}
        actions={[
          ...(hasCompleted && !cleanedUp ? [{ icon: 'broom', label: t('todo.menu_clear'), onPress: () => { setCleanedUp(true); setFabOpen(false); }, size: 'small' as const }] : []),
          { icon: 'autorenew', label: t('todo.menu_routine'), onPress: () => { navigation.navigate('RoutineRoot' as never); setFabOpen(false); }, size: 'small' as const },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
  fab: { transform: [{ scale: 0.85 }] },
});
