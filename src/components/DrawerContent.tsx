import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme';

function DrawerItem({ label, icon, onPress }: {
  label: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <MaterialCommunityIcons name={icon as any} size={22} color={Colors.text} style={styles.itemIcon} />
      <Text variant="bodyLarge" style={styles.itemLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DrawerContent(props: DrawerContentComponentProps) {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text variant="titleLarge" style={styles.appName}>CheckCheck</Text>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="labelSmall" style={styles.sectionLabel}>관리</Text>
        <DrawerItem
          label="카테고리 관리"
          icon="tag-outline"
          onPress={() => {
            props.navigation.navigate('CategoryDrawer');
            props.navigation.closeDrawer();
          }}
        />
        <DrawerItem
          label="루틴 관리"
          icon="repeat"
          onPress={() => {
            props.navigation.navigate('RoutineDrawer');
            props.navigation.closeDrawer();
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appName: { color: Colors.primary, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 24 },
  sectionLabel: {
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemIcon: { marginRight: 12 },
  itemLabel: { color: Colors.text },
});
