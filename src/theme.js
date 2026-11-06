import { DynamicColorIOS, Platform, PlatformColor, StyleSheet } from 'react-native';

const adaptive = (light, dark, androidColor) => {
  if (Platform.OS === 'ios') {
    return DynamicColorIOS({ light, dark, highContrastLight: light, highContrastDark: dark });
  }
  if (Platform.OS === 'android' && androidColor) return PlatformColor(androidColor);
  return light;
};
const appFontFamily = 'Ubuntu_400Regular';

const ubuntuFamilyForStyle = (style = {}) => {
  const numericWeight = style.fontWeight === 'bold' ? 700 : Number(style.fontWeight) || 400;
  const italic = style.fontStyle === 'italic';
  if (italic && numericWeight >= 600) return 'Ubuntu_700Bold_Italic';
  if (italic && numericWeight >= 500) return 'Ubuntu_500Medium_Italic';
  if (italic) return 'Ubuntu_400Regular_Italic';
  if (numericWeight >= 600) return 'Ubuntu_700Bold';
  if (numericWeight >= 500) return 'Ubuntu_500Medium';
  return appFontFamily;
};

// Apply the matching loaded Ubuntu face to all text-like styles, including
// components that don't explicitly reference the shared Typography object.
if (!StyleSheet.__oneHealthFontPatched) {
  const createStyleSheet = StyleSheet.create.bind(StyleSheet);
  const textStyleKeys = ['color', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform', 'textDecorationLine'];
  StyleSheet.create = (styles) => createStyleSheet(Object.fromEntries(
    Object.entries(styles).map(([key, value]) => {
      const looksLikeText = value && textStyleKeys.some((styleKey) => value[styleKey] !== undefined);
      return [key, looksLikeText ? { ...value, fontFamily: value.fontFamily || ubuntuFamilyForStyle(value) } : value];
    }),
  ));
  StyleSheet.__oneHealthFontPatched = true;
}

export const Colors = {
  primary: adaptive('#287C79', '#58BDB7', '?android:attr/colorAccent'),
  primaryLight: adaptive('#DDF2F0', '#163634', '?android:attr/colorControlHighlight'),
  primaryDark: adaptive('#185C59', '#91D8D3', '?android:attr/colorAccent'),
  primaryBorder: adaptive('#B9DEDB', '#285D59', '?android:attr/colorAccent'),
  background: adaptive('#F2F6F8', '#111416', '?android:attr/colorBackground'),
  backgroundSecondary: adaptive('rgba(226, 235, 238, 0.74)', 'rgba(40, 46, 48, 0.78)', '?android:attr/colorBackgroundFloating'),
  cardBackground: adaptive('rgba(255, 255, 255, 0.78)', 'rgba(31, 36, 38, 0.82)', '?android:attr/colorBackgroundFloating'),
  elevatedSurface: adaptive('rgba(255, 255, 255, 0.94)', 'rgba(36, 41, 43, 0.94)', '?android:attr/colorBackgroundFloating'),
  controlFill: adaptive('rgba(118, 118, 128, 0.10)', 'rgba(118, 118, 128, 0.22)'),
  glassFill: adaptive('rgba(255, 255, 255, 0.64)', 'rgba(45, 51, 53, 0.64)'),
  glassBorder: adaptive('rgba(255, 255, 255, 0.82)', 'rgba(255, 255, 255, 0.16)'),
  glassCardBorder: adaptive('rgba(15, 23, 28, 0.10)', 'rgba(255, 255, 255, 0.14)'),
  tabBarBackground: adaptive('rgba(255, 255, 255, 0.92)', 'rgba(29, 29, 29, 0.92)'),
  text: adaptive('#152126', '#F3F5F4', '?android:attr/textColorPrimary'),
  textSecondary: adaptive('#59666D', '#B3BEBD', '?android:attr/textColorSecondary'),
  textLight: adaptive('#879096', '#859392', '?android:attr/textColorTertiary'),
  textWhite: '#FFFFFF',
  difficultyEasy: adaptive('#E3F2FD', '#172B38'),
  difficultyEasyText: adaptive('#1976D2', '#79B9F2'),
  difficultyModerate: adaptive('#FFF3E0', '#332819'),
  difficultyModerateText: adaptive('#F57C00', '#FFB45F'),
  difficultyHard: adaptive('#FFEBEE', '#351D21'),
  difficultyHardText: adaptive('#D32F2F', '#FF8A96'),
  border: adaptive('#E8E4DD', '#363636', '?android:attr/colorControlNormal'),
  divider: adaptive('#EEEAE4', '#2D2D2D', '?android:attr/colorControlNormal'),
  shadow: adaptive('rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.45)'),
  success: '#4CAF50',
  successSoft: adaptive('#DCF3EA', '#173329'),
  error: '#F44336',
  dangerSoft: adaptive('#FBDFE3', '#351D22'),
  warning: '#FF9800',
  warningSoft: adaptive('#FFF7E8', '#322619'),
  warningBorder: adaptive('#F0D9A8', '#664B27'),
  food: '#D98C1F',
  foodSoft: adaptive('#FBEAD0', '#342718'),
  foodDark: adaptive('#B06F14', '#F0AE50'),
  workout: adaptive('#287C79', '#58BDB7', '?android:attr/colorAccent'),
  workoutSoft: adaptive('#DDF2F0', '#163634', '?android:attr/colorControlHighlight'),
  workoutDark: adaptive('#185C59', '#91D8D3', '?android:attr/colorAccent'),
  workoutLog: adaptive('#9B4DCA', '#BF5AF2', '?android:attr/colorAccent'),
  workoutLogSoft: adaptive('#F3E7FA', '#321D3B', '?android:attr/colorControlHighlight'),
  workoutLogDark: adaptive('#74369A', '#D69AF7', '?android:attr/colorAccent'),
  run: adaptive('#2F6FED', '#6C9BFF', '?android:attr/colorAccent'),
  runSoft: adaptive('#E4ECFE', '#182640', '?android:attr/colorControlHighlight'),
  runDark: adaptive('#1F4FC4', '#A9C6FF', '?android:attr/colorAccent'),
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.11,
    shadowRadius: 10,
    elevation: 3,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const Typography = {
  fontFamily: appFontFamily,
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
