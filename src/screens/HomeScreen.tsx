import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, FAB, Text } from 'react-native-paper';
import { useCategories } from '../hooks/useCategories';
import { useUIStore } from '../stores/uiStore';

export default function HomeScreen() {
  const { data: categories = [], isLoading } = useCategories();
  const { selectedCategoryId, setSelectedCategoryId } = useUIStore();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="할 일 관리" />
      </Appbar.Header>

      {isLoading ? (
        <Text style={styles.center}>로딩 중...</Text>
      ) : categories.length === 0 ? (
        <Text style={styles.center}>카테고리를 추가해주세요</Text>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Text
              style={[
                styles.category,
                selectedCategoryId === item.id && styles.selected,
              ]}
              onPress={() =>
                setSelectedCategoryId(
                  selectedCategoryId === item.id ? null : item.id
                )
              }
            >
              {item.name}
            </Text>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 8 },
  center: { textAlign: 'center', marginTop: 40 },
  category: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    fontSize: 16,
  },
  selected: { backgroundColor: '#d0b4f4' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
