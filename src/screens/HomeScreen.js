import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';
import HealthHighlights from '../components/HealthHighlights';
import IntakeProgress from '../components/IntakeProgress';
import StepTracker from '../components/StepTracker';
import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import { getFoods, getUserProfile, todayLocalISO } from '../eugene/services/storage';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';

function greetingForTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const tabBarClearance = useFloatingTabBarClearance();
  const [firstName, setFirstName] = useState('');
  const [intake, setIntake] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0, calorieTarget: 1750, proteinTarget: 85, fatTarget: 60, carbsTarget: 220 });
  const [hydrated, setHydrated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getUserProfile(), getFoods()]).then(([profile, foods]) => {
        if (!active) return;
        const today = todayLocalISO();
        const totals = foods
          .filter((food) => String(food?.date || '').slice(0, 10) === today)
          .reduce((sum, food) => ({
            calories: sum.calories + (Number(food?.calories) || 0),
            protein: sum.protein + (Number(food?.macros?.protein_g) || 0),
            fat: sum.fat + (Number(food?.macros?.fat_g) || 0),
            carbs: sum.carbs + (Number(food?.macros?.carbs_g) || 0),
          }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

        setFirstName(profile?.firstName || '');
        setIntake({
          ...totals,
          calorieTarget: Number(profile?.calorieTarget) || 1750,
          proteinTarget: Number(profile?.proteinTarget) || 85,
          fatTarget: Number(profile?.fatTarget) || 60,
          carbsTarget: Number(profile?.carbsTarget) || 220,
        });
        setHydrated(true);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  if (!hydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          brandLabel="OneHealth"
          title={`${greetingForTime()}${firstName ? `, ${firstName}` : ''}`}
          actions={[
            { icon: 'message-circle', onPress: () => navigation.navigate('Chat'), accessibilityLabel: 'Open Eugene' },
            { icon: 'settings', onPress: () => navigation.navigate('Settings'), accessibilityLabel: 'Open settings' },
          ]}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: tabBarClearance }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <HealthHighlights />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps</Text>
            <StepTracker />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Intake</Text>
            <IntakeProgress {...intake} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Logs</Text>

            <GlassCard noPadding style={styles.logGroup}>
              <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('FoodLog')}>
                <View style={styles.cardIcon}>
                  <Ionicons name="camera-outline" size={26} color={Colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Log Food</Text>
                  <Text style={styles.cardSubtitle}>Add a meal by photo or text</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('WorkoutLog')}>
                <View style={styles.cardIcon}>
                  <Ionicons name="barbell-outline" size={24} color={Colors.workoutLog} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Log Workout</Text>
                  <Text style={styles.cardSubtitle}>Save a completed workout</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('MealLogs', { logType: 'meals', selectionId: Date.now() })}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="book-outline" size={26} color={Colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>View Logs</Text>
                  <Text style={styles.cardSubtitle}>Browse meals and workouts by week and day</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </GlassCard>
          </View>

        </ScrollView>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  logGroup: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.lg + 48 + Spacing.lg,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
