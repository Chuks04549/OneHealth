// src/utils/progressMath.js
//
// All the numbers on the Progress screen, as plain functions (no React, no
// storage) so they can be unit-tested — see tests/progressMath.test.js.
//
// Fixes vs. the old inline math in ProgressScreen:
//  - "avg. calories/day" really is per DAY now (it used to average per meal,
//    so three 600 kcal meals showed as 600/day).
//  - Maintenance calories account for how often the user actually trains
//    (logged workouts + runs) instead of assuming everyone is inactive.
//  - The meal projection starts from the first weigh-in on the chart and uses
//    weigh-in weights, not the weight typed in during onboarding.

import { ACTIVITY_LEVELS, estimateDailyTargets, goalCalorieAdjustment } from './profileUtils.js';

const pad = (n) => String(n).padStart(2, '0');
export const localDay = (value = new Date()) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const noon = (date) => new Date(`${String(date).slice(0, 10)}T12:00:00`);
export const daysAgo = (date, now = new Date()) => Math.floor((now - noon(date)) / 86400000);
export const daysBetween = (a, b) => Math.max(0, Math.round((noon(b) - noon(a)) / 86400000));
export const average = (items) => (items.length ? items.reduce((sum, v) => sum + v, 0) / items.length : 0);

/** Calories for one logged meal: the logged number, else computed from macros. */
export function mealCalories(meal) {
  const logged = Number(meal?.calories);
  if (logged > 0) return logged;
  const m = meal?.macros || {};
  return (Number(m.protein_g) || 0) * 4 + (Number(m.carbs_g) || 0) * 4 + (Number(m.fat_g) || 0) * 9;
}

/** Average calories per day, counting only days that have at least one meal logged. */
export function dailyCalorieAverage(foods, windowDays = 30, now = new Date()) {
  const totals = new Map();
  foods.forEach((meal) => {
    if (!meal?.date || daysAgo(meal.date, now) > windowDays) return;
    const day = String(meal.date).slice(0, 10);
    totals.set(day, (totals.get(day) || 0) + mealCalories(meal));
  });
  return { average: average([...totals.values()]), loggedDays: totals.size };
}

/** How active the user is, from distinct days with a workout or run in the last 4 weeks. */
export function activityLevel(workouts = [], runs = [], now = new Date()) {
  const activeDays = new Set(
    [...workouts, ...runs]
      .filter((item) => item?.date && daysAgo(item.date, now) <= 27 && daysAgo(item.date, now) >= 0)
      .map((item) => String(item.date).slice(0, 10)),
  );
  const sessionsPerWeek = activeDays.size / 4;
  const level = ACTIVITY_LEVELS.find((l) => sessionsPerWeek < l.maxSessionsPerWeek) || ACTIVITY_LEVELS[ACTIVITY_LEVELS.length - 1];
  return { sessionsPerWeek, multiplier: level.multiplier, label: level.label };
}

/** Resting calories (Mifflin-St Jeor) × activity multiplier. */
export function maintenanceCalories(profile = {}, weightKg, multiplier = 1.2) {
  const kg = Number(weightKg) || Number(profile.weightKg) || 70;
  const bmr = 10 * kg + 6.25 * (Number(profile.heightCm) || 170) - 5 * (Number(profile.age) || 30) + (profile.sex === 'male' ? 5 : -161);
  return bmr * multiplier;
}

/**
 * Expected weight at each weigh-in if the user ate what they logged.
 * 7,700 kcal ≈ 1 kg of body weight.
 */
export function projectWeights(points, foods, profile, multiplier) {
  if (!points.length) return [];
  const anchor = points[0];
  const maintenance = maintenanceCalories(profile, anchor.weightKg, multiplier);
  return points.map((point) => {
    const meals = foods.filter((meal) => meal?.date && meal.date >= anchor.date && meal.date <= point.date);
    const loggedDays = new Set(meals.map((meal) => String(meal.date).slice(0, 10))).size;
    const intake = loggedDays ? meals.reduce((sum, meal) => sum + mealCalories(meal), 0) / loggedDays : Number(profile.calorieTarget) || maintenance;
    return anchor.weightKg + ((intake - maintenance) * daysBetween(anchor.date, point.date)) / 7700;
  });
}

/** Everything the Progress screen shows, from raw stored data. */
export function buildProgressSummary(data = {}, now = new Date()) {
  const { entries = [], foods = [], steps = [], workouts = [], runs = [] } = data;
  const goals = data.goals || {};
  const profile = data.profile || {};
  const recentWeights = entries.filter((item) => daysAgo(item.date, now) <= 180);
  const latest = recentWeights[recentWeights.length - 1] || null;
  const first = recentWeights[0] || null;
  const weightPoints = recentWeights.slice(-8);

  const activity = activityLevel(workouts, runs, now);
  const { average: calorieAverage, loggedDays: loggedFoodDays } = dailyCalorieAverage(foods, 30, now);
  const stepAverage = average(steps.filter((item) => daysAgo(item.date, now) <= 30).map((item) => Number(item.steps) || 0));

  // Suggested intake for the user's goal using their real activity level and latest weigh-in.
  const currentWeightKg = latest?.weightKg || profile.weightKg;
  const maintenance = maintenanceCalories(profile, currentWeightKg, activity.multiplier);
  const suggestedTarget = estimateDailyTargets({ ...profile, weightKg: currentWeightKg }, { activityMultiplier: activity.multiplier }).calorieTarget;

  const dayLabels = Array.from({ length: 7 }, (_, i) => localDay(new Date(now.getTime() - (6 - i) * 86400000)));
  const caloriesByDay = dayLabels.map((day) => foods.filter((item) => String(item.date).slice(0, 10) === day).reduce((sum, item) => sum + mealCalories(item), 0));
  const stepsByDay = dayLabels.map((day) => Number(steps.find((item) => item.date === day)?.steps) || 0);

  const savedTarget = Number(profile.calorieTarget) || 0;
  return {
    latest,
    first,
    change: latest && first ? latest.weightKg - first.weightKg : 0,
    weightPoints,
    expectedPoints: projectWeights(weightPoints, foods, profile, activity.multiplier),
    goalWeight: Number(goals.targetWeightKg) || null,
    calorieAverage,
    loggedFoodDays,
    calorieDiff: Math.round(calorieAverage - savedTarget),
    savedTarget,
    suggestedTarget,
    maintenance: Math.round(maintenance),
    goalAdjustment: goalCalorieAdjustment(profile.bodyGoal),
    activity,
    stepAverage,
    caloriesByDay,
    stepsByDay,
  };
}
