import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, Divider, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useRoutines, useReorderRoutines } from '../hooks/useRoutines';
import { useCategories } from '../hooks/useCategories';
import { RoutineStackParamList } from '../navigation/RoutineStack';
import TodoItemMeta from '../components/TodoItem/TodoItemMeta';
import type { TFunction } from 'i18next';

type Nav = NativeStackNavigationProp<RoutineStackParamList, 'RoutineManagement'>;

type Routine = {
  id: number;
  categoryId: number;
  title: string;
  description?: string | null;
  repeatType: string;
  repeatValue?: string | null;
  alarmTime?: number | null;
  urgency: number | null;
  importance: number | null;
  sortOrder: number;
  isActive: number;
  createdAt: number;
  updatedAt: number;
};

const DAY_KEYS = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'] as const;

function repeatDescription(routine: Routine, t: TFunction): string {
  if (routine.repeatType === 'daily') return t('routine.repeat_label_daily');
  if (routine.repeatType === 'weekly' && routine.repeatValue) {
    const days = routine.repeatValue.split(',').map((d) => t(`routine.${DAY_KEYS[Number(d)]}`)).join(', ');
    return `${t('routine.repeat_label_weekly_prefix')}${days}`;
  }
  if (routine.repeatType === 'monthly' && routine.repeatValue) {
    const days = routine.repeatValue.split(',')
      .map((d) => d === 'last' ? t('routine.repeat_label_monthly_lastday') : t('routine.repeat_label_monthly_day', { day: d }))
      .join(', ');
    return `${t('routine.repeat_label_monthly_prefix')}${days}`;
  }
  return routine.repeatType;
}

export default function RoutineManagementScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { data: routines = [] } = useRoutines();
  const { data: categories = [] } = useCategories();
  const { mutate: reorderRoutines } = useReorderRoutines();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Routine>) => {
    const category = categoryMap.get(item.categoryId);

    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[styles.item, isActive && styles.itemDragging]}
          onPress={() => navigation.navigate('RoutineForm', { routine: item })}
          onLongPress={drag}
          disabled={isActive}
        >
          <View style={styles.itemText}>
            <Text variant="bodyLarge">{item.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.repeatTag}>
                <Text style={styles.repeatTagText}>{repeatDescription(item, t)}</Text>
              </View>
              <TodoItemMeta
                category={category}
                dueTime={item.alarmTime}
                urgency={item.urgency}
                importance={item.importance}
              />
            </View>
          </View>
          <Text style={styles.dragHandle}>☰</Text>
        </TouchableOpacity>
        <Divider />
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('routine.title_manage')} />
      </Appbar.Header>

      <DraggableFlatList
        data={routines as Routine[]}
        keyExtractor={(item) => String(item.id)}
        onDragEnd={({ data }) => reorderRoutines(data.map((r) => r.id))}
        renderItem={renderItem}
        autoscrollThreshold={80}
        autoscrollSpeed={200}
        containerStyle={{ flex: 1 }}
        ListEmptyComponent={
          <Text style={styles.empty}>{t('routine.empty')}</Text>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: bottomInset + 16 }]}
        onPress={() => navigation.navigate('RoutineForm')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.background,
  },
  itemDragging: { backgroundColor: Colors.surfaceVariant, elevation: 4 },
  itemText: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4, gap: 6 },
  repeatTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.surfaceVariant,
  },
  repeatTagText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  dragHandle: { color: Colors.textMuted, fontSize: 18 },
  fab: { position: 'absolute', right: 16, transform: [{ scale: 0.85 }] },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
});
