// Weight trend hero card: latest weigh-in, change, actual vs. meal-projection line.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { BorderRadius, Colors } from '../../theme';
import GlassCard from '../GlassCard';

const toTime = (date) => new Date(`${date}T12:00:00`).getTime();
const shortDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function WeightTrendGraph({ points, expectedPoints, goalWeight, formatWeight }) {
  if (points.length < 2) {
    return <View style={styles.graphEmpty}><Text style={styles.emptyText}>Add more data to see your weight trend.</Text></View>;
  }
  const start = toTime(points[0].date);
  const duration = Math.max(toTime(points[points.length - 1].date) - start, 86400000);
  const values = [...points.map((p) => p.weightKg), ...expectedPoints, ...(goalWeight ? [goalWeight] : [])];
  const min = Math.min(...values) - 0.4;
  const max = Math.max(...values) + 0.4;
  const range = Math.max(0.5, max - min);
  const y = (v) => 5 + (1 - (v - min) / range) * 66;
  const x = (date) => 9 + ((toTime(date) - start) / duration) * 87;
  const actual = points.map((p) => `${x(p.date)},${y(p.weightKg)}`).join(' ');
  const expected = points.map((p, i) => `${x(p.date)},${y(expectedPoints[i])}`).join(' ');

  return (
    <View style={styles.graph}>
      <View style={styles.yAxis}>
        <Text style={styles.axisLabel}>{formatWeight(max)}</Text>
        <Text style={styles.axisLabel}>{formatWeight(min)}</Text>
      </View>
      <View style={styles.graphArea}>
        <Svg width="100%" height="100%" viewBox="0 0 100 76" preserveAspectRatio="none">
          <Line x1="9" y1="5" x2="9" y2="71" stroke={Colors.glassBorder} strokeWidth="0.6" />
          <Line x1="9" y1="71" x2="96" y2="71" stroke={Colors.glassBorder} strokeWidth="0.6" />
          <Line x1="9" y1="38" x2="96" y2="38" stroke={Colors.glassBorder} strokeWidth="0.45" strokeDasharray="2 2" />
          {goalWeight ? <Line x1="9" y1={y(goalWeight)} x2="96" y2={y(goalWeight)} stroke={Colors.textLight} strokeWidth="1.2" strokeDasharray="3 2" /> : null}
          <Polyline points={expected} fill="none" stroke={Colors.success} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points={actual} fill="none" stroke={Colors.primary} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p) => <Circle key={p.id || p.date} cx={x(p.date)} cy={y(p.weightKg)} r="2.3" fill={Colors.primary} stroke={Colors.cardBackground} strokeWidth="0.8" />)}
        </Svg>
        <View style={styles.xAxis}>
          <Text style={styles.axisLabel}>{shortDate(points[0].date)}</Text>
          <Text style={styles.axisLabel}>{shortDate(points[points.length - 1].date)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function WeightTrendCard({ summary, formatWeight, onLog }) {
  const { latest, change, weightPoints, expectedPoints, goalWeight } = summary;
  const changeText = `${change >= 0 ? '+' : '−'}${formatWeight(Math.abs(change))}`;
  return (
    <GlassCard style={styles.card}>
      <View style={styles.top}>
        <View>
          <Text style={styles.label}>WEIGHT TREND</Text>
          <Text style={styles.weight}>{latest ? formatWeight(latest.weightKg) : 'Add a weigh-in'}</Text>
          <Text style={styles.muted}>{latest ? `${changeText} over recent entries` : 'Start building your trend today'}</Text>
        </View>
        <TouchableOpacity onPress={onLog} style={styles.addButton} accessibilityRole="button" accessibilityLabel="Log your weight">
          <Ionicons name="add" size={19} color="#fff" />
          <Text style={styles.addText}>Log</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chart}>
        <WeightTrendGraph points={weightPoints} expectedPoints={expectedPoints} goalWeight={goalWeight} formatWeight={formatWeight} />
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: Colors.primary }]} /><Text style={styles.legendText}>Actual</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: Colors.success }]} /><Text style={styles.legendText}>Meal projection</Text></View>
        {goalWeight ? <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: Colors.textLight }]} /><Text style={styles.legendText}>Goal weight</Text></View> : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 284 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, color: Colors.textSecondary, letterSpacing: 0.9, fontWeight: '700' },
  weight: { color: Colors.text, fontSize: 28, fontWeight: '700', marginTop: 5 },
  muted: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  addButton: { alignSelf: 'flex-start', backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: 13, height: 35, alignItems: 'center', flexDirection: 'row', gap: 3, justifyContent: 'center' },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chart: { height: 114, marginTop: 12 },
  graph: { flexDirection: 'row', height: 106 },
  graphEmpty: { height: 106, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
  yAxis: { width: 44, justifyContent: 'space-between', paddingBottom: 20 },
  graphArea: { flex: 1, height: 92 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  axisLabel: { color: Colors.textLight, fontSize: 9 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: Colors.glassBorder, paddingTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendLine: { width: 17, height: 2, borderRadius: 2 },
  legendText: { color: Colors.textSecondary, fontSize: 11 },
});
