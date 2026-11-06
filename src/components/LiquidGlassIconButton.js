import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../theme';
import { useAppAppearance } from '../contexts/AppearanceContext';

export default function LiquidGlassIconButton({
  icon,
  onPress,
  size = 44,
  iconSize = 21,
  color = Colors.text,
  accessibilityLabel,
  disabled = false,
}) {
  const { colorScheme } = useAppAppearance();
  const scale = useRef(new Animated.Value(1)).current;
  const isDark = colorScheme === 'dark';

  const animateTo = (value) => Animated.spring(scale, {
    toValue: value,
    stiffness: 420,
    damping: 26,
    mass: 0.55,
    useNativeDriver: true,
  }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.92)}
        onPressOut={() => animateTo(1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.shadow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: isDark ? 'rgba(255,255,255,0.17)' : 'rgba(255,255,255,0.86)',
          },
          disabled && styles.disabled,
        ]}
      >
        <BlurView
          pointerEvents="none"
          intensity={76}
          tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
          experimentalBlurMethod="dimezisBlurView"
          style={[styles.glass, { borderRadius: size / 2 }]}
        >
          <Feather name={icon} size={iconSize} color={color} />
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 6,
  },
  glass: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
});
