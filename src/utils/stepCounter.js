// src/utils/stepCounter.js
//
// One place for reading today's steps, so Home, Progress and Goals agree.
//
// iOS:     the system pedometer keeps history, so we ask it for "steps since
//          midnight" directly.
// Android: expo-sensors can't read step history on Android — it only reports
//          live steps while the app is listening. Previously that meant
//          Progress/Goals always showed 0 and the Home card restarted from 0
//          on every visit. Now live steps are added to a per-day running
//          total saved on the device, so nothing is lost between visits.
//          (Full all-day Android steps need Health Connect — see README.)

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';

const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const storageKey = (day) => `onehealth:androidSteps:${day}`;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

/** 'device' = full-day history, 'while-open' = counted while the app is open, 'none' = no pedometer. */
export const STEP_SOURCE = Platform.OS === 'ios' ? 'device' : Platform.OS === 'android' ? 'while-open' : 'none';

/**
 * Returns 'granted' | 'denied' | 'unavailable'.
 * Pass { ask: true } to show the OS permission prompt if allowed.
 */
export async function getStepAccess({ ask = false } = {}) {
  try {
    if (STEP_SOURCE === 'none' || !(await Pedometer.isAvailableAsync())) return 'unavailable';
    let permission = await Pedometer.getPermissionsAsync();
    if (!permission.granted && ask && permission.canAskAgain) permission = await Pedometer.requestPermissionsAsync();
    return permission.granted ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

async function readAndroidTotal(day = todayKey()) {
  const raw = await AsyncStorage.getItem(storageKey(day));
  return Number(raw) || 0;
}

/** Today's step count, or 0 if steps aren't available. Never throws. */
export async function getTodaySteps() {
  try {
    if ((await getStepAccess()) !== 'granted') return 0;
    if (Platform.OS === 'ios') {
      const result = await Pedometer.getStepCountAsync(startOfToday(), new Date());
      return Number(result?.steps) || 0;
    }
    return await readAndroidTotal();
  } catch {
    return 0;
  }
}

/**
 * Calls onChange(totalStepsToday) as the user walks. Returns a function that
 * stops watching. On Android the running total is saved as it grows.
 */
export async function watchTodaySteps(onChange) {
  let day = todayKey();
  let base = await getTodaySteps();
  let offset = 0; // live steps reported before a midnight rollover
  let lastSaved = base;
  let latest = base;
  onChange(base);

  const subscription = Pedometer.watchStepCount((result) => {
    const live = Number(result?.steps) || 0;
    const nowDay = todayKey();
    if (nowDay !== day) {
      // Midnight passed while the app was open: start a fresh day.
      day = nowDay;
      base = 0;
      offset = live;
      lastSaved = 0;
    }
    const total = base + Math.max(0, live - offset);
    latest = total;
    onChange(total);
    if (Platform.OS === 'android' && total - lastSaved >= 5) {
      lastSaved = total;
      AsyncStorage.setItem(storageKey(day), String(total)).catch(() => {});
    }
  });

  return () => {
    subscription?.remove();
    if (Platform.OS === 'android' && latest > lastSaved) {
      AsyncStorage.setItem(storageKey(day), String(latest)).catch(() => {});
    }
  };
}
