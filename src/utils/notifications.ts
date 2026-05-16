import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '@/types/data';

const NOTIF_REGISTRY_KEY = '@kaori_notif_registry';

type NotifRegistry = Record<string, { notifId: string }>;

export function configureNotifications() {
  Notifications.setNotificationHandler({
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
  if (!Device.isDevice) {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskReminder(task: Task): Promise<void> {
  if (!task.reminderAt) return;

  const triggerDate = new Date(task.reminderAt);
  if (isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) return;

  await cancelTaskReminder(task.id);

  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Reminder',
      body: task.title,
      data: { taskId: task.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
    },
  });

  const registry = await loadRegistry();
  registry[task.id] = { notifId };
  await saveRegistry(registry);
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  const registry = await loadRegistry();
  const entry = registry[taskId];
  if (entry) {
    await Notifications.cancelScheduledNotificationAsync(entry.notifId);
    delete registry[taskId];
    await saveRegistry(registry);
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await saveRegistry({});
}

export async function rescheduleAllReminders(tasks: Task[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const newRegistry: NotifRegistry = {};

  for (const task of tasks) {
    if (!task.reminderAt || task.done || task.archived) continue;

    const triggerDate = new Date(task.reminderAt);
    if (isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) continue;

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: task.title,
        data: { taskId: task.id },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
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
