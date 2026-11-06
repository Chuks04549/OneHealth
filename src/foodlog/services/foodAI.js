// Photo analysis always goes through our backend so the OpenAI key is never
// shipped in the mobile bundle.
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
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    addUrl(`http://${window.location.hostname}:3000`);
  }

  [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    NativeModules.SourceCode?.scriptURL,
  ].forEach((uri) => {
    const host = hostFromUri(uri);
    if (host) addUrl(`http://${host}:3000`);
  });

  if (Platform.OS === 'android') addUrl('http://10.0.2.2:3000');
  addUrl('http://localhost:3000');
  return candidates;
}

const API_BASE_URLS = resolveApiBaseUrls();
const REQUEST_TIMEOUT_MS = 90_000;

function readableError(payload, status) {
  if (payload?.error) return payload.error;
  return `Meal analysis failed (${status})`;
}

/**
 * Analyze a meal image and return a structured whole-serving nutrition estimate.
 * @param {string} base64Image base64 bytes without a data URL prefix
 * @param {string} mimeType image/jpeg, image/png, image/webp, or image/gif
 */
export async function analyzeMealPhoto(base64Image, mimeType = 'image/jpeg') {
  if (typeof base64Image !== 'string' || base64Image.length < 100) {
    throw new Error('The selected photo could not be read. Please choose it again.');
  }
  if (base64Image.length > 10_500_000) {
    throw new Error('This photo is too large to upload reliably. Retake it or choose a smaller image.');
  }

  let lastError;
  for (const apiBaseUrl of API_BASE_URLS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${apiBaseUrl}/api/analyze-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ image: base64Image, mimeType }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(readableError(payload, response.status));
        error.serverReached = true;
        error.reason = payload.reason;
        throw error;
      }
      if (!payload.portion || !payload.macros || typeof payload.calories !== 'number') {
        const error = new Error('The server returned an incomplete nutrition estimate.');
        error.serverReached = true;
        throw error;
      }
      return payload;
    } catch (error) {
      lastError = error?.name === 'AbortError'
        ? new Error('Meal analysis timed out. Please try again with a clear, well-lit photo.')
        : error;
      if (error?.serverReached) throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error('The meal analyzer is unavailable.');
}

export async function analyzeMealText(description) {
  if (typeof description !== 'string' || description.trim().length < 2) {
    throw new Error('Enter a food or meal to analyze.');
  }

  let lastError;
  for (const apiBaseUrl of API_BASE_URLS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${apiBaseUrl}/api/analyze-food-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ description: description.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(readableError(payload, response.status));
        error.serverReached = true;
        throw error;
      }
      if (!payload.macros || typeof payload.calories !== 'number') {
        const error = new Error('The server returned an incomplete nutrition estimate.');
        error.serverReached = true;
        throw error;
      }
      return payload;
    } catch (error) {
      lastError = error?.name === 'AbortError' ? new Error('Nutrition lookup timed out. Please try again.') : error;
      if (error?.serverReached) throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error('The nutrition analyzer is unavailable.');
}

/** Scale the base estimate locally so portion adjustments remain instant. */
export function scaleMeal(meal, multiplier) {
  const round = (value, digits = 1) => {
    const factor = 10 ** digits;
    return Math.round((Number(value) || 0) * multiplier * factor) / factor;
  };
  const macros = meal.macros || {};
  return {
    ...meal,
    calories: Math.round((Number(meal.calories) || 0) * multiplier),
    macros: Object.fromEntries(
      ['protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g'].map((key) => [key, round(macros[key])]),
    ),
    items: (meal.items || []).map((item) => ({
      ...item,
      estimatedGrams: Math.round((Number(item.estimatedGrams) || 0) * multiplier),
      calories: Math.round((Number(item.calories) || 0) * multiplier),
      protein_g: round(item.protein_g),
      carbs_g: round(item.carbs_g),
      fat_g: round(item.fat_g),
    })),
    micros: (meal.micros || []).map((micro) => ({
      ...micro,
      amount: round(micro.amount),
      dailyPct: Math.round((Number(micro.dailyPct) || 0) * multiplier),
    })),
    portion: {
      ...meal.portion,
      amount: Math.round((Number(meal.portion?.amount || 1) * multiplier) * 10) / 10,
      grams: Math.round((Number(meal.portion?.baseGrams) || 0) * multiplier),
    },
  };
}
