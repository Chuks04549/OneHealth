import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { saveUserProfile } from '../eugene/services/storage';
import { DEFAULT_USER_PROFILE, estimateDailyTargets } from '../utils/profileUtils';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import { useUnits } from '../contexts/UnitContext';
import LiquidGlassBackButton from '../components/LiquidGlassBackButton';

const PAGE_COPY = [
  {
    icon: 'happy-outline',
    title: 'Welcome to OneHealth!',
    subtitle: 'Let’s get to know you. These details help us make your daily goals feel personal and realistic.',
  },
  {
    icon: 'body-outline',
    title: 'A little more about you',
    subtitle: 'You’re doing great. Your height and weight help us create a useful starting estimate.',
  },
  {
    icon: 'flag-outline',
    title: 'What are you working toward?',
    subtitle: 'Choose the direction that fits you today. You can change it later in Settings whenever your goals shift.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Your starting goals are ready',
    subtitle: 'We estimated a starting point for your goal. Adjust any target now, or keep these values and get started.',
  },
];

function NumberField({ label, value, onChangeText, suffix, min, max }) {
  return (
    <View style={styles.numberFieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.numberInputRow}>
        <TextInput
          style={styles.numberInput}
          value={String(value)}
          onChangeText={(text) => onChangeText(text.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          selectTextOnFocus
          accessibilityLabel={`${label}, between ${min} and ${max}`}
        />
        <Text style={styles.suffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function GoalSlider({ label, value, minimumValue, maximumValue, step, unit, onValueChange }) {
  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeading}>
        <Text style={styles.goalLabel}>{label}</Text>
        <Text style={styles.goalValue}>{Math.round(value).toLocaleString()} {unit}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={Colors.primary}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.primary}
        accessibilityLabel={`${label} target`}
      />
      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>{minimumValue.toLocaleString()}</Text>
        <Text style={styles.rangeText}>{maximumValue.toLocaleString()} {unit}</Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { setUnitSystem } = useUnits();
  const lastNameRef = useRef(null);
  const [page, setPage] = useState(0);
  const [measurementSystem, setMeasurementSystem] = useState('imperial');
  const [imperialHeight, setImperialHeight] = useState({ feet: '', inches: '' });
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    sex: '',
    age: '',
    heightCm: '',
    weightKg: '',
    bodyGoal: '',
    calorieTarget: DEFAULT_USER_PROFILE.calorieTarget,
    proteinTarget: DEFAULT_USER_PROFILE.proteinTarget,
    fatTarget: DEFAULT_USER_PROFILE.fatTarget,
    carbsTarget: DEFAULT_USER_PROFILE.carbsTarget,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const copy = PAGE_COPY[page];
  const estimated = useMemo(() => estimateDailyTargets(profile), [profile.age, profile.heightCm, profile.weightKg, profile.sex, profile.bodyGoal]);
  const metric = measurementSystem === 'metric';

  const displayMeasurement = (value, factor) => {
    if (value === '') return '';
    const converted = Number(value) * factor;
    return Number.isFinite(converted) ? String(Math.round(converted * 10) / 10) : '';
  };

  const updateMeasurement = (key, value, factor) => {
    if (value === '') {
      update(key, '');
      return;
    }
    const converted = Number(value) * factor;
    update(key, Number.isFinite(converted) ? Math.round(converted * 100) / 100 : '');
  };

  const selectMeasurementSystem = (system) => {
    if (system === 'imperial' && profile.heightCm !== '') {
      const totalInches = Number(profile.heightCm) / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round((totalInches - (feet * 12)) * 10) / 10;
      setImperialHeight({ feet: String(feet), inches: String(inches) });
    }
    setMeasurementSystem(system);
    setError('');
  };

  const updateImperialHeight = (key, value) => {
    const next = { ...imperialHeight, [key]: value };
    setImperialHeight(next);
    if (next.feet === '') {
      update('heightCm', '');
      return;
    }
    const totalInches = (Number(next.feet) * 12) + (Number(next.inches) || 0);
    update('heightCm', Math.round(totalInches * 2.54 * 100) / 100);
  };

  const update = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const skip = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Only remember that setup was skipped — never overwrite details the
      // user already saved (the old code reset the whole profile to defaults).
      await saveUserProfile({ onboardingSkipped: true });
      navigation.replace('Home');
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (page === 0) {
      const age = Number(profile.age);
      if (!profile.firstName.trim() || !profile.lastName.trim()) {
        setError('Please add your first and last name.');
        return;
      }
      if (!profile.sex) {
        setError('Please choose a sex for the calorie estimate.');
        return;
      }
      if (!Number.isFinite(age) || age < 18 || age > 100) {
        setError('Please enter an age from 18 to 100.');
        return;
      }
      setPage(1);
      return;
    }

    if (page === 1) {
      const heightCm = Number(profile.heightCm);
      const weightKg = Number(profile.weightKg);
      if (!metric) {
        const feet = Number(imperialHeight.feet);
        const inches = Number(imperialHeight.inches || 0);
        if (!Number.isFinite(feet) || feet < 3 || feet > 8 || !Number.isFinite(inches) || inches < 0 || inches >= 12) {
          setError('Please enter a height using 3–8 feet and 0–11 inches.');
          return;
        }
      }
      if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) {
        setError('Please enter a valid height.');
        return;
      }
      if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300) {
        setError('Please enter a valid weight.');
        return;
      }
      setPage(2);
      return;
    }

    if (!profile.bodyGoal) {
      setError('Please choose a goal to continue.');
      return;
    }
    setProfile((current) => ({ ...current, ...estimated }));
    setPage(3);
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveUserProfile({ ...profile, onboardingComplete: true, onboardingSkipped: false });
      await setUnitSystem(measurementSystem);
      navigation.replace('Home');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.topBar}>
        <View style={styles.backButton}>
          {page > 0 ? (
            <LiquidGlassBackButton
              onPress={() => setPage((current) => current - 1)}
              accessibilityLabel="Previous onboarding step"
            />
          ) : null}
        </View>
        <Text style={styles.step}>STEP {page + 1} OF 4</Text>
        <TouchableOpacity style={styles.skipButton} onPress={skip} accessibilityRole="button">
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={copy.icon} size={34} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        {page === 0 ? (
          <View style={styles.form}>
            <Text style={styles.label}>FIRST NAME</Text>
            <TextInput
              style={styles.input}
              value={profile.firstName}
              onChangeText={(value) => update('firstName', value)}
              placeholder="First name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
            />

            <Text style={styles.label}>LAST NAME</Text>
            <TextInput
              ref={lastNameRef}
              style={styles.input}
              value={profile.lastName}
              onChangeText={(value) => update('lastName', value)}
              placeholder="Last name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              returnKeyType="done"
            />

            <Text style={styles.label}>SEX</Text>
            <View style={styles.choiceRow}>
              {['female', 'male'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.choice, profile.sex === option && styles.choiceSelected]}
                  onPress={() => update('sex', option)}
                >
                  <Text style={[styles.choiceText, profile.sex === option && styles.choiceTextSelected]}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <NumberField label="AGE" value={profile.age} onChangeText={(value) => update('age', value)} suffix="years" min={18} max={100} />
          </View>
        ) : null}

        {page === 1 ? (
          <View style={styles.form}>
            <View style={styles.unitSwitch} accessibilityRole="radiogroup" accessibilityLabel="Measurement units">
              <View style={[styles.unitThumb, !metric ? styles.unitThumbLeft : styles.unitThumbRight]} />
              <TouchableOpacity
                style={styles.unitOption}
                onPress={() => selectMeasurementSystem('imperial')}
                accessibilityRole="radio"
                accessibilityState={{ selected: !metric }}
              >
                <Text style={[styles.unitOptionText, !metric && styles.unitOptionTextSelected]}>in · lb</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unitOption}
                onPress={() => selectMeasurementSystem('metric')}
                accessibilityRole="radio"
                accessibilityState={{ selected: metric }}
              >
                <Text style={[styles.unitOptionText, metric && styles.unitOptionTextSelected]}>cm · kg</Text>
              </TouchableOpacity>
            </View>
            {metric ? (
              <NumberField
                label="HEIGHT"
                value={profile.heightCm}
                onChangeText={(value) => update('heightCm', value)}
                suffix="cm"
                min={100}
                max={250}
              />
            ) : (
              <View style={styles.imperialHeightWrap}>
                <View style={styles.imperialHeightField}>
                  <NumberField
                    label="HEIGHT · FEET"
                    value={imperialHeight.feet}
                    onChangeText={(value) => updateImperialHeight('feet', value)}
                    suffix="′"
                    min={3}
                    max={8}
                  />
                </View>
                <View style={styles.imperialHeightField}>
                  <NumberField
                    label="INCHES"
                    value={imperialHeight.inches}
                    onChangeText={(value) => updateImperialHeight('inches', value)}
                    suffix="″"
                    min={0}
                    max={11}
                  />
                </View>
              </View>
            )}
            <NumberField
              label="WEIGHT"
              value={metric ? profile.weightKg : displayMeasurement(profile.weightKg, 2.2046226218)}
              onChangeText={(value) => metric ? update('weightKg', value) : updateMeasurement('weightKg', value, 1 / 2.2046226218)}
              suffix={metric ? 'kg' : 'lb'}
              min={metric ? 30 : 66}
              max={metric ? 300 : 661}
            />
            <View style={styles.reassurance}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
              <Text style={styles.reassuranceText}>Your details stay on this device and can be changed later.</Text>
            </View>
          </View>
        ) : null}

        {page === 2 ? (
          <View style={styles.form}>
            {[
              { key: 'maintain', title: 'Maintain my weight', subtitle: 'Support steady energy and your current weight', icon: 'remove-circle-outline' },
              { key: 'gain', title: 'Gain muscle', subtitle: 'A modest calorie surplus with higher protein', icon: 'barbell-outline' },
              { key: 'lose', title: 'Lose weight', subtitle: 'A modest calorie reduction with higher protein', icon: 'trending-down-outline' },
            ].map((goal) => (
              <TouchableOpacity key={goal.key} style={[styles.goalChoice, profile.bodyGoal === goal.key && styles.goalChoiceSelected]} onPress={() => update('bodyGoal', goal.key)}>
                <View style={styles.goalChoiceIcon}><Ionicons name={goal.icon} size={24} color={Colors.primary} /></View>
                <View style={styles.goalChoiceContent}>
                  <Text style={styles.goalChoiceTitle}>{goal.title}</Text>
                  <Text style={styles.goalChoiceSubtitle}>{goal.subtitle}</Text>
                </View>
                <Ionicons name={profile.bodyGoal === goal.key ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={profile.bodyGoal === goal.key ? Colors.primary : Colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {page === 3 ? (
          <View style={styles.form}>
            <Text style={styles.estimateIntro}>Estimated daily starting targets</Text>
            <GoalSlider
              label="Daily calories"
              value={profile.calorieTarget}
              minimumValue={1000}
              maximumValue={5000}
              step={50}
              unit="kcal"
              onValueChange={(value) => update('calorieTarget', value)}
            />
            <GoalSlider label="Daily fat" value={profile.fatTarget} minimumValue={30} maximumValue={180} step={5} unit="g" onValueChange={(value) => update('fatTarget', value)} />
            <GoalSlider label="Daily carbs" value={profile.carbsTarget} minimumValue={75} maximumValue={600} step={5} unit="g" onValueChange={(value) => update('carbsTarget', value)} />
            <GoalSlider
              label="Daily protein"
              value={profile.proteinTarget}
              minimumValue={30}
              maximumValue={250}
              step={5}
              unit="g"
              onValueChange={(value) => update('proteinTarget', value)}
            />
            <Text style={styles.disclaimer}>These are general adult estimates based on the information you entered. Activity, health, pregnancy, and personal goals can change what’s right for you.</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <View style={styles.dots}>
            {[0, 1, 2, 3].map((index) => <View key={index} style={[styles.dot, page === index && styles.dotActive]} />)}
          </View>
          <TouchableOpacity
            style={[styles.continueButton, saving && styles.disabled]}
            onPress={page === 3 ? finish : next}
            disabled={saving}
          >
            <Text style={styles.continueText}>{saving ? 'Saving…' : page === 3 ? 'Finish & go home' : 'Continue'}</Text>
            {!saving ? <Ionicons name={page === 3 ? 'checkmark' : 'arrow-forward'} size={20} color={Colors.textWhite} /> : null}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  topBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  backButton: { width: 56, minHeight: 44, alignItems: 'flex-start', justifyContent: 'center' },
  step: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, letterSpacing: 1 },
  skipButton: { width: 56, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  skipText: { color: Colors.primary, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  content: { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  iconContainer: { width: 68, height: 68, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { color: Colors.text, fontSize: Typography.fontSize.xxxl, fontWeight: Typography.fontWeight.bold, lineHeight: 39 },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.fontSize.md, lineHeight: 23, marginTop: Spacing.sm, maxWidth: 380 },
  form: { marginTop: Spacing.xxl },
  label: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, letterSpacing: 0.8, marginBottom: Spacing.sm },
  input: { minHeight: 52, backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, borderRadius: BorderRadius.xl, color: Colors.text, fontSize: Typography.fontSize.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  choiceRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  choice: { flex: 1, minHeight: 50, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.cardBackground, alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  choiceText: { color: Colors.textSecondary, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  choiceTextSelected: { color: Colors.primaryDark },
  numberFieldWrap: { marginBottom: Spacing.xl },
  goalChoice: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.cardBackground, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.md },
  goalChoiceSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  goalChoiceIcon: { width: 46, height: 46, borderRadius: BorderRadius.lg, backgroundColor: Colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  goalChoiceContent: { flex: 1, paddingRight: Spacing.sm },
  goalChoiceTitle: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  goalChoiceSubtitle: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 17, marginTop: 3 },
  imperialHeightWrap: { flexDirection: 'row', gap: Spacing.md },
  imperialHeightField: { flex: 1 },
  unitSwitch: { height: 48, flexDirection: 'row', position: 'relative', backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.full, padding: 4, marginBottom: Spacing.xl },
  unitThumb: { position: 'absolute', top: 4, bottom: 4, width: '50%', borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  unitThumbLeft: { left: 4 },
  unitThumbRight: { right: 4 },
  unitOption: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  unitOptionText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  unitOptionTextSelected: { color: Colors.textWhite },
  numberInputRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg },
  numberInput: { flex: 1, color: Colors.text, fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.semibold, paddingVertical: Spacing.md },
  suffix: { color: Colors.textSecondary, fontSize: Typography.fontSize.md },
  reassurance: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  reassuranceText: { flex: 1, color: Colors.primaryDark, fontSize: Typography.fontSize.sm, lineHeight: 20 },
  estimateIntro: { color: Colors.primaryDark, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing.md },
  goalCard: { backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md },
  goalHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalLabel: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  goalValue: { color: Colors.primaryDark, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  slider: { width: '100%', height: 42, marginTop: Spacing.sm },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeText: { color: Colors.textLight, fontSize: Typography.fontSize.xs },
  disclaimer: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: Spacing.xs },
  error: { color: Colors.error, fontSize: Typography.fontSize.sm, marginTop: Spacing.md },
  footer: { marginTop: 'auto', paddingTop: Spacing.xxl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  dot: { width: 7, height: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.border },
  dotActive: { width: 22, backgroundColor: Colors.primary },
  continueButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  continueText: { color: Colors.textWhite, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  disabled: { opacity: 0.65 },
});
