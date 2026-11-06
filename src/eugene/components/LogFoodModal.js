// src/components/LogFoodModal.js
//
// Manual food entry — same philosophy as LogRunModal: low-friction,
// user-controlled data entry. This app never computes or suggests
// calorie targets, macros, or diet plans anywhere — it only stores what
// the user chose to log, so the coach can reference it as context
// (e.g. "logged a light breakfast before a hard effort") rather than
// reasoning about fueling blind.

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, type } from '../theme';
import { todayLocalISO } from '../services/storage';
import { analyzeMealText } from '../../foodlog/services/foodAI';

function todayISO() {
  return todayLocalISO();
}

export default function LogFoodModal({ visible, onClose, onSave }) {
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDescription('');
    setNote('');
    setError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = async () => {
    if (!description.trim()) {
      setError('Enter what you ate, including an amount when possible.');
      return;
    }
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const analysis = await analyzeMealText(description.trim());
      if (!analysis.isFood) throw new Error(analysis.warning || 'No recognizable food was found in that description.');
      await onSave({
        date: todayISO(),
        description: analysis.label || description.trim(),
        originalDescription: description.trim(),
        calories: analysis.calories,
        macros: analysis.macros,
        portion: analysis.portion,
        components: analysis.items,
        micros: analysis.micros,
        confidence: analysis.confidence,
        assumptions: analysis.assumptions,
        warning: analysis.warning,
        source: 'text_estimate',
        note: note.trim(),
      });
      Alert.alert('Food logged successfully');
      reset();
    } catch (lookupError) {
      setError(lookupError.message || 'Could not estimate this food. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.backdrop}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Log food</Text>
          <Text style={styles.subtitle}>
            Describe the food and amount. We’ll estimate calories and protein before saving it to your log.
          </Text>

          <Text style={styles.fieldLabel}>WHAT DID YOU EAT</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="e.g. 1 cup oatmeal with a banana"
            placeholderTextColor={colors.inkFaint}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="e.g. pre-run, post-run, felt low energy"
            placeholderTextColor={colors.inkFaint}
            value={note}
            onChangeText={setNote}
            multiline
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelBtn} onPress={close} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.saveText}>Estimate & log</Text>}
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  backdrop: { flexGrow: 1, backgroundColor: 'rgba(28,25,52,0.45)', justifyContent: 'flex-end' },
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
  fieldLabel: { ...type.label, color: colors.inkFaint, marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: colors.surfaceSunk,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 16,
  },
  descriptionInput: { minHeight: 64, textAlignVertical: 'top' },
  noteInput: { minHeight: 60, textAlignVertical: 'top' },
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
    backgroundColor: colors.food,
    alignItems: 'center',
  },
  saveText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  saveBtnDisabled: { opacity: 0.65 },
});
