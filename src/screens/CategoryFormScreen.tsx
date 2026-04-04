import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Text, TextInput, Button, Dialog, Portal, IconButton } from 'react-native-paper';
import { Colors } from '../theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useCategories } from '../hooks/useCategories';
import { SettingsStackParamList } from '../navigation/SettingsStack';
import { generateRandomColor } from '../constants/colors';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'CategoryForm'>;
type Route = RouteProp<SettingsStackParamList, 'CategoryForm'>;

export default function CategoryFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const category = route.params?.category;
  const isEdit = !!category?.id;

  const { data: categories = [] } = useCategories();
  const { mutate: createCategory } = useCreateCategory();
  const { mutate: updateCategory } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(generateRandomColor);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    setName(category?.name ?? '');
    setDescription(category?.description ?? '');
    setColor(category?.color ?? generateRandomColor());
  }, [category]);

  const handleSave = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), description: description.trim() || undefined, color };
    if (isEdit && category) {
      updateCategory({ id: category.id, ...data });
    } else {
      createCategory(data);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!category) return;
    const defaultCategory = categories.find((c) => c.isDefault === 1);
    if (defaultCategory) {
      deleteCategory({ id: category.id, defaultCategoryId: defaultCategory.id });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEdit ? '카테고리 수정' : '새 카테고리'} />
        {isEdit && (
          <Appbar.Action
            icon="delete-outline"
            iconColor="#EA4335"
            onPress={() => setDeleteDialogVisible(true)}
          />
        )}
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!name.trim()}
          style={styles.saveButton}
          labelStyle={styles.saveButtonLabel}
        >
          저장
        </Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label="이름 *"
          value={name}
          onChangeText={setName}
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
          numberOfLines={3}
          style={[styles.input, styles.descriptionInput]}
        />

        <Text variant="labelLarge" style={styles.label}>색상</Text>
        <View style={styles.colorPreviewRow}>
          <View style={[styles.colorPreview, { backgroundColor: color }]} />
          <Text style={styles.colorHex}>{color.toUpperCase()}</Text>
          <IconButton
            icon="refresh"
            size={24}
            onPress={() => setColor(generateRandomColor())}
          />
        </View>

      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>카테고리 삭제</Dialog.Title>
          <Dialog.Content>
            <Text>
              <Text style={styles.bold}>"{category?.name}"</Text> 카테고리에 속한 할 일이 모두{' '}
              <Text style={styles.bold}>미분류</Text>로 이동됩니다.{'\n'}삭제하시겠습니까?
            </Text>
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
  descriptionInput: { minHeight: 80 },
  label: { marginBottom: 12 },
  saveButton: { marginRight: 8, alignSelf: 'center' },
  saveButtonLabel: { fontSize: 14 },
  colorPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  colorHex: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  bold: { fontWeight: 'bold' },
});
