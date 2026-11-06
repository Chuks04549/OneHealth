import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';
import LiquidGlassBackButton from '../components/LiquidGlassBackButton';

const { width, height } = Dimensions.get('window');

export default function BrowseByMuscleScreen() {
  const navigation = useNavigation();
  const tabBarClearance = useFloatingTabBarClearance();
  const [selectedMuscle, setSelectedMuscle] = useState('chest');
  
  const muscleGroups = [
    { id: 'chest', name: 'Chest', scientific: 'Pectoralis major', aiScore: 96, color: Colors.primary },
    { id: 'back', name: 'Back', scientific: 'Latissimus dorsi', aiScore: 94, color: Colors.primary },
    { id: 'shoulders', name: 'Shoulders', scientific: 'Deltoid', aiScore: 92, color: Colors.primary },
    { id: 'arms', name: 'Arms', scientific: 'Biceps/Triceps', aiScore: 90, color: Colors.primary },
    { id: 'core', name: 'Core', scientific: 'Rectus abdominis', aiScore: 88, color: Colors.primary },
    { id: 'legs', name: 'Legs', scientific: 'Quadriceps', aiScore: 95, color: Colors.primary },
  ];

  const exercises = [
    { id: 1, name: 'Bench Press', sets: '3 sets x 12 reps', icon: 'dumbbell' },
    { id: 2, name: 'Incline Dumbbell Press', sets: '3 sets x 10 reps', icon: 'dumbbell' },
    { id: 3, name: 'Cable Fly', sets: '3 sets x 15 reps', icon: 'cable' },
    { id: 4, name: 'Push-ups', sets: '3 sets x 15 reps', icon: 'human' },
  ];

  const currentMuscle = muscleGroups.find(m => m.id === selectedMuscle);

  return (
    <View style={styles.safeArea}>
      
      {/* Header */}
      <View style={styles.header}>
        <LiquidGlassBackButton onPress={() => navigation.goBack()} iconSize={24} />
        <Text style={styles.headerTitle}>Browse by muscle</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Body Silhouette */}
        <View style={styles.silhouetteContainer}>
          <View style={styles.silhouette}>
            {/* Simplified body silhouette with highlighted areas */}
            <MaterialCommunityIcons name="human" size={200} color={Colors.textLight} />
            
            {/* Highlighted muscle areas (simplified representation) */}
            <View style={[styles.muscleHighlight, styles.chestHighlight]} />
            <View style={[styles.muscleHighlight, styles.coreHighlight]} />
            <View style={[styles.muscleHighlight, styles.legsHighlight]} />
          </View>
        </View>

        {/* Muscle Details Card */}
        <View style={styles.muscleDetailsCard}>
        
        {/* Muscle Info */}
        <View style={styles.muscleInfo}>
          <Text style={styles.muscleLabel}>{currentMuscle.name.toUpperCase()}</Text>
          <View style={styles.muscleHeader}>
            <Text style={styles.muscleName}>{currentMuscle.scientific}</Text>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>AI - {currentMuscle.aiScore}%</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
            <Text style={styles.primaryActionButtonText}>Train it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Prevent injury</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Avoid this</Text>
          </TouchableOpacity>
        </View>

        {/* Exercises List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.exercisesTitle}>Exercises</Text>
          <View style={styles.exerciseList}>
            {exercises.map((exercise) => (
              <TouchableOpacity 
                key={exercise.id} 
                style={styles.exerciseCard}
                onPress={() => {}}
              >
                <View style={styles.exerciseIconContainer}>
                  <MaterialCommunityIcons 
                    name={exercise.icon} 
                    size={20} 
                    color={Colors.primary} 
                  />
                </View>
                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseSets}>{exercise.sets}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add to Routine Button */}
        <TouchableOpacity style={styles.addToRoutineButton}>
          <Text style={styles.addToRoutineButtonText}>Add to my routine</Text>
        </TouchableOpacity>

        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  bodyScroll: { flex: 1 },
  bodyContent: { flexGrow: 1 },
  silhouetteContainer: {
    minHeight: Math.max(320, height * 0.4),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  silhouette: {
    position: 'relative',
    width: 200,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muscleHighlight: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    opacity: 0.3,
    borderRadius: BorderRadius.sm,
  },
  chestHighlight: {
    top: 80,
    width: 60,
    height: 40,
  },
  coreHighlight: {
    top: 140,
    width: 50,
    height: 60,
  },
  legsHighlight: {
    top: 220,
    width: 80,
    height: 80,
  },
  muscleDetailsCard: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  muscleInfo: {
    marginBottom: Spacing.lg,
  },
  muscleLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  muscleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  muscleName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  aiTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  aiTagText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  primaryActionButton: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
  },
  primaryActionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textWhite,
  },
  exercisesSection: {
    marginBottom: Spacing.xl,
  },
  exercisesTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  exerciseList: {
    gap: Spacing.sm,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  exerciseSets: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  addToRoutineButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  addToRoutineButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textWhite,
  },
});
