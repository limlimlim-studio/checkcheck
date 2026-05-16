import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Appbar, Text, TextInput, Button, IconButton, Dialog, Portal, SegmentedButtons, Divider, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCreateRoutine, useUpdateRoutine, useDeleteRoutine } from '../hooks/useRoutines';
import { useCategories } from '../hooks/useCategories';
import { RoutineStackParamList } from '../navigation/RoutineStack';
import { getLevelOptions } from '../constants/todo';
import { getOffsetOptions, offsetsFromString, offsetLabel } from '../utils/notifications';
import dayjs from 'dayjs';
import i18next from 'i18next';

type Nav = NativeStackNavigationProp<RoutineStackParamList, 'RoutineForm'>;
type Route = RouteProp<RoutineStackParamList, 'RoutineForm'>;

const PICKER_LOCALE: Record<string, string> = {
  ko: 'ko', en: 'en', zh: 'zh-Hans', ja: 'ja',
};

export default function RoutineFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const routine = route.params?.routine;
  const isEdit = !!routine?.id;

  const { data: categories = [] } = useCategories();
  const { mutate: createRoutine } = useCreateRoutine();
  const { mutate: updateRoutine } = useUpdateRoutine();
  const { mutate: deleteRoutine } = useDeleteRoutine();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedMonthDays, setSelectedMonthDays] = useState<Set<string>>(new Set());
  const [alarmTime, setAlarmTime] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationOffsets, setNotificationOffsets] = useState<number[]>([]);
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [pendingOffsets, setPendingOffsets] = useState<number[]>([]);
  const [urgency, setUrgency] = useState('0');
  const [importance, setImportance] = useState('0');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const pickerLocale = PICKER_LOCALE[i18next.language] ?? 'en';

  const DAY_OPTIONS = [
    { value: '0', label: t('routine.day_sun') },
    { value: '1', label: t('routine.day_mon') },
    { value: '2', label: t('routine.day_tue') },
    { value: '3', label: t('routine.day_wed') },
    { value: '4', label: t('routine.day_thu') },
    { value: '5', label: t('routine.day_fri') },
    { value: '6', label: t('routine.day_sat') },
  ];

  useEffect(() => {
    if (routine) {
      setTitle(routine.title);
      setDescription(routine.description ?? '');
      setCategoryId(routine.categoryId);
      setRepeatType(routine.repeatType as 'daily' | 'weekly' | 'monthly');
      if (routine.repeatType === 'weekly' && routine.repeatValue) {
        setSelectedDays(new Set(routine.repeatValue.split(',')));
      }
      if (routine.repeatType === 'monthly' && routine.repeatValue) {
        setSelectedMonthDays(new Set(routine.repeatValue.split(',')));
      }
      if (routine.alarmTime != null) {
        const time = new Date();
        time.setHours(Math.floor(routine.alarmTime / 60), routine.alarmTime % 60, 0, 0);
        setAlarmTime(time);
      } else {
        setAlarmTime(null);
      }
      setNotificationOffsets(offsetsFromString((routine as any)?.notificationOffsets));
      setUrgency(String(routine.urgency ?? 0));
      setImportance(String(routine.importance ?? 0));
    } else {
      const defaultCategory = categories.find((c) => c.isDefault === 1);
      if (defaultCategory) setCategoryId(defaultCategory.id);
    }
  }, [routine, categories]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const toggleMonthDay = (day: string) => {
    setSelectedMonthDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const getRepeatValue = () => {
    if (repeatType === 'weekly') return Array.from(selectedDays).sort().join(',');
    if (repeatType === 'monthly') return Array.from(selectedMonthDays).sort((a, b) => Number(a) - Number(b)).join(',');
    return undefined;
  };

  const isValid = () => {
    if (!title.trim()) return false;
    if (!categoryId) return false;
    if (repeatType === 'weekly' && selectedDays.size === 0) return false;
    if (repeatType === 'monthly' && selectedMonthDays.size === 0) return false;
    return true;
  };

  const handleSave = () => {
    if (!isValid() || categoryId === null) return;
    const data = {
      categoryId,
      title: title.trim(),
      description: description.trim() || undefined,
      repeatType,
      repeatValue: getRepeatValue(),
      alarmTime: alarmTime ? alarmTime.getHours() * 60 + alarmTime.getMinutes() : null,
      notificationOffsets: alarmTime ? notificationOffsets : [],
      urgency: Number(urgency),
      importance: Number(importance),
    };
    if (isEdit && routine) {
      updateRoutine({ id: routine.id, ...data });
    } else {
      createRoutine(data);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (routine) deleteRoutine(routine.id);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEdit ? t('routine.title_edit') : t('routine.title_new')} />
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!isValid()}
          style={styles.saveButton}
          labelStyle={styles.actionButtonLabel}
        >
          {t('common.save')}
        </Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label={t('routine.field_title')}
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          keyboardAppearance="dark"
        />
        <TextInput
          label={t('routine.field_description')}
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          keyboardAppearance="dark"
          style={[styles.input, styles.descriptionInput]}
        />

        <Text variant="labelLarge" style={styles.label}>{t('routine.field_category')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={[
                styles.categoryChip,
                { backgroundColor: cat.color + '28' },
                categoryId === cat.id
                  ? { borderColor: cat.color }
                  : { borderColor: 'transparent' },
              ]}
            >
              <Text style={[styles.categoryChipText, { color: cat.color }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Divider style={styles.divider} />

        <Text variant="labelLarge" style={styles.label}>{t('routine.field_time')}</Text>
        <View style={styles.timeRow}>
          <TouchableOpacity
            style={[styles.dateButton, styles.timeButton]}
            onPress={() => { setTempTime(alarmTime ?? new Date(new Date().setHours(9, 0, 0, 0))); setShowTimePicker(true); }}
          >
            <Text style={alarmTime ? styles.dateText : styles.datePlaceholder}>
              {alarmTime ? dayjs(alarmTime).format('HH:mm') : t('routine.time_not_set')}
            </Text>
          </TouchableOpacity>
          {alarmTime && (
            <IconButton icon="close-circle" size={20} onPress={() => setAlarmTime(null)} />
          )}
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="spinner"
            locale={pickerLocale}
            textColor="#F2F2F7"
            onChange={(event, date) => {
              if (Platform.OS === 'android') {
                setShowTimePicker(false);
                if (event.type === 'set' && date) setAlarmTime(date);
              } else if (date) {
                setTempTime(date);
              }
            }}
          />
        )}
        {showTimePicker && Platform.OS === 'ios' && (
          <View style={styles.confirmRow}>
            <Button mode="text" onPress={() => setShowTimePicker(false)}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={() => { setAlarmTime(tempTime); setShowTimePicker(false); }}>
              {t('common.confirm')}
            </Button>
          </View>
        )}

        {alarmTime && (
          <View style={styles.notifRow}>
            <Button
              mode="outlined"
              icon="bell-outline"
              compact
              onPress={() => {
                setPendingOffsets([...notificationOffsets]);
                setShowNotifDialog(true);
              }}
              style={styles.notifBtn}
            >
              {t('routine.notif_setting')}
            </Button>
            {notificationOffsets.length > 0 && (
              <View style={styles.notifTagRow}>
                {notificationOffsets.map((o) => (
                  <View key={o} style={styles.notifTag}>
                    <Text style={styles.notifTagText}>{offsetLabel(o)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <Divider style={styles.divider} />

        <Text variant="labelLarge" style={styles.label}>{t('routine.field_repeat')}</Text>
        <SegmentedButtons
          value={repeatType}
          onValueChange={(v) => setRepeatType(v as 'daily' | 'weekly' | 'monthly')}
          buttons={[
            { value: 'daily', label: t('routine.repeat_daily') },
            { value: 'weekly', label: t('routine.repeat_weekly') },
            { value: 'monthly', label: t('routine.repeat_monthly') },
          ]}
          style={styles.segmented}
        />

        {repeatType === 'weekly' && (
          <>
            <Text variant="labelMedium" style={styles.subLabel}>{t('routine.weekday_select')}</Text>
            <View style={styles.chipRow}>
              {DAY_OPTIONS.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[styles.dayChip, selectedDays.has(day.value) && styles.dayChipSelected]}
                  onPress={() => toggleDay(day.value)}
                >
                  <Text
                    variant="labelMedium"
                    style={selectedDays.has(day.value) ? styles.dayChipTextSelected : styles.dayChipText}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {repeatType === 'monthly' && (
          <>
            <Text variant="labelMedium" style={styles.subLabel}>{t('routine.date_select')}</Text>
            <View style={styles.dayGrid}>
              {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChip, selectedMonthDays.has(d) && styles.dayChipSelected]}
                  onPress={() => toggleMonthDay(d)}
                >
                  <Text
                    variant="labelMedium"
                    style={selectedMonthDays.has(d) ? styles.dayChipTextSelected : styles.dayChipText}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.dayChipLast, selectedMonthDays.has('last') && styles.dayChipSelected]}
                onPress={() => toggleMonthDay('last')}
              >
                <Text
                  variant="labelMedium"
                  style={selectedMonthDays.has('last') ? styles.dayChipTextSelected : styles.dayChipText}
                >
                  {t('routine.last_day')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text variant="labelLarge" style={styles.label}>{t('routine.field_urgency')}</Text>
        <SegmentedButtons
          value={urgency}
          onValueChange={setUrgency}
          buttons={getLevelOptions().map((o) => ({ value: o.value, label: o.label }))}
          style={styles.segmented}
        />

        <Text variant="labelLarge" style={styles.label}>{t('routine.field_importance')}</Text>
        <SegmentedButtons
          value={importance}
          onValueChange={setImportance}
          buttons={getLevelOptions().map((o) => ({ value: o.value, label: o.label }))}
          style={styles.segmented}
        />

        {isEdit && (
          <Button
            mode="outlined"
            textColor={Colors.dangerDark}
            icon="delete-outline"
            onPress={() => setDeleteDialogVisible(true)}
            style={styles.deleteButton}
            labelStyle={styles.actionButtonLabel}
          >
            {t('common.delete')}
          </Button>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>{t('routine.delete_title')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('routine.delete_message', { title: routine?.title ?? '' })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>{t('common.cancel')}</Button>
            <Button textColor={Colors.danger} onPress={handleDelete}>{t('common.delete')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {showNotifDialog && (
        <Portal>
          <Dialog visible onDismiss={() => setShowNotifDialog(false)}>
            <Dialog.Title>{t('todo.notif_dialog_title')}</Dialog.Title>
            <Dialog.Content>
              {getOffsetOptions().map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.checkRow}
                  onPress={() => {
                    setPendingOffsets((prev) =>
                      prev.includes(opt.value)
                        ? prev.filter((v) => v !== opt.value)
                        : [...prev, opt.value],
                    );
                  }}
                >
                  <Checkbox.Android
                    status={pendingOffsets.includes(opt.value) ? 'checked' : 'unchecked'}
                    color={Colors.primary}
                  />
                  <Text variant="bodyMedium">{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowNotifDialog(false)}>{t('common.cancel')}</Button>
              <Button onPress={() => { setNotificationOffsets(pendingOffsets); setShowNotifDialog(false); }}>
                {t('common.confirm')}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  input: { marginBottom: 16 },
  descriptionInput: { minHeight: 80 },
  label: { marginBottom: 8, marginTop: 4 },
  subLabel: { marginBottom: 8, marginTop: 8, color: Colors.textSecondary },
  divider: { marginVertical: 16 },
  segmented: { marginBottom: 16 },
  categoryScroll: { marginBottom: 4 },
  categoryChip: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeButton: { flex: 1, marginBottom: 0 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  dateText: { fontSize: 15, color: Colors.text },
  datePlaceholder: { color: Colors.textMuted },
  confirmRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
  dayChipLast: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
  dayChipSelected: { backgroundColor: Colors.primary },
  dayChipText: { color: Colors.textSecondary },
  dayChipTextSelected: { color: '#fff', fontWeight: '700' },
  saveButton: { marginRight: 8, alignSelf: 'center' },
  actionButtonLabel: { fontSize: 14 },
  deleteButton: { marginTop: 8 },
  bold: { fontWeight: 'bold' },
  notifRow: { marginBottom: 12 },
  notifBtn: { alignSelf: 'flex-start' },
  notifTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  notifTag: {
    backgroundColor: Colors.primary + '22',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  notifTagText: { fontSize: 12, color: Colors.primary },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
});
