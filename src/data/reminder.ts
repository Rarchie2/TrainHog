// The morning goals reminder: a notification on the client's own phone each
// morning listing today's goals. Scheduled on the phone itself, so it needs
// no server and works offline. Clients can switch it off or change the time.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { goalTitle } from './goals';
import type { DailyGoal } from './types';

export type ReminderSetting = { on: boolean; time: string }; // "07:30"
export const REMINDER_TIMES = ['06:30', '07:00', '07:30', '08:00', '09:00'];
const KEY = 'trainhog.goalReminder.v1';
const ID = 'daily-goals';
const DEFAULT: ReminderSetting = { on: true, time: '07:30' };

export const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export function timeLabel(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`;
}

let listeners: ((s: ReminderSetting) => void)[] = [];
let current: ReminderSetting | null = null;

async function load(): Promise<ReminderSetting> {
  if (current) return current;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    current = raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    current = DEFAULT;
  }
  return current!;
}

export function useReminderSetting(): [ReminderSetting, (s: ReminderSetting) => void] {
  const [s, setS] = useState<ReminderSetting>(current ?? DEFAULT);
  useEffect(() => {
    load().then(setS);
    listeners.push(setS);
    return () => {
      listeners = listeners.filter((l) => l !== setS);
    };
  }, []);
  const update = (next: ReminderSetting) => {
    current = next;
    listeners.forEach((l) => l(next));
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };
  return [s, update];
}

// Keep the phone's scheduled reminder in step with the goals and setting.
export function useGoalReminder(goals: DailyGoal[] | undefined, enabled: boolean) {
  const [setting] = useReminderSetting();
  const list = (goals ?? []).map(goalTitle).join(', ');
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    (async () => {
      await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
      if (!enabled || !setting.on || !list || cancelled) return;
      const perm = await Notifications.getPermissionsAsync();
      const ok = perm.granted || (perm.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
      if (!ok || cancelled) return;
      const [hour, minute] = setting.time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        identifier: ID,
        content: { title: "Good morning! Today's goals", body: `${list}. Tick them off in TrainHog as you go.` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [list, enabled, setting.on, setting.time]);
}
