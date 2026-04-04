import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { useCategories } from '../hooks/useCategories';

type Todo = {
  id?: number;
  title: string;
  description?: string | null;
  dueDate?: number | null;
  urgency?: number | null;
  importance?: number | null;
  categoryId: number;
};

type Props = {
  visible: boolean;
  todo?: Todo | null;
  onDismiss: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    dueDate?: number;
    urgency: number;
    importance: number;
    categoryId: number;
  }) => void;
  onDelete?: () => void;
};

const LEVEL_OPTIONS = [
  { value: '0', label: '없음' },
  { value: '1', label: '낮음' },
  { value: '2', label: '보통' },
  { value: '3', label: '높음' },
];

export default function TodoFormSheet({ visible, todo, onDismiss, onSave, onDelete }: Props) {
  const { data: categories = [] } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateStr, setDueDateStr] = useState('');
  const [urgency, setUrgency] = useState('0');
  const [importance, setImportance] = useState('0');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const isEdit = !!todo?.id;

  useEffect(() => {
    if (visible) {
      setTitle(todo?.title ?? '');
      setDescription(todo?.description ?? '');
      setDueDateStr(todo?.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '');
      setUrgency(String(todo?.urgency ?? 0));
      setImportance(String(todo?.importance ?? 0));
      setCategoryId(todo?.categoryId ?? (categories[0]?.id ?? null));
    }
  }, [visible, todo, categories]);

  const handleSave = () => {
    if (!title.trim() || categoryId === null) return;
    const dueDate = dueDateStr ? new Date(dueDateStr).getTime() : undefined;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: isNaN(dueDate as number) ? undefined : dueDate,
      urgency: Number(urgency),
      importance: Number(importance),
      categoryId,
    });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="titleLarge" style={styles.title}>
            {isEdit ? '할 일 수정' : '새 할 일'}
          </Text>

          <TextInput
            label="제목 *"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="상세 내용"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <TextInput
            label="기한 (YYYY-MM-DD)"
            value={dueDateStr}
            onChangeText={setDueDateStr}
            mode="outlined"
            placeholder="2025-12-31"
            style={styles.input}
          />

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

          <Text variant="labelLarge" style={styles.label}>시급도</Text>
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

          <View style={styles.actions}>
            {isEdit && onDelete && (
              <Button mode="text" textColor="#EA4335" onPress={onDelete}>삭제</Button>
            )}
            <View style={styles.rightActions}>
              <Button mode="text" onPress={onDismiss}>취소</Button>
              <Button mode="contained" onPress={handleSave} disabled={!title.trim()}>저장</Button>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    maxHeight: '85%',
  },
  title: { marginBottom: 16 },
  input: { marginBottom: 12 },
  label: { marginBottom: 8, marginTop: 4 },
  categoryScroll: { marginBottom: 16 },
  categoryChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryChipText: { fontSize: 13 },
  segment: { marginBottom: 16 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rightActions: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
});
