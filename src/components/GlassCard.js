import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme';
import { useAppAppearance } from '../contexts/AppearanceContext';

export default function GlassCard({ children, style, contentStyle, intensity = 34, floating = false, noPadding = false }) {
  const { colorScheme } = useAppAppearance();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.card, floating ? Shadows.floating : Shadows.card, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
        experimentalBlurMethod="dimezisBlurView"
        style={[styles.blur, !noPadding && styles.padding, contentStyle]}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassCardBorder,
  },
  blur: {
    overflow: 'hidden',
  },
  padding: {
    padding: Spacing.lg,
  },
});
