// src/components/GoalCard.js
//
// Interactive goal proposal card. `goal.reasoning` — grounded in the
// user's actual logged runs — renders inline by default. No tap needed
// to see why the number is what it is; that's the point.

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, type } from '../theme';
import { formatDistance, useUnits } from '../../contexts/UnitContext';

export default function GoalCard({ goal, onConfirm, onEdit, editable = true }) {
  const { unitSystem } = useUnits();
  const [editing, setEditing] = useState(false);
  const [km, setKm] = useState(goal.km);

  const startEdit = () => setEditing(true);

  const saveEdit = () => {
    setEditing(false);
    onEdit({ ...goal, km, subtitle: `${goal.sessions} sessions · adjusted from ${formatDistance(goal.km, unitSystem)}` });
  };

  const confirm = () => onConfirm({ ...goal, km });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>◎</Text>
        </View>
        <Text style={styles.eyebrow}>PROPOSED GOAL</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>{Math.round(goal.confidence * 100)}% confidence</Text>
        </View>
      </View>

      {!editing ? (
        <>
          <Text style={styles.title}>Run {formatDistance(km, unitSystem)} next week</Text>
          <Text style={styles.subtitle}>{goal.sessions} sessions · {goal.changeLabel}</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Adjust distance</Text>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepBtn} onPress={() => setKm((k) => Math.max(1, k - (unitSystem === 'imperial' ? 1.609344 : 1)))}>
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepValue}>{formatDistance(km, unitSystem)}</Text>
            <Pressable style={styles.stepBtn} onPress={() => setKm((k) => k + (unitSystem === 'imperial' ? 1.609344 : 1))}>
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
        </>
      )}

      {!!goal.reasoning && (
        <View style={styles.reasoningBox}>
          <Text style={styles.reasoningLabel}>WHY THIS NUMBER</Text>
          <Text style={styles.reasoningText}>{goal.reasoning}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        {!editing ? (
          <>
            <Pressable style={styles.confirmBtn} onPress={confirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
            {editable && (
              <Pressable style={styles.editBtn} onPress={startEdit}>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            )}
          </>
        ) : (
          <Pressable style={styles.confirmBtn} onPress={saveEdit}>
            <Text style={styles.confirmText}>Save & confirm</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 18,
    maxWidth: '92%',
    alignSelf: 'flex-start',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconGlyph: { color: colors.primary, fontSize: 13 },
  eyebrow: { ...type.label, color: colors.inkMuted, flex: 1 },
  aiBadge: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  aiBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.inkMuted, marginBottom: 4 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSunk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, color: colors.ink },
  stepValue: { fontSize: 20, fontWeight: '700', color: colors.ink, marginHorizontal: 20 },
  reasoningBox: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  reasoningLabel: { ...type.label, color: colors.accentDark, marginBottom: 3, fontSize: 10 },
  reasoningText: { fontSize: 13, lineHeight: 18, color: colors.ink },
  buttonRow: { flexDirection: 'row', marginTop: 14 },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 22,
    marginRight: 10,
  },
  confirmText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  editText: { color: colors.ink, fontWeight: '600', fontSize: 15 },
});
