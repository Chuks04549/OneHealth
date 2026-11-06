// src/services/storage.js
//
// Persistence layer for Eugene. Everything the coach should "remember"
// across app restarts lives here, backed by AsyncStorage (NOT
// localStorage/sessionStorage, which don't work in this environment).
//
// Three things are persisted:
//   1. Logged runs        — the real training data the coach reasons from
//   2. Chat history        — so a conversation survives a reload
//   3. Engagement profile  — session-open timestamps, used to compute
//                            streaks / lapses so the coach's tone can
//                            adapt instead of being static every time
//
// This is intentionally a thin wrapper with plain async functions rather
// than a class — easy to swap for a real backend/sync layer later without
// touching call sites.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_USER_PROFILE, normalizeUserProfile } from '../../utils/profileUtils';

const KEYS = {
  runs: 'eugene:runs',
  foods: 'eugene:foods',
  workouts: 'eugene:workouts',
  goals: 'onehealth:goals',
  messages: 'eugene:messages',
  welcomeSeen: 'eugene:welcomeSeen',
  sessions: 'eugene:sessions',
  disclaimer: 'eugene:disclaimerAcknowledged',
  profile: 'onehealth:profile',
  appearance: 'onehealth:appearance',
  units: 'onehealth:units',
  notificationPrefs: 'onehealth:notificationPrefs',
  achievedGoalIds: 'onehealth:achievedGoalIds',
  lastNotifiedStreak: 'onehealth:lastNotifiedStreak',
  weightEntries: 'onehealth:weightEntries',
  healthGoals: 'onehealth:healthGoals',
  stepHistory: 'onehealth:stepHistory',
  favoriteExercises: 'onehealth:favoriteExercises',
  weeklyProgressNotices: 'onehealth:weeklyProgressNotices',
};

const DEFAULT_NOTIFICATION_PREFS = {
  dailyNudges: true,
  goalStreakAlerts: true,
  weeklySummary: true,
  weightReminders: true,
  weeklyProgressAlerts: true,
};

export function todayLocalISO() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`storage: failed to read ${key}`, err);
    return fallback;
  }
}

async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`storage: failed to write ${key}`, err);
  }
}

// ---------- Runs ----------

export async function getRuns() {
  return readJSON(KEYS.runs, []);
}

export async function addRun(run) {
  const runs = await getRuns();
  const withId = { id: `r${Date.now()}`, ...run };
  const next = [withId, ...runs].sort((a, b) => new Date(b.date) - new Date(a.date));
  await writeJSON(KEYS.runs, next);
  return withId;
}

export async function deleteRun(runId) {
  const runs = await getRuns();
  const next = runs.filter((r) => r.id !== runId);
  await writeJSON(KEYS.runs, next);
  return next;
}

// ---------- Food logs ----------
// Meals are stored as logged so the diary and daily-intake indicators can
// summarize them without changing the original estimates.

export async function getFoods() {
  return readJSON(KEYS.foods, []);
}

export async function addFood(food) {
  const foods = await getFoods();
  const withId = { id: `f${Date.now()}`, ...food };
  const next = [withId, ...foods].sort((a, b) => new Date(b.date) - new Date(a.date));
  await writeJSON(KEYS.foods, next);
  return withId;
}

export async function deleteFood(foodId) {
  const foods = await getFoods();
  const next = foods.filter((f) => f.id !== foodId);
  await writeJSON(KEYS.foods, next);
  return next;
}

// ---------- Workout sessions ----------

export async function getWorkouts() {
  return readJSON(KEYS.workouts, []);
}

export async function addWorkout(workout) {
  const workouts = await getWorkouts();
  const withId = { id: `w${Date.now()}`, ...workout };
  const next = [withId, ...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
  await writeJSON(KEYS.workouts, next);
  return withId;
}

export async function deleteWorkout(workoutId) {
  const workouts = await getWorkouts();
  const next = workouts.filter((workout) => workout.id !== workoutId);
  await writeJSON(KEYS.workouts, next);
  return next;
}

// ---------- User-created goals ----------

export async function getGoals() {
  return readJSON(KEYS.goals, []);
}

export async function saveGoal(goal) {
  const goals = await getGoals();
  const savedGoal = goal.id
    ? { ...goal, updatedAt: new Date().toISOString() }
    : { ...goal, id: `g${Date.now()}`, createdAt: new Date().toISOString() };
  const existingIndex = goals.findIndex((item) => item.id === savedGoal.id);
  const next = existingIndex >= 0
    ? goals.map((item) => item.id === savedGoal.id ? savedGoal : item)
    : [...goals, savedGoal];
  await writeJSON(KEYS.goals, next);
  return savedGoal;
}

export async function deleteGoal(goalId) {
  const goals = await getGoals();
  const next = goals.filter((goal) => goal.id !== goalId);
  await writeJSON(KEYS.goals, next);
  return next;
}

// ---------- User profile ----------

export async function getUserProfile() {
  const saved = await readJSON(KEYS.profile, DEFAULT_USER_PROFILE);
  return normalizeUserProfile(saved);
}

export async function saveUserProfile(profile) {
  const current = await getUserProfile();
  const next = normalizeUserProfile({ ...current, ...profile });
  await writeJSON(KEYS.profile, next);
  return next;
}

// ---------- Appearance ----------

export async function getAppearancePreference() {
  const saved = await AsyncStorage.getItem(KEYS.appearance);
  return ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
}

export async function saveAppearancePreference(preference) {
  const next = ['light', 'dark'].includes(preference) ? preference : 'system';
  await AsyncStorage.setItem(KEYS.appearance, next);
  return next;
}

export async function getUnitSystem() {
  const saved = await AsyncStorage.getItem(KEYS.units);
  return saved === 'metric' ? 'metric' : 'imperial';
}

export async function saveUnitSystem(unitSystem) {
  const next = unitSystem === 'metric' ? 'metric' : 'imperial';
  await AsyncStorage.setItem(KEYS.units, next);
  return next;
}

// ---------- Notification preferences ----------

export async function getNotificationPrefs() {
  const saved = await readJSON(KEYS.notificationPrefs, DEFAULT_NOTIFICATION_PREFS);
  return { ...DEFAULT_NOTIFICATION_PREFS, ...saved };
}

export async function saveNotificationPrefs(prefs) {
  const current = await getNotificationPrefs();
  const next = { ...current, ...prefs };
  await writeJSON(KEYS.notificationPrefs, next);
  return next;
}

// ---------- Health progress ----------

export async function getWeightEntries() {
  return readJSON(KEYS.weightEntries, []);
}

export async function addWeightEntry(entry) {
  const entries = await getWeightEntries();
  const date = entry.date || todayLocalISO();
  const saved = { id: `weight-${Date.now()}`, date, weightKg: Number(entry.weightKg), createdAt: new Date().toISOString() };
  const next = [...entries.filter((item) => item.date !== date), saved]
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  await writeJSON(KEYS.weightEntries, next);
  return saved;
}

export async function getHealthGoals() {
  return readJSON(KEYS.healthGoals, { targetWeightKg: null, goalDate: null, stepGoal: 8000, weighInIntervalDays: 7 });
}

export async function saveHealthGoals(goals) {
  const current = await getHealthGoals();
  const next = { ...current, ...goals };
  await writeJSON(KEYS.healthGoals, next);
  return next;
}

export async function getStepHistory() {
  return readJSON(KEYS.stepHistory, []);
}

export async function saveStepSnapshot(steps, date = todayLocalISO()) {
  const history = await getStepHistory();
  const next = [...history.filter((item) => item.date !== date), { date, steps: Number(steps) || 0 }]
    .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-120);
  await writeJSON(KEYS.stepHistory, next);
  return next;
}

// ---------- Workout playlist ----------

export async function getFavoriteExerciseIds() {
  return readJSON(KEYS.favoriteExercises, []);
}

export async function toggleFavoriteExercise(exerciseId) {
  const current = await getFavoriteExerciseIds();
  const next = current.includes(exerciseId)
    ? current.filter((id) => id !== exerciseId)
    : [...current, exerciseId];
  await writeJSON(KEYS.favoriteExercises, next);
  return next;
}

// ---------- Goal / streak achievement tracking ----------
// Used so we only fire a "you hit your goal" notification once per goal
// completion and once per new streak milestone, instead of re-notifying
// every time the screen re-renders.

export async function getAchievedGoalIds() {
  return readJSON(KEYS.achievedGoalIds, []);
}

export async function markGoalAchieved(goalId) {
  const achieved = await getAchievedGoalIds();
  if (achieved.includes(goalId)) return achieved;
  const next = [...achieved, goalId];
  await writeJSON(KEYS.achievedGoalIds, next);
  return next;
}

export async function resetAchievedGoal(goalId) {
  const achieved = await getAchievedGoalIds();
  const next = achieved.filter((id) => id !== goalId);
  await writeJSON(KEYS.achievedGoalIds, next);
  return next;
}

export async function getLastNotifiedStreak() {
  const raw = await AsyncStorage.getItem(KEYS.lastNotifiedStreak);
  return raw ? Number(raw) || 0 : 0;
}

export async function setLastNotifiedStreak(streakCount) {
  await AsyncStorage.setItem(KEYS.lastNotifiedStreak, String(streakCount));
}

// ---------- Weekly progress notices ----------
// Remembers which "week:status" notices have already been sent (e.g.
// "2026-10-26:improved") so the user gets at most one improvement and one
// slip notice per week, no matter how often they open the app.

export async function getWeeklyProgressNotices() {
  return readJSON(KEYS.weeklyProgressNotices, []);
}

export async function addWeeklyProgressNotice(noticeKey) {
  const notices = await getWeeklyProgressNotices();
  if (notices.includes(noticeKey)) return notices;
  const next = [...notices, noticeKey].slice(-20);
  await writeJSON(KEYS.weeklyProgressNotices, next);
  return next;
}

// ---------- Messages ----------

export async function getMessages() {
  return readJSON(KEYS.messages, null); // null = "no saved history yet"
}

export async function saveMessages(messages) {
  // Keep this bounded so storage doesn't grow forever in a long-lived app.
  const trimmed = messages.slice(-200);
  await writeJSON(KEYS.messages, trimmed);
}

export async function clearMessages() {
  await AsyncStorage.removeItem(KEYS.messages);
}

export async function getEugeneWelcomeSeen() {
  return (await AsyncStorage.getItem(KEYS.welcomeSeen)) === 'true';
}

export async function markEugeneWelcomeSeen() {
  await AsyncStorage.setItem(KEYS.welcomeSeen, 'true');
}

// ---------- Disclaimer ----------

export async function getDisclaimerAcknowledged() {
  const raw = await AsyncStorage.getItem(KEYS.disclaimer);
  return raw === 'true';
}

export async function setDisclaimerAcknowledged() {
  await AsyncStorage.setItem(KEYS.disclaimer, 'true');
}

// ---------- Engagement / sessions ----------
// Records one timestamp per app open. Used to derive streaks and lapses
// so the coach can adapt tone instead of greeting a lapsed user the same
// way as someone who opened the app four times today.

export async function recordSessionOpen() {
  const sessions = await readJSON(KEYS.sessions, []);
  const today = todayLocalISO();
  const lastDay = sessions[0]?.slice(0, 10);
  const next = lastDay === today ? sessions : [new Date().toISOString(), ...sessions].slice(0, 60);
  await writeJSON(KEYS.sessions, next);
  return next;
}

function dayDiff(a, b) {
  const ms = new Date(a).setHours(0, 0, 0, 0) - new Date(b).setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

/**
 * Computes a lightweight engagement summary from session-open history.
 * `status` drives tone selection in coachAI.js / the server prompt:
 *   - 'new'        no prior sessions
 *   - 'lapsed'     4+ days since last open
 *   - 'returning'  1-3 days since last open, no active streak
 *   - 'consistent' opened on 3+ of the last 4 days
 */
export async function getEngagementSummary() {
  const sessions = await readJSON(KEYS.sessions, []);
  if (sessions.length === 0) {
    return { status: 'new', daysSinceLastOpen: null, streakDays: 0, totalSessions: 0 };
  }

  const now = new Date().toISOString();
  const daysSinceLastOpen = dayDiff(now, sessions[0]);

  let streakDays = 1;
  for (let i = 1; i < sessions.length; i++) {
    if (dayDiff(sessions[i - 1], sessions[i]) === 1) streakDays += 1;
    else break;
  }

  const recentOpens = sessions.filter((s) => dayDiff(now, s) <= 4).length;

  let status = 'returning';
  if (daysSinceLastOpen >= 4) status = 'lapsed';
  else if (recentOpens >= 3) status = 'consistent';

  return { status, daysSinceLastOpen, streakDays, totalSessions: sessions.length };
}
