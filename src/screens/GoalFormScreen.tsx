import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Appbar, Text, TextInput, Button, Divider, Dialog, Portal } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import i18next from 'i18next';
import { Colors } from '../theme';
import { useCategories } from '../hooks/useCategories';
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from '../hooks/useGoals';
import { GoalStackParamList } from '../navigation/GoalStack';

type Nav = NativeStackNavigationProp<GoalStackParamList, 'GoalForm'>;
type Route = RouteProp<GoalStackParamList, 'GoalForm'>;

const PICKER_LOCALE: Record<string, string> = {
  ko: 'ko', en: 'en', zh: 'zh-Hans', ja: 'ja',
};

function getTodayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function GoalFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const goal = route.params?.goal;
  const isEdit = !!goal?.id;

  const { data: categories = [] } = useCategories();
  const { mutate: createGoal } = useCreateGoal();
  const { mutate: updateGoal } = useUpdateGoal();
  const { mutate: deleteGoal } = useDeleteGoal();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(getTodayMidnight);
  const [tempDate, setTempDate] = useState<Date>(getTodayMidnight);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const pickerLocale = PICKER_LOCALE[i18next.language] ?? 'en';

  useEffect(() => {
    setTitle(goal?.title ?? '');
    setDescription(goal?.description ?? '');
    setDueDate(goal?.dueDate ? new Date(goal.dueDate) : getTodayMidnight());
    setCategoryId(goal?.categoryId ?? (categories[0]?.id ?? null));
  }, [goal, categories]);

  const handleSave = () => {
    if (!title.trim() || categoryId === null) return;
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime(),
      categoryId,
    };
    if (isEdit && goal) {
      updateGoal({ id: goal.id, ...data });
    } else {
      createGoal(data);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (goal) {
      deleteGoal(goal.id);
      navigation.navigate('GoalList');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEdit ? t('goal.title_edit') : t('goal.title_new')} />
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
          label={t('goal.field_title')}
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          keyboardAppearance="dark"
        />

        <TextInput
          label={t('goal.field_description')}
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={[styles.input, styles.descriptionInput]}
          keyboardAppearance="dark"
        />

        <Text variant="labelLarge" style={styles.label}>{t('goal.field_due_date')}</Text>
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

        <Divider style={styles.divider} />

        <Text variant="labelLarge" style={styles.label}>{t('goal.field_category')}</Text>
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
          <Dialog.Title>{t('goal.delete_goal_title')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('goal.delete_goal_msg', { title: goal?.title })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>{t('common.cancel')}</Button>
            <Button textColor={Colors.danger} onPress={handleDelete}>{t('common.delete')}</Button>
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
  descriptionInput: { minHeight: 100 },
  label: { marginBottom: 8, marginTop: 4 },
  saveButton: { marginRight: 8, alignSelf: 'center' },
  actionButtonLabel: { fontSize: 14 },
  dateButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  dateText: { fontSize: 15, color: Colors.text },
  dateConfirmRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 },
  divider: { marginVertical: 16 },
  categoryScroll: { marginBottom: 16 },
  categoryChip: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  deleteButton: { marginTop: 8 },
});
