import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Text, TextInput, Button, SegmentedButtons, Divider, Dialog, Portal } from 'react-native-paper';
import { Colors } from '../theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCategories } from '../hooks/useCategories';
import { useCreateTodo, useUpdateTodo, useDeleteTodo } from '../hooks/useTodos';
import { TodoStackParamList } from '../navigation/TodoStack';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoForm'>;
type Route = RouteProp<TodoStackParamList, 'TodoForm'>;

const today = new Date();
today.setHours(0, 0, 0, 0);

const LEVEL_OPTIONS = [
  { value: '0', label: '없음' },
  { value: '1', label: '낮음' },
  { value: '2', label: '보통' },
  { value: '3', label: '높음' },
];

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
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const [urgency, setUrgency] = useState('0');
  const [importance, setImportance] = useState('0');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  useEffect(() => {
    setTitle(todo?.title ?? '');
    setDescription(todo?.description ?? '');
    setDueDate(todo?.dueDate ? new Date(todo.dueDate) : null);
    setUrgency(String(todo?.urgency ?? 0));
    setImportance(String(todo?.importance ?? 0));
    setCategoryId(todo?.categoryId ?? (categories[0]?.id ?? null));
  }, [todo, categories]);

  const handleSave = () => {
    if (!title.trim() || categoryId === null) return;
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate ? dueDate.getTime() : undefined,
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
        {isEdit && (
          <Appbar.Action icon="delete-outline" iconColor="#EA4335" onPress={() => setDeleteDialogVisible(true)} />
        )}
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!title.trim()}
          style={styles.saveButton}
          labelStyle={styles.saveButtonLabel}
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
          autoFocus={!isEdit}
        />

        <TextInput
          label="설명"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={5}
          style={[styles.input, styles.descriptionInput]}
        />

        <Text variant="labelLarge" style={styles.label}>기한</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            if (!dueDate) setDueDate(new Date(today));
            setShowDatePicker(true);
          }}
        >
          <Text style={[styles.dateText, !dueDate && styles.datePlaceholder]}>
            {dueDate
              ? dueDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
              : '기한 없음'}
          </Text>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate(null)} hitSlop={8}>
              <Text style={styles.dateClear}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate ?? today}
            mode="date"
            display="spinner"
            locale="ko"
            minimumDate={today}
            textColor="#F2F2F7"
            onChange={(_, date) => {
              if (date && date >= today) setDueDate(date);
            }}
          />
        )}
        {showDatePicker && (
          <View style={styles.dateConfirmRow}>
            <Button mode="text" onPress={() => { setDueDate(null); setShowDatePicker(false); }}>
              초기화
            </Button>
            <Button mode="contained" onPress={() => setShowDatePicker(false)}>
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
                { borderColor: cat.color },
                categoryId === cat.id && { backgroundColor: cat.color },
              ]}
            >
              <Text style={[
                styles.categoryChipText,
                categoryId === cat.id && { color: '#fff' },
              ]}>
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
      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>할 일 삭제</Dialog.Title>
          <Dialog.Content>
            <Text>"{todo?.title}" 을(를) 삭제하시겠습니까?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>취소</Button>
            <Button textColor="#EA4335" onPress={handleDelete}>삭제</Button>
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
  saveButton: { marginRight: 8, alignSelf: 'center' },
  saveButtonLabel: { fontSize: 14 },
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
  divider: { marginVertical: 16 },
  categoryScroll: { marginBottom: 4 },
  categoryChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryChipText: { fontSize: 13 },
  segment: { marginBottom: 16 },
});
