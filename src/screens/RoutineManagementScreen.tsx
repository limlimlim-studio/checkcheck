import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, Divider, FAB } from 'react-native-paper';
import { Colors } from '../theme';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useRoutines, useReorderRoutines } from '../hooks/useRoutines';
import { useCategories } from '../hooks/useCategories';
import { SettingsStackParamList } from '../navigation/SettingsStack';
import { LEVEL_LABELS } from '../constants/todo';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'RoutineManagement'>;

type Routine = {
  id: number;
  categoryId: number;
  title: string;
  description?: string | null;
  repeatType: string;
  repeatValue?: string | null;
  urgency: number | null;
  importance: number | null;
  sortOrder: number;
  isActive: number;
  createdAt: number;
  updatedAt: number;
};

const REPEAT_LABELS: Record<string, string> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function repeatDescription(routine: Routine): string {
  if (routine.repeatType === 'daily') return '매일';
  if (routine.repeatType === 'weekly' && routine.repeatValue) {
    const days = routine.repeatValue.split(',').map((d) => DAY_NAMES[Number(d)]).join(', ');
    return `매주 ${days}`;
  }
  if (routine.repeatType === 'monthly' && routine.repeatValue) {
    const days = routine.repeatValue.split(',')
      .map((d) => d === 'last' ? '말일' : `${d}일`)
      .join(', ');
    return `매월 ${days}`;
  }
  return REPEAT_LABELS[routine.repeatType] ?? routine.repeatType;
}

const URGENCY_COLOR = Colors.urgency;
const IMPORTANCE_COLOR = Colors.importance;

export default function RoutineManagementScreen() {
  const navigation = useNavigation<Nav>();
  const { data: routines = [] } = useRoutines();
  const { data: categories = [] } = useCategories();
  const { mutate: reorderRoutines } = useReorderRoutines();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Routine>) => {
    const category = categoryMap.get(item.categoryId);
    const urgencyLevel = item.urgency ?? 0;
    const importanceLevel = item.importance ?? 0;

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
            <View style={styles.meta}>
              {category && (
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              )}
              {category && (
                <Text variant="labelSmall" style={[styles.metaText, { color: category.color }]}>
                  {category.name}
                </Text>
              )}
              <Text variant="labelSmall" style={styles.metaText}>{repeatDescription(item)}</Text>
              {urgencyLevel > 0 && (
                <View style={[styles.badge, { backgroundColor: URGENCY_COLOR + '33' }]}>
                  <Text style={[styles.badgeText, { color: URGENCY_COLOR }]}>
                    긴급 {LEVEL_LABELS[urgencyLevel]}
                  </Text>
                </View>
              )}
              {importanceLevel > 0 && (
                <View style={[styles.badge, { backgroundColor: IMPORTANCE_COLOR + '33' }]}>
                  <Text style={[styles.badgeText, { color: IMPORTANCE_COLOR }]}>
                    중요 {LEVEL_LABELS[importanceLevel]}
                  </Text>
                </View>
              )}
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
        <Appbar.Content title="루틴 관리" />
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
          <Text style={styles.empty}>루틴이 없어요</Text>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
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
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { color: Colors.textSecondary },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  dragHandle: { color: Colors.textMuted, fontSize: 18 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
});
