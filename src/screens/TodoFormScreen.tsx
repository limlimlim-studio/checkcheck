import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Text, TextInput, Button, IconButton, SegmentedButtons, Divider, Dialog, Portal } from 'react-native-paper';
import { Colors } from '../theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCategories } from '../hooks/useCategories';
import { useCreateTodo, useUpdateTodo, useDeleteTodo } from '../hooks/useTodos';
import { TodoStackParamList } from '../navigation/TodoStack';
import { LEVEL_OPTIONS } from '../constants/todo';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoForm'>;
type Route = RouteProp<TodoStackParamList, 'TodoForm'>;

function getTodayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function TodoFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const todo = route.params?.todo;
  const isEdit = !!todo?.id;

  const { data: categories = [] } = useCategories();
  const { mutate: createTodo } = useCreateTodo();
  const { mutate: updateTodo } = useUpdateTodo();
  const { mutate: deleteTodo } = useDeleteTodo();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(getTodayMidnight);
  const [dueTime, setDueTime] = useState<Date | null>(null); // null = 시간 없음
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const [urgency, setUrgency] = useState('0');
  const [importance, setImportance] = useState('0');
  const [categoryId, setCategoryId] = useState<number | null>(null);


  useEffect(() => {
    setTitle(todo?.title ?? '');
    setDescription(todo?.description ?? '');
    setDueDate(todo?.dueDate ? new Date(todo.dueDate) : getTodayMidnight());
    if (todo?.dueTime != null) {
      const t = new Date();
      t.setHours(Math.floor(todo.dueTime / 60), todo.dueTime % 60, 0, 0);
      setDueTime(t);
    } else {
      setDueTime(null);
    }
    setUrgency(String(todo?.urgency ?? 0));
    setImportance(String(todo?.importance ?? 0));
    setCategoryId(todo?.categoryId ?? (categories[0]?.id ?? null));
  }, [todo, categories]);

  const handleSave = () => {
    if (!title.trim() || categoryId === null) return;
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime(),
      dueTime: dueTime ? dueTime.getHours() * 60 + dueTime.getMinutes() : null,
      urgency: Number(urgency),
      importance: Number(importance),
      categoryId,
    };
    if (isEdit && todo) {
      updateTodo({ id: todo.id, ...data });
    } else {
      createTodo(data);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (todo) {
      deleteTodo(todo.id);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEdit ? '할 일 수정' : '새 할 일'} />
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!title.trim()}
          style={styles.saveButton}
          labelStyle={styles.actionButtonLabel}
        >
          저장
        </Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label="제목 *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          keyboardAppearance="dark"
        />

        <TextInput
          label="설명"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={5}
          style={[styles.input, styles.descriptionInput]}
          keyboardAppearance="dark"
        />

        <Text variant="labelLarge" style={styles.label}>기한 *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {dueDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="spinner"
            locale="ko"
            textColor="#F2F2F7"
            minimumDate={getTodayMidnight()}
            onChange={(_, date) => {
              if (date) {
                const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                setDueDate(midnight);
              }
            }}
          />
        )}
        {showDatePicker && (
          <View style={styles.dateConfirmRow}>
            <Button mode="contained" onPress={() => setShowDatePicker(false)}>
              확인
            </Button>
          </View>
        )}

        <Text variant="labelLarge" style={styles.label}>시간</Text>
        <View style={styles.timeRow}>
          <TouchableOpacity
            style={[styles.dateButton, styles.timeButton]}
            onPress={() => {
              if (!dueTime) {
                const d = new Date();
                d.setHours(9, 0, 0, 0);
                setDueTime(d);
              }
              setShowTimePicker(true);
            }}
          >
            <Text style={dueTime ? styles.dateText : styles.datePlaceholder}>
              {dueTime
                ? dueTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                : '설정 안 함'}
            </Text>
          </TouchableOpacity>
          {dueTime && (
            <IconButton icon="close-circle" size={20} onPress={() => setDueTime(null)} />
          )}
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={dueTime ?? new Date(new Date().setHours(9, 0, 0, 0))}
            mode="time"
            display="spinner"
            locale="ko"
            textColor="#F2F2F7"
            onChange={(_, date) => {
              if (date) setDueTime(date);
            }}
          />
        )}
        {showTimePicker && (
          <View style={styles.dateConfirmRow}>
            <Button mode="contained" onPress={() => setShowTimePicker(false)}>
              확인
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        <Text variant="labelLarge" style={styles.label}>카테고리</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={[
                styles.categoryChip,
                { backgroundColor: cat.color + '28' },
                categoryId === cat.id
                  ? { borderColor: cat.color }
                  : { borderColor: 'transparent' },
              ]}
            >
              <Text style={[styles.categoryChipText, { color: cat.color }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Divider style={styles.divider} />

        <Text variant="labelLarge" style={styles.label}>긴급도</Text>
        <SegmentedButtons
          value={urgency}
          onValueChange={setUrgency}
          buttons={LEVEL_OPTIONS}
          style={styles.segment}
        />

        <Text variant="labelLarge" style={styles.label}>중요도</Text>
        <SegmentedButtons
          value={importance}
          onValueChange={setImportance}
          buttons={LEVEL_OPTIONS}
          style={styles.segment}
        />

        {isEdit && (
          <Button
            mode="outlined"
            textColor={Colors.dangerDark}
            icon="delete-outline"
            onPress={() => setDeleteDialogVisible(true)}
            style={styles.deleteButton}
            labelStyle={styles.actionButtonLabel}
          >
            삭제
          </Button>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>할 일 삭제</Dialog.Title>
          <Dialog.Content>
            <Text>"{todo?.title}" 을(를) 삭제하시겠습니까?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>취소</Button>
            <Button textColor={Colors.danger} onPress={handleDelete}>삭제</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  input: { marginBottom: 16 },
  descriptionInput: { minHeight: 120 },
  label: { marginBottom: 8, marginTop: 4 },
  deleteButton: { marginTop: 8 },
  saveButton: { marginRight: 8, alignSelf: 'center' },
  actionButtonLabel: { fontSize: 14 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  dateText: { fontSize: 15, color: Colors.text },
  datePlaceholder: { color: Colors.textMuted },
  dateClear: { fontSize: 14, color: Colors.textSecondary },
  dateConfirmRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeButton: { flex: 1, marginBottom: 0 },
  divider: { marginVertical: 16 },
  categoryScroll: { marginBottom: 4 },
  categoryChip: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  segment: { marginBottom: 16 },
});
