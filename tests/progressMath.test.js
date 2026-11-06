import test from 'node:test';
import assert from 'node:assert/strict';
import { activityLevel, buildProgressSummary, dailyCalorieAverage, maintenanceCalories, projectWeights } from '../src/utils/progressMath.js';
import { nextWeighInReminderDate } from '../src/utils/reminderSchedule.js';

const NOW = new Date('2026-11-02T15:00:00');

test('calorie average is per day, not per meal', () => {
  const foods = [
    { date: '2026-11-01', calories: 600 }, { date: '2026-11-01', calories: 600 }, { date: '2026-11-01', calories: 600 },
    { date: '2026-10-31', calories: 2000 },
  ];
  const { average, loggedDays } = dailyCalorieAverage(foods, 30, NOW);
  assert.equal(loggedDays, 2);
  assert.equal(average, 1900); // (1800 + 2000) / 2 — the old code said 950
});

test('meals without a calorie number fall back to macros', () => {
  const { average } = dailyCalorieAverage([{ date: '2026-11-01', macros: { protein_g: 30, carbs_g: 50, fat_g: 10 } }], 30, NOW);
  assert.equal(average, 30 * 4 + 50 * 4 + 10 * 9);
});

test('activity level comes from distinct training days in the last 4 weeks', () => {
  assert.equal(activityLevel([], [], NOW).multiplier, 1.2);
  const days = ['2026-10-06', '2026-10-08', '2026-10-13', '2026-10-15', '2026-10-20', '2026-10-22', '2026-10-27', '2026-10-29', '2026-10-29'];
  const level = activityLevel(days.map((date) => ({ date })), [], NOW);
  assert.equal(level.sessionsPerWeek, 2); // 8 distinct days / 4 weeks
  assert.equal(level.multiplier, 1.375);
});

test('maintenance scales with activity', () => {
  const profile = { sex: 'male', age: 20, heightCm: 180 };
  assert.ok(maintenanceCalories(profile, 80, 1.55) > maintenanceCalories(profile, 80, 1.2));
});

test('projection starts at the first point on the chart', () => {
  const points = [{ date: '2026-10-20', weightKg: 82 }, { date: '2026-10-27', weightKg: 81.5 }];
  const projected = projectWeights(points, [], { calorieTarget: 2000, sex: 'male', age: 20, heightCm: 180 }, 1.2);
  assert.equal(projected[0], 82);
});

test('summary handles a missing profile and no data', () => {
  const s = buildProgressSummary({ profile: null }, NOW);
  assert.equal(s.latest, null);
  assert.equal(s.loggedFoodDays, 0);
  assert.equal(s.caloriesByDay.length, 7);
});

test('weigh-in reminder follows the last weigh-in', () => {
  const due = nextWeighInReminderDate('2026-10-30', 7, NOW);
  assert.equal(due.getDate(), 6); // Nov 6
  assert.equal(due.getHours(), 9);
  const overdue = nextWeighInReminderDate('2026-10-01', 7, NOW);
  assert.equal(overdue.getDate(), 3); // tomorrow 9am, since 9am today has passed
  assert.equal(nextWeighInReminderDate(null, 7, NOW).getDate(), 3);
});
