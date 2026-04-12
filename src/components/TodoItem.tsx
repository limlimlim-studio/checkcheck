import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { Colors } from '../theme';
import { LEVEL_LABELS } from '../constants/todo';

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
  onDrag?: () => void;
  isDragging?: boolean;
};

const URGENCY_COLOR = Colors.urgency;
const IMPORTANCE_COLOR = Colors.importance;

export default function TodoItem({ todo, category, onToggle, onPress, onDrag, isDragging }: Props) {
  const dueDateStr = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  const urgencyLevel = todo.urgency ?? 0;
  const importanceLevel = todo.importance ?? 0;

  return (
    <View style={[styles.container, isDragging && styles.containerDragging]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.6} style={styles.checkboxArea}>
        <Checkbox.Android
          status={todo.isCompleted === 1 ? 'checked' : 'unchecked'}
          color={category?.color}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.content} onPress={onPress} onLongPress={onDrag} activeOpacity={0.7}>
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
      </TouchableOpacity>

      {onDrag && <Text style={styles.dragHandle}>☰</Text>}
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
  containerDragging: { backgroundColor: Colors.surfaceVariant, elevation: 4 },
  checkboxArea: {
    padding: 4,
  },
  content: { flex: 1, marginLeft: 4, paddingVertical: 4 },
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
  dragHandle: { paddingLeft: 8, color: Colors.textMuted, fontSize: 18 },
});
