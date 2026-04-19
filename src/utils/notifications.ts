import * as Notifications from 'expo-notifications';

// 앱 포그라운드에서도 알림 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const OFFSET_OPTIONS = [
  { value: 0,   label: '정시' },
  { value: 10,  label: '10분 전' },
  { value: 30,  label: '30분 전' },
  { value: 60,  label: '1시간 전' },
  { value: 120, label: '2시간 전' },
];

export function offsetsToString(offsets: number[]): string {
  return offsets.sort((a, b) => a - b).join(',');
}

export function offsetsFromString(str: string | null | undefined): number[] {
  if (!str) return [];
  return str.split(',').map(Number).filter((n) => !isNaN(n));
}

export function offsetLabel(offset: number): string {
  return OFFSET_OPTIONS.find((o) => o.value === offset)?.label ?? `${offset}분 전`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** 할 일 알림 전체 예약. 기존 예약은 모두 취소 후 재예약 */
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
        title: offset === 0 ? '지금' : offsetLabel(offset),
        body: todo.title,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerAt,
      },
    });
  }
}

/** 루틴 알림 전체 예약. 기존 예약은 모두 취소 후 재예약 */
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
        title: offset === 0 ? '지금' : offsetLabel(offset),
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
  for (const { value } of OFFSET_OPTIONS) {
    await Notifications.cancelScheduledNotificationAsync(`todo-${todoId}-${value}`).catch(() => {});
  }
}

export async function cancelRoutineNotifications(routineId: number): Promise<void> {
  for (const { value } of OFFSET_OPTIONS) {
    await Notifications.cancelScheduledNotificationAsync(`routine-${routineId}-${value}`).catch(() => {});
  }
}
