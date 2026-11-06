// Calorie guidance: compares what the user eats per day with their target,
// and suggests an updated target when their real activity level differs.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import GlassCard from '../GlassCard';

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString();

export default function CalorieGuidance({ summary }) {
  const { loggedFoodDays, calorieDiff, savedTarget, suggestedTarget, maintenance, activity } = summary;
  const sessions = Math.round(activity.sessionsPerWeek * 10) / 10;

  const intakeLine = loggedFoodDays
    ? `You’re averaging ${fmt(Math.abs(calorieDiff))} kcal ${calorieDiff > 0 ? 'above' : 'below'} your ${fmt(savedTarget)} kcal daily target (over ${loggedFoodDays} logged day${loggedFoodDays === 1 ? '' : 's'}).`
    : `Your target is ${fmt(savedTarget)} kcal/day. Log meals to personalize the comparison.`;

  const activityLine = `With about ${sessions} workout${sessions === 1 ? '' : 's'} a week you’re ${activity.label}, so you burn roughly ${fmt(maintenance)} kcal/day.`;
  const suggestLine = Math.abs(suggestedTarget - savedTarget) >= 100
    ? ` For your goal, about ${fmt(suggestedTarget)} kcal/day fits better — you can update it in Settings.`
    : '';

  return (
    <GlassCard contentStyle={styles.row}>
      <View style={styles.icon}><Ionicons name="sparkles" size={19} color={Colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Your calorie guidance</Text>
        <Text style={styles.text}>{intakeLine}</Text>
        <Text style={[styles.text, { marginTop: 6 }]}>{activityLine}{suggestLine}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  title: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  text: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
});
