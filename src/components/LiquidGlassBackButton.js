import React from 'react';
import LiquidGlassIconButton from './LiquidGlassIconButton';

export default function LiquidGlassBackButton({
  onPress,
  size = 40,
  iconSize = 22,
  accessibilityLabel = 'Go back',
  disabled = false,
}) {
  return (
    <LiquidGlassIconButton
      icon="arrow-left"
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      size={size}
      iconSize={iconSize}
    />
  );
}
