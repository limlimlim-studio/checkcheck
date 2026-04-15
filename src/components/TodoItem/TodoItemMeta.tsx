import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const URGENCY_COLOR = Colors.urgency;
const IMPORTANCE_COLOR = Colors.importance;

// 레벨별 아이콘 수 (1→1개, 2→2개, 3→3개)
const URGENCY_ICON = 'lightning-bolt';
const IMPORTANCE_ICON = 'star';

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
        <View style={[styles.tag, { backgroundColor: category.color + '28' }]}>
          <View style={[styles.tagDot, { backgroundColor: category.color }]} />
          <Text style={[styles.tagText, { color: category.color }]}>{category.name}</Text>
        </View>
      )}
      {urgencyLevel > 0 && (
        <View style={[styles.tag, { backgroundColor: URGENCY_COLOR + '22' }]}>
          {Array.from({ length: urgencyLevel }).map((_, i) => (
            <MaterialCommunityIcons
              key={i}
              name={URGENCY_ICON}
              size={10}
              color={URGENCY_COLOR}
            />
          ))}
        </View>
      )}
      {importanceLevel > 0 && (
        <View style={[styles.tag, { backgroundColor: IMPORTANCE_COLOR + '22' }]}>
          {Array.from({ length: importanceLevel }).map((_, i) => (
            <MaterialCommunityIcons
              key={i}
              name={IMPORTANCE_ICON}
              size={10}
              color={IMPORTANCE_COLOR}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 10, fontWeight: '600' },
});
