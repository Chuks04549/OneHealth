// src/utils/weeklyProgress.js
//
// Turns raw weigh-ins into a week-by-week progress picture that is graded
// against the body goal the user picked during onboarding (or later in
// Settings):
//
//   - 'lose'     → weight going DOWN week over week is an improvement
//   - 'gain'     → weight going UP week over week is an improvement
//   - 'maintain' → staying within a small band is an improvement
//
// Pure functions only — no storage or notification side effects — so the
// Progress screen chart, its banner, and the push notification all agree.

const KG_PER_LB = 0.45359237;

// Changes smaller than this are treated as normal day-to-day noise
// (water, food in the gut, etc.) rather than real progress or slippage.
export const NOISE_KG = 0.1; // ≈ 0.2 lb

// For "maintain", staying within this much of last week counts as on track.
export const MAINTAIN_BAND_KG = 0.25; // ≈ 0.5 lb

const pad = (n) => String(n).padStart(2, '0');
const toLocalISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Monday (local time) of the week the given YYYY-MM-DD date falls in. */
export function weekStartOf(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return toLocalISO(d);
}

function normalizeGoal(goal) {
  return goal === 'lose' || goal === 'gain' ? goal : 'maintain';
}

/**
 * Grades one week-over-week change for the user's goal.
 * Returns 'improved' | 'regressed' | 'steady'.
 */
export function classifyChange(deltaKg, bodyGoal) {
  const goal = normalizeGoal(bodyGoal);
  if (goal === 'maintain') return Math.abs(deltaKg) <= MAINTAIN_BAND_KG ? 'improved' : 'regressed';
  if (Math.abs(deltaKg) < NOISE_KG) return 'steady';
  const wentDown = deltaKg < 0;
  if (goal === 'lose') return wentDown ? 'improved' : 'regressed';
  return wentDown ? 'regressed' : 'improved';
}

/**
 * Groups weigh-ins by week and compares each week's average to the week
 * before it.
 *
 * @param {Array<{date: string, weightKg: number}>} entries
 * @param {'lose'|'gain'|'maintain'} bodyGoal
 * @param {number} maxWeeks how many weeks to keep for the chart
 */
export function computeWeeklyProgress(entries = [], bodyGoal = 'maintain', maxWeeks = 8) {
  const goal = normalizeGoal(bodyGoal);
  const buckets = new Map();
  entries.forEach((entry) => {
    const kg = Number(entry?.weightKg);
    if (!entry?.date || !Number.isFinite(kg) || kg <= 0) return;
    const key = weekStartOf(entry.date);
    const bucket = buckets.get(key) || { weekKey: key, total: 0, count: 0 };
    bucket.total += kg;
    bucket.count += 1;
    buckets.set(key, bucket);
  });

  const weeks = [...buckets.values()]
    .sort((a, b) => (a.weekKey < b.weekKey ? -1 : 1))
    .slice(-maxWeeks)
    .map(({ weekKey, total, count }) => ({ weekKey, avgKg: total / count, count }));

  const segments = weeks.slice(1).map((week, i) => {
    const previous = weeks[i];
    const deltaKg = week.avgKg - previous.avgKg;
    const weeksApart = Math.round((new Date(`${week.weekKey}T12:00:00`) - new Date(`${previous.weekKey}T12:00:00`)) / (7 * 86400000));
    return { from: previous, to: week, deltaKg, weeksApart, status: classifyChange(deltaKg, goal) };
  });

  const latest = segments[segments.length - 1] || null;

  // How many weeks in a row (ending with the latest) were improvements.
  let improvedStreak = 0;
  for (let i = segments.length - 1; i >= 0 && segments[i].status === 'improved'; i -= 1) improvedStreak += 1;

  const thisWeekKey = weekStartOf(toLocalISO(new Date()));
  return {
    goal,
    weeks,
    segments,
    latest,
    improvedStreak,
    latestIsCurrentWeek: Boolean(latest && latest.to.weekKey === thisWeekKey),
  };
}

/** Formats an absolute weight change in the user's units, e.g. "1.2 lb". */
export function formatChange(deltaKg, unitSystem) {
  const abs = Math.abs(deltaKg);
  return unitSystem === 'metric' ? `${abs.toFixed(1)} kg` : `${(abs / KG_PER_LB).toFixed(1)} lb`;
}

const GOAL_PHRASE = {
  lose: 'your weight-loss goal',
  gain: 'your muscle-gain goal',
  maintain: 'keeping your weight steady',
};

/**
 * Friendly, goal-aware copy for the latest week. Used for both the
 * in-app banner and the push notification so they always match.
 */
export function describeWeeklyProgress(progress, unitSystem) {
  const latest = progress?.latest;
  if (!latest) {
    return {
      status: 'insufficient',
      title: 'Weekly progress unlocks soon',
      body: 'Log your weight in two different weeks and we’ll show whether you’re improving.',
    };
  }

  const { goal, improvedStreak } = progress;
  const amount = formatChange(latest.deltaKg, unitSystem);
  const direction = latest.deltaKg < 0 ? 'Down' : 'Up';
  const since = latest.weeksApart > 1 ? `vs. ${latest.weeksApart} weeks ago` : 'vs. last week';
  const streakNote = improvedStreak >= 2 ? ` That’s ${improvedStreak} weeks in a row!` : '';

  if (latest.status === 'improved') {
    if (goal === 'maintain') {
      return {
        status: 'improved',
        title: 'You’re improving! 💪',
        body: `Your weight held steady (${latest.deltaKg >= 0 ? '+' : '−'}${amount} ${since}) — right on track for ${GOAL_PHRASE.maintain}.${streakNote}`,
      };
    }
    return {
      status: 'improved',
      title: 'You’re improving! 💪',
      body: `${direction} ${amount} ${since} — real progress toward ${GOAL_PHRASE[goal]}.${streakNote}`,
    };
  }

  if (latest.status === 'regressed') {
    const tip = goal === 'lose'
      ? 'Take a look at this week’s meals and keep logging — one week doesn’t define your progress.'
      : goal === 'gain'
        ? 'Try adding a little more protein and calories, and keep training — you’ve got this.'
        : 'Small tweaks to meals or activity can bring it back.';
    return {
      status: 'regressed',
      title: 'Heads up: you slipped this week',
      body: `${direction} ${amount} ${since}, which moves away from ${GOAL_PHRASE[goal]}. ${tip}`,
    };
  }

  return {
    status: 'steady',
    title: 'Holding steady',
    body: `Barely any change ${since} (${amount}). Stay consistent and the trend will show.`,
  };
}
