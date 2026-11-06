// "Last 30 days" calorie + step cards, each with a 7-day sparkline.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Polyline } from 'react-native-svg';
import { Colors, Spacing } from '../../theme';
import GlassCard from '../GlassCard';
import { STEP_SOURCE } from '../../utils/stepCounter';

function Sparkline({ values, color, height = 35 }) {
  if (values.length < 2) return <View style={{ height }} />;
  const min = Math.min(...values);
  const range = Math.max(Math.max(...values) - min, 0.1);
  const points = values.map((v, i) => `${4 + (i / (values.length - 1)) * 92},${4 + (1 - (v - min) / range) * 36}`).join(' ');
  return (
    <View style={{ height }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 44" preserveAspectRatio="none">
        <Line x1="0" y1="40" x2="100" y2="40" stroke={Colors.glassBorder} strokeWidth="0.5" />
        <Polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function MetricCard({ icon, iconBg, iconColor, value, label, values, color, footer, footerColor }) {
  return (
    <GlassCard style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}><Ionicons name={icon} size={19} color={iconColor} /></View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      <Sparkline values={values} color={color} />
      <Text style={[styles.footer, { color: footerColor }]}>{footer}</Text>
    </GlassCard>
  );
}

export default function MetricCards({ summary, stepGoal, todaySteps }) {
  const { calorieAverage, loggedFoodDays, calorieDiff, caloriesByDay, stepAverage, stepsByDay } = summary;
  const goal = Number(stepGoal) || 8000;
  const steps = stepAverage || todaySteps;
  const stepFooter = STEP_SOURCE === 'none'
    ? 'Steps need the phone app'
    : `${Math.round((steps / goal) * 100)}% of ${goal.toLocaleString()}`;
  return (
    <View style={styles.row}>
      <MetricCard
        icon="flame-outline" iconBg={Colors.foodSoft} iconColor={Colors.foodDark}
        value={Math.round(calorieAverage || 0).toLocaleString()}
        label="avg. calories/day"
        values={caloriesByDay} color={Colors.food}
        footer={loggedFoodDays ? `${calorieDiff > 0 ? '+' : ''}${calorieDiff} vs target` : 'Log meals to compare'}
        footerColor={calorieDiff > 0 ? Colors.warning : Colors.success}
      />
      <MetricCard
        icon="footsteps-outline" iconBg={Colors.runSoft} iconColor={Colors.runDark}
        value={Math.round(steps || 0).toLocaleString()}
        label="avg. steps/day"
        values={stepsByDay} color={Colors.run}
        footer={stepFooter}
        footerColor={stepAverage >= goal ? Colors.success : Colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  card: { flex: 1, minHeight: 190 },
  iconCircle: { height: 34, width: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  value: { color: Colors.text, fontSize: 22, fontWeight: '700', marginTop: 12 },
  label: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  footer: { fontSize: 11, fontWeight: '600', marginTop: 8 },
});
