import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useMemo, useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Appbar, Text, Divider } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Colors } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../navigation/SettingsStack';
import Constants from 'expo-constants';
import { useAdFree, REQUIRED_AD_COUNT } from '../hooks/useAdFree';
import { setDayStartHour, db } from '../db';
import { todos, todoCompletions } from '../db/schema';
import { useDayStartStore } from '../stores/dayStartStore';
import { resetDueDateCheckGuard, runDueDateCheck } from '../hooks/useTodos';

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

function formatHour(hour: number): string {
  if (hour === 0) return '오전 12:00';
  if (hour < 12) return `오전 ${hour}:00`;
  if (hour === 12) return '오후 12:00';
  return `오후 ${hour - 12}:00`;
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAdFree, adFreeUntil, watchedCount, watchAd, isLoading, resetAdFree } = useAdFree();
  const queryClient = useQueryClient();

  // 하루 시작 시간 — Zustand 스토어에서 읽음 (변경 시 타이머 자동 재시작)
  const { dayStartHour, setDayStartHour: setDayStartHourInStore } = useDayStartStore();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const dayStartDate = useMemo(() => {
    const d = new Date();
    d.setHours(dayStartHour, 0, 0, 0);
    return d;
  }, [dayStartHour]);

  const nextTimerStr = useMemo(() => {
    const now = dayjs();
    let next = now.startOf('day').add(dayStartHour, 'hour');
    if (!now.isBefore(next)) next = next.add(1, 'day');
    return next.format('M월 D일 HH:mm');
  }, [dayStartHour]);

  const handleTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const hour = date.getHours();
      setDayStartHour(hour);         // DB 저장
      setDayStartHourInStore(hour);  // 스토어 업데이트 → 타이머 재시작
    }
  };

  // ── 개발용 ──────────────────────────────────────────
  const handleCreateTestTodo = async () => {
    const yesterday = dayjs().subtract(1, 'day');
    const yesterdayTs = yesterday.startOf('day').valueOf();
    const yesterdayStr = yesterday.format('YYYY-MM-DD');
    const now = Date.now();

    const cats = db.select().from(require('../db/schema').categories).all() as { id: number }[];
    const catId = cats[0]?.id ?? 1;

    const result = db.insert(todos).values({
      categoryId: catId,
      title: '[타이머테스트] 어제 완료한 할 일',
      dueDate: yesterdayTs,
      sortOrder: -9999,
      urgency: 0,
      importance: 0,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: todos.id }).get();

    if (result) {
      db.insert(todoCompletions).values({ todoId: result.id, completedDate: yesterdayStr }).run();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      Alert.alert(
        '테스트 할 일 생성',
        `"[타이머테스트] 어제 완료한 할 일" 생성\n어제(${yesterdayStr}) 완료 기록 추가\n\n이제 "타이머 강제 실행"을 눌러 정리 여부를 확인하세요`,
      );
    }
  };

  const handleForceRunTimer = async () => {
    resetDueDateCheckGuard();
    const changed = await runDueDateCheck();
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
    Alert.alert('타이머 강제 실행', changed ? '할 일이 정리됐어요 ✓' : '정리할 항목이 없어요');
  };
  // ────────────────────────────────────────────────────

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
            <Divider />
            <TouchableOpacity style={styles.item} onPress={handleCreateTestTodo}>
              <View>
                <Text variant="bodyLarge" style={{ color: Colors.danger }}>테스트 할 일 생성</Text>
                <Text variant="bodySmall" style={styles.description}>어제 날짜 + 완료 기록 포함</Text>
              </View>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity style={styles.item} onPress={handleForceRunTimer}>
              <View>
                <Text variant="bodyLarge" style={{ color: Colors.danger }}>타이머 강제 실행</Text>
                <Text variant="bodySmall" style={styles.description}>
                  다음 예약: {nextTimerStr}
                </Text>
              </View>
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
              이 시간이 지나면 오늘 완료한 할 일이 정리돼요
            </Text>
          </View>
          <Text style={styles.timeValue}>{formatHour(dayStartHour)}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={dayStartDate}
            mode="time"
            display="spinner"
            themeVariant="dark"
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
