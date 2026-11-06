import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addWorkout, getWorkouts, todayLocalISO } from '../eugene/services/storage';
import { useUnits } from '../contexts/UnitContext';
import { findPersonalRecords, formatLiftSet } from '../utils/strengthProgress';
import { notifyPersonalRecords } from '../utils/notifications';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';
import LiquidGlassBackButton from '../components/LiquidGlassBackButton';

const WORKOUT_DAYS = [
  { title: 'Full Body', icon: 'body-outline' },
  { title: 'Upper Body', icon: 'barbell-outline' },
  { title: 'Lower Body', icon: 'walk-outline' },
  { title: 'Push Day', icon: 'arrow-up-circle-outline' },
  { title: 'Pull Day', icon: 'arrow-down-circle-outline' },
  { title: 'Leg Day', icon: 'fitness-outline' },
  { title: 'Arm Day', icon: 'barbell-outline' },
  { title: 'Core Day', icon: 'ellipse-outline' },
];

const COMMON_LIFTS = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-up', 'Leg Press', 'Bicep Curl'];
const KG_PER_LB = 0.45359237;
let liftRowId = 0;
const newLiftRow = () => ({ id: `lift-${liftRowId += 1}`, name: '', weight: '', reps: '', sets: '' });

function LiftRow({ lift, unitLabel, onChange, onRemove, canRemove, onFocus }) {
  return (
    <View style={styles.liftCard}>
      <View style={styles.liftHeader}>
        <TextInput
          style={[styles.input, styles.liftName]}
          value={lift.name}
          onChangeText={(name) => onChange({ ...lift, name })}
          placeholder="Exercise, e.g. Bench Press"
          placeholderTextColor={Colors.textLight}
          onFocus={onFocus}
        />
        {canRemove ? (
          <TouchableOpacity onPress={onRemove} style={styles.liftRemove} accessibilityLabel="Remove lift">
            <Feather name="x" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {!lift.name ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liftChips} keyboardShouldPersistTaps="handled">
          {COMMON_LIFTS.map((name) => (
            <TouchableOpacity key={name} style={styles.liftChip} onPress={() => onChange({ ...lift, name })}>
              <Text style={styles.liftChipText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.liftNumbers}>
        {[
          { key: 'weight', label: `WEIGHT (${unitLabel})`, placeholder: '0 = bodyweight' },
          { key: 'reps', label: 'REPS', placeholder: '8' },
          { key: 'sets', label: 'SETS', placeholder: '3' },
        ].map((field) => (
          <View key={field.key} style={styles.liftField}>
            <Text style={styles.liftFieldLabel}>{field.label}</Text>
            <TextInput
              style={[styles.input, styles.liftInput]}
              value={lift[field.key]}
              onChangeText={(value) => onChange({ ...lift, [field.key]: value.replace(field.key === 'weight' ? /[^0-9.]/g : /[^0-9]/g, '') })}
              placeholder={field.placeholder}
              placeholderTextColor={Colors.textLight}
              keyboardType={field.key === 'weight' ? 'decimal-pad' : 'number-pad'}
              onFocus={onFocus}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function WorkoutLogScreen() {
  const navigation = useNavigation();
  const tabBarClearance = useFloatingTabBarClearance();
  const scrollRef = useRef(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { unitSystem } = useUnits();
  const [lifts, setLifts] = useState([]);
  const unitLabel = unitSystem === 'metric' ? 'KG' : 'LB';

  const revealBottomFields = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
  };

  const saveWorkout = async () => {
    const workoutTitle = title.trim();
    const durationMin = Number.parseFloat(duration);
    if (!workoutTitle) {
      setError('Choose a workout type or enter your own.');
      return;
    }
    if (!durationMin || durationMin <= 0) {
      setError('Enter a duration greater than 0 minutes.');
      return;
    }

    const filledLifts = lifts.filter((lift) => lift.name.trim() || lift.reps || lift.weight);
    if (filledLifts.some((lift) => !lift.name.trim() || !(Number(lift.reps) > 0))) {
      setError('Each lift needs an exercise name and reps (or remove the empty lift).');
      return;
    }
    const savedLifts = filledLifts.map((lift) => ({
      name: lift.name.trim(),
      weightKg: unitSystem === 'metric' ? Number(lift.weight) || 0 : (Number(lift.weight) || 0) * KG_PER_LB,
      reps: Math.round(Number(lift.reps)),
      sets: Math.max(1, Math.round(Number(lift.sets) || 1)),
    }));

    setSaving(true);
    setError('');
    try {
      const workout = {
        date: todayLocalISO(),
        title: workoutTitle,
        durationMin: Math.round(durationMin),
        note: note.trim(),
        ...(savedLifts.length ? { lifts: savedLifts } : {}),
      };
      const records = savedLifts.length ? findPersonalRecords(await getWorkouts(), workout) : [];
      await addWorkout(workout);
      notifyPersonalRecords(records, unitSystem);
      const message = records.length
        ? `New personal record${records.length > 1 ? 's' : ''}! 🏆\n${records.map((r) => `${r.name}: ${formatLiftSet(r.best, unitSystem)}`).join('\n')}`
        : 'Your workout was saved successfully.';
      Alert.alert('Workout saved', message, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (saveError) {
      setSaving(false);
      setError('The workout could not be saved. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <LiquidGlassBackButton onPress={() => navigation.goBack()} accessibilityLabel="Cancel workout log" />
        </View>
        <Text style={styles.headerTitle}>Log Workout</Text>
        <TouchableOpacity
          style={[styles.headerSide, styles.logsButton]}
          onPress={() => navigation.navigate('MealLogs', { logType: 'workouts', selectionId: Date.now() })}
        >
          <Text style={styles.logsButtonText}>View Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.introIcon}>
          <Ionicons name="barbell-outline" size={32} color={Colors.workoutLog} />
        </View>
        <Text style={styles.title}>What did you train?</Text>
        <Text style={styles.subtitle}>Choose a workout day or enter a custom name.</Text>

        <View style={styles.presets}>
          {WORKOUT_DAYS.map((workout) => {
            const selected = title === workout.title;
            return (
              <TouchableOpacity
                key={workout.title}
                style={[styles.preset, selected && styles.presetSelected]}
                onPress={() => {
                  setTitle(workout.title);
                  setError('');
                }}
                accessibilityState={{ selected }}
              >
                <Ionicons name={workout.icon} size={19} color={selected ? Colors.textWhite : Colors.workoutLog} />
                <Text style={[styles.presetText, selected && styles.presetTextSelected]}>{workout.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>CUSTOM WORKOUT</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setError('');
          }}
          placeholder="e.g. Chest and back"
          placeholderTextColor={Colors.textLight}
          returnKeyType="next"
        />

        <Text style={styles.label}>DURATION</Text>
        <View style={styles.durationRow}>
          <TextInput
            style={[styles.input, styles.durationInput]}
            value={duration}
            onChangeText={(value) => {
              setDuration(value);
              setError('');
            }}
            placeholder="45"
            placeholderTextColor={Colors.textLight}
            keyboardType="number-pad"
            onFocus={revealBottomFields}
          />
          <Text style={styles.durationUnit}>minutes</Text>
        </View>

        <Text style={styles.label}>LIFTS (OPTIONAL)</Text>
        <Text style={styles.helper}>Add your exercises to track strength progress and personal records.</Text>
        {lifts.map((lift) => (
          <LiftRow
            key={lift.id}
            lift={lift}
            unitLabel={unitLabel}
            canRemove
            onFocus={revealBottomFields}
            onChange={(next) => { setLifts((rows) => rows.map((row) => (row.id === lift.id ? next : row))); setError(''); }}
            onRemove={() => setLifts((rows) => rows.filter((row) => row.id !== lift.id))}
          />
        ))}
        <TouchableOpacity style={styles.addLift} onPress={() => setLifts((rows) => [...rows, newLiftRow()])} accessibilityRole="button">
          <Feather name="plus" size={17} color={Colors.workoutLog} />
          <Text style={styles.addLiftText}>{lifts.length ? 'Add another lift' : 'Add a lift'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>NOTES (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="Anything you want to remember?"
          placeholderTextColor={Colors.textLight}
          multiline
          textAlignVertical="top"
          onFocus={revealBottomFields}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveWorkout}
          disabled={saving}
          accessibilityRole="button"
        >
          <Feather name="check" size={19} color={Colors.textWhite} />
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Workout'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  headerSide: { width: 76, minHeight: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { flex: 1, color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, textAlign: 'center' },
  logsButton: { alignItems: 'flex-end' },
  logsButtonText: { color: Colors.workoutLog, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: 140 },
  introIcon: { width: 64, height: 64, borderRadius: BorderRadius.full, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.workoutLogSoft },
  title: { color: Colors.text, fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, textAlign: 'center', marginTop: Spacing.lg },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  preset: { width: '48%', minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.cardBackground },
  presetSelected: { backgroundColor: Colors.workoutLog },
  presetText: { flex: 1, color: Colors.text, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  presetTextSelected: { color: Colors.textWhite },
  label: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, letterSpacing: 0.7, marginBottom: Spacing.sm },
  input: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, borderRadius: BorderRadius.xl, backgroundColor: Colors.cardBackground, color: Colors.text, fontSize: Typography.fontSize.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  durationInput: { flex: 1 },
  durationUnit: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginBottom: Spacing.lg, marginRight: Spacing.sm },
  noteInput: { minHeight: 100, paddingTop: Spacing.md },
  helper: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: -4, marginBottom: Spacing.md },
  liftCard: { borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, borderRadius: BorderRadius.xl, backgroundColor: Colors.backgroundSecondary, padding: Spacing.md, marginBottom: Spacing.md },
  liftHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  liftName: { flex: 1, marginBottom: 0 },
  liftRemove: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  liftChips: { gap: 6, paddingTop: Spacing.sm },
  liftChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.workoutLogSoft },
  liftChipText: { color: Colors.workoutLog, fontSize: 12, fontWeight: '600' },
  liftNumbers: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  liftField: { flex: 1 },
  liftFieldLabel: { color: Colors.textLight, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  liftInput: { marginBottom: 0, textAlign: 'center', paddingHorizontal: Spacing.sm },
  addLift: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 46, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.workoutLog, borderStyle: 'dashed', marginBottom: Spacing.xl },
  addLiftText: { color: Colors.workoutLog, fontSize: Typography.fontSize.sm, fontWeight: '700' },
  error: { color: Colors.error, fontSize: Typography.fontSize.sm, marginBottom: Spacing.md },
  saveButton: { minHeight: 54, borderRadius: BorderRadius.full, backgroundColor: Colors.workoutLog, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: Colors.textWhite, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
});
