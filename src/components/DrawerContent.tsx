import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme';

export default function DrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.appName}>CheckCheck</Text>
      </View>

      <View style={styles.section}>
        <Text variant="labelSmall" style={styles.sectionLabel}>관리</Text>
        <DrawerItem
          label="카테고리 관리"
          labelStyle={styles.itemLabel}
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="tag-outline" size={size} color={color} />
          )}
          onPress={() => {
            props.navigation.navigate('CategoryDrawer');
            props.navigation.closeDrawer();
          }}
        />
        <DrawerItem
          label="루틴 관리"
          labelStyle={styles.itemLabel}
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="repeat" size={size} color={color} />
          )}
          onPress={() => {
            props.navigation.navigate('RoutineDrawer');
            props.navigation.closeDrawer();
          }}
        />
      </View>
    </DrawerContentScrollView>
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
  section: { paddingTop: 8 },
  sectionLabel: {
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  itemLabel: { color: Colors.text },
});
