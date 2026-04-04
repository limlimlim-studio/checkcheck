import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Text, IconButton } from 'react-native-paper';
import { Colors } from '../theme';
import { useCategories } from '../hooks/useCategories';

const CURRENT_YEAR = new Date().getFullYear();

export default function RecordScreen() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const { data: categories = [] } = useCategories();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <IconButton
          icon="chevron-left"
          iconColor={Colors.text}
          onPress={() => setYear((y) => y - 1)}
        />
        <Appbar.Content title={String(year)} titleStyle={styles.yearTitle} />
        <IconButton
          icon="chevron-right"
          iconColor={year >= CURRENT_YEAR ? Colors.textMuted : Colors.text}
          disabled={year >= CURRENT_YEAR}
          onPress={() => setYear((y) => y + 1)}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {categories.map((category) => (
          <View key={category.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.dot, { backgroundColor: category.color }]} />
              <Text variant="titleSmall" style={styles.categoryName}>
                {category.name}
              </Text>
              {category.description ? (
                <Text variant="bodySmall" style={styles.categoryDesc} numberOfLines={1} ellipsizeMode="tail">
                  {category.description}
                </Text>
              ) : null}
            </View>
            {/* 잔디 그리드는 이슈 #24에서 구현 */}
            <View style={styles.gridPlaceholder} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  yearTitle: { textAlign: 'center', fontWeight: '700', fontSize: 18 },
  content: { paddingVertical: 8 },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { color: Colors.text },
  categoryDesc: { color: Colors.textMuted, flexShrink: 1 },
  gridPlaceholder: {
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: 6,
  },
});
