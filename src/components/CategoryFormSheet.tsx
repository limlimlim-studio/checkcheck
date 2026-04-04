import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, IconButton } from 'react-native-paper';
import { generateRandomColor } from '../constants/colors';

type Category = {
  id?: number;
  name: string;
  description?: string | null;
  color: string;
};

type Props = {
  visible: boolean;
  category?: Category | null;
  onDismiss: () => void;
  onSave: (data: { name: string; description?: string; color: string }) => void;
  onDelete?: () => void;
};

export default function CategoryFormSheet({ visible, category, onDismiss, onSave, onDelete }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(generateRandomColor);

  const isEdit = !!category?.id;

  useEffect(() => {
    if (visible) {
      setName(category?.name ?? '');
      setDescription(category?.description ?? '');
      setColor(category?.color ?? generateRandomColor());
    }
  }, [visible, category]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim() || undefined, color });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          {isEdit ? '카테고리 수정' : '새 카테고리'}
        </Text>

        <TextInput
          label="이름 *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="설명"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
        />

        <Text variant="labelLarge" style={styles.colorLabel}>색상</Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorPreview, { backgroundColor: color }]} />
          <Text style={styles.colorHex}>{color.toUpperCase()}</Text>
          <IconButton
            icon="refresh"
            size={20}
            onPress={() => setColor(generateRandomColor())}
          />
        </View>

        <View style={styles.actions}>
          {isEdit && onDelete && (
            <Button mode="text" textColor="#EA4335" onPress={onDelete}>
              삭제
            </Button>
          )}
          <View style={styles.rightActions}>
            <Button mode="text" onPress={onDismiss}>취소</Button>
            <Button mode="contained" onPress={handleSave} disabled={!name.trim()}>
              저장
            </Button>
          </View>
        </View>
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
  },
  title: { marginBottom: 16 },
  input: { marginBottom: 12 },
  colorLabel: { marginBottom: 8 },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  colorPreview: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  colorHex: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
});
