// src/screens/ProgressScreen.js
//
// The Progress tab. This file only loads data and lays out the cards —
// the math lives in utils/progressMath.js, weeklyProgress.js and
// strengthProgress.js, and each card is its own component.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing } from '../theme';
import { useUnits } from '../contexts/UnitContext';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';
import WeightTrendCard from '../components/progress/WeightTrendCard';
import MetricCards from '../components/progress/MetricCards';
import CalorieGuidance from '../components/progress/CalorieGuidance';
import SetupPrompt from '../components/progress/SetupPrompt';
import LogWeightModal from '../components/progress/LogWeightModal';
import WeeklyProgressCard from '../components/WeeklyProgressCard';
import StrengthProgressCard from '../components/StrengthProgressCard';
import {
  addWeightEntry, getFoods, getHealthGoals, getRuns, getStepHistory, getUserProfile, getWeightEntries, getWorkouts, saveStepSnapshot,
} from '../eugene/services/storage';
import { buildProgressSummary, localDay } from '../utils/progressMath';
import { computeWeeklyProgress } from '../utils/weeklyProgress';
import { getTodaySteps } from '../utils/stepCounter';
import { notifyWeeklyProgress, scheduleHealthReminders } from '../utils/notifications';

const KG_PER_LB = 0.45359237;
const EMPTY = { entries: [], foods: [], steps: [], workouts: [], runs: [], goals: { stepGoal: 8000 }, profile: null, todaySteps: 0 };

export default function ProgressScreen() {
  const { unitSystem } = useUnits();
  const tabBarClearance = useFloatingTabBarClearance();
  const [data, setData] = useState(EMPTY);
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    const [entries, foods, steps, goals, profile, workouts, runs, todaySteps] = await Promise.all([
      getWeightEntries(), getFoods(), getStepHistory(), getHealthGoals(), getUserProfile(), getWorkouts(), getRuns(), getTodaySteps(),
    ]);
    if (todaySteps) await saveStepSnapshot(todaySteps);
    const today = localDay();
    const stepHistory = todaySteps ? [...steps.filter((s) => s.date !== today), { date: today, steps: todaySteps }] : steps;
    setData({ entries, foods, steps: stepHistory, goals, profile, workouts, runs, todaySteps });
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const summary = useMemo(() => buildProgressSummary(data), [data]);
  const weeklyProgress = useMemo(() => computeWeeklyProgress(data.entries, data.profile?.bodyGoal), [data.entries, data.profile?.bodyGoal]);

  // Tell the user (once per week + status) when they improved or slipped.
  useEffect(() => {
    if (data.profile) notifyWeeklyProgress(weeklyProgress, unitSystem);
  }, [weeklyProgress, data.profile, unitSystem]);

  const formatWeight = useCallback(
    (kg) => (unitSystem === 'metric' ? `${kg.toFixed(1)} kg` : `${(kg / KG_PER_LB).toFixed(1)} lb`),
    [unitSystem],
  );

  const saveWeight = async (entry) => {
    await addWeightEntry(entry);
    setLogging(false);
    await load();
    scheduleHealthReminders(); // move the next weigh-in reminder to N days from now
  };

  const showSetupPrompt = data.profile && !data.profile.onboardingComplete;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={styles.title}>Your progress</Text></View>
        {showSetupPrompt ? <SetupPrompt /> : null}
        <WeightTrendCard summary={summary} formatWeight={formatWeight} onLog={() => setLogging(true)} />
        <WeeklyProgressCard progress={weeklyProgress} unitSystem={unitSystem} />
        <StrengthProgressCard workouts={data.workouts} unitSystem={unitSystem} />
        <Text style={styles.sectionTitle}>LAST 30 DAYS</Text>
        <MetricCards summary={summary} stepGoal={data.goals.stepGoal} todaySteps={data.todaySteps} />
        <CalorieGuidance summary={summary} />
      </ScrollView>
      <LogWeightModal
        visible={logging}
        unitSystem={unitSystem}
        latestKg={summary.latest?.weightKg}
        onCancel={() => setLogging(false)}
        onSave={saveWeight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.md },
  header: { paddingTop: Spacing.sm, marginBottom: Spacing.sm },
  title: { color: Colors.text, fontSize: 32, fontWeight: '700', marginTop: 3 },
  sectionTitle: { color: Colors.textSecondary, letterSpacing: 1, fontSize: 11, fontWeight: '700', marginTop: Spacing.md, marginLeft: 4 },
});
