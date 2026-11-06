import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import GlassCard from './GlassCard';

const SIZE = 96;
const CENTER = SIZE / 2;
const RADIUS = 42;

function pointAt(angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(radians),
    y: CENTER + RADIUS * Math.sin(radians),
  };
}

function sectorPath(progress) {
  const start = pointAt(0);
  const end = pointAt(progress * 360);
  const largeArc = progress > 0.5 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function ProgressCircle({ value, target, unit, color }) {
  const safeTarget = Math.max(1, Number(target) || 1);
  const progress = Math.max(0, Math.min(1, (Number(value) || 0) / safeTarget));
  const percent = Math.round(((Number(value) || 0) / safeTarget) * 100);

  return (
    <View style={styles.progressCircle} accessibilityLabel={`${percent}% of ${unit} target logged`}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={Colors.backgroundSecondary} />
        {progress >= 1 ? (
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={color} />
        ) : progress > 0 ? (
          <Path d={sectorPath(progress)} fill={color} />
        ) : null}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={Colors.border} strokeWidth={2} />
      </Svg>
      <View pointerEvents="none" style={styles.circleLabel}>
        <Text style={styles.percent}>{percent}%</Text>
      </View>
    </View>
  );
}

export default function IntakeProgress({ calories, protein, fat, carbs, calorieTarget, proteinTarget, fatTarget, carbsTarget }) {
  const items = [
    { label: 'Calories', value: Math.round(calories), target: Math.round(calorieTarget), unit: 'kcal', color: '#E4A13A' },
    { label: 'Protein', value: Math.round(protein), target: Math.round(proteinTarget), unit: 'g', color: Colors.primary },
    { label: 'Fat', value: Math.round(fat), target: Math.round(fatTarget), unit: 'g', color: '#B26A8B' },
    { label: 'Carbs', value: Math.round(carbs), target: Math.round(carbsTarget), unit: 'g', color: '#6C8CC7' },
  ];

  return (
    <GlassCard contentStyle={styles.card}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <ProgressCircle value={item.value} target={item.target} unit={item.unit} color={item.color} />
          <Text style={styles.name}>{item.label}</Text>
          <Text style={styles.amount}>{item.value} / {item.target} {item.unit}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  item: { width: '50%', alignItems: 'center', marginBottom: Spacing.lg },
  progressCircle: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  circleLabel: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  percent: { color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  name: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, marginTop: Spacing.sm },
  amount: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: Spacing.xs },
});
