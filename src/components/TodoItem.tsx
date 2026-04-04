import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { Colors } from '../theme';

type Todo = {
  id: number;
  title: string;
  description?: string | null;
  dueDate?: number | null;
  urgency?: number | null;
  importance?: number | null;
  isCompleted: number;
  categoryId: number;
};

type Category = {
  id: number;
  name: string;
  color: string;
};

type Props = {
  todo: Todo;
  category?: Category;
  onToggle: () => void;
  onPress: () => void;
};

const LEVEL_LABELS = ['', '낮음', '보통', '높음'];

const URGENCY_COLOR = '#FF6B6B';
const IMPORTANCE_COLOR = '#4ECDC4';

export default function TodoItem({ todo, category, onToggle, onPress }: Props) {
  const dueDateStr = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  const urgencyLevel = todo.urgency ?? 0;
  const importanceLevel = todo.importance ?? 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Checkbox.Android
        status={todo.isCompleted === 1 ? 'checked' : 'unchecked'}
        onPress={onToggle}
        color={category?.color}
      />
      <View style={styles.content}>
        <Text
          variant="bodyLarge"
          style={[styles.titleText, todo.isCompleted === 1 && styles.completed]}
        >
          {todo.title}
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
          {dueDateStr && (
            <Text variant="labelSmall" style={styles.metaText}>{dueDateStr}</Text>
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  content: { flex: 1, marginLeft: 4 },
  titleText: { flexShrink: 1 },
  completed: { textDecorationLine: 'line-through', color: Colors.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { color: Colors.textSecondary },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
});
