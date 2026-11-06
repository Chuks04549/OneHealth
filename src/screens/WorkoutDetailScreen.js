import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { findExerciseById } from '../data/exercises';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import ExerciseVideoPreview from '../components/ExerciseVideoPreview';
import { getExerciseEquipmentIcon } from '../utils/exerciseIcons';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';
import LiquidGlassBackButton from '../components/LiquidGlassBackButton';
import LiquidGlassIconButton from '../components/LiquidGlassIconButton';

function DetailSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const navigation = useNavigation();
  const tabBarClearance = useFloatingTabBarClearance();
  const route = useRoute();
  const item = findExerciseById(route.params?.exerciseId);

  if (!item) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingTitle}>Exercise not found</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Back to library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const askEugene = () => navigation.navigate('Chat', {
    draft: `Tell me more about how to safely perform ${item.name}.`,
    draftId: Date.now(),
  });

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <LiquidGlassBackButton onPress={() => navigation.goBack()} size={42} iconSize={23} accessibilityLabel="Back to workouts" />
        <Text style={styles.headerTitle}>Guide</Text>
        <LiquidGlassIconButton icon="message-circle" size={42} color={Colors.primary} onPress={askEugene} accessibilityLabel={`Ask Eugene about ${item.name}`} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name={getExerciseEquipmentIcon(item)} size={34} color={Colors.primary} />
          </View>
          <Text selectable style={styles.title}>{item.name}</Text>
          <Text selectable style={styles.summary}>{item.summary}</Text>
          <View style={styles.tags}>
            <View style={styles.tag}><Text style={styles.tagText}>{item.category}</Text></View>
            {item.muscles.map((muscle) => (
              <View key={muscle} style={styles.tag}>
                <Text selectable style={styles.tagText}>{muscle}</Text>
              </View>
            ))}
            <View style={[styles.tag, styles.equipmentTag]}>
              <Feather name="tool" size={14} color={Colors.foodDark} />
              <Text selectable style={[styles.tagText, styles.equipmentTagText]}>{item.equipment}</Text>
            </View>
          </View>
        </View>

        <ExerciseVideoPreview exerciseName={item.name} />

        <DetailSection title="Set up">
          <Text selectable style={styles.bodyText}>{item.setup}</Text>
        </DetailSection>

        <DetailSection title="How to do it">
          {item.steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
              <Text selectable style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </DetailSection>

        <DetailSection title="Breathing and form cues">
          <View style={styles.tipCard}>
            <Feather name="check-circle" size={20} color={Colors.primary} />
            <Text selectable style={styles.tipText}>{item.cues}</Text>
          </View>
        </DetailSection>

        <DetailSection title="Common mistakes">
          {item.mistakes.map((mistake) => (
            <View key={mistake} style={styles.bulletRow}>
              <Feather name="x" size={17} color={Colors.error} />
              <Text selectable style={styles.bulletText}>{mistake}</Text>
            </View>
          ))}
        </DetailSection>

        <TouchableOpacity style={styles.primaryButton} onPress={askEugene}>
          <Feather name="message-circle" size={19} color={Colors.textWhite} />
          <Text style={styles.primaryButtonText}>Ask Eugene about this exercise</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 64,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { flex: 1, textAlign: 'center', color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  hero: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  title: { color: Colors.text, fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, textAlign: 'center' },
  summary: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 21, textAlign: 'center', marginTop: Spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, paddingVertical: 6, paddingHorizontal: Spacing.md },
  tagText: { color: Colors.primaryDark, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  equipmentTag: { backgroundColor: Colors.foodSoft },
  equipmentTagText: { color: Colors.foodDark },
  section: { marginTop: Spacing.xxl },
  sectionTitle: { color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, marginBottom: Spacing.md },
  bodyText: { color: Colors.textSecondary, fontSize: Typography.fontSize.md, lineHeight: 23 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, marginTop: 1 },
  stepNumberText: { color: Colors.textWhite, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold },
  stepText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.fontSize.md, lineHeight: 23 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  tipText: { flex: 1, color: Colors.text, fontSize: Typography.fontSize.md, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  bulletText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.fontSize.md, lineHeight: 22 },
  primaryButton: { minHeight: 52, marginTop: Spacing.xl, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  primaryButtonText: { color: Colors.textWhite, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  missingContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  missingTitle: { color: Colors.text, fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold },
});
