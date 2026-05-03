import * as Notifications from 'expo-notifications';
import i18next from 'i18next';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function getOffsetOptions() {
  return [
    { value: 0,   label: i18next.t('notif.on_time') },
    { value: 10,  label: i18next.t('notif.before_10') },
    { value: 30,  label: i18next.t('notif.before_30') },
    { value: 60,  label: i18next.t('notif.before_1h') },
    { value: 120, label: i18next.t('notif.before_2h') },
  ];
}

export const OFFSET_OPTIONS = getOffsetOptions();

export function offsetsToString(offsets: number[]): string {
  return offsets.sort((a, b) => a - b).join(',');
}

export function offsetsFromString(str: string | null | undefined): number[] {
  if (!str) return [];
  return str.split(',').map(Number).filter((n) => !isNaN(n));
}

export function offsetLabel(offset: number): string {
  return getOffsetOptions().find((o) => o.value === offset)?.label ?? `${offset}${i18next.t('notif.before_10').replace('10', '')}`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTodoNotifications(todo: {
  id: number;
  title: string;
  dueDate: number;
  dueTime: number;
  notificationOffsets: number[];
}): Promise<void> {
  await cancelTodoNotifications(todo.id);
  const dueMoment = todo.dueDate + todo.dueTime * 60 * 1000;

  for (const offset of todo.notificationOffsets) {
    const triggerAt = new Date(dueMoment - offset * 60 * 1000);
    if (triggerAt <= new Date()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `todo-${todo.id}-${offset}`,
      content: {
        title: offset === 0 ? i18next.t('notif.now') : offsetLabel(offset),
        body: todo.title,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerAt,
      },
    });
  }
}

export async function scheduleRoutineNotifications(routine: {
  id: number;
  title: string;
  alarmTime: number;
  notificationOffsets: number[];
}): Promise<void> {
  await cancelRoutineNotifications(routine.id);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const alarmMoment = today.getTime() + routine.alarmTime * 60 * 1000;

  for (const offset of routine.notificationOffsets) {
    const triggerAt = new Date(alarmMoment - offset * 60 * 1000);
    if (triggerAt <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `routine-${routine.id}-${offset}`,
      content: {
        title: offset === 0 ? i18next.t('notif.now') : offsetLabel(offset),
        body: routine.title,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerAt,
      },
    });
  }
}

export async function cancelTodoNotifications(todoId: number): Promise<void> {
  for (const { value } of getOffsetOptions()) {
    await Notifications.cancelScheduledNotificationAsync(`todo-${todoId}-${value}`).catch(() => {});
  }
}

export async function cancelRoutineNotifications(routineId: number): Promise<void> {
  for (const { value } of getOffsetOptions()) {
    await Notifications.cancelScheduledNotificationAsync(`routine-${routineId}-${value}`).catch(() => {});
  }
}
