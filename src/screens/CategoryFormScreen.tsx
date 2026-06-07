import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Text, TextInput, Button, Dialog, Portal, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <Appbar.Content title={isEdit ? t('category.title_edit') : t('category.title_new')} />
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!name.trim()}
          style={styles.saveButton}
          labelStyle={styles.actionButtonLabel}
        >
          {t('common.save')}
        </Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label={t('category.field_name')}
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          keyboardAppearance="dark"
        />
        <TextInput
          label={t('category.field_description')}
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          keyboardAppearance="dark"
          style={[styles.input, styles.descriptionInput]}
        />

        <Text variant="labelLarge" style={styles.label}>{t('category.field_color')}</Text>
        <View style={styles.colorPreviewRow}>
          <View style={[styles.colorPreview, { backgroundColor: color }]} />
          <Text style={styles.colorHex}>{color.toUpperCase()}</Text>
          <IconButton
            icon="refresh"
            size={24}
            onPress={() => setColor(generateRandomColor())}
          />
        </View>

        {isEdit && (
          <Button
            mode="outlined"
            textColor="#B03A2E"
            icon="delete-outline"
            onPress={() => setDeleteDialogVisible(true)}
            style={styles.deleteButton}
            labelStyle={styles.actionButtonLabel}
          >
            {t('common.delete')}
          </Button>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>{t('category.delete_title')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('category.delete_message', { name: category?.name ?? '' })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>{t('common.cancel')}</Button>
            <Button textColor="#EA4335" onPress={handleDelete}>{t('common.delete')}</Button>
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
  deleteButton: { marginTop: 8 },
  saveButton: { marginRight: 8, alignSelf: 'center' },
  actionButtonLabel: { fontSize: 14 },
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
