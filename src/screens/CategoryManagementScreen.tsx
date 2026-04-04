import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, Divider, FAB, Dialog, Portal, Button } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '../hooks/useCategories';
import CategoryFormSheet from '../components/CategoryFormSheet';

type Category = {
  id: number;
  name: string;
  description?: string | null;
  color: string;
  sortOrder: number;
  isDefault: number;
  createdAt: number;
};

export default function CategoryManagementScreen() {
  const navigation = useNavigation();
  const { data: categories = [] } = useCategories();
  const { mutate: createCategory } = useCreateCategory();
  const { mutate: updateCategory } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();
  const { mutate: reorderCategories } = useReorderCategories();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const defaultCategory = categories.find((c) => c.isDefault === 1);

  const openCreate = () => {
    setSelectedCategory(null);
    setSheetVisible(true);
  };

  const openEdit = (category: Category) => {
    setSelectedCategory(category);
    setSheetVisible(true);
  };

  const handleSave = (data: { name: string; description?: string; color: string }) => {
    if (selectedCategory) {
      updateCategory({ id: selectedCategory.id, ...data });
    } else {
      createCategory(data);
    }
    setSheetVisible(false);
  };

  const handleDeletePress = () => {
    setSheetVisible(false);
    setDeleteDialogVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCategory && defaultCategory) {
      deleteCategory({ id: selectedCategory.id, defaultCategoryId: defaultCategory.id });
    }
    setDeleteDialogVisible(false);
    setSelectedCategory(null);
  };

  const handleDragEnd = ({ data }: { data: Category[] }) => {
    reorderCategories(data.map((c) => c.id));
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Category>) => (
    <ScaleDecorator>
      <TouchableOpacity
        style={[styles.item, isActive && styles.itemDragging]}
        onPress={() => !item.isDefault && openEdit(item)}
        onLongPress={drag}
        disabled={isActive}
      >
        <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
        <View style={styles.itemText}>
          <View style={styles.itemRow}>
            <Text variant="bodyLarge">{item.name}</Text>
            {item.isDefault === 1 && (
              <Text variant="labelSmall" style={styles.defaultBadge}>기본</Text>
            )}
          </View>
          {item.description ? (
            <Text variant="bodySmall" style={styles.description}>{item.description}</Text>
          ) : null}
        </View>
        <Text style={styles.dragHandle}>☰</Text>
      </TouchableOpacity>
      <Divider />
    </ScaleDecorator>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="카테고리 관리" />
      </Appbar.Header>

      <DraggableFlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        onDragEnd={handleDragEnd}
        renderItem={renderItem}
        autoscrollThreshold={80}
        autoscrollSpeed={200}
      />

      <FAB icon="plus" style={styles.fab} onPress={openCreate} />

      <CategoryFormSheet
        visible={sheetVisible}
        category={selectedCategory}
        onDismiss={() => setSheetVisible(false)}
        onSave={handleSave}
        onDelete={selectedCategory?.isDefault ? undefined : handleDeletePress}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>카테고리 삭제</Dialog.Title>
          <Dialog.Content>
            <Text>
              <Text style={styles.bold}>"{selectedCategory?.name}"</Text> 카테고리에 속한 할 일이 모두{' '}
              <Text style={styles.bold}>미분류</Text>로 이동됩니다.{'\n'}삭제하시겠습니까?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>취소</Button>
            <Button textColor="#EA4335" onPress={handleDeleteConfirm}>삭제</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  itemDragging: { backgroundColor: '#f5f5f5', elevation: 4 },
  colorBadge: { width: 20, height: 20, borderRadius: 10 },
  itemText: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defaultBadge: {
    backgroundColor: '#eee',
    color: '#888',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  description: { color: '#888', marginTop: 2 },
  dragHandle: { color: '#ccc', fontSize: 18 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  bold: { fontWeight: 'bold' },
});
