import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Text, TextInput, Button, IconButton, Dialog, Portal, SegmentedButtons, Divider } from 'react-native-paper';
import { Colors } from '../theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCreateRoutine, useUpdateRoutine, useDeleteRoutine } from '../hooks/useRoutines';
import { useCategories } from '../hooks/useCategories';
import { RoutineStackParamList } from '../navigation/RoutineStack';
import { LEVEL_OPTIONS } from '../constants/todo';

type Nav = NativeStackNavigationProp<RoutineStackParamList, 'RoutineForm'>;
type Route = RouteProp<RoutineStackParamList, 'RoutineForm'>;

const DAY_OPTIONS = [
  { value: '0', label: '일' },
  { value: '1', label: '월' },
  { value: '2', label: '화' },
  { value: '3', label: '수' },
  { value: '4', label: '목' },
  { value: '5', label: '금' },
  { value: '6', label: '토' },
];

export default function RoutineFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [urgency, setUrgency] = useState('0');
  const [importance, setImportance] = useState('0');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

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
        const t = new Date();
        t.setHours(Math.floor(routine.alarmTime / 60), routine.alarmTime % 60, 0, 0);
        setAlarmTime(t);
      } else {
        setAlarmTime(null);
      }
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
        <Appbar.Content title={isEdit ? '루틴 수정' : '새 루틴'} />
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!isValid()}
          style={styles.saveButton}
          labelStyle={styles.actionButtonLabel}
        >
          저장
        </Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label="제목 *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          keyboardAppearance="dark"
        />
        <TextInput
          label="설명"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          keyboardAppearance="dark"
          style={[styles.input, styles.descriptionInput]}
        />

        <Text variant="labelLarge" style={styles.label}>카테고리 *</Text>
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

        <Text variant="labelLarge" style={styles.label}>시간</Text>
        <View style={styles.timeRow}>
          <TouchableOpacity
            style={[styles.dateButton, styles.timeButton]}
            onPress={() => {
              if (!alarmTime) {
                const d = new Date();
                d.setHours(9, 0, 0, 0);
                setAlarmTime(d);
              }
              setShowTimePicker(true);
            }}
          >
            <Text style={alarmTime ? styles.dateText : styles.datePlaceholder}>
              {alarmTime
                ? alarmTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                : '설정 안 함'}
            </Text>
          </TouchableOpacity>
          {alarmTime && (
            <IconButton icon="close-circle" size={20} onPress={() => setAlarmTime(null)} />
          )}
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={alarmTime ?? new Date(new Date().setHours(9, 0, 0, 0))}
            mode="time"
            display="spinner"
            locale="ko"
            textColor="#F2F2F7"
            onChange={(_, date) => {
              if (date) setAlarmTime(date);
            }}
          />
        )}
        {showTimePicker && (
          <View style={styles.confirmRow}>
            <Button mode="contained" onPress={() => setShowTimePicker(false)}>
              확인
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        <Text variant="labelLarge" style={styles.label}>반복 주기 *</Text>
        <SegmentedButtons
          value={repeatType}
          onValueChange={(v) => setRepeatType(v as 'daily' | 'weekly' | 'monthly')}
          buttons={[
            { value: 'daily', label: '매일' },
            { value: 'weekly', label: '매주' },
            { value: 'monthly', label: '매월' },
          ]}
          style={styles.segmented}
        />

        {repeatType === 'weekly' && (
          <>
            <Text variant="labelMedium" style={styles.subLabel}>요일 선택 *</Text>
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
            <Text variant="labelMedium" style={styles.subLabel}>날짜 선택 *</Text>
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
                  말일
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text variant="labelLarge" style={styles.label}>긴급도</Text>
        <SegmentedButtons
          value={urgency}
          onValueChange={setUrgency}
          buttons={LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          style={styles.segmented}
        />

        <Text variant="labelLarge" style={styles.label}>중요도</Text>
        <SegmentedButtons
          value={importance}
          onValueChange={setImportance}
          buttons={LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
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
            삭제
          </Button>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>루틴 삭제</Dialog.Title>
          <Dialog.Content>
            <Text>
              <Text style={styles.bold}>"{routine?.title}"</Text> 루틴을 삭제할까요?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>취소</Button>
            <Button textColor={Colors.danger} onPress={handleDelete}>삭제</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
});
