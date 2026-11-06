export const DEFAULT_USER_PROFILE = {
  // Names start blank so a user who skips setup isn't greeted as someone else.
  firstName: '',
  lastName: '',
  sex: 'female',
  age: 30,
  heightCm: 170,
  weightKg: 70,
  bodyGoal: 'maintain',
  calorieTarget: 1750,
  proteinTarget: 85,
  fatTarget: 60,
  carbsTarget: 220,
  onboardingComplete: false,
  // True once the user taps "Skip" so we don't force onboarding on every launch.
  onboardingSkipped: false,
};

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

// Standard activity multipliers applied to resting calories (Mifflin-St Jeor).
export const ACTIVITY_LEVELS = [
  { maxSessionsPerWeek: 1, multiplier: 1.2, label: 'mostly inactive' },
  { maxSessionsPerWeek: 3, multiplier: 1.375, label: 'lightly active' },
  { maxSessionsPerWeek: 5, multiplier: 1.55, label: 'moderately active' },
  { maxSessionsPerWeek: Infinity, multiplier: 1.725, label: 'very active' },
];

export function goalCalorieAdjustment(bodyGoal) {
  return bodyGoal === 'lose' ? -300 : bodyGoal === 'gain' ? 250 : 0;
}

/**
 * @param {object} profile
 * @param {{ activityMultiplier?: number }} options – defaults to 1.2 (inactive)
 *   because onboarding doesn't know how often the user trains yet.
 */
export function estimateDailyTargets(profile, { activityMultiplier = 1.2 } = {}) {
  const age = finiteNumber(profile?.age, DEFAULT_USER_PROFILE.age);
  const heightCm = finiteNumber(profile?.heightCm, DEFAULT_USER_PROFILE.heightCm);
  const weightKg = finiteNumber(profile?.weightKg, DEFAULT_USER_PROFILE.weightKg);
  const sexAdjustment = profile?.sex === 'male' ? 5 : -161;
  const restingCalories = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + sexAdjustment;
  const maintenanceCalories = restingCalories * activityMultiplier;
  const bodyGoal = ['lose', 'gain'].includes(profile?.bodyGoal) ? profile.bodyGoal : 'maintain';
  const calorieAdjustment = goalCalorieAdjustment(bodyGoal);
  const calorieTarget = Math.max(1200, Math.round((maintenanceCalories + calorieAdjustment) / 50) * 50);
  const proteinPerKg = bodyGoal === 'maintain' ? 1.2 : 1.6;
  const proteinTarget = Math.max(40, Math.round((weightKg * proteinPerKg) / 5) * 5);
  const fatTarget = Math.max(35, Math.round((calorieTarget * 0.3) / 9 / 5) * 5);
  const carbsTarget = Math.max(100, Math.round((calorieTarget - (proteinTarget * 4) - (fatTarget * 9)) / 4 / 5) * 5);

  return {
    calorieTarget,
    proteinTarget,
    fatTarget,
    carbsTarget,
  };
}

export function normalizeUserProfile(profile = {}) {
  const merged = { ...DEFAULT_USER_PROFILE, ...profile };
  return {
    firstName: String(merged.firstName ?? '').trim(),
    lastName: String(merged.lastName ?? '').trim(),
    sex: merged.sex === 'male' ? 'male' : 'female',
    age: finiteNumber(merged.age, DEFAULT_USER_PROFILE.age),
    heightCm: finiteNumber(merged.heightCm, DEFAULT_USER_PROFILE.heightCm),
    weightKg: finiteNumber(merged.weightKg, DEFAULT_USER_PROFILE.weightKg),
    bodyGoal: ['lose', 'gain'].includes(merged.bodyGoal) ? merged.bodyGoal : 'maintain',
    calorieTarget: finiteNumber(merged.calorieTarget, DEFAULT_USER_PROFILE.calorieTarget),
    proteinTarget: finiteNumber(merged.proteinTarget, DEFAULT_USER_PROFILE.proteinTarget),
    fatTarget: finiteNumber(merged.fatTarget, DEFAULT_USER_PROFILE.fatTarget),
    carbsTarget: finiteNumber(merged.carbsTarget, DEFAULT_USER_PROFILE.carbsTarget),
    onboardingComplete: Boolean(merged.onboardingComplete),
    onboardingSkipped: Boolean(merged.onboardingSkipped),
  };
}
