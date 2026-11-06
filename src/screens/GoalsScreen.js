import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  ActivityIndicator,
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { getTodaySteps } from '../utils/stepCounter';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';
import {
  deleteGoal,
  getAchievedGoalIds,
  getFoods,
  getGoals,
  getLastNotifiedStreak,
  getRuns,
  getWorkouts,
  markGoalAchieved,
  resetAchievedGoal,
  saveGoal,
  setLastNotifiedStreak,
  getHealthGoals,
  saveHealthGoals,
  getNotificationPrefs,
} from '../eugene/services/storage';
import { formatDistance, useUnits } from '../contexts/UnitContext';
import GoalEditorModal, { getGoalOption } from '../components/GoalEditorModal';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';
import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import { notifyGoalAchieved, notifyStreakMilestone } from '../utils/notifications';
import { scheduleHealthReminders } from '../utils/notifications';

function localDay(value = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysSince(value) {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return Infinity;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  parsed.setHours(12, 0, 0, 0);
  return Math.floor((today - parsed) / 86400000);
}

function consecutiveDayStreak(entries, predicate = () => true) {
  const days = new Set(entries.filter(predicate).map((entry) => localDay(entry.date)).filter(Boolean));
  let cursor = new Date();
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function percent(current, target) {
  return Math.min(100, Math.round((current / target) * 100));
}

const readTodaySteps = getTodaySteps;

function userGoalFromActivity(goal, runs, foods, workouts, steps, unitSystem) {
  const recentRuns = runs.filter((run) => daysSince(run.date) <= 6);
  const recentFoods = foods.filter((food) => daysSince(food.date) <= 6);
  const recentWorkouts = workouts.filter((workout) => daysSince(workout.date) <= 6);
  const todaysFoods = foods.filter((food) => localDay(food.date) === localDay());
  const category = goal.category === 'Nutrition' ? 'Nutrition' : 'Fitness';
  const option = getGoalOption(category, goal.metric);
  const target = Number(goal.target) || 1;
  let currentValue = 0;
  let currentLabel = '0';
  let targetLabel = String(target);

  switch (goal.metric) {
    case 'daily_steps':
      currentValue = steps;
      currentLabel = `${Math.round(currentValue).toLocaleString()} steps`;
      targetLabel = `${Math.round(target).toLocaleString()} steps`;
      break;
    case 'weekly_workouts':
      currentValue = recentWorkouts.length;
      currentLabel = `${currentValue} session${currentValue === 1 ? '' : 's'}`;
      targetLabel = `${target} sessions`;
      break;
    case 'weekly_runs':
      currentValue = recentRuns.length;
      currentLabel = `${currentValue} run${currentValue === 1 ? '' : 's'}`;
      targetLabel = `${target} runs`;
      break;
    case 'weekly_distance':
      currentValue = recentRuns.reduce((sum, run) => sum + (Number(run.km) || 0), 0);
      currentLabel = formatDistance(currentValue, unitSystem);
      targetLabel = formatDistance(target, unitSystem);
      break;
    case 'active_days': {
      const activeDays = new Set(
        [...recentRuns, ...recentWorkouts].map((item) => localDay(item.date)).filter(Boolean),
      );
      currentValue = activeDays.size;
      currentLabel = `${currentValue} day${currentValue === 1 ? '' : 's'}`;
      targetLabel = `${target} days`;
      break;
    }
    case 'daily_calories':
      currentValue = todaysFoods.reduce((sum, food) => sum + (Number(food.calories) || 0), 0);
      currentLabel = `${Math.round(currentValue)} kcal`;
      targetLabel = `${target} kcal`;
      break;
    case 'daily_protein':
    case 'daily_carbs':
    case 'daily_fat': {
      const macro = goal.metric.replace('daily_', '');
      currentValue = todaysFoods.reduce(
        (sum, food) => sum + (Number(food.macros?.[`${macro}_g`]) || 0),
        0,
      );
      currentLabel = `${Math.round(currentValue * 10) / 10}g`;
      targetLabel = `${target}g`;
      break;
    }
    case 'weekly_meals':
      currentValue = recentFoods.length;
      currentLabel = `${currentValue} meal${currentValue === 1 ? '' : 's'}`;
      targetLabel = `${target} meals`;
      break;
    default:
      break;
  }

  return {
    ...goal,
    category,
    isCustom: true,
    title: option?.label || 'Personal goal',
    progress: percent(currentValue, target),
    current: currentLabel,
    targetLabel,
  };
}

export default function GoalsScreen() {
  const tabBarClearance = useFloatingTabBarClearance();
  const navigation = useNavigation();
  const route = useRoute();
  const { unitSystem } = useUnits();
  
  const [customGoals, setCustomGoals] = useState([]);
  const [activity, setActivity] = useState({ runs: [], foods: [], workouts: [], steps: 0 });
  const [streakCount, setStreakCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [goalEditorVisible, setGoalEditorVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalPreset, setGoalPreset] = useState(null);
  const [healthGoals, setHealthGoals] = useState({ targetWeightKg: null, stepGoal: 8000, weighInIntervalDays: 7 });
  const [healthEditorVisible, setHealthEditorVisible] = useState(false);
  const [addGoalChoiceVisible, setAddGoalChoiceVisible] = useState(false);
  const [healthDraft, setHealthDraft] = useState({ targetWeight: '', steps: '8000', interval: '7' });
  const handledPromptRef = useRef(null);

  const displayedGoals = useMemo(() => customGoals.map((goal) => userGoalFromActivity(
      goal,
      activity.runs,
      activity.foods,
      activity.workouts,
      activity.steps,
      unitSystem,
    )), [customGoals, activity, unitSystem]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadProgress = async () => {
        const [runs, foods, workouts, savedGoals, savedHealthGoals] = await Promise.all([
          getRuns(),
          getFoods(),
          getWorkouts(),
          getGoals(),
          getHealthGoals(),
        ]);
        const hasStepGoal = (savedGoals || []).some((goal) => goal.metric === 'daily_steps');
        const steps = hasStepGoal ? await readTodaySteps() : 0;
        if (!active) return;
        const activityStreak = consecutiveDayStreak([
          ...(runs || []),
          ...(foods || []),
          ...(workouts || []),
        ]);
        setCustomGoals(savedGoals || []);
        setHealthGoals(savedHealthGoals);
        setActivity({ runs: runs || [], foods: foods || [], workouts: workouts || [], steps });
        setStreakCount(activityStreak);
        setHydrated(true);
      };
      loadProgress();
      return () => {
        active = false;
      };
    }, []),
  );

  // Fire a local notification the moment a goal hits 100% or the activity
  // streak extends to a new day, so the user gets a nudge without having
  // to open the app and check.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const checkGoalsAndStreak = async () => {
      const achievedIds = await getAchievedGoalIds();
      for (const goal of displayedGoals) {
        const isAchieved = goal.progress >= 100;
        const wasAchieved = achievedIds.includes(goal.id);
        if (isAchieved && !wasAchieved) {
          await markGoalAchieved(goal.id);
          if (!cancelled) await notifyGoalAchieved(goal.title);
        } else if (!isAchieved && wasAchieved) {
          // Goal fell back below target (e.g. a new week started) — allow
          // it to notify again next time it's completed.
          await resetAchievedGoal(goal.id);
        }
      }

      if (streakCount > 0) {
        const lastNotifiedStreak = await getLastNotifiedStreak();
        if (streakCount > lastNotifiedStreak) {
          await setLastNotifiedStreak(streakCount);
          if (!cancelled) await notifyStreakMilestone(streakCount);
        }
      } else {
        await setLastNotifiedStreak(0);
      }
    };

    checkGoalsAndStreak();
    return () => {
      cancelled = true;
    };
  }, [hydrated, displayedGoals, streakCount]);

  useEffect(() => {
    const promptId = route.params?.goalPromptId;
    if (!promptId || handledPromptRef.current === promptId) return;
    handledPromptRef.current = promptId;
    setEditingGoal(null);
    setGoalPreset({ category: 'Fitness', metric: 'daily_steps', target: 10000 });
    setGoalEditorVisible(true);
  }, [route.params?.goalPromptId]);

  const openNewGoal = () => {
    setEditingGoal(null);
    setGoalPreset(null);
    setGoalEditorVisible(true);
  };

  const openAddGoal = () => setAddGoalChoiceVisible(true);

  const openGoalEditor = (goal) => {
    if (!goal.isCustom) return;
    const savedGoal = customGoals.find((item) => item.id === goal.id);
    if (!savedGoal) return;
    setGoalPreset(null);
    setEditingGoal(savedGoal);
    setGoalEditorVisible(true);
  };

  const handleSaveGoal = async (goal) => {
    const existingStepGoal = !goal.id && goal.metric === 'daily_steps'
      ? customGoals.find((item) => item.metric === 'daily_steps')
      : null;
    const saved = await saveGoal(existingStepGoal ? { ...goal, id: existingStepGoal.id } : goal);
    setCustomGoals((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved];
    });
    setGoalEditorVisible(false);
    setEditingGoal(null);
    setGoalPreset(null);
  };

  const handleDeleteGoal = async (goalId) => {
    const next = await deleteGoal(goalId);
    setCustomGoals(next);
    setGoalEditorVisible(false);
    setEditingGoal(null);
    setGoalPreset(null);
  };

  const openHealthGoals = () => {
    const goalWeight = Number(healthGoals.targetWeightKg);
    setHealthDraft({
      targetWeight: goalWeight ? (unitSystem === 'metric' ? String(goalWeight) : String((goalWeight * 2.2046226218).toFixed(1))) : '',
      steps: String(healthGoals.stepGoal || 8000),
      interval: String(healthGoals.weighInIntervalDays || 7),
    });
    setHealthEditorVisible(true);
  };

  const saveHealthGoalSettings = async () => {
    const next = {
      targetWeightKg: Number(healthDraft.targetWeight) > 0 ? (unitSystem === 'metric' ? Number(healthDraft.targetWeight) : Number(healthDraft.targetWeight) / 2.2046226218) : null,
      stepGoal: Math.max(1000, Number(healthDraft.steps) || 8000),
      weighInIntervalDays: Math.max(1, Number(healthDraft.interval) || 7),
    };
    await saveHealthGoals(next);
    setHealthGoals(next);
    scheduleHealthReminders(await getNotificationPrefs(), next.weighInIntervalDays);
    setHealthEditorVisible(false);
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
      <ScreenHeader
        title="Goals"
        actions={[
          { icon: 'message-circle', onPress: () => navigation.navigate('Chat'), accessibilityLabel: 'Open Eugene' },
          { icon: 'settings', onPress: () => navigation.navigate('Settings'), accessibilityLabel: 'Open settings' },
        ]}
      />

      {!hydrated ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Activity streak */}
        <GlassCard floating style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <View style={styles.streakIconContainer}>
              <MaterialCommunityIcons name="fire" size={28} color={Colors.warning} />
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakCount}>{streakCount}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
              <Text style={styles.streakSubtitle}>{streakCount > 0 ? 'Based on your logged activity' : 'Log activity to start your streak'}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Active Goals Section */}
        <Text style={styles.sectionHeader}>ACTIVE GOALS</Text>
        {displayedGoals.length > 0 ? <GlassCard noPadding style={styles.cardGroup}>{displayedGoals.map((goal, index) => (
            <React.Fragment key={goal.id}>
            <TouchableOpacity
              style={styles.goalCard}
              onPress={() => openGoalEditor(goal)}
              activeOpacity={goal.isCustom ? 0.7 : 1}
            >
              <View style={styles.goalHeader}>
                <View style={styles.goalCategory}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(goal.category) }]} />
                  <Text style={styles.categoryText}>{goal.category}</Text>
                </View>
                <View style={styles.editBadge}>
                  <Feather name="edit-2" size={14} color={Colors.primary} />
                </View>
              </View>

              <Text style={styles.goalTitle}>{goal.title}</Text>

              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{`${goal.current} / ${goal.targetLabel}`}</Text>
              </View>
            </TouchableOpacity>
            {index < displayedGoals.length - 1 ? <View style={styles.goalDivider} /> : null}
            </React.Fragment>
          ))}</GlassCard> : <GlassCard style={styles.emptyGoalsCard}><View style={styles.emptyGoalsIcon}><Feather name="target" size={24} color={Colors.primary} /></View><Text style={styles.emptyGoalsTitle}>No active goals</Text><Text style={styles.emptyGoalsText}>Add a Nutrition or Fitness goal to start tracking progress.</Text></GlassCard>}

        {/* Add Goal Button */}
        <TouchableOpacity style={styles.addGoalButton} onPress={openAddGoal}>
          <Feather name="plus" size={20} color={Colors.textWhite} />
          <Text style={styles.addGoalText}>Add New Goal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.coachCard} onPress={() => navigation.navigate('Chat')}>
          <View style={styles.coachIconContainer}>
            <MaterialCommunityIcons name="robot" size={24} color={Colors.primary} />
          </View>
          <View style={styles.coachContent}>
            <Text style={styles.coachTitle}>AI Coach Suggestion</Text>
            <Text style={styles.coachSubtitle}>Ask Eugene for guidance based on your workouts and goals</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textLight} />
        </TouchableOpacity>

      </ScrollView>
      )}

      <GoalEditorModal
        visible={goalEditorVisible}
        goal={editingGoal}
        preset={goalPreset}
        unitSystem={unitSystem}
        onClose={() => {
          setGoalEditorVisible(false);
          setEditingGoal(null);
          setGoalPreset(null);
        }}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
      />
      <Modal visible={addGoalChoiceVisible} transparent animationType="fade" onRequestClose={() => setAddGoalChoiceVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.addGoalModal}>
          <Text style={styles.modalTitle}>Add a goal</Text>
          <Text style={styles.modalHint}>Choose what you’d like to set up or adjust.</Text>
          <TouchableOpacity style={styles.goalChoice} onPress={() => { setAddGoalChoiceVisible(false); openNewGoal(); }}>
            <View style={styles.goalChoiceIcon}><Feather name="target" size={20} color={Colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.goalChoiceTitle}>Fitness or nutrition</Text><Text style={styles.goalChoiceText}>Steps, runs, workouts, meals, or macros</Text></View><Feather name="chevron-right" size={20} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.goalChoice} onPress={() => { setAddGoalChoiceVisible(false); openHealthGoals(); }}>
            <View style={styles.goalChoiceIcon}><Feather name="trending-up" size={20} color={Colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.goalChoiceTitle}>Weight & movement</Text><Text style={styles.goalChoiceText}>Target weight, step goal, and weigh-in schedule</Text></View><Feather name="chevron-right" size={20} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.choiceCancel} onPress={() => setAddGoalChoiceVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
      <Modal visible={healthEditorVisible} transparent animationType="fade" onRequestClose={() => setHealthEditorVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.healthModal}>
          <Text style={styles.modalTitle}>Weight & movement goals</Text>
          <Text style={styles.modalLabel}>TARGET WEIGHT ({unitSystem === 'metric' ? 'KG' : 'LB'})</Text><TextInput style={styles.modalInput} value={healthDraft.targetWeight} onChangeText={(targetWeight) => setHealthDraft({ ...healthDraft, targetWeight })} keyboardType="decimal-pad" placeholder="Optional" />
          <Text style={styles.modalLabel}>DAILY STEP GOAL</Text><TextInput style={styles.modalInput} value={healthDraft.steps} onChangeText={(steps) => setHealthDraft({ ...healthDraft, steps })} keyboardType="number-pad" />
          <Text style={styles.modalLabel}>WEIGH-IN EVERY (DAYS)</Text><TextInput style={styles.modalInput} value={healthDraft.interval} onChangeText={(interval) => setHealthDraft({ ...healthDraft, interval })} keyboardType="number-pad" />
          <Text style={styles.modalHint}>Weekly is recommended. You can still log a weigh-in for any past or current date from Progress.</Text>
          <View style={styles.modalActions}><TouchableOpacity onPress={() => setHealthEditorVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.saveButton} onPress={saveHealthGoalSettings}><Text style={styles.saveText}>Save</Text></TouchableOpacity></View>
        </View></View>
      </Modal>

      </View>
    </View>
  );
}

function getCategoryColor(category) {
  return category === 'Nutrition' ? Colors.primary : Colors.workout;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  sectionHeader: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  cardGroup: {
    marginBottom: Spacing.lg,
  },
  healthGoalCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  standaloneHealthGoalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBackground, borderRadius: BorderRadius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, padding: Spacing.lg },
  healthGoalIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight, marginRight: Spacing.md },
  healthGoalTitle: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  healthGoalText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: 3 },
  
  // Streak Card
  streakCard: {
    marginBottom: Spacing.lg,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.difficultyModerate,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    lineHeight: 36,
  },
  streakLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginTop: -2,
  },
  streakSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  // Goal Cards
  goalCard: {
    padding: Spacing.lg,
  },
  goalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  editBadge: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGoalsCard: {
    alignItems: 'center',
  },
  emptyGoalsIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGoalsTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing.md,
  },
  emptyGoalsText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  inlineEmptyGoals: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  goalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    minWidth: 60,
    textAlign: 'right',
  },

  // Add Goal Button
  addGoalButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  addGoalText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textWhite,
    marginLeft: Spacing.sm,
  },

  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.primaryBorder,
  },
  coachIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  coachContent: { flex: 1 },
  coachTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  coachSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 19,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(16,22,28,.35)', justifyContent: 'flex-end', padding: Spacing.md },
  healthModal: { backgroundColor: Colors.elevatedSurface, borderRadius: BorderRadius.xxl, padding: Spacing.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.glassBorder },
  addGoalModal: { backgroundColor: Colors.elevatedSurface, borderRadius: BorderRadius.xxl, padding: Spacing.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.glassBorder },
  modalTitle: { color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, marginBottom: Spacing.lg },
  modalLabel: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, letterSpacing: .7, marginBottom: Spacing.xs },
  modalInput: { minHeight: 48, backgroundColor: Colors.controlFill, color: Colors.text, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: Typography.fontSize.md, marginBottom: Spacing.md },
  modalHint: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 17 },
  goalChoice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.backgroundSecondary, padding: Spacing.md, marginTop: Spacing.md },
  goalChoiceIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight },
  goalChoiceTitle: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  goalChoiceText: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 2 },
  choiceCancel: { alignSelf: 'center', padding: Spacing.md, marginTop: Spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.lg },
  cancelText: { color: Colors.textSecondary, fontSize: Typography.fontSize.md },
  saveButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  saveText: { color: Colors.textWhite, fontWeight: Typography.fontWeight.semibold },

});
