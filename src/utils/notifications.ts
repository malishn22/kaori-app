import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Task, Routine } from '@/types/data';
import { nextOccurrence } from './time';

const NOTIF_REGISTRY_KEY = '@kaori_notif_registry';
const ROUTINE_NOTIF_REGISTRY_KEY = '@kaori_routine_notif_registry';
const ANDROID_CHANNEL_ID = 'task-reminders';
export const IS_EXPO_GO = Constants.appOwnership === 'expo';

type NotifRegistry = Record<string, { notifId: string }>;
type RoutineNotifRegistry = Record<string, string[]>;

// Lazily require native notification modules so they never load in Expo Go,
// where they throw at import time.
function N() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof import('expo-notifications');
}

function Notifee() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@notifee/react-native') as typeof import('@notifee/react-native');
}

export function configureNotifications() {
  if (IS_EXPO_GO) return;
  N().setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  const notifee = Notifee().default;
  const { AndroidImportance } = Notifee();
  await notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: 'Task Reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

export async function requestPermissions(): Promise<boolean> {
  if (IS_EXPO_GO || !Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await ensureAndroidChannel();
    const settings = await Notifee().default.requestPermission();
    return settings.authorizationStatus >= 1;
  }

  const { status: existing } = await N().getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await N().requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskReminder(task: Task): Promise<void> {
  if (IS_EXPO_GO || !task.reminderAt) return;

  const triggerDate = new Date(task.reminderAt);
  if (isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) return;

  await cancelTaskReminder(task.id);

  const notifId = await scheduleOne(task, triggerDate);

  const registry = await loadRegistry();
  registry[task.id] = { notifId };
  await saveRegistry(registry);
}

async function scheduleOne(task: Task, triggerDate: Date): Promise<string> {
  if (Platform.OS === 'android') {
    await ensureAndroidChannel();
    const notifee = Notifee().default;
    const { TriggerType, AndroidImportance, AlarmType } = Notifee();
    return notifee.createTriggerNotification(
      {
        id: `task-${task.id}`,
        title: 'Task Reminder',
        body: task.title,
        data: { taskId: task.id },
        android: {
          channelId: ANDROID_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
      },
    );
  }

  return N().scheduleNotificationAsync({
    content: {
      title: 'Task Reminder',
      body: task.title,
      data: { taskId: task.id },
      sound: 'default',
    },
    trigger: {
      type: N().SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  if (IS_EXPO_GO) return;
  const registry = await loadRegistry();
  const entry = registry[taskId];
  if (!entry) return;

  if (Platform.OS === 'android') {
    await Notifee().default.cancelTriggerNotification(entry.notifId);
  } else {
    await N().cancelScheduledNotificationAsync(entry.notifId);
  }

  delete registry[taskId];
  await saveRegistry(registry);
}

export async function cancelAllReminders(): Promise<void> {
  if (IS_EXPO_GO) return;
  if (Platform.OS === 'android') {
    await Notifee().default.cancelAllNotifications();
  } else {
    await N().cancelAllScheduledNotificationsAsync();
  }
  await saveRegistry({});
}

export async function rescheduleAllReminders(tasks: Task[]): Promise<void> {
  if (IS_EXPO_GO) return;

  if (Platform.OS === 'android') {
    await Notifee().default.cancelAllNotifications();
    await ensureAndroidChannel();
  } else {
    await N().cancelAllScheduledNotificationsAsync();
  }

  const newRegistry: NotifRegistry = {};

  for (const task of tasks) {
    if (!task.reminderAt || task.done || task.archived) continue;

    const triggerDate = new Date(task.reminderAt);
    if (isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) continue;

    const notifId = await scheduleOne(task, triggerDate);
    newRegistry[task.id] = { notifId };
  }

  await saveRegistry(newRegistry);
}

async function loadRegistry(): Promise<NotifRegistry> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveRegistry(registry: NotifRegistry): Promise<void> {
  await AsyncStorage.setItem(NOTIF_REGISTRY_KEY, JSON.stringify(registry));
}

// --- Routines ---
// A routine maps to one notification per selected weekday, each a native
// weekly-repeating trigger (not one-shot like tasks), so the OS reschedules
// the next fire itself with no app-side renewal needed.

export async function scheduleRoutineReminders(routine: Routine): Promise<void> {
  if (IS_EXPO_GO || !routine.active || routine.archived || routine.daysOfWeek.length === 0) return;

  await cancelRoutineReminders(routine.id);

  if (Platform.OS === 'android') await ensureAndroidChannel();

  const notifIds: string[] = [];
  for (const day of routine.daysOfWeek) {
    notifIds.push(await scheduleOneRoutineDay(routine, day));
  }

  const registry = await loadRoutineRegistry();
  registry[routine.id] = notifIds;
  await saveRoutineRegistry(registry);
}

async function scheduleOneRoutineDay(routine: Routine, dayOfWeek: number): Promise<string> {
  const [hour, minute] = routine.reminderTime.split(':').map(Number);

  if (Platform.OS === 'android') {
    const notifee = Notifee().default;
    const { TriggerType, AndroidImportance, AlarmType, RepeatFrequency } = Notifee();
    return notifee.createTriggerNotification(
      {
        id: `routine-${routine.id}-${dayOfWeek}`,
        title: 'Routine Reminder',
        body: routine.title,
        data: { routineId: routine.id },
        android: {
          channelId: ANDROID_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: nextOccurrence(dayOfWeek, hour, minute).getTime(),
        repeatFrequency: RepeatFrequency.WEEKLY,
        alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
      },
    );
  }

  return N().scheduleNotificationAsync({
    content: {
      title: 'Routine Reminder',
      body: routine.title,
      data: { routineId: routine.id },
      sound: 'default',
    },
    trigger: {
      type: N().SchedulableTriggerInputTypes.WEEKLY,
      weekday: dayOfWeek + 1, // expo-notifications: 1(Sun)-7(Sat)
      hour,
      minute,
    },
  });
}

export async function cancelRoutineReminders(routineId: string): Promise<void> {
  if (IS_EXPO_GO) return;
  const registry = await loadRoutineRegistry();
  const ids = registry[routineId];
  if (!ids || ids.length === 0) return;

  if (Platform.OS === 'android') {
    const notifee = Notifee().default;
    await Promise.all(ids.map((id) => notifee.cancelTriggerNotification(id)));
  } else {
    await Promise.all(ids.map((id) => N().cancelScheduledNotificationAsync(id)));
  }

  delete registry[routineId];
  await saveRoutineRegistry(registry);
}

// Called immediately after rescheduleAllReminders(tasks), which already wipes every
// OS-level notification (cancelAllNotifications) — so this re-derives from scratch
// rather than cancelling by id (those ids are already gone).
export async function rescheduleAllRoutineReminders(routines: Routine[]): Promise<void> {
  if (IS_EXPO_GO) return;

  if (Platform.OS === 'android') await ensureAndroidChannel();

  const newRegistry: RoutineNotifRegistry = {};

  for (const routine of routines) {
    if (!routine.active || routine.archived || routine.daysOfWeek.length === 0) continue;

    const notifIds: string[] = [];
    for (const day of routine.daysOfWeek) {
      notifIds.push(await scheduleOneRoutineDay(routine, day));
    }
    newRegistry[routine.id] = notifIds;
  }

  await saveRoutineRegistry(newRegistry);
}

async function loadRoutineRegistry(): Promise<RoutineNotifRegistry> {
  try {
    const raw = await AsyncStorage.getItem(ROUTINE_NOTIF_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveRoutineRegistry(registry: RoutineNotifRegistry): Promise<void> {
  await AsyncStorage.setItem(ROUTINE_NOTIF_REGISTRY_KEY, JSON.stringify(registry));
}
