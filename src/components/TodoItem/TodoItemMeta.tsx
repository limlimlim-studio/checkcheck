import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../../theme';
import { LEVEL_LABELS } from '../../constants/todo';

const URGENCY_COLOR = Colors.urgency;
const IMPORTANCE_COLOR = Colors.importance;

type Category = {
  id: number;
  name: string;
  color: string;
};

type Props = {
  category?: Category;
  urgency?: number | null;
  importance?: number | null;
};

export default function TodoItemMeta({ category, urgency, importance }: Props) {
  const urgencyLevel = urgency ?? 0;
  const importanceLevel = importance ?? 0;

  return (
    <View style={styles.meta}>
      {category && (
        <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
      )}
      {category && (
        <Text variant="labelSmall" style={[styles.metaText, { color: category.color }]}>
          {category.name}
        </Text>
      )}
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
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { color: Colors.textSecondary },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '600' },
});
