// src/components/RunLogBubble.js
//
// When a run is logged, it appears in the chat as data — not just a toast
// that disappears. This is what makes the log feel like it's actually
// feeding the coach, instead of vanishing into a separate "stats" tab
// the coach never visibly references.

import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, type } from '../theme';
import { formatDistance, formatPace, useUnits } from '../../contexts/UnitContext';

const EFFORT_LABEL = { easy: 'Easy', moderate: 'Moderate', hard: 'Hard' };

export default function RunLogBubble({ run }) {
  const { unitSystem } = useUnits();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>↗</Text>
        </View>
        <Text style={styles.eyebrow}>RUN LOGGED</Text>
      </View>
      <Text style={styles.title}>{formatDistance(run.km, unitSystem)} · {run.durationMin} min</Text>
      <Text style={styles.subtitle}>
        {formatPace(run.paceMinPerKm, unitSystem)} · {EFFORT_LABEL[run.effort] || run.effort}
      </Text>
      {!!run.note && <Text style={styles.note}>"{run.note}"</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#ffd2c9',
    padding: 16,
    marginBottom: 18,
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  iconGlyph: { color: colors.white, fontSize: 12, fontWeight: '700' },
  eyebrow: { ...type.label, color: colors.accentDark },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  subtitle: { fontSize: 13, color: colors.inkMuted },
  note: { fontSize: 13, color: colors.inkMuted, marginTop: 6, fontStyle: 'italic' },
});
