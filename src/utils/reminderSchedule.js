// src/utils/reminderSchedule.js — pure date logic for reminders (tested in tests/).

/**
 * When the next weigh-in reminder should fire: `intervalDays` after the last
 * weigh-in, at 9:00 local time. If that's already passed (or there's no
 * weigh-in yet), the next 9:00 that's still ahead of us.
 */
export function nextWeighInReminderDate(lastWeighInDate, intervalDays = 7, now = new Date()) {
  const days = Math.max(1, Number(intervalDays) || 7);
  let due = null;
  if (lastWeighInDate) {
    due = new Date(`${lastWeighInDate}T09:00:00`);
    due.setDate(due.getDate() + days);
  }
  if (!due || Number.isNaN(due.getTime()) || due <= now) {
    due = new Date(now);
    due.setHours(9, 0, 0, 0);
    if (due <= now) due.setDate(due.getDate() + 1);
  }
  return due;
}
