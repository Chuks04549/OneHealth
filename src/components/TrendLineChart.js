// src/components/TrendLineChart.js
//
// Small line chart where each segment is coloured by status:
// green = toward the goal, red = away from it, grey = little change.
// Used by the weekly weight card and the strength card.

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing } from '../theme';

export const STATUS_COLORS = {
  improved: Colors.success,
  regressed: Colors.error,
  steady: Colors.textLight,
};

const PAD = { top: 18, right: 14, bottom: 22, left: 44 };

export const shortDate = (isoDay) => new Date(`${isoDay}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/**
 * @param points   [{ key, value, label }] oldest → newest, already in display units
 * @param segments [{ status, weeksApart }] one fewer than points
 * @param unit     short unit shown above the y-axis
 * @param minSpread smallest y-range so flat data doesn't look dramatic
 * @param emptyText message when there are fewer than two points
 */
export default function TrendLineChart(props) {
  // Measure on a wrapper that is always mounted. (Measuring inside the chart
  // meant onLayout never re-fired when data arrived after the first render,
  // so the chart stayed blank.)
  const [width, setWidth] = useState(0);
  return (
    <View style={{ height: props.height || 150 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ChartBody {...props} width={width} />
    </View>
  );
}

function ChartBody({ points, segments, unit, minSpread = 1, emptyText, height = 150, width }) {
  if (points.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Ionicons name="stats-chart-outline" size={26} color={Colors.textLight} />
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, minSpread);
  const lo = (min + max) / 2 - spread / 2 - spread * 0.12;
  const hi = (min + max) / 2 + spread / 2 + spread * 0.12;

  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v) => PAD.top + (1 - (v - lo) / (hi - lo)) * innerH;

  const labelEvery = innerW / points.length < 44 ? 2 : 1;
  const showLabel = (i) => (points.length - 1 - i) % labelEvery === 0;
  const grid = [hi - (hi - lo) * 0.12, (hi + lo) / 2, lo + (hi - lo) * 0.12];
  const decimals = spread < 10 ? 1 : 0;

  return (
    <View style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {grid.map((v) => (
            <React.Fragment key={`g${v}`}>
              <Line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={Colors.glassBorder} strokeWidth={1} strokeDasharray="3 4" />
              <SvgText x={PAD.left - 6} y={y(v) + 3} fontSize={10} fill={Colors.textLight} textAnchor="end">{v.toFixed(decimals)}</SvgText>
            </React.Fragment>
          ))}
          <SvgText x={PAD.left - 6} y={PAD.top - 6} fontSize={10} fill={Colors.textLight} textAnchor="end">{unit}</SvgText>

          {segments.map((seg, i) => (
            <Line
              key={`s${points[i + 1].key}`}
              x1={x(i)} y1={y(values[i])} x2={x(i + 1)} y2={y(values[i + 1])}
              stroke={STATUS_COLORS[seg.status]}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeDasharray={seg.weeksApart > 1 ? '6 5' : undefined}
            />
          ))}

          {points.map((p, i) => {
            const color = i === 0 ? Colors.primary : STATUS_COLORS[segments[i - 1].status];
            const isLast = i === points.length - 1;
            return (
              <React.Fragment key={`p${p.key}`}>
                <Circle cx={x(i)} cy={y(p.value)} r={isLast ? 6 : 4.5} fill={color} stroke={Colors.cardBackground} strokeWidth={2} />
                {showLabel(i) ? (
                  <SvgText x={x(i)} y={height - 5} fontSize={10} fill={isLast ? Colors.text : Colors.textLight} fontWeight={isLast ? '700' : '400'} textAnchor="middle">{p.label}</SvgText>
                ) : null}
              </React.Fragment>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

export function StatusBanner({ status, title, body, icon }) {
  const look = {
    improved: { bg: Colors.successSoft, fg: Colors.success, icon: 'trending-up' },
    regressed: { bg: Colors.dangerSoft, fg: Colors.error, icon: 'alert-circle' },
    steady: { bg: Colors.controlFill, fg: Colors.textSecondary, icon: 'remove-circle-outline' },
    insufficient: { bg: Colors.primaryLight, fg: Colors.primary, icon: 'calendar-outline' },
  }[status] || { bg: Colors.controlFill, fg: Colors.textSecondary, icon: 'information-circle-outline' };
  return (
    <View style={[styles.banner, { backgroundColor: look.bg }]}>
      <Ionicons name={icon || look.icon} size={20} color={look.fg} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.bannerTitle, { color: look.fg }]}>{title}</Text>
        <Text style={styles.bannerBody}>{body}</Text>
      </View>
    </View>
  );
}

export function StatusLegend({ showSteady = true }) {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.success }]} /><Text style={styles.legendText}>Toward goal</Text></View>
      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.error }]} /><Text style={styles.legendText}>Away from goal</Text></View>
      {showSteady ? <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.textLight }]} /><Text style={styles.legendText}>Little change</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: Spacing.lg },
  emptyText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  banner: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 12, marginTop: Spacing.md },
  bannerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  bannerBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: Colors.glassBorder, paddingTop: 10, marginTop: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: Colors.textSecondary, fontSize: 11 },
});
