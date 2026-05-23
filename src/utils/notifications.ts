import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Task } from '@/types/data';

const NOTIF_REGISTRY_KEY = '@kaori_notif_registry';
const ANDROID_CHANNEL_ID = 'task-reminders';
export const IS_EXPO_GO = Constants.appOwnership === 'expo';

type NotifRegistry = Record<string, { notifId: string }>;

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
