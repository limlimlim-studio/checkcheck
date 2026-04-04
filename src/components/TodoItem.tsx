import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';

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

export default function TodoItem({ todo, category, onToggle, onPress }: Props) {
  const dueDateStr = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Checkbox
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
  completed: { textDecorationLine: 'line-through', color: '#aaa' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { color: '#888' },
});
