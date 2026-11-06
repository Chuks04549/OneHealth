// src/theme.js
//
// Coach components share the app's adaptive palette so every warm beige
// surface becomes a soft black surface in dark mode.

import { Colors, Typography } from '../theme';

const colorMap = {
  bg: 'background', surface: 'cardBackground', surfaceAlt: 'backgroundSecondary', surfaceSunk: 'divider', border: 'border',
  ink: 'text', inkMuted: 'textSecondary', inkFaint: 'textLight',
  primary: 'primary', primaryDark: 'primaryDark', primarySoft: 'primaryLight',
  accent: 'primary', accentSoft: 'primaryLight', accentDark: 'primaryDark',
  food: 'food', foodSoft: 'foodSoft', foodDark: 'foodDark',
  workout: 'workout', workoutSoft: 'workoutSoft', workoutDark: 'workoutDark',
  run: 'run', runSoft: 'runSoft', runDark: 'runDark',
  success: 'success', successSoft: 'successSoft', warning: 'warning', warningSoft: 'warningSoft',
  danger: 'error', dangerSoft: 'dangerSoft', white: 'textWhite',
};

export const colors = new Proxy({}, {
  get: (_, key) => Colors[colorMap[key]],
});

export const radius = {
  sm: 10,
  md: 18,
  lg: 28,
  pill: 999,
};

export const spacing = (n) => n * 4;

export const type = {
  title: { fontFamily: Typography.fontFamily, fontSize: 20, fontWeight: '700' },
  subtitle: { fontFamily: Typography.fontFamily, fontSize: 14, fontWeight: '500' },
  body: { fontFamily: Typography.fontFamily, fontSize: 15, fontWeight: '400' },
  label: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  small: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: '500' },
};
