import React, { useCallback, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  Switch, 
  Modal,
  TextInput,
  TouchableOpacity, 
  StatusBar,
  Platform 
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';
import { useAppAppearance } from '../contexts/AppearanceContext';
import { useUnits } from '../contexts/UnitContext';
import { getNotificationPrefs, getUserProfile, saveNotificationPrefs, saveUserProfile } from '../eugene/services/storage';
import { ensureNotificationPermissions, scheduleHealthReminders } from '../utils/notifications';
import { DEFAULT_USER_PROFILE } from '../utils/profileUtils';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';
import LiquidGlassBackButton from '../components/LiquidGlassBackButton';
import GlassCard from '../components/GlassCard';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const tabBarClearance = useFloatingTabBarClearance();
  const { preference: appearancePreference, setPreference: setAppearancePreference } = useAppAppearance();
  const { unitSystem, setUnitSystem } = useUnits();
  
  // Notification States
  const [dailyNudges, setDailyNudges] = useState(true);
  const [goalStreakAlerts, setGoalStreakAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [weightReminders, setWeightReminders] = useState(true);
  const [weeklyProgressAlerts, setWeeklyProgressAlerts] = useState(true);

  const [profile, setProfile] = useState(DEFAULT_USER_PROFILE);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_USER_PROFILE);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getUserProfile().then((savedProfile) => {
        if (active) setProfile(savedProfile || DEFAULT_USER_PROFILE);
      });
      getNotificationPrefs().then((prefs) => {
        if (!active) return;
        setDailyNudges(prefs.dailyNudges);
        setGoalStreakAlerts(prefs.goalStreakAlerts);
        setWeeklySummary(prefs.weeklySummary);
        setWeightReminders(prefs.weightReminders);
        setWeeklyProgressAlerts(prefs.weeklyProgressAlerts);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const toggleDailyNudges = async (value) => {
    setDailyNudges(value);
    await saveNotificationPrefs({ dailyNudges: value });
    if (value) await ensureNotificationPermissions();
    scheduleHealthReminders({ dailyNudges: value, weeklySummary, weightReminders });
  };

  const toggleGoalStreakAlerts = async (value) => {
    setGoalStreakAlerts(value);
    await saveNotificationPrefs({ goalStreakAlerts: value });
    if (value) ensureNotificationPermissions();
  };

  const toggleSummary = async (value) => {
    setWeeklySummary(value);
    await saveNotificationPrefs({ weeklySummary: value });
    if (value) await ensureNotificationPermissions();
    scheduleHealthReminders({ dailyNudges, weeklySummary: value, weightReminders });
  };

  const toggleWeightReminders = async (value) => {
    setWeightReminders(value);
    await saveNotificationPrefs({ weightReminders: value });
    if (value) await ensureNotificationPermissions();
    scheduleHealthReminders({ dailyNudges, weeklySummary, weightReminders: value });
  };

  const toggleWeeklyProgressAlerts = async (value) => {
    setWeeklyProgressAlerts(value);
    await saveNotificationPrefs({ weeklyProgressAlerts: value });
    if (value) ensureNotificationPermissions();
  };

  const heightText = unitSystem === 'metric'
    ? `${Math.round(Number(profile.heightCm) || 0)} cm`
    : (() => {
        const totalInches = (Number(profile.heightCm) || 0) / 2.54;
        let feet = Math.floor(totalInches / 12);
        let inches = Math.round(totalInches - (feet * 12));
        if (inches === 12) {
          feet += 1;
          inches = 0;
        }
        return `${feet}′ ${inches}″`;
      })();
  const weightText = unitSystem === 'metric'
    ? `${Math.round(Number(profile.weightKg) || 0)} kg`
    : `${Math.round((Number(profile.weightKg) || 0) * 2.2046226218)} lb`;
  const profileRows = [
    { label: 'Name', value: `${profile.firstName} ${profile.lastName}`.trim() || 'Not set', icon: 'user' },
    { label: 'Sex', value: profile.sex ? profile.sex[0].toUpperCase() + profile.sex.slice(1) : '—', icon: 'users' },
    { label: 'Age', value: `${profile.age} years`, icon: 'calendar' },
    { label: 'Height', value: heightText, icon: 'arrow-up' },
    { label: 'Weight', value: weightText, icon: 'activity' },
    { label: 'Goal', value: profile.bodyGoal === 'gain' ? 'Gain muscle' : profile.bodyGoal === 'lose' ? 'Lose weight' : 'Maintain weight', icon: 'flag' },
    { label: 'Calorie target', value: `${Math.round(profile.calorieTarget).toLocaleString()} kcal`, icon: 'target' },
    { label: 'Protein target', value: `${Math.round(profile.proteinTarget)} g`, icon: 'zap' },
    { label: 'Fat target', value: `${Math.round(profile.fatTarget)} g`, icon: 'circle' },
    { label: 'Carbs target', value: `${Math.round(profile.carbsTarget)} g`, icon: 'battery' },
  ];

  const openProfileEditor = () => {
    const totalInches = Number(profile.heightCm) / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round((totalInches - feet * 12) * 10) / 10;
    setDraft({
      ...profile,
      heightInput: unitSystem === 'metric' ? String(profile.heightCm) : String(feet),
      inchesInput: unitSystem === 'metric' ? '' : String(inches),
      weightInput: unitSystem === 'metric' ? String(profile.weightKg) : String(Math.round(profile.weightKg * 2.2046226218 * 10) / 10),
    });
    setEditingProfile(true);
  };

  const saveProfileEdits = async () => {
    const heightCm = unitSystem === 'metric'
      ? Number(draft.heightInput)
      : ((Number(draft.heightInput) * 12) + Number(draft.inchesInput || 0)) * 2.54;
    const weightKg = unitSystem === 'metric'
      ? Number(draft.weightInput)
      : Number(draft.weightInput) / 2.2046226218;
    const saved = await saveUserProfile({
      ...draft,
      heightCm,
      weightKg,
      age: Number(draft.age),
      calorieTarget: Number(draft.calorieTarget),
      proteinTarget: Number(draft.proteinTarget),
      fatTarget: Number(draft.fatTarget),
      carbsTarget: Number(draft.carbsTarget),
      // Saving real details here counts as finishing setup.
      onboardingComplete: true,
      onboardingSkipped: false,
    });
    setProfile(saved);
    setEditingProfile(false);
  };

  return (
    <View style={styles.safeArea}>
      
      {/* Header */}
      <View style={styles.header}>
        <LiquidGlassBackButton onPress={() => navigation.goBack()} size={44} />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* SECTION: YOUR PROFILE */}
        <Text style={styles.sectionHeader}>YOUR PROFILE</Text>
        <GlassCard noPadding style={styles.cardGroup}>
          <TouchableOpacity
            style={[styles.row, !profileExpanded && styles.lastRow]}
            onPress={() => setProfileExpanded((expanded) => !expanded)}
            accessibilityRole="button"
            accessibilityState={{ expanded: profileExpanded }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="info" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.rowText}>Information</Text>
            </View>
            <Feather name={profileExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textLight} />
          </TouchableOpacity>
          {profileExpanded ? (
            <View style={styles.profileDetails}>
              {profileRows.map((item, index) => (
                <View key={item.label} style={[styles.profileRow, index === profileRows.length - 1 && styles.profileRowLast]}>
                  <View style={styles.rowLeft}>
                    <Feather name={item.icon} size={16} color={Colors.textSecondary} style={styles.profileIcon} />
                    <Text style={styles.profileLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.profileValue} numberOfLines={1}>{item.value}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.editProfileButton} onPress={openProfileEditor}>
                <Feather name="edit-2" size={16} color={Colors.textWhite} />
                <Text style={styles.editProfileText}>Edit information</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </GlassCard>

        <Modal visible={editingProfile} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditingProfile(false)}>
          <View style={styles.editorScreen}>
            <View style={styles.editorHeader}>
              <TouchableOpacity onPress={() => setEditingProfile(false)}><Text style={styles.editorCancel}>Cancel</Text></TouchableOpacity>
              <Text style={styles.editorTitle}>Edit information</Text>
              <TouchableOpacity onPress={saveProfileEdits}><Text style={styles.editorSave}>Save</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.editorLabel}>FIRST NAME</Text>
              <TextInput style={styles.editorInput} value={String(draft.firstName)} onChangeText={(value) => setDraft((current) => ({ ...current, firstName: value }))} />
              <Text style={styles.editorLabel}>LAST NAME</Text>
              <TextInput style={styles.editorInput} value={String(draft.lastName)} onChangeText={(value) => setDraft((current) => ({ ...current, lastName: value }))} />
              <Text style={styles.editorLabel}>SEX</Text>
              <View style={styles.editorChoices}>
                {['female', 'male'].map((option) => (
                  <TouchableOpacity key={option} style={[styles.editorChoice, draft.sex === option && styles.editorChoiceActive]} onPress={() => setDraft((current) => ({ ...current, sex: option }))}>
                    <Text style={[styles.editorChoiceText, draft.sex === option && styles.editorChoiceTextActive]}>{option[0].toUpperCase() + option.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.editorLabel}>AGE</Text>
              <TextInput style={styles.editorInput} value={String(draft.age)} keyboardType="number-pad" onChangeText={(value) => setDraft((current) => ({ ...current, age: value.replace(/\D/g, '') }))} />
              <Text style={styles.editorLabel}>HEIGHT ({unitSystem === 'metric' ? 'CM' : 'FT · IN'})</Text>
              <View style={styles.editorMeasurementRow}>
                <TextInput style={styles.editorMeasurementInput} value={String(draft.heightInput ?? '')} keyboardType="decimal-pad" onChangeText={(value) => setDraft((current) => ({ ...current, heightInput: value }))} />
                {unitSystem === 'imperial' ? <TextInput style={styles.editorMeasurementInput} value={String(draft.inchesInput ?? '')} keyboardType="decimal-pad" onChangeText={(value) => setDraft((current) => ({ ...current, inchesInput: value }))} /> : null}
              </View>
              <Text style={styles.editorLabel}>WEIGHT ({unitSystem === 'metric' ? 'KG' : 'LB'})</Text>
              <TextInput style={styles.editorInput} value={String(draft.weightInput ?? '')} keyboardType="decimal-pad" onChangeText={(value) => setDraft((current) => ({ ...current, weightInput: value }))} />
              <Text style={styles.editorLabel}>GOAL</Text>
              <View style={styles.editorChoices}>
                {[
                  { key: 'maintain', label: 'Maintain' },
                  { key: 'gain', label: 'Gain muscle' },
                  { key: 'lose', label: 'Lose weight' },
                ].map((option) => (
                  <TouchableOpacity key={option.key} style={[styles.editorChoice, draft.bodyGoal === option.key && styles.editorChoiceActive]} onPress={() => setDraft((current) => ({ ...current, bodyGoal: option.key }))}>
                    <Text style={[styles.editorChoiceText, draft.bodyGoal === option.key && styles.editorChoiceTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.editorLabel}>CALORIE TARGET (KCAL)</Text>
              <TextInput style={styles.editorInput} value={String(draft.calorieTarget)} keyboardType="number-pad" onChangeText={(value) => setDraft((current) => ({ ...current, calorieTarget: value.replace(/\D/g, '') }))} />
              <Text style={styles.editorLabel}>PROTEIN TARGET (G)</Text>
              <TextInput style={styles.editorInput} value={String(draft.proteinTarget)} keyboardType="number-pad" onChangeText={(value) => setDraft((current) => ({ ...current, proteinTarget: value.replace(/\D/g, '') }))} />
              <Text style={styles.editorLabel}>FAT TARGET (G)</Text>
              <TextInput style={styles.editorInput} value={String(draft.fatTarget)} keyboardType="number-pad" onChangeText={(value) => setDraft((current) => ({ ...current, fatTarget: value.replace(/\D/g, '') }))} />
              <Text style={styles.editorLabel}>CARBS TARGET (G)</Text>
              <TextInput style={styles.editorInput} value={String(draft.carbsTarget)} keyboardType="number-pad" onChangeText={(value) => setDraft((current) => ({ ...current, carbsTarget: value.replace(/\D/g, '') }))} />
            </ScrollView>
          </View>
        </Modal>

        {/* SECTION: NOTIFICATIONS */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <GlassCard noPadding style={styles.cardGroup}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="bell" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.rowText}>Daily nudges</Text>
            </View>
            <Switch
              value={dailyNudges}
              onValueChange={toggleDailyNudges}
              trackColor={{ false: '#E2E2E2', true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.row, styles.lastRow]}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="trophy-outline" size={19} color={Colors.textSecondary} />
              </View>
              <Text style={styles.rowText}>Goal & streak alerts</Text>
            </View>
            <Switch
              value={goalStreakAlerts}
              onValueChange={toggleGoalStreakAlerts}
              trackColor={{ false: '#E2E2E2', true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        <GlassCard noPadding style={[styles.cardGroup, { marginTop: Spacing.sm }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}><Feather name="calendar" size={18} color={Colors.textSecondary} /></View>
              <Text style={styles.rowText}>Weekly summary</Text>
            </View>
            <Switch value={weeklySummary} onValueChange={toggleSummary} trackColor={{ false: '#E2E2E2', true: Colors.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}><Feather name="trending-up" size={18} color={Colors.textSecondary} /></View>
              <Text style={styles.rowText}>Progress alerts (weekly & PRs)</Text>
            </View>
            <Switch value={weeklyProgressAlerts} onValueChange={toggleWeeklyProgressAlerts} trackColor={{ false: '#E2E2E2', true: Colors.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={[styles.row, styles.lastRow]}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}><Feather name="activity" size={18} color={Colors.textSecondary} /></View>
              <Text style={styles.rowText}>Weigh-in reminders</Text>
            </View>
            <Switch value={weightReminders} onValueChange={toggleWeightReminders} trackColor={{ false: '#E2E2E2', true: Colors.primary }} thumbColor="#FFFFFF" />
          </View>
        </GlassCard>

        {/* SECTION: UNITS */}
        <Text style={styles.sectionHeader}>UNITS</Text>
        <GlassCard noPadding style={styles.cardGroup}>
          <View style={styles.unitToggleContainer}>
            <TouchableOpacity 
              style={[styles.unitButton, unitSystem === 'metric' && styles.unitButtonActive]}
              onPress={() => setUnitSystem('metric')}
            >
              <Text style={[styles.unitButtonText, unitSystem === 'metric' && styles.unitButtonTextActive]}>Metric</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.unitButton, unitSystem === 'imperial' && styles.unitButtonActive]}
              onPress={() => setUnitSystem('imperial')}
            >
              <Text style={[styles.unitButtonText, unitSystem === 'imperial' && styles.unitButtonTextActive]}>Imperial</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.unitFooterRow}>
            <Feather name="paperclip" size={14} color={Colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.unitSubtext}>
              {unitSystem === 'metric' ? 'Kilograms, kilometers, °C' : 'Pounds, miles, °F'}
            </Text>
          </View>
        </GlassCard>

        {/* SECTION: APPEARANCE */}
        <Text style={styles.sectionHeader}>APPEARANCE</Text>
        <GlassCard noPadding style={styles.cardGroup}>
          <View style={styles.appearanceToggleContainer}>
            {[
              { key: 'system', label: 'System', icon: 'smartphone' },
              { key: 'light', label: 'Light', icon: 'sun' },
              { key: 'dark', label: 'Dark', icon: 'moon' },
            ].map((option) => {
              const selected = appearancePreference === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.appearanceButton, selected && styles.appearanceButtonActive]}
                  onPress={() => setAppearancePreference(option.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Feather name={option.icon} size={16} color={selected ? Colors.textWhite : Colors.textSecondary} />
                  <Text style={[styles.appearanceButtonText, selected && styles.appearanceButtonTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.appearanceSubtext}>
            {appearancePreference === 'system' ? 'Matches your device appearance automatically.' : `OneHealth will stay in ${appearancePreference} mode.`}
          </Text>
        </GlassCard>

        {/* SECTION: ACCOUNT */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <GlassCard noPadding style={styles.cardGroup}>
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="user" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.rowText}>Manage account</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="log-out" size={18} color="#E53E3E" />
              </View>
              <Text style={[styles.rowText, { color: '#E53E3E' }]}>Log out</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, styles.lastRow]}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="log-out" size={18} color="#E53E3E" />
              </View>
              <Text style={[styles.rowText, { color: '#E53E3E' }]}>Delete account</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </GlassCard>

        {/* SECTION: ABOUT */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <GlassCard noPadding style={[styles.cardGroup, { marginBottom: 40 }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="info" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.rowText}>Version</Text>
            </View>
            <Text style={styles.rowRightText}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="info" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.rowText}>Privacy policy</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, styles.lastRow]}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="info" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.rowText}>Terms of service</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </GlassCard>

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
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
    paddingLeft: 4,
  },
  cardGroup: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  rowRightText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  profileValue: { flexShrink: 1, maxWidth: '45%', color: Colors.textSecondary, fontSize: Typography.fontSize.sm, textAlign: 'right' },
  profileDetails: { backgroundColor: Colors.backgroundSecondary, paddingHorizontal: Spacing.lg },
  profileRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.divider },
  profileRowLast: { borderBottomWidth: 0 },
  profileIcon: { width: 28 },
  profileLabel: { color: Colors.text, fontSize: Typography.fontSize.sm },
  editProfileButton: { minHeight: 50, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.full, marginVertical: Spacing.md },
  editProfileText: { color: Colors.textWhite, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  editorScreen: { flex: 1, backgroundColor: Colors.background },
  editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl },
  editorTitle: { color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  editorCancel: { color: Colors.textSecondary, fontSize: Typography.fontSize.md },
  editorSave: { color: Colors.primary, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  editorContent: { padding: Spacing.xl, paddingBottom: 60 },
  editorLabel: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing.sm, letterSpacing: 0.7 },
  editorInput: { minHeight: 52, color: Colors.text, backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.md, marginBottom: Spacing.lg },
  editorChoices: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  editorChoice: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.cardBackground },
  editorChoiceActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  editorChoiceText: { color: Colors.textSecondary, fontSize: Typography.fontSize.md },
  editorChoiceTextActive: { color: Colors.primaryDark, fontWeight: Typography.fontWeight.semibold },
  editorMeasurementRow: { flexDirection: 'row', gap: Spacing.md },
  editorMeasurementInput: { flex: 1, minHeight: 52, color: Colors.text, backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.md, marginBottom: Spacing.lg },
  /* Units Section Specific Styles */
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    padding: 4,
    borderRadius: BorderRadius.full,
    margin: 12,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  unitButtonActive: {
    backgroundColor: Colors.cardBackground,
    // Soft button shadow
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unitButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  unitButtonTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  unitFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  unitSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  appearanceToggleContainer: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  appearanceButton: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderRadius: BorderRadius.xl, backgroundColor: Colors.backgroundSecondary },
  appearanceButtonActive: { backgroundColor: Colors.primary },
  appearanceButtonText: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  appearanceButtonTextActive: { color: Colors.textWhite },
  appearanceSubtext: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
});
