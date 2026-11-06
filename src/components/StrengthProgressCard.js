// src/components/StrengthProgressCard.js
//
// Gym strength over time: pick an exercise, see the best set each week
// (as an estimated 1-rep max), coloured green when you got stronger and red
// when you slipped.

import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BorderRadius, Colors, Spacing } from '../theme';
import GlassCard from './GlassCard';
import TrendLineChart, { STATUS_COLORS, StatusBanner, StatusLegend, shortDate } from './TrendLineChart';
import { cardStyles } from './WeeklyProgressCard';
import { collectLiftHistory, computeStrengthProgress, formatLiftSet } from '../utils/strengthProgress';

const KG_PER_LB = 0.45359237;

function describeStrength(exercise, progress, unitSystem) {
  const unit = exercise.mode === 'reps' ? 'reps' : unitSystem === 'metric' ? 'kg' : 'lb';
  const toDisplay = (v) => (exercise.mode === 'reps' || unitSystem === 'metric' ? v : v / KG_PER_LB);
  const latest = progress.latest;
  if (!latest) {
    return { status: 'insufficient', title: 'Keep logging this lift', body: `Log ${exercise.name} in another week to see whether you’re getting stronger.` };
  }
  const amount = `${Math.abs(toDisplay(latest.delta)).toFixed(exercise.mode === 'reps' ? 0 : 1)} ${unit}`;
  const since = latest.weeksApart > 1 ? `vs. ${latest.weeksApart} weeks ago` : 'vs. last week';
  const what = exercise.mode === 'reps' ? 'best set' : 'estimated max';
  if (latest.status === 'improved') {
    const streak = progress.improvedStreak >= 2 ? ` ${progress.improvedStreak} weeks in a row!` : '';
    return { status: 'improved', title: 'Getting stronger! 💪', body: `${exercise.name} ${what} up ${amount} ${since}.${streak}` };
  }
  if (latest.status === 'regressed') {
    return { status: 'regressed', title: 'A dip this week', body: `${exercise.name} ${what} down ${amount} ${since}. Sleep, food and rest days all matter — an off week is normal.` };
  }
  return { status: 'steady', title: 'Holding steady', body: `${exercise.name} is about the same ${since}. Try adding a rep or a little weight next session.` };
}

export default function StrengthProgressCard({ workouts, unitSystem }) {
  const navigation = useNavigation();
  const exercises = useMemo(() => collectLiftHistory(workouts), [workouts]);
  const [selectedKey, setSelectedKey] = useState(null);
  useEffect(() => {
    if (!exercises.find((e) => e.key === selectedKey)) setSelectedKey(exercises[0]?.key || null);
  }, [exercises, selectedKey]);

  const exercise = exercises.find((e) => e.key === selectedKey) || exercises[0];
  const progress = useMemo(() => computeStrengthProgress(exercise), [exercise]);

  if (!exercise) {
    return (
      <GlassCard>
        <Text style={cardStyles.label}>STRENGTH PROGRESS</Text>
        <Text style={cardStyles.heading}>Track your lifts</Text>
        <Text style={styles.emptyBody}>Add the exercises, weight and reps when you log a workout, and we’ll chart whether you’re getting stronger each week.</Text>
        <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate('WorkoutLog')} accessibilityRole="button">
          <Ionicons name="barbell-outline" size={17} color="#fff" />
          <Text style={styles.ctaText}>Log a workout</Text>
        </TouchableOpacity>
      </GlassCard>
    );
  }

  const metricWeights = unitSystem === 'metric';
  const toDisplay = (v) => (exercise.mode === 'reps' || metricWeights ? v : v / KG_PER_LB);
  const points = progress.weeks.map((w) => ({ key: w.weekKey, value: toDisplay(w.value), label: shortDate(w.weekKey) }));
  const unit = exercise.mode === 'reps' ? 'reps' : metricWeights ? 'kg' : 'lb';

  return (
    <GlassCard>
      <View style={cardStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.label}>STRENGTH PROGRESS</Text>
          <Text style={cardStyles.heading}>{exercise.name}</Text>
        </View>
        {progress.best ? (
          <View style={cardStyles.goalPill}>
            <Ionicons name="trophy-outline" size={12} color={Colors.primary} />
            <Text style={cardStyles.goalPillText}>Best {formatLiftSet(progress.best.best, unitSystem)}</Text>
          </View>
        ) : null}
      </View>

      {exercises.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picker}>
          {exercises.slice(0, 8).map((e) => {
            const active = e.key === exercise.key;
            return (
              <TouchableOpacity key={e.key} onPress={() => setSelectedKey(e.key)} style={[styles.pick, active && styles.pickActive]} accessibilityState={{ selected: active }}>
                <Text style={[styles.pickText, active && styles.pickTextActive]}>{e.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <StatusBanner {...describeStrength(exercise, progress, unitSystem)} />
      <View style={{ marginTop: Spacing.md }}>
        <TrendLineChart
          points={points}
          segments={progress.segments}
          unit={unit}
          minSpread={exercise.mode === 'reps' ? 2 : metricWeights ? 2.5 : 5}
          emptyText="One week logged so far. Log this lift again next week to see your trend."
        />
      </View>
      {progress.segments.length ? (
        <View style={cardStyles.chips}>
          {progress.segments.slice(-4).map((seg) => (
            <View key={seg.to.weekKey} style={cardStyles.chip}>
              <Text style={cardStyles.chipWeek}>{shortDate(seg.to.weekKey)}</Text>
              <Text style={[cardStyles.chipValue, { color: STATUS_COLORS[seg.status] }]}>{formatLiftSet(seg.to.best, unitSystem)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <StatusLegend />
      <Text style={cardStyles.footnote}>
        {exercise.mode === 'reps' ? 'Each point is your best set of the week.' : 'Each point is your best set of the week, as an estimated 1-rep max.'}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  emptyBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 6 },
  cta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: 14, height: 36, marginTop: Spacing.md },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  picker: { gap: 6, paddingTop: Spacing.md },
  pick: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.controlFill },
  pickActive: { backgroundColor: Colors.primary },
  pickText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  pickTextActive: { color: '#fff' },
});
