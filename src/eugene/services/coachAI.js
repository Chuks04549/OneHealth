// src/services/coachAI.js
//
// Enhanced to use OpenAI API for ChatGPT-like responses while maintaining
// the coaching context from logged runs and meals.
//
// Two things make this different from a generic scripted-reply mock:
//   1. Every "why" and every goal number is computed FROM the runs (and,
//      as light context, the meals) the user actually logged (see
//      buildRunStats / buildFoodContext), not canned text. Food logs are
//      never turned into calorie targets or diet advice — only referenced
//      descriptively.
//   2. Tone shifts based on `engagement` (see storage.js) — a lapsed
//      user gets re-engaged gently, a consistent one gets treated like
//      someone who doesn't need convincing.

// The API key must never be bundled into the app. The Expo client only knows
// the URL of our small server-side proxy; that server reads OPENAI_API_KEY.
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

function hostFromUri(uri) {
  if (!uri || typeof uri !== 'string') return null;
  const match = uri.match(/^(?:[a-z]+:\/\/)?([^/:]+)/i);
  return match?.[1] || null;
}

function resolveApiBaseUrls() {
  const candidates = [];
  const addUrl = (url) => {
    if (url && !candidates.includes(url)) candidates.push(url.replace(/\/$/, ''));
  };

  addUrl(process.env.EXPO_PUBLIC_COACH_API_URL);

  // On a phone, localhost means the phone itself. During Expo development the
  // bundle URL contains the computer's LAN address, so reuse that host for the
  // local API server. Deployed builds should set EXPO_PUBLIC_COACH_API_URL.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    addUrl(`http://${window.location.hostname}:3000`);
  }

  const developmentHosts = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    NativeModules.SourceCode?.scriptURL,
  ];
  developmentHosts.forEach((uri) => {
    const host = hostFromUri(uri);
    if (host) addUrl(`http://${host}:3000`);
  });

  if (Platform.OS === 'android') addUrl('http://10.0.2.2:3000');
  addUrl('http://localhost:3000');
  return candidates;
}

const API_BASE_URLS = resolveApiBaseUrls();
const REQUEST_TIMEOUT_MS = 7000;

async function requestCoachReply(body) {
  let lastError;
  for (const apiBaseUrl of API_BASE_URLS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.text !== 'string' || !payload.text.trim()) {
        throw new Error(payload.error || `Coach API returned ${response.status}`);
      }
      return payload.text.trim();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error('No coach API address is available');
}

// Client-side safety net: catches concerning symptoms instantly, without
// waiting on a network round trip to the AI. This runs *before* anything
// else, on every message the user sends, regardless of MOCK_MODE.
const SYMPTOM_KEYWORDS = [
  'chest pain', "can't breathe", 'cant breathe', 'cannot breathe',
  'shortness of breath', 'short of breath', 'dizzy', 'dizziness',
  'faint', 'passed out', 'irregular heartbeat', 'heart racing',
  'numbness', 'numb arm', 'severe pain', 'blacking out', 'blackout',
];

export function detectSymptoms(text) {
  const lower = text.toLowerCase();
  return SYMPTOM_KEYWORDS.some((kw) => lower.includes(kw));
}

export const SAFETY_RESPONSE_TEXT =
  "That sounds like it could be serious. Please stop what you're doing and " +
  'contact emergency services (911 in the US) or a medical professional right ' +
  "away. I'm a training coach, not equipped to help with this — your safety " +
  'comes first. I\'ll be here when you\'re ready to talk training again.';

// ---------- Grounding: turn logged runs into numbers the coach can cite ----------

function buildRunStats(runs = []) {
  if (!runs || runs.length === 0) return null;

  const sorted = [...runs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last3 = sorted.slice(0, 3);
  const totalKm = (arr) => arr.reduce((s, r) => s + r.km, 0);
  const avgPace = (arr) =>
    arr.reduce((s, r) => s + r.paceMinPerKm, 0) / arr.length;

  const last3Km = Math.round(totalKm(last3) * 10) / 10;
  const last3AvgPace = Math.round(avgPace(last3) * 100) / 100;
  const longest = [...runs].sort((a, b) => b.km - a.km)[0];
  const hardCount = last3.filter((r) => r.effort === 'hard').length;

  return { sorted, last3, last3Km, last3AvgPace, longest, hardCount, count: runs.length };
}

function formatPace(pace) {
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${String(sec).padStart(2, '0')}/km`;
}

// Food logs are context, never a target: this only describes what was
// logged (e.g. "you logged oatmeal before today's run"), and never
// computes or suggests calorie totals, macros, or a diet plan.
function buildFoodContext(foods = [], runs = []) {
  if (!foods || foods.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const todaysFoods = foods.filter((f) => f.date === today);
  const todaysRun = [...runs].sort((a, b) => new Date(b.date) - new Date(a.date))
    .find((r) => r.date === today);

  if (todaysFoods.length === 0) return null;

  const items = todaysFoods.slice(0, 3).map((f) => f.description).join(', ');
  if (todaysRun) {
    return `You logged ${items} today alongside your ${todaysRun.km} km run — noting it, not judging it.`;
  }
  return `You logged ${items} today.`;
}

// Workout logs are context rather than targets. This tells Eugene what the
// user completed without prescribing a training split or workout volume.
function buildWorkoutContext(workouts = []) {
  if (!workouts || workouts.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const todaysWorkouts = workouts.filter((workout) => workout.date === today);
  if (todaysWorkouts.length === 0) return null;

  const items = todaysWorkouts.slice(0, 3).map((workout) => workout.title).join(', ');
  return `You logged ${items} today.`;
}

// ---------- Tone adaptation ----------

function toneOpener(engagement) {
  switch (engagement?.status) {
    case 'lapsed':
      return {
        prefix: "Good to see you back — it's been a few days. No lecture, just picking up where we left off. ",
        proposeIncrease: false,
      };
    case 'consistent':
      return {
        prefix: '',
        proposeIncrease: true,
        terse: true, // consistent users get less hand-holding, more signal
      };
    case 'new':
      return {
        prefix: "Let's get your first few runs logged so I'm working from your actual data, not guesses. ",
        proposeIncrease: false,
      };
    default:
      return { prefix: '', proposeIncrease: true };
  }
}

// ---------- Mock reply builders (grounded in real data) ----------

function buildGoalReply(stats, engagement, foodContext) {
  const tone = toneOpener(engagement);
  if (!stats) {
    return {
      type: 'text',
      text:
        tone.prefix +
        "I don't have any runs logged yet, so I can't respons­ibly propose a number — log a run or two and I'll build a goal from what you've actually done.",
      reasoning: null,
    };
  }

  const bump = stats.hardCount >= 2 ? 1.1 : 1.2; // ease off if recent effort was already high
  const proposedKm = Math.round(stats.last3Km * bump * 10) / 10;
  const changePct = Math.round((bump - 1) * 100);

  let reasoning =
    `Your last ${stats.last3.length} run(s) totaled ${stats.last3Km} km at an average pace of ` +
    `${formatPace(stats.last3AvgPace)}` +
    (stats.hardCount >= 2
      ? `, with ${stats.hardCount} hard efforts — so I'm capping this at +${changePct}% instead of the usual +20% to avoid stacking load on load.`
      : `, holding steady. That supports a +${changePct}% bump without jumping past what you've shown you can handle.`);
  if (foodContext) reasoning += ` ${foodContext}`;

  return {
    type: 'goal',
    text: tone.terse ? null : "Here's what I'd suggest for next week:",
    goal: {
      km: proposedKm,
      sessions: stats.last3.length || 3,
      confidence: stats.count >= 3 ? 0.9 : 0.65,
      changeLabel: `+${changePct}% from last week`,
      reasoning,
    },
  };
}

function buildWhyReply(stats, foodContext) {
  if (!stats) {
    return {
      type: 'text',
      text: "I don't have anything logged yet to reason from — that's really the honest answer here.",
      reasoning: null,
    };
  }
  return {
    type: 'text',
    text:
      `Fair question. Over your last ${stats.last3.length} logged run(s) you covered ${stats.last3Km} km ` +
      `at ${formatPace(stats.last3AvgPace)} average pace${stats.longest ? `, and your longest single run was ${stats.longest.km} km` : ''}. ` +
      `That's the actual signal I use — not a generic training-plan template.`,
    reasoning:
      `Source: ${stats.last3.length} of your ${stats.count} logged run(s), most recent first.` +
      (foodContext ? ` ${foodContext}` : ''),
  };
}

function buildEasierReply(stats, engagement) {
  const tone = toneOpener(engagement);
  const baseKm = stats ? stats.last3Km : 12;
  const km = Math.round(baseKm * 1.07 * 10) / 10;
  return {
    type: 'goal',
    text: tone.prefix + "Totally fine to ease into it — here's a gentler version:",
    goal: {
      km,
      sessions: stats?.last3.length || 3,
      confidence: stats ? 0.85 : 0.55,
      changeLabel: '+7% from last week',
      reasoning: stats
        ? `Based on your recent ${stats.last3Km} km, a +7% step is closer to a conservative, injury-averse progression than the +20% ceiling.`
        : "No logged runs yet, so this is a conservative starting estimate — log a run and I'll tighten it up.",
    },
  };
}

function buildOfflineReply(lastUserMessage, stats, engagement, foodContext) {
  const lower = lastUserMessage?.text?.trim().toLowerCase() || '';
  const tone = toneOpener(engagement);

  if (/\b(hello|hi|hey|good morning|good evening)\b/.test(lower)) {
    return { type: 'text', text: `${tone.prefix}Hey! What can I help you with today?`, reasoning: null };
  }
  if (/\b(thanks|thank you|appreciate it)\b/.test(lower)) {
    return { type: 'text', text: "You're welcome. I'm here whenever you want to talk training, recovery, goals, or fueling.", reasoning: null };
  }
  if (/what can you do|how can you help|who are you/.test(lower)) {
    return {
      type: 'text',
      text: 'I can answer running and wellness questions, review your logged runs, explain pacing and recovery, and help shape a realistic weekly goal.',
      reasoning: null,
    };
  }
  if (/\b(rest|recovery|sore|tired|fatigue)\b/.test(lower)) {
    return {
      type: 'text',
      text: 'Easy movement, sleep, hydration, and a lower training load are sensible recovery basics. If pain is sharp, worsening, or changes how you move, stop training and check with a medical professional.',
      reasoning: stats ? `You currently have ${stats.count} run(s) logged.` : null,
    };
  }
  if (/\b(pace|faster|speed)\b/.test(lower)) {
    return {
      type: 'text',
      text: stats
        ? `Your recent average is ${formatPace(stats.last3AvgPace)}. Build speed gradually: keep most running comfortable and make only one session per week intentionally faster.`
        : 'A good starting point is to keep most runs conversational and add speed gradually. Log a run and I can make the advice specific to your pace.',
      reasoning: stats ? `Based on your last ${stats.last3.length} logged run(s).` : null,
    };
  }
  if (/\b(goal|plan|week|distance|mileage|kilomet|kilometer)\b/.test(lower)) {
    return buildGoalReply(stats, engagement, foodContext);
  }
  if (/\b(food|meal|fuel|hydration|water)\b/.test(lower)) {
    return {
      type: 'text',
      text: 'For everyday training, aim for regular meals, enough fluids, and food you tolerate well around runs. I can use your meal logs as context, but I won\'t prescribe calorie targets.',
      reasoning: foodContext,
    };
  }

  return {
    type: 'text',
    text: "I want to make sure I answer the right question. Could you rephrase it with a little more detail? I can help with training, recovery, goals, fueling, and general wellness.",
    reasoning: null,
  };
}

/**
 * @param {Array<{sender:string, text:string}>} history - full conversation so far
 * @param {Array<object>} runs - logged runs (see storage.js addRun shape)
 * @param {object} engagement - engagement summary (see storage.js getEngagementSummary)
 * @param {Array<object>} foods - logged meals (see storage.js addFood shape)
 * @returns {Promise<{type:'text'|'goal'|'safety', text:string|null, goal?:object, reasoning?:string}>}
 */
export async function sendCoachMessage(
  history,
  runs = [],
  engagement = null,
  foods = [],
  unitSystem = 'imperial',
  workouts = [],
) {
  const lastUserMessage = [...history].reverse().find((m) => m.sender === 'user');

  if (lastUserMessage?.text && detectSymptoms(lastUserMessage.text)) {
    return { type: 'safety', text: SAFETY_RESPONSE_TEXT };
  }

  const stats = buildRunStats(runs);
  const foodContext = buildFoodContext(foods, runs);
  const workoutContext = buildWorkoutContext(workouts);
  let contextData = '';
  contextData += `\nPreferred display units: ${unitSystem === 'metric' ? 'metric (km, kg, cm)' : 'imperial (miles, lb, ft/in)'}. Use these units in the response.\n`;
  if (stats) {
    contextData += `\nUser's recent running data:\n`;
    contextData += `- Last ${stats.last3.length} runs: ${stats.last3Km} km total at ${formatPace(stats.last3AvgPace)} avg pace\n`;
    contextData += `- Total runs logged: ${stats.count}\n`;
    if (stats.longest) {
      contextData += `- Longest run: ${stats.longest.km} km\n`;
    }
    contextData += `- Hard efforts in last 3 runs: ${stats.hardCount}\n`;
  }
  if (foodContext) {
    contextData += `\n${foodContext}\n`;
  }
  if (workoutContext) {
    contextData += `\n${workoutContext}\n`;
  }
  if (engagement) {
    contextData += `\nEngagement status: ${engagement.status} (streak: ${engagement.streakDays} days)\n`;
  }

  try {
    const text = await requestCoachReply({
      history: history
        .filter((msg) => msg.type === 'text' && typeof msg.text === 'string')
        .slice(-12)
        .map((msg) => ({ sender: msg.sender, text: msg.text })),
      context: contextData.trim(),
    });
    return {
      type: 'text',
      text,
      reasoning: stats ? `Based on ${stats.count} logged runs, last ${stats.last3.length} totaling ${stats.last3Km} km.` : null,
    };
  } catch (error) {
    console.warn('Coach API unavailable; using local response.', error?.message);
    const lower = lastUserMessage?.text.toLowerCase() ?? '';
    if (['bump', 'increase', 'longer', 'more', 'yes'].some((k) => lower.includes(k))) {
      return buildGoalReply(stats, engagement, foodContext);
    }
    if (['why', 'reason'].some((k) => lower.includes(k))) return buildWhyReply(stats, foodContext);
    if (['easier', 'less', 'lower', 'too much'].some((k) => lower.includes(k))) {
      return buildEasierReply(stats, engagement);
    }
    return buildOfflineReply(lastUserMessage, stats, engagement, foodContext);
  }
}
