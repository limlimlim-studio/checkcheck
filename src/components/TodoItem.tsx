import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRef } from 'react';
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
  forceCompleted?: boolean; // 오늘 탭: isCompleted=0이어도 체크된 것처럼 표시
  showCheckbox?: boolean;   // 기본 false이면 선택 모드일 때만 체크박스 표시
  isSelecting?: boolean;    // 다중 선택 모드
  isSelected?: boolean;     // 선택됨 여부
};

const URGENCY_COLOR = Colors.urgency;
const IMPORTANCE_COLOR = Colors.importance;

export default function TodoItem({ todo, category, onToggle, onPress, onDrag, isDragging, forceCompleted, showCheckbox = true, isSelecting, isSelected }: Props) {
  const showAsCompleted = !isSelecting && showCheckbox && (todo.isCompleted === 1 || forceCompleted);
  const checkboxStatus = isSelecting ? (isSelected ? 'checked' : 'unchecked') : (showAsCompleted ? 'checked' : 'unchecked');
  const checkboxVisible = isSelecting || showCheckbox;
  const pressStartX = useRef(0);
  const dueDateStr = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  const urgencyLevel = todo.urgency ?? 0;
  const importanceLevel = todo.importance ?? 0;

  const handlePress = (e: { nativeEvent: { pageX: number } }) => {
    if (Math.abs(e.nativeEvent.pageX - pressStartX.current) < 10) {
      isSelecting ? onToggle() : onPress();
    }
  };

  return (
    <View style={[styles.container, isDragging && styles.containerDragging]}>
      {checkboxVisible && (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.6} style={styles.checkboxArea}>
          <Checkbox.Android
            status={checkboxStatus}
            color={Colors.primary}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.content}
        onPressIn={(e) => { pressStartX.current = e.nativeEvent.pageX; }}
        onPress={handlePress}
        onLongPress={isSelecting ? undefined : onDrag}
        activeOpacity={0.7}
      >
        <Text
          variant="bodyLarge"
          style={[styles.titleText, showAsCompleted && styles.completed]}
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

      {!isSelecting && onDrag && <Text style={styles.dragHandle}>☰</Text>}
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
