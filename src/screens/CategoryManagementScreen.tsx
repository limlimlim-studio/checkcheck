import { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, Divider, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';
import CategoryFormSheet from '../components/CategoryFormSheet';

type Category = {
  id: number;
  name: string;
  description?: string | null;
  color: string;
  createdAt: number;
};

export default function CategoryManagementScreen() {
  const navigation = useNavigation();
  const { data: categories = [] } = useCategories();
  const { mutate: createCategory } = useCreateCategory();
  const { mutate: updateCategory } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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

  const handleDelete = () => {
    if (selectedCategory) {
      deleteCategory(selectedCategory.id);
      setSheetVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="카테고리 관리" />
      </Appbar.Header>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openEdit(item)}>
            <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
            <View style={styles.itemText}>
              <Text variant="bodyLarge">{item.name}</Text>
              {item.description ? (
                <Text variant="bodySmall" style={styles.description}>{item.description}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />

      <FAB icon="plus" style={styles.fab} onPress={openCreate} />

      <CategoryFormSheet
        visible={sheetVisible}
        category={selectedCategory}
        onDismiss={() => setSheetVisible(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
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
  },
  colorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  itemText: { flex: 1 },
  description: { color: '#888', marginTop: 2 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
