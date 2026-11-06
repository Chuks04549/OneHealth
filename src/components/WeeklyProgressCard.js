// src/components/WeeklyProgressCard.js
//
// Week-by-week body-weight chart graded against the user's body goal
// (lose / gain / maintain), with a banner saying how the latest week went.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing } from '../theme';
import GlassCard from './GlassCard';
import TrendLineChart, { STATUS_COLORS, StatusBanner, StatusLegend, shortDate } from './TrendLineChart';
import { describeWeeklyProgress, formatChange } from '../utils/weeklyProgress';

const KG_PER_LB = 0.45359237;
const GOAL_LABEL = { lose: 'Lose weight', gain: 'Gain muscle', maintain: 'Maintain weight' };

function WeekChips({ segments, unitSystem }) {
  const recent = segments.slice(-4);
  if (!recent.length) return null;
  return (
    <View style={styles.chips}>
      {recent.map((seg) => {
        const sign = seg.deltaKg > 0 ? '+' : seg.deltaKg < 0 ? '−' : '±';
        return (
          <View key={seg.to.weekKey} style={styles.chip}>
            <Text style={styles.chipWeek}>{shortDate(seg.to.weekKey)}</Text>
            <Text style={[styles.chipValue, { color: STATUS_COLORS[seg.status] }]}>{sign}{formatChange(seg.deltaKg, unitSystem)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function WeeklyProgressCard({ progress, unitSystem }) {
  const metric = unitSystem === 'metric';
  const summary = describeWeeklyProgress(progress, unitSystem);
  const icon = summary.status === 'improved' && progress.goal === 'lose' ? 'trending-down' : undefined;
  const points = progress.weeks.map((w) => ({ key: w.weekKey, value: metric ? w.avgKg : w.avgKg / KG_PER_LB, label: shortDate(w.weekKey) }));

  return (
    <GlassCard>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>WEEKLY PROGRESS</Text>
          <Text style={styles.heading}>{progress.latestIsCurrentWeek ? 'This week so far' : 'Week by week'}</Text>
        </View>
        <View style={styles.goalPill}>
          <Ionicons name="flag-outline" size={12} color={Colors.primary} />
          <Text style={styles.goalPillText}>{GOAL_LABEL[progress.goal]}</Text>
        </View>
      </View>

      <StatusBanner {...summary} icon={icon} />
      <View style={{ marginTop: Spacing.md }}>
        <TrendLineChart
          points={points}
          segments={progress.segments}
          unit={metric ? 'kg' : 'lb'}
          minSpread={metric ? 0.5 : 1}
          emptyText={progress.weeks.length === 1 ? 'One week logged. Weigh in again next week to see your first comparison.' : 'No weigh-ins yet. Tap “Log” above to start.'}
        />
      </View>
      <WeekChips segments={progress.segments} unitSystem={unitSystem} />
      <StatusLegend showSteady={progress.goal !== 'maintain'} />
      <Text style={styles.footnote}>Each point is that week’s average weigh-in.</Text>
    </GlassCard>
  );
}

export const cardStyles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  label: { fontSize: 11, color: Colors.textSecondary, letterSpacing: 0.9, fontWeight: '700' },
  heading: { color: Colors.text, fontSize: 20, fontWeight: '700', marginTop: 4 },
  goalPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 5 },
  goalPillText: { color: Colors.primary, fontSize: 11, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 6, marginTop: 6 },
  chip: { flex: 1, alignItems: 'center', backgroundColor: Colors.controlFill, borderRadius: 12, paddingVertical: 7 },
  chipWeek: { color: Colors.textLight, fontSize: 10, fontWeight: '600' },
  chipValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  footnote: { color: Colors.textLight, fontSize: 10, marginTop: 6 },
});
const styles = cardStyles;
