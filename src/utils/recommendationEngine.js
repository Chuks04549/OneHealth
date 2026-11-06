// Produces one grounded Home-screen suggestion from the user's saved activity.
// Food entries remain descriptive context; this does not create calorie targets
// or dietary prescriptions.

function daysAgo(dateStr) {
  const timestamp = new Date(dateStr).getTime();
  if (!Number.isFinite(timestamp)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
}

function formatPace(pace, unitSystem = 'imperial') {
  if (!Number.isFinite(Number(pace))) return null;
  const value = Number(pace) * (unitSystem === 'imperial' ? 1.609344 : 1);
  let minutes = Math.floor(value);
  let seconds = Math.round((value - minutes) * 60);
  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}/${unitSystem === 'imperial' ? 'mi' : 'km'}`;
}

export function buildRecommendation(runs = [], foods = [], unitSystem = 'imperial') {
  const distance = (km) => unitSystem === 'imperial'
    ? `${Math.round((Number(km) || 0) * 0.621371 * 10) / 10}mi`
    : `${Math.round((Number(km) || 0) * 10) / 10}km`;
  const sortedRuns = [...runs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedFoods = [...foods].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sortedRuns.length === 0 && sortedFoods.length === 0) {
    return {
      icon: 'sparkles-outline',
      title: 'For You',
      body: "Log a workout or a meal and I'll start tailoring suggestions to what you actually do.",
      detail: null,
    };
  }

  const last7Runs = sortedRuns.filter((run) => daysAgo(run.date) <= 7);
  const last7Foods = sortedFoods.filter((food) => daysAgo(food.date) <= 7);
  const mostRecentRun = sortedRuns[0];

  if (mostRecentRun && mostRecentRun.effort === 'hard' && daysAgo(mostRecentRun.date) <= 1) {
    return {
      icon: 'battery-half-outline',
      title: 'For You',
      body: `Your last logged run was a hard ${distance(mostRecentRun.km)} effort. An easy day or rest before your next session will help it stick.`,
      detail: 'Based on your most recently logged run.',
    };
  }

  if (mostRecentRun && daysAgo(mostRecentRun.date) >= 3) {
    const gap = daysAgo(mostRecentRun.date);
    return {
      icon: 'walk-outline',
      title: 'For You',
      body: `It's been ${gap} days since your last logged run (${distance(mostRecentRun.km)}). A short, easy session is a good way back in—no need to jump straight to where you left off.`,
      detail: `Last run logged ${gap} day${gap === 1 ? '' : 's'} ago.`,
    };
  }

  if (last7Runs.length >= 3) {
    const totalKm = Math.round(last7Runs.reduce((sum, run) => sum + (Number(run.km) || 0), 0) * 10) / 10;
    const paces = last7Runs.map((run) => Number(run.paceMinPerKm)).filter(Number.isFinite);
    const averagePace = paces.length ? paces.reduce((sum, pace) => sum + pace, 0) / paces.length : null;
    const hardCount = last7Runs.filter((run) => run.effort === 'hard').length;
    const increase = hardCount >= 2 ? 5 : 10;

    return {
      icon: 'trending-up-outline',
      title: 'For You',
      body:
        `You've logged ${last7Runs.length} runs this week totaling ${distance(totalKm)}` +
        (averagePace ? ` at ${formatPace(averagePace, unitSystem)} average pace` : '') +
        `. That's solid consistency—a modest +${increase}% next week is a reasonable next step.`,
      detail: `Based on ${last7Runs.length} runs logged in the last 7 days.`,
    };
  }

  if (last7Runs.length > 0 && last7Foods.length < last7Runs.length) {
    return {
      icon: 'restaurant-outline',
      title: 'For You',
      body: `You've logged ${last7Runs.length} run${last7Runs.length === 1 ? '' : 's'} this week but only ${last7Foods.length} meal${last7Foods.length === 1 ? '' : 's'}. Logging food around workouts gives your coach more useful context.`,
      detail: null,
    };
  }

  return {
    icon: 'checkmark-circle-outline',
    title: 'For You',
    body: `You've logged ${sortedRuns.length} run${sortedRuns.length === 1 ? '' : 's'} and ${sortedFoods.length} meal${sortedFoods.length === 1 ? '' : 's'} so far. Keep logging and these suggestions will get sharper.`,
    detail: null,
  };
}
