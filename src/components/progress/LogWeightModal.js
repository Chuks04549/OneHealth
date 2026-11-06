// Bottom-sheet modal for logging a weigh-in with a date.

import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../theme';
import { localDay } from '../../utils/progressMath';

const KG_PER_LB = 0.45359237;

/** Returns 'YYYY-MM-DD' if the parts form a real calendar date, otherwise null. */
export function validDate(year, month, day) {
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && localDay(parsed) === date ? date : null;
}

export default function LogWeightModal({ visible, unitSystem, latestKg, onCancel, onSave }) {
  const metric = unitSystem === 'metric';
  const [draft, setDraft] = useState({ weight: '', month: '', day: '', year: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    const [year, month, day] = localDay().split('-');
    const weight = latestKg ? (metric ? latestKg.toFixed(1) : (latestKg / KG_PER_LB).toFixed(1)) : '';
    setDraft({ weight, month, day, year });
    setError('');
  }, [visible, latestKg, metric]);

  const digits = (key, max) => (value) => setDraft((d) => ({ ...d, [key]: value.replace(/\D/g, '').slice(0, max) }));

  const save = () => {
    const weight = Number(draft.weight);
    const date = validDate(draft.year, draft.month, draft.day);
    if (!(weight > 0)) return setError('Enter your weight.');
    if (!date) return setError('Enter a real date.');
    if (date > localDay()) return setError('The date can’t be in the future.');
    onSave({ weightKg: metric ? weight : weight * KG_PER_LB, date });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Log your weight</Text>
          <Text style={styles.label}>WEIGHT ({metric ? 'KG' : 'LB'})</Text>
          <TextInput style={styles.input} value={draft.weight} onChangeText={(weight) => setDraft((d) => ({ ...d, weight: weight.replace(/[^0-9.]/g, '') }))} keyboardType="decimal-pad" autoFocus />
          <Text style={styles.label}>DATE</Text>
          <View style={styles.dateRow}>
            {[['MONTH', 'month', 2, 1], ['DAY', 'day', 2, 1], ['YEAR', 'year', 4, 1.35]].map(([caption, key, max, flex]) => (
              <View key={key} style={{ flex }}>
                <Text style={styles.caption}>{caption}</Text>
                <TextInput style={styles.dateInput} value={draft[key]} onChangeText={digits(key, max)} keyboardType="number-pad" maxLength={max} selectTextOnFocus />
              </View>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={save} style={styles.save}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16,22,28,.35)', alignItems: 'center', justifyContent: 'flex-end', padding: Spacing.md },
  sheet: { width: '100%', backgroundColor: Colors.elevatedSurface, borderRadius: 28, padding: Spacing.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.glassBorder },
  title: { color: Colors.text, fontSize: 21, fontWeight: '700', marginBottom: Spacing.xl },
  label: { color: Colors.textSecondary, fontSize: 11, letterSpacing: 0.8, fontWeight: '700', marginBottom: 6 },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: Colors.controlFill, color: Colors.text, paddingHorizontal: 14, fontSize: 16, marginBottom: 14 },
  dateRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  caption: { color: Colors.textLight, fontSize: 10, letterSpacing: 0.6, marginBottom: 5, fontWeight: '700' },
  dateInput: { height: 52, textAlign: 'center', borderRadius: BorderRadius.md, backgroundColor: Colors.controlFill, color: Colors.text, fontSize: 17, fontWeight: '600' },
  error: { color: Colors.error, fontSize: 13, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 18, marginTop: 4 },
  cancel: { color: Colors.textSecondary, fontSize: 16 },
  save: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.full },
  saveText: { color: '#fff', fontWeight: '700' },
});
