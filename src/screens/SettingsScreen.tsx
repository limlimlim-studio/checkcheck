import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Appbar, Text, Divider } from 'react-native-paper';
import { Colors } from '../theme';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { SettingsStackParamList } from '../navigation/SettingsStack';
import Constants from 'expo-constants';
import { usePremiumStore } from '../stores/premiumStore';
import { savePremiumStatus } from '../hooks/usePremiumStatus';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

const SETTINGS_ITEMS = [
  { key: 'CategoryManagement', label: '카테고리 관리', description: '카테고리 추가, 수정, 삭제' },
] as const;

const APP_INFO = [
  { label: '앱 이름', value: Constants.expoConfig?.name ?? 'checkcheck' },
  { label: '버전', value: Constants.expoConfig?.version ?? '1.0.0' },
  { label: '개발사', value: 'limlimlim studio' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isPremium = usePremiumStore((s) => s.isPremium);

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

      <Text variant="labelSmall" style={styles.sectionLabel}>일반</Text>
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

      <Text variant="labelSmall" style={styles.sectionLabel}>프리미엄</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('Premium')}
          disabled={isPremium}
        >
          <View>
            <Text variant="bodyLarge">{isPremium ? '프리미엄 이용 중' : '광고 제거'}</Text>
            <Text variant="bodySmall" style={styles.description}>
              {isPremium ? '모든 광고가 제거된 상태입니다' : '일회성 구매로 광고를 영구 제거'}
            </Text>
          </View>
          {isPremium
            ? <Text style={styles.checkmark}>✓</Text>
            : <Text style={styles.arrow}>›</Text>
          }
        </TouchableOpacity>
      </View>

      {__DEV__ && isPremium && (
        <>
          <Text variant="labelSmall" style={[styles.sectionLabel, { color: Colors.danger }]}>개발용</Text>
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => Alert.alert('프리미엄 초기화', '프리미엄 상태를 초기화할까요?', [
                { text: '취소', style: 'cancel' },
                { text: '초기화', style: 'destructive', onPress: () => savePremiumStatus(false) },
              ])}
            >
              <Text variant="bodyLarge" style={{ color: Colors.danger }}>프리미엄 초기화</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text variant="labelSmall" style={styles.sectionLabel}>앱</Text>
      <View style={styles.section}>
        {APP_INFO.map((info, index) => (
          <View key={info.label}>
            <View style={styles.infoItem}>
              <Text variant="bodyLarge">{info.label}</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{info.value}</Text>
            </View>
            {index < APP_INFO.length - 1 && <Divider />}
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
    marginTop: 4,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  description: { color: Colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 20, color: Colors.textMuted },
  checkmark: { fontSize: 18, color: '#A78BFA', fontWeight: '700' },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoValue: { color: Colors.textSecondary },
});
