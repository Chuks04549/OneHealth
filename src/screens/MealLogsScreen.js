import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  deleteFood,
  deleteWorkout,
  deleteRun,
  getFoods,
  getWorkouts,
  getRuns,
} from '../eugene/services/storage';
import { deletePersistedMealPhoto } from '../foodlog/services/mealPhotoStorage';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import AskEugeneText from '../components/AskEugeneText';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';
import LiquidGlassBackButton from '../components/LiquidGlassBackButton';
import { formatDistance, formatPace, useUnits } from '../contexts/UnitContext';

function parseLogDate(value) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(date) {
  const result = new Date(date);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  result.setHours(12, 0, 0, 0);
  return result;
}

function weekTitle(weekStart) {
  const currentWeek = dateKey(startOfWeek(new Date()));
  if (dateKey(weekStart) === currentWeek) return 'This Week';
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return `${weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function groupLogsByWeekAndDay(logs) {
  const weeks = new Map();
  const currentWeek = startOfWeek(new Date());
  weeks.set(dateKey(currentWeek), { start: currentWeek, logsByDay: new Map() });

  logs.forEach((log) => {
    const date = parseLogDate(log.date) || new Date(0);
    const week = startOfWeek(date);
    const weekId = dateKey(week);
    const dayId = dateKey(date);
    if (!weeks.has(weekId)) weeks.set(weekId, { start: week, logsByDay: new Map() });
    const logsByDay = weeks.get(weekId).logsByDay;
    if (!logsByDay.has(dayId)) logsByDay.set(dayId, []);
    logsByDay.get(dayId).push(log);
  });

  return [...weeks.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([weekId, week]) => ({
      id: weekId,
      isCurrent: weekId === dateKey(currentWeek),
      title: weekTitle(week.start),
      days: Array.from({ length: 7 }, (_, index) => {
        const date = new Date(week.start);
        date.setDate(date.getDate() + index);
        const id = dateKey(date);
        return {
          id,
          label: date.toLocaleDateString([], { weekday: 'long' }),
          dateLabel: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          isToday: id === dateKey(new Date()),
          logs: week.logsByDay.get(id) || [],
        };
      }).filter((day) => weekId !== dateKey(currentWeek) || day.id <= dateKey(new Date())),
    }));
}

function macroSummary(macros) {
  if (!macros) return null;
  return `${macros.protein_g || 0}g protein · ${macros.carbs_g || 0}g carbs · ${macros.fat_g || 0}g fat`;
}

const EFFORT_LABEL = { easy: 'Easy', moderate: 'Moderate', hard: 'Hard' };

export default function MealLogsScreen() {
  const tabBarClearance = useFloatingTabBarClearance();
  const navigation = useNavigation();
  const route = useRoute();
  const { unitSystem } = useUnits();
  const [foods, setFoods] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [runs, setRuns] = useState([]);
  const [logType, setLogType] = useState('meals');
  const [loading, setLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState(() => ({
    [dateKey(startOfWeek(new Date()))]: true,
  }));
  const [expandedDays, setExpandedDays] = useState({});
  const activeLogs = logType === 'meals' ? foods : logType === 'workouts' ? workouts : runs;
  const weeks = groupLogsByWeekAndDay(activeLogs);

  useEffect(() => {
    const requestedType = route.params?.logType;
    if (requestedType !== 'meals' && requestedType !== 'workouts' && requestedType !== 'runs') return;
    setLogType(requestedType);
    setExpandedDays({});
  }, [route.params?.logType, route.params?.selectionId]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const [savedFoods, savedWorkouts, savedRuns] = await Promise.all([getFoods(), getWorkouts(), getRuns()]);
    setFoods(savedFoods || []);
    setWorkouts(savedWorkouts || []);
    setRuns(savedRuns || []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs]),
  );

  const requestDeleteFood = (food) => {
    Alert.alert(
      'Delete meal log?',
      `${food.description} will be removed from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePersistedMealPhoto(food.photoUri).catch(() => {});
            const next = await deleteFood(food.id);
            setFoods(next);
          },
        },
      ],
    );
  };

  const requestDeleteWorkout = (workout) => {
    Alert.alert(
      'Delete workout log?',
      `${workout.title} will be removed from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const next = await deleteWorkout(workout.id);
            setWorkouts(next);
          },
        },
      ],
    );
  };

  const requestDeleteRun = (run) => {
    Alert.alert(
      'Delete run log?',
      `This ${formatDistance(run.km, unitSystem)} run will be removed from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const next = await deleteRun(run.id);
            setRuns(next);
          },
        },
      ],
    );
  };

  const renderFood = (food) => {
    const macros = macroSummary(food.macros);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('MealLogDetail', { foodId: food.id })}
        accessibilityRole="button"
        accessibilityLabel={`View nutrition details for ${food.description}`}
      >
        {food.photoUri ? <Image source={{ uri: food.photoUri }} style={styles.photo} /> : null}
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.source}>{food.source === 'photo_estimate' ? 'PHOTO ESTIMATE' : 'MANUAL ENTRY'}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(event) => {
                event.stopPropagation?.();
                requestDeleteFood(food);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${food.description}`}
            >
              <Feather name="trash-2" size={17} color={Colors.error} />
            </TouchableOpacity>
          </View>
          <AskEugeneText style={styles.title}>{food.description}</AskEugeneText>
          {food.calories != null ? (
            <Text style={styles.calories}>{food.calories} kcal</Text>
          ) : (
            <Text style={styles.calories}>Manual entry</Text>
          )}
          {macros ? <AskEugeneText style={styles.macros} text={`${food.description}: ${macros}`}>{macros}</AskEugeneText> : null}
          {food.portion?.grams ? <Text style={styles.detail}>Estimated serving: {food.portion.grams} g</Text> : null}
          {food.note ? <Text style={styles.note}>“{food.note}”</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderWorkout = (workout) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[styles.source, styles.workoutSource]}>WORKOUT</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => requestDeleteWorkout(workout)}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${workout.title}`}
          >
            <Feather name="trash-2" size={17} color={Colors.error} />
          </TouchableOpacity>
        </View>
        <AskEugeneText style={styles.title}>{workout.title}</AskEugeneText>
        <Text style={styles.workoutMeta}>{workout.durationMin || 0} min</Text>
        {workout.note ? <AskEugeneText style={styles.note}>“{workout.note}”</AskEugeneText> : null}
      </View>
    </View>
  );

  const renderRun = (run) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[styles.source, styles.runSource]}>RUN</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => requestDeleteRun(run)}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${formatDistance(run.km, unitSystem)} run`}
          >
            <Feather name="trash-2" size={17} color={Colors.error} />
          </TouchableOpacity>
        </View>
        <AskEugeneText style={styles.title}>{formatDistance(run.km, unitSystem)} · {run.durationMin} min</AskEugeneText>
        <Text style={styles.runMeta}>
          {formatPace(run.paceMinPerKm, unitSystem)} · {EFFORT_LABEL[run.effort] || run.effort}
        </Text>
        {run.note ? <AskEugeneText style={styles.note}>“{run.note}”</AskEugeneText> : null}
      </View>
    </View>
  );

  const toggleWeek = (weekId) => {
    setExpandedWeeks((current) => ({ ...current, [weekId]: !current[weekId] }));
  };

  const toggleDay = (dayId) => {
    setExpandedDays((current) => ({ ...current, [dayId]: !current[dayId] }));
  };

  const renderWeek = ({ item: week }) => {
    const expanded = Boolean(expandedWeeks[week.id]);
    return (
      <View style={styles.weekFolder}>
        <TouchableOpacity
          style={styles.weekFolderHeader}
          onPress={() => toggleWeek(week.id)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <View style={[
            styles.folderIcon,
            logType === 'workouts' && styles.workoutFolderIcon,
            logType === 'runs' && styles.runFolderIcon,
          ]}>
            <Feather
              name={expanded ? 'folder-minus' : 'folder'}
              size={21}
              color={logType === 'workouts' ? Colors.workoutLog : logType === 'runs' ? Colors.run : Colors.primary}
            />
          </View>
          <View style={styles.weekFolderText}>
            <View style={styles.weekTitleRow}>
              {week.isCurrent ? <View style={styles.currentWeekDot} /> : null}
              <Text style={styles.weekFolderTitle}>{week.title}</Text>
            </View>
          </View>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textLight} />
        </TouchableOpacity>

        {expanded ? (
          <View style={styles.weekContents}>
            {week.days.map((day, dayIndex) => (
              <View key={day.id} style={[styles.dayGroup, dayIndex > 0 && styles.dayGroupBorder]}>
                <TouchableOpacity
                  style={styles.dayRow}
                  onPress={() => navigation.navigate('DailyLogDetail', { date: day.id })}
                  accessibilityRole="button"
                  accessibilityHint="Opens the complete daily log"
                >
                  <View style={styles.dayNameRow}>
                    {day.isToday ? <View style={styles.todayDot} /> : <View style={styles.dotSpacer} />}
                    <Text style={[styles.dayName, day.isToday && styles.todayName]}>{day.label}</Text>
                  </View>
                  <View style={styles.dayMeta}>
                    <Text style={styles.dayDate}>{day.dateLabel}</Text>
                    <Text style={[
                      styles.dayCount,
                      logType === 'workouts' && styles.workoutDayCount,
                      logType === 'runs' && styles.runDayCount,
                    ]}>{day.logs.length}</Text>
                    <Feather name="chevron-right" size={17} color={Colors.textLight} />
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.backButton}><LiquidGlassBackButton onPress={() => navigation.goBack()} /></View>
        <Text style={styles.headerTitle}>Logs</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (logType === 'meals') navigation.navigate('FoodLog');
            else if (logType === 'workouts') navigation.navigate('WorkoutLog');
            else navigation.navigate('Chat');
          }}
        >
          <Feather
            name="plus"
            size={18}
            color={logType === 'meals' ? Colors.primary : logType === 'workouts' ? Colors.workoutLog : Colors.run}
          />
          <Text style={[
            styles.addButtonText,
            logType === 'workouts' && styles.workoutAddText,
            logType === 'runs' && styles.runAddText,
          ]}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logTypeToggle} accessibilityRole="tablist">
        {[
          { id: 'meals', label: 'Meals', icon: 'coffee' },
          { id: 'workouts', label: 'Workouts', icon: 'activity' },
          { id: 'runs', label: 'Runs', icon: 'trending-up' },
        ].map((option) => {
          const selected = logType === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.logTypeOption,
                selected && styles.logTypeOptionSelected,
                selected && option.id === 'workouts' && styles.workoutLogTypeOptionSelected,
                selected && option.id === 'runs' && styles.runLogTypeOptionSelected,
              ]}
              onPress={() => {
                setLogType(option.id);
                setExpandedDays({});
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Feather name={option.icon} size={16} color={selected ? Colors.textWhite : Colors.textSecondary} />
              <Text style={[styles.logTypeText, selected && styles.logTypeTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={weeks}
          keyExtractor={(item) => `${logType}-${item.id}`}
          renderItem={renderWeek}
          extraData={logType}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarClearance }]}
          showsVerticalScrollIndicator={false}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  backButton: { width: 72, minHeight: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { flex: 1, textAlign: 'center', color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  addButton: { width: 72, minHeight: 40, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  addButtonText: { color: Colors.primary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  workoutAddText: { color: Colors.workoutLog },
  runAddText: { color: Colors.run },
  logTypeToggle: { flexDirection: 'row', marginHorizontal: Spacing.xl, marginTop: Spacing.lg, padding: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundSecondary, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  logTypeOption: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.full },
  logTypeOptionSelected: { backgroundColor: Colors.primary },
  workoutLogTypeOptionSelected: { backgroundColor: Colors.workoutLog },
  runLogTypeOptionSelected: { backgroundColor: Colors.run },
  logTypeText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  logTypeTextSelected: { color: Colors.textWhite },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  weekFolder: { backgroundColor: Colors.cardBackground, borderRadius: BorderRadius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.lg },
  weekFolderHeader: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  folderIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  workoutFolderIcon: { backgroundColor: Colors.workoutLogSoft },
  runFolderIcon: { backgroundColor: Colors.runSoft },
  weekFolderText: { flex: 1 },
  weekTitleRow: { flexDirection: 'row', alignItems: 'center' },
  currentWeekDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: Spacing.sm },
  weekFolderTitle: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  weekContents: { borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.backgroundSecondary },
  dayGroup: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  dayGroupBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayNameRow: { flexDirection: 'row', alignItems: 'center' },
  todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: Spacing.sm },
  dotSpacer: { width: 8, height: 8, marginRight: Spacing.sm },
  dayName: { color: Colors.text, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  todayName: { color: Colors.primaryDark },
  dayDate: { color: Colors.textLight, fontSize: Typography.fontSize.xs },
  dayMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dayCount: { minWidth: 22, textAlign: 'center', overflow: 'hidden', color: Colors.primaryDark, backgroundColor: Colors.primaryLight, borderRadius: 11, paddingHorizontal: 6, paddingVertical: 2, fontSize: 11, fontWeight: Typography.fontWeight.bold },
  workoutDayCount: { color: Colors.workoutLogDark, backgroundColor: Colors.workoutLogSoft },
  runDayCount: { color: Colors.runDark, backgroundColor: Colors.runSoft },
  noLogs: { color: Colors.textLight, fontSize: Typography.fontSize.xs, marginTop: Spacing.sm, marginLeft: 16 },
  dayLogs: { marginTop: Spacing.md },
  card: { overflow: 'hidden', backgroundColor: Colors.cardBackground, borderRadius: BorderRadius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, marginBottom: Spacing.lg },
  photo: { width: '100%', height: 180, backgroundColor: Colors.backgroundSecondary },
  cardBody: { padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  source: { flex: 1, color: Colors.primary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, letterSpacing: 0.8 },
  deleteButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, marginTop: Spacing.sm },
  calories: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: Spacing.xs },
  macros: { color: Colors.text, fontSize: Typography.fontSize.sm, marginTop: Spacing.sm },
  detail: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: Spacing.xs },
  note: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, fontStyle: 'italic', marginTop: Spacing.sm },
  workoutSource: { color: Colors.workoutLog },
  workoutMeta: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: Spacing.xs },
  runSource: { color: Colors.run },
  runMeta: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: Spacing.xs },
});
