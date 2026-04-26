import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Appbar, Text, Divider } from 'react-native-paper';
import { Colors } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../navigation/SettingsStack';
import Constants from 'expo-constants';
import { useAdFree, REQUIRED_AD_COUNT } from '../hooks/useAdFree';
import { getDayStartHour, setDayStartHour } from '../db';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

const APP_INFO = [
  { label: '앱 이름', value: Constants.expoConfig?.name ?? 'checkcheck' },
  { label: '버전', value: Constants.expoConfig?.version ?? '1.0.0' },
  { label: '개발사', value: 'limlimlim studio' },
];

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAdFree, adFreeUntil, watchedCount, watchAd, isLoading, resetAdFree } = useAdFree();
  const [dayStartHour, setDayStartHourState] = useState(() => getDayStartHour());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const dayStartDate = new Date();
  dayStartDate.setHours(dayStartHour, 0, 0, 0);

  const handleTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const hour = date.getHours();
      setDayStartHour(hour);
      setDayStartHourState(hour);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="설정" />
      </Appbar.Header>

      <Text variant="labelSmall" style={styles.sectionLabel}>광고 없이 보기</Text>
      <View style={styles.section}>
        {isAdFree ? (
          <View style={styles.item}>
            <View>
              <Text variant="bodyLarge">광고 없음</Text>
              <Text variant="bodySmall" style={styles.description}>
                {formatDate(adFreeUntil)}까지 광고가 표시되지 않아요
              </Text>
            </View>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        ) : (
          <View style={styles.rewardedSection}>
            <View style={styles.rewardedInfo}>
              <Text variant="bodyLarge">광고 시청으로 30일 무광고</Text>
              <Text variant="bodySmall" style={styles.description}>
                동영상 광고 {REQUIRED_AD_COUNT}개를 시청하면 30일간 광고가 숨겨져요
              </Text>
              <View style={styles.dots}>
                {Array.from({ length: REQUIRED_AD_COUNT }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i < watchedCount && styles.dotFilled]}
                  />
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.watchButton, isLoading && styles.watchButtonDisabled]}
              onPress={watchAd}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={styles.watchButtonText}>광고 시청</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

      {__DEV__ && (
        <>
          <Text variant="labelSmall" style={[styles.sectionLabel, { color: Colors.danger }]}>개발용</Text>
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => Alert.alert('광고 없음 초기화', '광고 없음 상태를 초기화할까요?', [
                { text: '취소', style: 'cancel' },
                { text: '초기화', style: 'destructive', onPress: resetAdFree },
              ])}
            >
              <Text variant="bodyLarge" style={{ color: Colors.danger }}>광고 면제 초기화</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text variant="labelSmall" style={styles.sectionLabel}>하루 기준 시간</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={() => setShowTimePicker(true)}>
          <View>
            <Text variant="bodyLarge">하루 시작 시간</Text>
            <Text variant="bodySmall" style={styles.description}>
              이 시간 이후부터 새로운 날로 인식해요
            </Text>
          </View>
          <Text style={styles.timeValue}>오전 {String(dayStartHour).padStart(2, '0')}:00</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={dayStartDate}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
          />
        )}
      </View>

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
  checkmark: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoValue: { color: Colors.textSecondary },
  timeValue: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
  rewardedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rewardedInfo: { flex: 1 },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  watchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  watchButtonDisabled: {
    backgroundColor: Colors.surfaceVariant,
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
