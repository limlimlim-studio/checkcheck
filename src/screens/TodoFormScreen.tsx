import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Appbar, Text, TextInput, Button, IconButton, SegmentedButtons, Divider, Dialog, Portal, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCategories } from '../hooks/useCategories';
import { useCreateTodo, useUpdateTodo, useDeleteTodo, useClearInProgress } from '../hooks/useTodos';
import { TodoStackParamList } from '../navigation/TodoStack';
import { getLevelOptions } from '../constants/todo';
import { getOffsetOptions, offsetsFromString, offsetLabel } from '../utils/notifications';
import dayjs from 'dayjs';
import i18next from 'i18next';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoForm'>;
type Route = RouteProp<TodoStackParamList, 'TodoForm'>;

const PICKER_LOCALE: Record<string, string> = {
  ko: 'ko', en: 'en', zh: 'zh-Hans', ja: 'ja',
};

function getTodayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function TodoFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const todo = route.params?.todo;
  const isEdit = !!todo?.id;

  const { data: categories = [] } = useCategories();
  const { mutate: createTodo } = useCreateTodo();
  const { mutate: updateTodo } = useUpdateTodo();
  const { mutate: deleteTodo } = useDeleteTodo();
  const { mutate: clearInProgress } = useClearInProgress();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(getTodayMidnight);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState<Date>(getTodayMidnight);
  const [tempTime, setTempTime] = useState<Date>(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationOffsets, setNotificationOffsets] = useState<number[]>([]);
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [pendingOffsets, setPendingOffsets] = useState<number[]>([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const [urgency, setUrgency] = useState('0');
  const [importance, setImportance] = useState('0');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const pickerLocale = PICKER_LOCALE[i18next.language] ?? 'en';

  useEffect(() => {
    setTitle(todo?.title ?? '');
    setDescription(todo?.description ?? '');
    setDueDate(todo?.dueDate ? new Date(todo.dueDate) : getTodayMidnight());
    if (todo?.dueTime != null) {
      const t = new Date();
      t.setHours(Math.floor(todo.dueTime / 60), todo.dueTime % 60, 0, 0);
      setDueTime(t);
    } else {
      setDueTime(null);
    }
    setNotificationOffsets(offsetsFromString((todo as any)?.notificationOffsets));
    setUrgency(String(todo?.urgency ?? 0));
    setImportance(String(todo?.importance ?? 0));
    setCategoryId(todo?.categoryId ?? (categories[0]?.id ?? null));
  }, [todo, categories]);

  const handleSave = () => {
    if (!title.trim() || categoryId === null) return;
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime(),
      dueTime: dueTime ? dueTime.getHours() * 60 + dueTime.getMinutes() : null,
      notificationOffsets: dueTime ? notificationOffsets : [],
      urgency: Number(urgency),
      importance: Number(importance),
      categoryId,
    };
    if (isEdit && todo) {
      updateTodo({ id: todo.id, ...data });
    } else {
      createTodo(data);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (todo) {
      deleteTodo(todo.id);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEdit ? t('todo.title_edit') : t('todo.title_new')} />
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!title.trim()}
          style={styles.saveButton}
          labelStyle={styles.actionButtonLabel}
        >
          {t('common.save')}
        </Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label={t('todo.field_title')}
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          keyboardAppearance="dark"
        />

        <TextInput
          label={t('todo.field_description')}
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={5}
          style={[styles.input, styles.descriptionInput]}
          keyboardAppearance="dark"
        />

        <Text variant="labelLarge" style={styles.label}>{t('todo.field_due_date')}</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => { setTempDate(dueDate); setShowDatePicker(true); }}
        >
          <Text style={styles.dateText}>
            {dayjs(dueDate).format(t('date.format_year_month_day'))}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            locale={pickerLocale}
            textColor="#F2F2F7"
            minimumDate={getTodayMidnight()}
            onChange={(event, date) => {
              if (Platform.OS === 'android') {
                setShowDatePicker(false);
                if (event.type === 'set' && date) {
                  setDueDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
                }
              } else if (date) {
                setTempDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
              }
            }}
          />
        )}
        {showDatePicker && Platform.OS === 'ios' && (
          <View style={styles.dateConfirmRow}>
            <Button mode="text" onPress={() => setShowDatePicker(false)}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={() => { setDueDate(tempDate); setShowDatePicker(false); }}>
              {t('common.confirm')}
            </Button>
          </View>
        )}

        <Text variant="labelLarge" style={styles.label}>{t('todo.field_time')}</Text>
        <View style={styles.timeRow}>
          <TouchableOpacity
            style={[styles.dateButton, styles.timeButton]}
            onPress={() => { setTempTime(dueTime ?? new Date(new Date().setHours(9, 0, 0, 0))); setShowTimePicker(true); }}
          >
            <Text style={dueTime ? styles.dateText : styles.datePlaceholder}>
              {dueTime ? dayjs(dueTime).format('HH:mm') : t('todo.time_not_set')}
            </Text>
          </TouchableOpacity>
          {dueTime && (
            <IconButton icon="close-circle" size={20} onPress={() => setDueTime(null)} />
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
                if (event.type === 'set' && date) setDueTime(date);
              } else if (date) {
                setTempTime(date);
              }
            }}
          />
        )}
        {showTimePicker && Platform.OS === 'ios' && (
          <View style={styles.dateConfirmRow}>
            <Button mode="text" onPress={() => setShowTimePicker(false)}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={() => { setDueTime(tempTime); setShowTimePicker(false); }}>
              {t('common.confirm')}
            </Button>
          </View>
        )}

        {dueTime && (
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
              {t('todo.notif_setting')}
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

        <Text variant="labelLarge" style={styles.label}>{t('todo.field_category')}</Text>
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

        <Text variant="labelLarge" style={styles.label}>{t('todo.field_urgency')}</Text>
        <SegmentedButtons
          value={urgency}
          onValueChange={setUrgency}
          buttons={getLevelOptions()}
          style={styles.segment}
        />

        <Text variant="labelLarge" style={styles.label}>{t('todo.field_importance')}</Text>
        <SegmentedButtons
          value={importance}
          onValueChange={setImportance}
          buttons={getLevelOptions()}
          style={styles.segment}
        />

        {isEdit && todo?.isInProgress === 1 && (
          <Button
            mode="outlined"
            icon="stop-circle-outline"
            onPress={() => { clearInProgress(todo.id); navigation.goBack(); }}
            style={styles.inProgressButton}
            labelStyle={styles.actionButtonLabel}
            textColor={Colors.inProgress}
          >
            {t('todo.in_progress_clear')}
          </Button>
        )}

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
          <Dialog.Title>{t('todo.delete_title')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('todo.delete_message', { title: todo?.title })}</Text>
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
  descriptionInput: { minHeight: 120 },
  label: { marginBottom: 8, marginTop: 4 },
  inProgressButton: { marginTop: 8 },
  deleteButton: { marginTop: 8 },
  saveButton: { marginRight: 8, alignSelf: 'center' },
  actionButtonLabel: { fontSize: 14 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  dateConfirmRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeButton: { flex: 1, marginBottom: 0 },
  divider: { marginVertical: 16 },
  categoryScroll: { marginBottom: 4 },
  categoryChip: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  segment: { marginBottom: 16 },
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
