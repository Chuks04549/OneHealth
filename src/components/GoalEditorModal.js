import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';

export const GOAL_OPTIONS = {
  Fitness: [
    { metric: 'daily_steps', label: 'Steps', unit: 'steps per day' },
    { metric: 'weekly_workouts', label: 'Workout sessions', unit: 'per week' },
    { metric: 'weekly_runs', label: 'Runs', unit: 'per week' },
    { metric: 'weekly_distance', label: 'Running distance', unit: 'distance per week' },
    { metric: 'active_days', label: 'Active days', unit: 'days per week' },
  ],
  Nutrition: [
    { metric: 'daily_calories', label: 'Calories', unit: 'kcal per day' },
    { metric: 'daily_protein', label: 'Protein', unit: 'g per day' },
    { metric: 'daily_carbs', label: 'Carbs', unit: 'g per day' },
    { metric: 'daily_fat', label: 'Fat', unit: 'g per day' },
    { metric: 'weekly_meals', label: 'Meals logged', unit: 'per week' },
  ],
};

export function getGoalOption(category, metric) {
  return GOAL_OPTIONS[category]?.find((option) => option.metric === metric);
}

const DEFAULT_TARGETS = {
  daily_steps: 10000,
  weekly_workouts: 3,
  weekly_runs: 3,
  weekly_distance: 10,
  active_days: 4,
  daily_calories: 2000,
  daily_protein: 100,
  daily_carbs: 250,
  daily_fat: 65,
  weekly_meals: 7,
};

export default function GoalEditorModal({ visible, goal, preset, unitSystem, onClose, onSave, onDelete }) {
  const [category, setCategory] = useState('Fitness');
  const [metric, setMetric] = useState(GOAL_OPTIONS.Fitness[0].metric);
  const [target, setTarget] = useState('3');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    const source = goal || preset;
    const nextCategory = source?.category === 'Nutrition' ? 'Nutrition' : 'Fitness';
    const nextMetric = source?.metric || GOAL_OPTIONS[nextCategory][0].metric;
    let nextTarget = Number(source?.target) || DEFAULT_TARGETS[nextMetric] || 3;
    if (nextMetric === 'weekly_distance' && unitSystem === 'imperial') {
      nextTarget = Math.round(nextTarget * 0.621371 * 10) / 10;
    }
    setCategory(nextCategory);
    setMetric(nextMetric);
    setTarget(String(nextTarget));
    setError('');
  }, [visible, goal, preset, unitSystem]);

  const selectedOption = useMemo(() => getGoalOption(category, metric), [category, metric]);
  const displayedUnit = metric === 'weekly_distance'
    ? `${unitSystem === 'imperial' ? 'mi' : 'km'} per week`
    : selectedOption?.unit;

  const chooseCategory = (nextCategory) => {
    const nextMetric = GOAL_OPTIONS[nextCategory][0].metric;
    setCategory(nextCategory);
    setMetric(nextMetric);
    setTarget(String(DEFAULT_TARGETS[nextMetric] || 1));
    setError('');
  };

  const save = () => {
    const enteredTarget = Number(target);
    if (!Number.isFinite(enteredTarget) || enteredTarget <= 0) {
      setError('Enter a target greater than 0.');
      return;
    }
    const canonicalTarget = metric === 'weekly_distance' && unitSystem === 'imperial'
      ? enteredTarget / 0.621371
      : enteredTarget;
    onSave({
      ...(goal || {}),
      category,
      metric,
      target: Math.round(canonicalTarget * 100) / 100,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{goal ? 'Edit goal' : 'Set a goal'}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>GOAL AREA</Text>
            <View style={styles.segmentRow}>
              {Object.keys(GOAL_OPTIONS).map((item) => {
                const selected = item === category;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.segment, selected && styles.segmentSelected]}
                    onPress={() => chooseCategory(item)}
                  >
                    <Feather
                      name={item === 'Fitness' ? 'activity' : 'heart'}
                      size={18}
                      color={selected ? Colors.textWhite : Colors.textSecondary}
                    />
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>WHAT DO YOU WANT TO TRACK?</Text>
            <View style={styles.options}>
              {GOAL_OPTIONS[category].map((option) => {
                const selected = option.metric === metric;
                return (
                  <TouchableOpacity
                    key={option.metric}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      setMetric(option.metric);
                      let defaultTarget = DEFAULT_TARGETS[option.metric] || 1;
                      if (option.metric === 'weekly_distance' && unitSystem === 'imperial') {
                        defaultTarget = Math.round(defaultTarget * 0.621371 * 10) / 10;
                      }
                      setTarget(String(defaultTarget));
                      setError('');
                    }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
                    {selected ? <Feather name="check-circle" size={19} color={Colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>TARGET</Text>
            <View style={styles.targetRow}>
              <TextInput
                style={styles.input}
                value={target}
                onChangeText={setTarget}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.textLight}
                selectTextOnFocus
                autoFocus={visible && preset?.metric === 'daily_steps'}
              />
              <Text style={styles.unit}>{displayedUnit}</Text>
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>

          <View style={styles.actions}>
            {goal ? (
              <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(goal.id)}>
                <Feather name="trash-2" size={19} color={Colors.error} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.saveButton} onPress={save}>
              <Text style={styles.saveButtonText}>{goal ? 'Save changes' : 'Add goal'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.42)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: Colors.elevatedSurface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  title: { flex: 1, color: Colors.text, fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold },
  closeButton: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.controlFill, alignItems: 'center', justifyContent: 'center' },
  label: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  segmentRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  segment: { flex: 1, minHeight: 48, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.backgroundSecondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  segmentSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  segmentText: { color: Colors.textSecondary, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  segmentTextSelected: { color: Colors.textWhite },
  options: { gap: Spacing.sm, marginBottom: Spacing.xl },
  option: { minHeight: 48, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionSelected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryBorder },
  optionText: { color: Colors.textSecondary, fontSize: Typography.fontSize.md },
  optionTextSelected: { color: Colors.text, fontWeight: Typography.fontWeight.semibold },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  input: { width: 110, height: 50, borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.backgroundSecondary, color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, paddingHorizontal: Spacing.md },
  unit: { flex: 1, color: Colors.textSecondary, fontSize: Typography.fontSize.md },
  error: { color: Colors.error, fontSize: Typography.fontSize.sm },
  actions: { flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.lg, marginTop: Spacing.md },
  deleteButton: { width: 50, height: 50, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  saveButton: { flex: 1, height: 50, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: Colors.textWhite, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
});
