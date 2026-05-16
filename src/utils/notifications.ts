import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Task } from '@/types/data';

const NOTIF_REGISTRY_KEY = '@kaori_notif_registry';
export const IS_EXPO_GO = Constants.appOwnership === 'expo';

type NotifRegistry = Record<string, { notifId: string }>;

// Lazily require expo-notifications so the module never loads in Expo Go,
// where the SDK 53 Android restriction throws at import time.
function N() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof import('expo-notifications');
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

export async function requestPermissions(): Promise<boolean> {
  if (IS_EXPO_GO || !Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await N().setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: N().AndroidImportance.HIGH,
      sound: 'default',
    });
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

  const notifId = await N().scheduleNotificationAsync({
    content: {
      title: 'Task Reminder',
      body: task.title,
      data: { taskId: task.id },
      sound: 'default',
    },
    trigger: {
      type: N().SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
    },
  });

  const registry = await loadRegistry();
  registry[task.id] = { notifId };
  await saveRegistry(registry);
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  if (IS_EXPO_GO) return;
  const registry = await loadRegistry();
  const entry = registry[taskId];
  if (entry) {
    await N().cancelScheduledNotificationAsync(entry.notifId);
    delete registry[taskId];
    await saveRegistry(registry);
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (IS_EXPO_GO) return;
  await N().cancelAllScheduledNotificationsAsync();
  await saveRegistry({});
}

export async function rescheduleAllReminders(tasks: Task[]): Promise<void> {
  if (IS_EXPO_GO) return;
  await N().cancelAllScheduledNotificationsAsync();
  const newRegistry: NotifRegistry = {};

  for (const task of tasks) {
    if (!task.reminderAt || task.done || task.archived) continue;

    const triggerDate = new Date(task.reminderAt);
    if (isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) continue;

    const notifId = await N().scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: task.title,
        data: { taskId: task.id },
        sound: 'default',
      },
      trigger: {
        type: N().SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
      },
    });

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
