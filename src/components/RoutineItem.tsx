import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { Colors } from '../theme';
import TodoItemMeta from './TodoItem/TodoItemMeta';

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
  alarmTime?: number | null;
  category?: Category;
  isCompletedToday: boolean;
  onToggle: () => void;
};

export default function RoutineItem({ routineId: _, title, urgency, importance, alarmTime, category, isCompletedToday, onToggle }: Props) {
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
        <View style={styles.metaRow}>
          <View style={styles.routineTag}>
            <Text style={styles.routineTagText}>루틴</Text>
          </View>
          <TodoItemMeta
            category={category}
            dueTime={alarmTime}
            urgency={urgency}
            importance={importance}
          />
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
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4, gap: 6 },
  routineTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.primary + '22',
  },
  routineTagText: { fontSize: 10, fontWeight: '600', color: Colors.primary },
});
