// src/utils/strengthProgress.js
//
// Strength progress from logged lifts. Each workout can carry
//   lifts: [{ name, weightKg, reps, sets }]
// (added in WorkoutLogScreen). For each exercise we track the best set per
// session, scored as an estimated one-rep max (Epley formula) so that
// "100 kg × 5" and "105 kg × 3" can be compared fairly. Bodyweight moves
// logged with no weight are scored by reps instead.
//
// Pure functions — tested in tests/strengthProgress.test.js.

import { weekStartOf } from './weeklyProgress.js';

/** Epley estimated 1-rep max. 1 rep = the weight itself. */
export function estimateOneRepMax(weightKg, reps) {
  const w = Number(weightKg) || 0;
  const r = Math.max(1, Math.round(Number(reps) || 0));
  if (w <= 0) return 0;
  return r === 1 ? w : w * (1 + r / 30);
}

const KG_PER_LB = 0.45359237;

/** "100 kg × 5", "225 lb × 5" or "12 reps" for bodyweight sets. */
export function formatLiftSet(best, unitSystem) {
  if (!best) return '';
  const w = Number(best.weightKg) || 0;
  if (w <= 0) return `${Math.round(Number(best.reps) || 0)} reps`;
  const shown = unitSystem === 'metric' ? `${Math.round(w * 10) / 10} kg` : `${Math.round(w / KG_PER_LB)} lb`;
  return `${shown} × ${Math.round(Number(best.reps) || 0)}`;
}

export const liftKey = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');

const validLift = (lift) => liftKey(lift?.name) && (Number(lift?.reps) || 0) > 0;

/** Score for one set: e1RM for weighted lifts, reps for bodyweight. */
function setScore(lift, mode) {
  return mode === 'reps' ? Math.round(Number(lift.reps) || 0) : estimateOneRepMax(lift.weightKg, lift.reps);
}

/**
 * Groups every logged lift by exercise.
 * Returns [{ key, name, mode: 'weight'|'reps', sessions: [{date, score, best}] }]
 * sorted with the most-logged exercise first.
 */
export function collectLiftHistory(workouts = []) {
  const byKey = new Map();
  workouts.forEach((workout) => {
    (workout?.lifts || []).filter(validLift).forEach((lift) => {
      const key = liftKey(lift.name);
      const entry = byKey.get(key) || { key, name: String(lift.name).trim(), lifts: [] };
      entry.lifts.push({ ...lift, date: String(workout.date).slice(0, 10) });
      byKey.set(key, entry);
    });
  });

  return [...byKey.values()].map((entry) => {
    const mode = entry.lifts.some((l) => Number(l.weightKg) > 0) ? 'weight' : 'reps';
    const perDay = new Map();
    entry.lifts.forEach((lift) => {
      if (mode === 'weight' && !(Number(lift.weightKg) > 0)) return;
      const score = setScore(lift, mode);
      const current = perDay.get(lift.date);
      if (!current || score > current.score) perDay.set(lift.date, { date: lift.date, score, best: lift });
    });
    const sessions = [...perDay.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
    const lastDate = sessions[sessions.length - 1]?.date || '';
    return { key: entry.key, name: entry.name, mode, sessions, lastDate };
  })
    .filter((e) => e.sessions.length)
    .sort((a, b) => b.sessions.length - a.sessions.length || (a.lastDate < b.lastDate ? 1 : -1));
}

/** A change counts as real when it beats both 1% and a small absolute floor. */
export function classifyStrengthChange(delta, previous, mode) {
  const floor = mode === 'reps' ? 1 : Math.max(0.5, Math.abs(previous) * 0.01);
  if (delta >= floor) return 'improved';
  if (delta <= -floor) return 'regressed';
  return 'steady';
}

/**
 * Week-by-week strength for one exercise (best score each week), in the
 * same shape as computeWeeklyProgress so the same chart can draw it.
 */
export function computeStrengthProgress(exercise, maxWeeks = 8) {
  if (!exercise) return { weeks: [], segments: [], latest: null, improvedStreak: 0, best: null };
  const byWeek = new Map();
  exercise.sessions.forEach((s) => {
    const weekKey = weekStartOf(s.date);
    const current = byWeek.get(weekKey);
    if (!current || s.score > current.value) byWeek.set(weekKey, { weekKey, value: s.score, best: s.best });
  });
  const weeks = [...byWeek.values()].sort((a, b) => (a.weekKey < b.weekKey ? -1 : 1)).slice(-maxWeeks);
  const segments = weeks.slice(1).map((week, i) => {
    const previous = weeks[i];
    const delta = week.value - previous.value;
    const weeksApart = Math.round((new Date(`${week.weekKey}T12:00:00`) - new Date(`${previous.weekKey}T12:00:00`)) / (7 * 86400000));
    return { from: previous, to: week, delta, weeksApart, status: classifyStrengthChange(delta, previous.value, exercise.mode) };
  });
  let improvedStreak = 0;
  for (let i = segments.length - 1; i >= 0 && segments[i].status === 'improved'; i -= 1) improvedStreak += 1;
  const best = exercise.sessions.reduce((top, s) => (!top || s.score > top.score ? s : top), null);
  return { weeks, segments, latest: segments[segments.length - 1] || null, improvedStreak, best };
}

/**
 * Lifts in `newWorkout` that beat every earlier session of that exercise.
 * Returns [{ name, mode, best, previousBest }]. First-ever logs are not PRs.
 */
export function findPersonalRecords(previousWorkouts = [], newWorkout) {
  const history = new Map(collectLiftHistory(previousWorkouts).map((e) => [e.key, e]));
  const fresh = collectLiftHistory([newWorkout]);
  return fresh.flatMap((exercise) => {
    const past = history.get(exercise.key);
    if (!past) return [];
    const mode = past.mode === 'weight' || exercise.mode === 'weight' ? 'weight' : 'reps';
    if (mode !== exercise.mode) return [];
    const previousBest = Math.max(...past.sessions.map((s) => s.score));
    const session = exercise.sessions[0];
    return session.score > previousBest ? [{ name: exercise.name, mode, best: session.best, score: session.score, previousBest }] : [];
  });
}
