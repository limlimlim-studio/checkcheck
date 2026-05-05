import { View, ScrollView, Modal, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useMemo, useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Appbar, Text, Divider, Dialog, Portal, RadioButton } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import i18next from 'i18next';
import { Colors } from '../theme';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../navigation/SettingsStack';
import Constants from 'expo-constants';
import { useAdFree, REQUIRED_AD_COUNT } from '../hooks/useAdFree';
import { setDayStartMinutes, db, setAppLanguage, resetOnboardingCompleted } from '../db';
import { todos, todoCompletions } from '../db/schema';
import { seedDemoData } from '../utils/seedData';
import { useDayStartStore } from '../stores/dayStartStore';
import { useLanguageStore } from '../stores/languageStore';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

const LANGUAGE_OPTIONS = [
  { value: 'auto', nativeLabel: null },
  { value: 'ko',   nativeLabel: '한국어' },
  { value: 'en',   nativeLabel: 'English' },
  { value: 'zh',   nativeLabel: '中文(简体)' },
  { value: 'ja',   nativeLabel: '日本語' },
];

function formatDate(ts: number, t: ReturnType<typeof useTranslation>['t']): string {
  return dayjs(ts).format(t('date.format_short'));
}

function formatMinutes(minutes: number, t: ReturnType<typeof useTranslation>['t']): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const mm = String(m).padStart(2, '0');
  const isAM = h < 12;
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${t(isAM ? 'settings.am' : 'settings.pm')} ${hour12}:${mm}`;
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { isAdFree, adFreeUntil, watchedCount, watchAd, isLoading, resetAdFree } = useAdFree();
  const queryClient = useQueryClient();

  const { dayStartMinutes, setDayStartMinutes: setDayStartMinutesInStore, setEffectiveToday } = useDayStartStore();
  const { language, setLanguage } = useLanguageStore();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLangDialog, setShowLangDialog] = useState(false);
  const [sampleLocale, setSampleLocale] = useState<'ko' | 'en' | 'zh' | 'ja'>('ko');
  const [tempDate, setTempDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(Math.floor(dayStartMinutes / 60), dayStartMinutes % 60, 0, 0);
    return d;
  });

  const dayStartDate = useMemo(() => {
    const d = new Date();
    d.setHours(Math.floor(dayStartMinutes / 60), dayStartMinutes % 60, 0, 0);
    return d;
  }, [dayStartMinutes]);

  const nextTimerStr = useMemo(() => {
    const now = dayjs();
    let next = now.startOf('day').add(dayStartMinutes, 'minute');
    if (!now.isBefore(next)) next = next.add(1, 'day');
    return next.format(t('date.format_short_with_time'));
  }, [dayStartMinutes, t]);

  const handleOpenPicker = () => {
    setTempDate(dayStartDate);
    setShowTimePicker(true);
  };

  const handlePickerChange = (_: DateTimePickerEvent, date?: Date) => {
    if (date) setTempDate(date);
  };

  const handleConfirm = () => {
    const minutes = tempDate.getHours() * 60 + tempDate.getMinutes();
    setDayStartMinutes(minutes);
    setDayStartMinutesInStore(minutes);
    setShowTimePicker(false);
  };

  const handleCancel = () => {
    setShowTimePicker(false);
  };

  const handleLanguageChange = (lang: string) => {
    setAppLanguage(lang);
    setLanguage(lang);
    if (lang === 'auto') {
      const deviceCode = (require('expo-localization').getLocales()[0]?.languageCode ?? 'en') as string;
      const supported = ['ko', 'en', 'zh', 'ja'];
      i18next.changeLanguage(supported.includes(deviceCode) ? deviceCode : 'en');
    } else {
      i18next.changeLanguage(lang);
    }
    setShowLangDialog(false);
  };

  const getLanguageDisplayLabel = () => {
    if (language === 'auto') return t('language.auto');
    return LANGUAGE_OPTIONS.find((o) => o.value === language)?.nativeLabel ?? language;
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
        t('settings.dev_test_todo_alert_title'),
        t('settings.dev_test_todo_alert_msg', { date: yesterdayStr }),
      );
    }
  };

  const handleForceRunTimer = () => {
    const currentEffective = useDayStartStore.getState().effectiveToday;
    setEffectiveToday(dayjs(currentEffective).add(1, 'day').format('YYYY-MM-DD'));
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
    Alert.alert(t('settings.dev_timer_alert_title'), t('settings.dev_timer_alert_changed'));
  };
  const handleSeedData = async () => {
    const result = await seedDemoData();
    if (result.skipped) {
      Alert.alert('시드 데이터', '이미 데이터가 존재합니다. 할 일을 모두 삭제한 뒤 다시 시도하세요.');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['routines'] });
    queryClient.invalidateQueries({ queryKey: ['routinesToday'] });
    queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
    Alert.alert('시드 완료', `루틴 ${result.routines}개 · 할 일 ${result.todos}개 · 루틴 완료 기록 ${result.routineCompletions}건 · 할 일 완료 기록 ${result.todoCompletions}건 생성됨`);
  };
  const handleApplySampleData = () => {
    const localeLabel = { ko: '한국어', en: 'English', zh: '中文', ja: '日本語' };
    Alert.alert(
      '샘플 데이터 적용',
      `[${localeLabel[sampleLocale]}] 샘플 데이터를 적용합니다.\n기존 할 일·루틴·완료 기록이 모두 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '적용',
          style: 'destructive',
          onPress: () => {
            const { applySampleData } = require('../utils/sampleDataLoader');
            const result = applySampleData(sampleLocale);
            queryClient.invalidateQueries({ queryKey: ['todos'] });
            queryClient.invalidateQueries({ queryKey: ['routines'] });
            queryClient.invalidateQueries({ queryKey: ['routinesToday'] });
            queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            Alert.alert(
              '적용 완료',
              `카테고리 ${result.categories}개 · 루틴 ${result.routines}개 · 할 일 ${result.todos}개\n루틴 완료 ${result.routineCompletions}건 · 할 일 완료 ${result.todoCompletions}건`,
            );
          },
        },
      ],
    );
  };

  const handleReplayOnboarding = () => {
    resetOnboardingCompleted();
    navigation.getParent()?.getParent()?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Onboarding' }] }),
    );
  };
  // ────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="labelSmall" style={styles.sectionLabel}>{t('settings.section_ad')}</Text>
        <View style={styles.section}>
          {isAdFree ? (
            <View style={styles.item}>
              <View>
                <Text variant="bodyLarge">{t('settings.ad_free')}</Text>
                <Text variant="bodySmall" style={styles.description}>
                  {t('settings.ad_free_until', { date: formatDate(adFreeUntil, t) })}
                </Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ) : (
            <View style={styles.rewardedSection}>
              <View style={styles.rewardedInfo}>
                <Text variant="bodyLarge">{t('settings.watch_ad')}</Text>
                <Text variant="bodySmall" style={styles.description}>
                  {t('settings.watch_ad_desc', { count: REQUIRED_AD_COUNT })}
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
                  : <Text style={styles.watchButtonText}>{t('settings.watch_ad_btn')}</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {__DEV__ && (
          <>
            <Text variant="labelSmall" style={[styles.sectionLabel, { color: Colors.danger }]}>
              {t('settings.dev_section')}
            </Text>
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.item}
                onPress={() => Alert.alert(
                  t('settings.dev_reset_confirm_title'),
                  t('settings.dev_reset_confirm_msg'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.reset'), style: 'destructive', onPress: resetAdFree },
                  ],
                )}
              >
                <Text variant="bodyLarge" style={{ color: Colors.danger }}>{t('settings.dev_reset_ad')}</Text>
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity style={styles.item} onPress={handleCreateTestTodo}>
                <View>
                  <Text variant="bodyLarge" style={{ color: Colors.danger }}>{t('settings.dev_test_todo')}</Text>
                  <Text variant="bodySmall" style={styles.description}>{t('settings.dev_test_todo_desc')}</Text>
                </View>
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity style={styles.item} onPress={handleForceRunTimer}>
                <View>
                  <Text variant="bodyLarge" style={{ color: Colors.danger }}>{t('settings.dev_timer')}</Text>
                  <Text variant="bodySmall" style={styles.description}>
                    {t('settings.dev_timer_next', { time: nextTimerStr })}
                  </Text>
                </View>
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity style={styles.item} onPress={handleSeedData}>
                <View>
                  <Text variant="bodyLarge" style={{ color: Colors.danger }}>시드 데이터 생성</Text>
                  <Text variant="bodySmall" style={styles.description}>
                    할 일 / 루틴 / 완료 이력 데모 데이터 삽입 (기존 데이터 없을 때만 동작)
                  </Text>
                </View>
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity style={styles.item} onPress={handleReplayOnboarding}>
                <View>
                  <Text variant="bodyLarge" style={{ color: Colors.danger }}>온보딩 다시 보기</Text>
                  <Text variant="bodySmall" style={styles.description}>
                    완료 기록을 초기화하고 가이드 화면으로 이동
                  </Text>
                </View>
              </TouchableOpacity>
              <Divider />
              <View style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLarge" style={{ color: Colors.danger }}>스크린샷용 샘플 데이터</Text>
                  <Text variant="bodySmall" style={styles.description}>
                    언어별 로컬라이즈 데이터로 초기화 (기존 데이터 전체 삭제)
                  </Text>
                  <View style={styles.localePicker}>
                    {(['ko', 'en', 'zh', 'ja'] as ('ko' | 'en' | 'zh' | 'ja')[]).map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.localeBtn, sampleLocale === loc && styles.localeBtnActive]}
                        onPress={() => setSampleLocale(loc)}
                      >
                        <Text
                          variant="labelMedium"
                          style={sampleLocale === loc ? styles.localeBtnTextActive : styles.localeBtnText}
                        >
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.applyBtn} onPress={handleApplySampleData}>
                    <Text variant="labelMedium" style={styles.applyBtnText}>적용</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}

        <Text variant="labelSmall" style={styles.sectionLabel}>{t('settings.section_day_start')}</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.item} onPress={handleOpenPicker}>
            <View>
              <Text variant="bodyLarge">{t('settings.day_start_time')}</Text>
              <Text variant="bodySmall" style={styles.description}>
                {t('settings.day_start_desc')}
              </Text>
            </View>
            <Text style={styles.timeValue}>{formatMinutes(dayStartMinutes, t)}</Text>
          </TouchableOpacity>
        </View>

        <Text variant="labelSmall" style={styles.sectionLabel}>{t('settings.section_language')}</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.item} onPress={() => setShowLangDialog(true)}>
            <Text variant="bodyLarge">{t('settings.language_label')}</Text>
            <Text style={styles.langValue}>{getLanguageDisplayLabel()}</Text>
          </TouchableOpacity>
        </View>

        <Text variant="labelSmall" style={styles.sectionLabel}>{t('settings.section_app')}</Text>
        <View style={styles.section}>
          <View style={styles.infoItem}>
            <Text variant="bodyLarge">{t('settings.version')}</Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 시간 선택 Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel} hitSlop={12}>
                <Text style={styles.modalCancel}>{t('settings.modal_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} hitSlop={12}>
                <Text style={styles.modalConfirm}>{t('settings.modal_confirm')}</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="time"
              display="spinner"
              themeVariant="dark"
              onChange={handlePickerChange}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>

      {/* 언어 선택 Dialog */}
      <Portal>
        <Dialog visible={showLangDialog} onDismiss={() => setShowLangDialog(false)}>
          <Dialog.Title>{t('language.select_title')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={handleLanguageChange} value={language}>
              {LANGUAGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.langOption}
                  onPress={() => handleLanguageChange(opt.value)}
                >
                  <RadioButton.Android value={opt.value} color={Colors.primary} />
                  <Text variant="bodyMedium">
                    {opt.value === 'auto' ? t('language.auto') : opt.nativeLabel}
                  </Text>
                </TouchableOpacity>
              ))}
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 40 },
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
  localePicker: { flexDirection: 'row', gap: 8, marginTop: 10 },
  localeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  localeBtnActive: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  localeBtnText: { color: Colors.textSecondary },
  localeBtnTextActive: { color: '#fff' },
  applyBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: Colors.danger,
  },
  applyBtnText: { color: '#fff' },
  checkmark: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoValue: { color: Colors.textSecondary },
  timeValue: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
  langValue: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalConfirm: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  picker: {
    width: '100%',
  },
});
