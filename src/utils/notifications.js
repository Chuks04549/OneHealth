// src/utils/notifications.js
//
// Local (on-device) notifications for goal completions and streak
// milestones. These fire immediately when the user hits a goal or extends
// their streak — no server/push infrastructure needed.
//
// Respects the "Goal & streak alerts" toggle in Settings (persisted via
// eugene/services/storage.js). If the user has it off, or hasn't granted
// OS notification permission, calls here are safely skipped.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { addWeeklyProgressNotice, getHealthGoals, getNotificationPrefs, getWeeklyProgressNotices, getWeightEntries } from '../eugene/services/storage';
import { describeWeeklyProgress } from './weeklyProgress';
import { formatLiftSet } from './strengthProgress';
import { nextWeighInReminderDate } from './reminderSchedule';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionRequested = false;

/**
 * Asks the OS for notification permission the first time it's needed.
 * Safe to call repeatedly — only prompts once per app session.
 */
export async function ensureNotificationPermissions() {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    if (permissionRequested) return false;
    permissionRequested = true;
    const result = await Notifications.requestPermissionsAsync();
    return !!result.granted;
  } catch (error) {
    console.warn('notifications: failed to request permissions', error);
    return false;
  }
}

async function canNotify(prefKey) {
  if (Platform.OS === 'web') return false;
  const prefs = await getNotificationPrefs();
  if (!prefs[prefKey]) return false;
  return ensureNotificationPermissions();
}

async function fireNotification(content) {
  try {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null, // deliver immediately
    });
  } catch (error) {
    console.warn('notifications: failed to schedule notification', error);
  }
}

/**
 * Fires when a user-created goal reaches 100% progress.
 */
export async function notifyGoalAchieved(goalTitle) {
  if (!(await canNotify('goalStreakAlerts'))) return;
  await fireNotification({
    title: 'Goal achieved! 🎯',
    body: `You hit your goal: ${goalTitle}. Nice work!`,
    data: { type: 'goal_achieved' },
  });
}

/**
 * Fires when the user's activity streak extends to a new day count.
 * Only called on meaningful milestones (see GoalsScreen) so it doesn't
 * spam every single day.
 */
export async function notifyStreakMilestone(streakCount) {
  if (!(await canNotify('goalStreakAlerts'))) return;
  await fireNotification({
    title: `${streakCount}-day streak! 🔥`,
    body: `You've stayed active ${streakCount} days in a row. Keep it going!`,
    data: { type: 'streak_milestone' },
  });
}

/**
 * Lets the user know when their latest week was an improvement or a slip,
 * graded against their body goal (lose / gain / maintain).
 * Sends each "week + status" notice only once, and skips "steady" weeks.
 */
export async function notifyWeeklyProgress(progress, unitSystem) {
  const latest = progress?.latest;
  if (!latest || !['improved', 'regressed'].includes(latest.status)) return;
  const noticeKey = `${latest.to.weekKey}:${latest.status}`;
  const sent = await getWeeklyProgressNotices();
  if (sent.includes(noticeKey)) return;
  // Mark first so two quick screen loads can't double-send.
  await addWeeklyProgressNotice(noticeKey);
  if (!(await canNotify('weeklyProgressAlerts'))) return;
  const { title, body } = describeWeeklyProgress(progress, unitSystem);
  await fireNotification({
    title,
    body,
    data: { type: latest.status === 'improved' ? 'weekly_progress_improved' : 'weekly_progress_regressed', weekKey: latest.to.weekKey },
  });
}

/**
 * Celebrates new personal records right after a workout is saved.
 * Uses the same "Progress alerts" switch as the weekly notices.
 */
export async function notifyPersonalRecords(records, unitSystem) {
  if (!records?.length) return;
  if (!(await canNotify('weeklyProgressAlerts'))) return;
  const [first, ...rest] = records;
  const more = rest.length ? ` (+${rest.length} more)` : '';
  await fireNotification({
    title: 'New personal record! 🏆',
    body: `${first.name}: ${formatLiftSet(first.best, unitSystem)} — your best yet${more}. You’re getting stronger.`,
    data: { type: 'personal_record' },
  });
}

async function clearScheduled(type) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => item.content.data?.type === type)
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

/**
 * (Re)schedules the daily, weekly and weigh-in reminders.
 *
 * Fixes two old bugs:
 *  1. Triggers had no `type`, which this version of expo-notifications
 *     rejects — so none of these reminders were ever actually scheduled.
 *  2. The weigh-in reminder repeated N days after whenever settings were
 *     saved, not N days after the user's last weigh-in.
 *
 * Call it again after every weigh-in so the reminder moves with the user.
 * Both arguments are optional; anything missing is read from storage.
 */
export async function scheduleHealthReminders(prefsOverride, weighInIntervalDays) {
  if (Platform.OS === 'web') return;
  try {
    const [savedPrefs, goals, entries] = await Promise.all([getNotificationPrefs(), getHealthGoals(), getWeightEntries()]);
    const prefs = { ...savedPrefs, ...(prefsOverride || {}) };
    const anyOn = prefs.dailyNudges || prefs.weeklySummary || prefs.weightReminders;
    await Promise.all([clearScheduled('daily_summary'), clearScheduled('weekly_summary'), clearScheduled('weigh_in')]);
    if (!anyOn || !(await ensureNotificationPermissions())) return;

    const jobs = [];
    if (prefs.dailyNudges) jobs.push(Notifications.scheduleNotificationAsync({
      content: { title: 'Your daily health summary', body: 'Take a minute to review meals, movement, and your goals.', data: { type: 'daily_summary' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
    }));
    if (prefs.weeklySummary) jobs.push(Notifications.scheduleNotificationAsync({
      content: { title: 'Your weekly summary is ready', body: 'See your progress and plan the week ahead.', data: { type: 'weekly_summary' } },
      // weekday: 1 = Sunday in expo-notifications
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 9, minute: 0 },
    }));
    if (prefs.weightReminders) {
      const lastEntry = entries[entries.length - 1];
      const interval = weighInIntervalDays ?? goals.weighInIntervalDays;
      jobs.push(Notifications.scheduleNotificationAsync({
        content: { title: 'Time for a weigh-in', body: 'A consistent check-in makes your weekly progress more accurate.', data: { type: 'weigh_in' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextWeighInReminderDate(lastEntry?.date, interval) },
      }));
    }
    await Promise.all(jobs);
  } catch (error) {
    console.warn('notifications: failed to schedule reminders', error);
  }
}
