import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRef } from 'react';
import { Text, Checkbox } from 'react-native-paper';
import { Colors } from '../../theme';
import TodoItemMeta from './TodoItemMeta';

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
  checked: boolean;
  onCheck: () => void;
  onPress?: () => void;        // 본문 탭 (없으면 onCheck 호출)
  onDrag?: () => void;
  isDragging?: boolean;
  checkboxVisible?: boolean;   // 기본 true
  showDescription?: boolean;
};

export default function TodoItem({
  todo,
  category,
  checked,
  onCheck,
  onPress,
  onDrag,
  isDragging,
  checkboxVisible = true,
  showDescription,
}: Props) {
  const pressStartX = useRef(0);

  const handlePress = (e: { nativeEvent: { pageX: number } }) => {
    if (Math.abs(e.nativeEvent.pageX - pressStartX.current) < 10) {
      onPress ? onPress() : onCheck();
    }
  };

  return (
    <View style={[styles.container, isDragging && styles.containerDragging]}>
      {checkboxVisible && (
        <TouchableOpacity onPress={onCheck} activeOpacity={0.6} style={styles.checkboxArea}>
          <Checkbox.Android
            status={checked ? 'checked' : 'unchecked'}
            color={Colors.primary}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.content}
        onPressIn={(e) => { pressStartX.current = e.nativeEvent.pageX; }}
        onPress={handlePress}
        onLongPress={onDrag}
        activeOpacity={0.7}
      >
        <Text
          variant="bodyLarge"
          style={[styles.titleText, checked && styles.completed]}
        >
          {todo.title}
        </Text>
        {showDescription && !!todo.description && (
          <Text
            variant="bodySmall"
            style={styles.descriptionText}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {todo.description}
          </Text>
        )}
        <TodoItemMeta
          category={category}
          urgency={todo.urgency}
          importance={todo.importance}
        />
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
  checkboxArea: { padding: 4 },
  content: { flex: 1, marginLeft: 4, paddingVertical: 4 },
  titleText: { flexShrink: 1 },
  completed: { textDecorationLine: 'line-through', color: Colors.textMuted },
  descriptionText: { color: Colors.textSecondary, marginTop: 2 },
  dragHandle: { paddingLeft: 8, color: Colors.textMuted, fontSize: 18 },
});
