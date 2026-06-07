import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Text, TextInput, Button, SegmentedButtons, Divider, Dialog, Portal } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import { useCreateGoalTodo, useUpdateGoalTodo, useDeleteGoalTodo } from '../hooks/useGoals';
import { GoalStackParamList } from '../navigation/GoalStack';
import { getLevelOptions } from '../constants/todo';

type Nav = NativeStackNavigationProp<GoalStackParamList, 'GoalTodoForm'>;
type Route = RouteProp<GoalStackParamList, 'GoalTodoForm'>;

export default function GoalTodoFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const { goalId, todo } = route.params;
  const isEdit = !!todo?.id;

  const { mutate: createTodo } = useCreateGoalTodo();
  const { mutate: updateTodo } = useUpdateGoalTodo();
  const { mutate: deleteTodo } = useDeleteGoalTodo();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('0');
  const [importance, setImportance] = useState('0');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    setTitle(todo?.title ?? '');
    setDescription(todo?.description ?? '');
    setUrgency(String(todo?.urgency ?? 0));
    setImportance(String(todo?.importance ?? 0));
  }, [todo]);

  const handleSave = () => {
    if (!title.trim()) return;
    const data = {
      goalId,
      title: title.trim(),
      description: description.trim() || undefined,
      urgency: Number(urgency),
      importance: Number(importance),
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
      deleteTodo({ id: todo.id, goalId });
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEdit ? t('goal.edit_todo') : t('goal.add_todo')} />
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
          autoFocus={!isEdit}
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
          <Dialog.Title>{t('goal.delete_todo_title')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('goal.delete_todo_msg', { title: todo?.title })}</Text>
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
  descriptionInput: { minHeight: 120 },
  label: { marginBottom: 8, marginTop: 4 },
  saveButton: { marginRight: 8, alignSelf: 'center' },
  actionButtonLabel: { fontSize: 14 },
  divider: { marginVertical: 16 },
  segment: { marginBottom: 16 },
  deleteButton: { marginTop: 8 },
});
