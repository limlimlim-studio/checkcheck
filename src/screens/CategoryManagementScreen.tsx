import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, Divider, FAB } from 'react-native-paper';
import { Colors } from '../theme';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCategories, useReorderCategories } from '../hooks/useCategories';
import { CategoryStackParamList } from '../navigation/CategoryStack';

type Nav = NativeStackNavigationProp<CategoryStackParamList, 'CategoryManagement'>;

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
  const navigation = useNavigation<Nav>();
  const { data: categories = [] } = useCategories();
  const { mutate: reorderCategories } = useReorderCategories();

  const handleDragEnd = ({ data }: { data: Category[] }) => {
    reorderCategories(data.map((c) => c.id));
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Category>) => (
    <ScaleDecorator>
      <TouchableOpacity
        style={[styles.item, isActive && styles.itemDragging]}
        onPress={() => {
          if (!item.isDefault) {
            navigation.navigate('CategoryForm', { category: item });
          }
        }}
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
        {!item.isDefault && <Text style={styles.dragHandle}>☰</Text>}
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
        containerStyle={{ flex: 1 }}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CategoryForm')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.background,
  },
  itemDragging: { backgroundColor: Colors.surfaceVariant, elevation: 4 },
  colorBadge: { width: 20, height: 20, borderRadius: 10 },
  itemText: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defaultBadge: {
    backgroundColor: Colors.surfaceVariant,
    color: Colors.textSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  description: { color: Colors.textSecondary, marginTop: 2 },
  dragHandle: { color: Colors.textMuted, fontSize: 18 },
  fab: { position: 'absolute', right: 16, bottom: 48 },
});
