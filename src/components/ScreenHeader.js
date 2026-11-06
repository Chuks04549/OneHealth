import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import LiquidGlassIconButton from './LiquidGlassIconButton';

export default function ScreenHeader({ title, brandLabel, actions = [], style }) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.titleGroup}>
        {brandLabel ? <Text style={styles.brandLabel}>{brandLabel}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <LiquidGlassIconButton
              key={action.icon + action.accessibilityLabel}
              icon={action.icon}
              onPress={action.onPress}
              accessibilityLabel={action.accessibilityLabel}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  titleGroup: { flex: 1, paddingRight: Spacing.md },
  brandLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
