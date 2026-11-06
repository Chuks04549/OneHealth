// src/components/LogRunModal.js
//
// Manual run entry. This is the "ground truth" input for the whole app —
// every reasoning line and goal proposal downstream traces back to what
// gets logged here. Deliberately simple (distance, time, effort, note)
// so there's no friction to logging the very first run.

import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, radius, type } from '../theme';
import { todayLocalISO } from '../services/storage';

const EFFORTS = [
  { key: 'easy', label: 'Easy' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'hard', label: 'Hard' },
];

function todayISO() {
  return todayLocalISO();
}

export default function LogRunModal({ visible, onClose, onSave }) {
  const [km, setKm] = useState('');
  const [minutes, setMinutes] = useState('');
  const [effort, setEffort] = useState('moderate');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setKm('');
    setMinutes('');
    setEffort('moderate');
    setNote('');
    setError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = () => {
    const kmNum = parseFloat(km);
    const minNum = parseFloat(minutes);
    if (!kmNum || kmNum <= 0) {
      setError('Enter a distance greater than 0.');
      return;
    }
    if (!minNum || minNum <= 0) {
      setError('Enter a duration greater than 0.');
      return;
    }
    onSave({
      date: todayISO(),
      km: Math.round(kmNum * 10) / 10,
      durationMin: Math.round(minNum),
      paceMinPerKm: Math.round((minNum / kmNum) * 100) / 100,
      effort,
      note: note.trim(),
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Log a run</Text>
          <Text style={styles.subtitle}>
            This is what your coach actually reasons from — the more you log, the less it's guessing.
          </Text>

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>DISTANCE (KM)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="5.0"
                placeholderTextColor={colors.inkFaint}
                value={km}
                onChangeText={setKm}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>TIME (MIN)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                placeholder="28"
                placeholderTextColor={colors.inkFaint}
                value={minutes}
                onChangeText={setMinutes}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>EFFORT</Text>
          <View style={styles.effortRow}>
            {EFFORTS.map((e) => (
              <Pressable
                key={e.key}
                style={[styles.effortChip, effort === e.key && styles.effortChipActive]}
                onPress={() => setEffort(e.key)}
              >
                <Text style={[styles.effortText, effort === e.key && styles.effortTextActive]}>
                  {e.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="How'd it feel? Anything the coach should know?"
            placeholderTextColor={colors.inkFaint}
            value={note}
            onChangeText={setNote}
            multiline
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelBtn} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveText}>Save run</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28,25,52,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { ...type.title, color: colors.ink, marginBottom: 4 },
  subtitle: { ...type.small, color: colors.inkMuted, marginBottom: 20, lineHeight: 17 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  field: { flex: 1 },
  fieldLabel: { ...type.label, color: colors.inkFaint, marginBottom: 8 },
  input: {
    backgroundColor: colors.surfaceSunk,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  noteInput: { minHeight: 60, textAlignVertical: 'top', marginBottom: 8 },
  effortRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  effortChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceSunk,
  },
  effortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  effortText: { ...type.small, color: colors.inkMuted, fontWeight: '600' },
  effortTextActive: { color: colors.white },
  error: { color: colors.danger, fontSize: 13, marginBottom: 8 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { color: colors.inkMuted, fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
