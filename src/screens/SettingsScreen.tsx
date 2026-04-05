import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, Divider } from 'react-native-paper';
import { Colors } from '../theme';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { SettingsStackParamList } from '../navigation/SettingsStack';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

const SETTINGS_ITEMS = [
  { key: 'CategoryManagement', label: '카테고리 관리', description: '카테고리 추가, 수정, 삭제' },
] as const;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const parentNav = navigation.getParent();
    if (!parentNav) return;
    return parentNav.addListener('focus', () => {
      navigation.setOptions({ animation: 'none' });
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'SettingsHome' }] }));
      requestAnimationFrame(() => navigation.setOptions({ animation: 'default' }));
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="설정" />
      </Appbar.Header>

      <View style={styles.section}>
        {SETTINGS_ITEMS.map((item, index) => (
          <View key={item.key}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate(item.key)}
            >
              <View>
                <Text variant="bodyLarge">{item.label}</Text>
                <Text variant="bodySmall" style={styles.description}>{item.description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            {index < SETTINGS_ITEMS.length - 1 && <Divider />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  section: {
    backgroundColor: Colors.surface,
    marginTop: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  description: { color: Colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 20, color: Colors.textMuted },
});
