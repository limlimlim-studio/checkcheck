import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { Colors } from '../theme';
import { LEVEL_LABELS } from '../constants/todo';

type Category = {
  id: number;
  name: string;
  color: string;
};

type Props = {
  routineId: number;
  title: string;
  urgency?: number | null;
  importance?: number | null;
  category?: Category;
  isCompletedToday: boolean;
  onToggle: () => void;
};

const URGENCY_COLOR = Colors.urgency;
const IMPORTANCE_COLOR = Colors.importance;

export default function RoutineItem({ routineId: _, title, urgency, importance, category, isCompletedToday, onToggle }: Props) {
  const urgencyLevel = urgency ?? 0;
  const importanceLevel = importance ?? 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.6} style={styles.checkboxArea}>
        <Checkbox.Android
          status={isCompletedToday ? 'checked' : 'unchecked'}
          color={category?.color}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          variant="bodyLarge"
          style={[styles.titleText, isCompletedToday && styles.completed]}
        >
          {title}
        </Text>
        <View style={styles.meta}>
          {category && (
            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
          )}
          {category && (
            <Text variant="labelSmall" style={[styles.metaText, { color: category.color }]}>
              {category.name}
            </Text>
          )}
          <Text variant="labelSmall" style={[styles.metaText, styles.routineTag]}>루틴</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  checkboxArea: { padding: 4 },
  content: { flex: 1, marginLeft: 4, paddingVertical: 4 },
  titleText: { flexShrink: 1 },
  completed: { textDecorationLine: 'line-through', color: Colors.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { color: Colors.textSecondary },
  routineTag: { color: Colors.primary },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '600' },
});
