import React, { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getStepAccess, STEP_SOURCE, watchTodaySteps } from '../utils/stepCounter';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import GlassCard from './GlassCard';
import { getGoals } from '../eugene/services/storage';

export default function StepTracker() {
  const navigation = useNavigation();
  const [steps, setSteps] = useState(0);
  const [status, setStatus] = useState('loading');
  const [stepGoal, setStepGoal] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let stopWatching;

      const loadSteps = async () => {
        try {
          setStatus('loading');
          const goals = await getGoals();
          if (!active) return;
          setStepGoal(goals.find((goal) => goal.metric === 'daily_steps') || null);

          const access = await getStepAccess({ ask: true });
          if (!active) return;
          if (access !== 'granted') {
            setStatus(access);
            return;
          }

          const stop = await watchTodaySteps((total) => {
            if (active) setSteps(total);
          });
          if (!active) {
            stop();
            return;
          }
          stopWatching = stop;
          setStatus('ready');
        } catch (error) {
          if (active) setStatus('error');
        }
      };

      loadSteps();
      return () => {
        active = false;
        stopWatching?.();
      };
    }, []),
  );

  const openStepGoal = () => {
    navigation.navigate('Home', { tab: 'Goals', tabSelectionId: Date.now(), goalPromptId: Date.now() });
  };

  const goalTarget = Number(stepGoal?.target) || 0;
  const goalProgress = goalTarget > 0 ? Math.min(100, Math.round((steps / goalTarget) * 100)) : 0;

  const goalContent = stepGoal ? (
    <View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${goalProgress}%` }]} />
      </View>
      <View style={styles.goalMetaRow}>
        <Text style={styles.goalText}>Daily goal: {Math.round(goalTarget).toLocaleString()} steps</Text>
        <Text style={styles.goalPercentage}>{goalProgress}%</Text>
      </View>
    </View>
  ) : (
    <TouchableOpacity onPress={openStepGoal} accessibilityLabel="Set a daily step goal">
      <Text style={styles.setGoalText}>Set a daily step goal</Text>
    </TouchableOpacity>
  );

  if (status !== 'ready') {
    const message = status === 'loading'
      ? 'Checking motion access…'
      : status === 'denied'
        ? 'Motion access is off'
        : status === 'unavailable'
          ? 'Step tracking is not available on this device'
          : 'Steps could not be loaded';

    return (
      <GlassCard style={styles.card} contentStyle={styles.cardContent}>
        <View style={styles.iconCircle}>
          <Ionicons name="footsteps-outline" size={27} color={Colors.primary} />
        </View>
        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>{message}</Text>
          {status === 'denied' ? (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.settingsLink}>Open Settings</Text>
            </TouchableOpacity>
          ) : null}
          {goalContent}
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card} contentStyle={styles.cardContent}>
      <View style={styles.iconCircle}>
        <Ionicons name="footsteps" size={27} color={Colors.primary} />
      </View>
      <View style={styles.stepContent}>
        <View style={styles.valueRow}>
          <Text style={styles.stepValue}>{Math.round(steps).toLocaleString()}</Text>
          <Text style={styles.stepUnit}>steps</Text>
        </View>
        {STEP_SOURCE === 'while-open' ? <Text style={styles.sourceNote}>Counted while OneHealth is open</Text> : null}
        {goalContent}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 112,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  stepContent: { flex: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  stepValue: { color: Colors.text, fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold },
  stepUnit: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: Colors.backgroundSecondary, overflow: 'hidden', marginTop: Spacing.sm },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  goalMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  goalText: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs },
  goalPercentage: { color: Colors.primary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  setGoalText: { color: Colors.primary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, marginTop: Spacing.sm },
  statusContent: { flex: 1 },
  sourceNote: { color: Colors.textLight, fontSize: 11, marginTop: 2 },
  statusTitle: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20 },
  settingsLink: { color: Colors.primary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, marginTop: Spacing.sm },
});
