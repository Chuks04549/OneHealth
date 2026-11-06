import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { scaleMeal } from '../services/foodAI';
import { persistMealPhoto } from '../services/mealPhotoStorage';
import { addFood, todayLocalISO } from '../../eugene/services/storage';
import { BorderRadius, Colors } from '../../theme';
import { sortMicronutrientsByDailyValue } from '../../utils/nutrition';
import useFloatingTabBarClearance from '../../hooks/useFloatingTabBarClearance';
import LiquidGlassBackButton from '../../components/LiquidGlassBackButton';

function diaryCategory(category) {
  if (['breakfast', 'lunch', 'dinner', 'snack'].includes(category)) return category;
  if (category === 'mixed meal') {
    const hour = new Date().getHours();
    return hour >= 17 ? 'dinner' : 'lunch';
  }
  return 'snack';
}

function nutrientLabel(key) {
  return {
    protein_g: 'Protein',
    carbs_g: 'Carbs',
    fat_g: 'Fat',
    fiber_g: 'Fiber',
    sugar_g: 'Sugar',
  }[key];
}

export default function ConfirmMealScreen({ photoUri, meal, onDone, onRetake }) {
  const tabBarClearance = useFloatingTabBarClearance();
  const [portion, setPortion] = useState(1.0);
  const [expanded, setExpanded] = useState(true);
  const [logging, setLogging] = useState(false);
  const displayMeal = scaleMeal(meal, portion);
  const sortedMicronutrients = sortMicronutrientsByDailyValue(displayMeal.micros);

  const adjustPortion = (delta) => {
    const next = Math.max(0.5, Math.round((portion + delta) * 10) / 10);
    setPortion(next);
  };

  const handleLog = async () => {
    if (logging) return;
    setLogging(true);
    try {
      const savedPhotoUri = await persistMealPhoto(photoUri);
      await addFood({
        date: todayLocalISO(),
        meal: diaryCategory(meal.category),
        category: meal.category,
        description: displayMeal.label,
        calories: displayMeal.calories,
        macros: displayMeal.macros,
        portion: displayMeal.portion,
        components: displayMeal.items,
        micros: displayMeal.micros,
        confidence: displayMeal.confidence,
        source: 'photo_estimate',
        assumptions: displayMeal.assumptions,
        warning: displayMeal.warning,
        photoUri: savedPhotoUri,
      });
      Alert.alert('Food logged successfully');
      onDone();
    } catch (error) {
      Alert.alert('Could not log meal', error.message || 'Please try again.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: tabBarClearance }}>
      <View style={styles.header}>
        <LiquidGlassBackButton onPress={onRetake} accessibilityLabel="Retake meal photo" />
        <Text style={styles.headerTitle}>Confirm meal</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.photoWrap}>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>✨ AI · {Math.round(meal.confidence * 100)}%</Text>
        </View>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.photoPreviewText}>photo preview</Text>
        )}
      </View>

      <Text style={styles.eyebrow}>WE THINK THIS IS</Text>
      <Text style={styles.foodName}>{meal.label}</Text>
      <View style={styles.categoryRow}>
        <Text style={styles.categoryBadge}>{meal.category}</Text>
        <Text style={styles.estimateLabel}>Estimated whole serving</Text>
      </View>

      <View style={styles.calorieCard}>
        <Text style={styles.calorieValue}>{displayMeal.calories}</Text>
        <Text style={styles.calorieUnit}>kcal</Text>
      </View>

      <View style={styles.macroGrid}>
        {Object.entries(displayMeal.macros).map(([key, value]) => (
          <View key={key} style={styles.macroCard}>
            <Text style={styles.macroValue}>{value} g</Text>
            <Text style={styles.macroLabel}>{nutrientLabel(key)}</Text>
          </View>
        ))}
      </View>

      {(meal.alternatives || []).length > 0 && (
        <>
          <Text style={styles.eyebrow}>POSSIBLE ALTERNATIVES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {meal.alternatives.map((alt) => (
              <View key={alt} style={styles.chip}>
                <Text style={styles.chipText}>{alt}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.portionCard}>
        <View>
          <Text style={styles.portionLabel}>Portion size</Text>
          <Text style={styles.portionSub}>
            {displayMeal.portion.amount} {displayMeal.portion.unit} · ~{displayMeal.portion.grams} g
          </Text>
        </View>
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => adjustPortion(-0.5)}>
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{portion.toFixed(1)}</Text>
          <Pressable style={styles.stepBtn} onPress={() => adjustPortion(0.5)}>
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.nutritionHeader} onPress={() => setExpanded((e) => !e)}>
        <Text style={styles.nutritionHeaderText}>View full nutrition</Text>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.nutritionBody}>
          {(displayMeal.items || []).length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Detected foods</Text>
              {displayMeal.items.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.itemRow}>
                  <View style={styles.itemTextWrap}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMacros}>
                      {item.protein_g}g protein · {item.carbs_g}g carbs · {item.fat_g}g fat
                    </Text>
                  </View>
                  <Text style={styles.itemAmount}>~{item.estimatedGrams} g · {item.calories} kcal</Text>
                </View>
              ))}
            </View>
          )}

          {sortedMicronutrients.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Micronutrients</Text>
              {sortedMicronutrients.map((micro) => (
                <View key={micro.name} style={styles.nutritionRow}>
                  <Text style={styles.nutrientName}>{micro.name}</Text>
                  <Text style={styles.nutrientAmount}>{micro.amount} {micro.unit}</Text>
                  <Text style={styles.nutrientPct}>{micro.dailyPct}% {/omega.?3/i.test(micro.name) ? 'ref.' : 'DV'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Photo estimate</Text>
        <Text style={styles.noticeText}>
          {meal.warning || 'Actual nutrition varies with ingredients, preparation, and serving size. Adjust the portion before logging.'}
        </Text>
        {(meal.assumptions || []).map((assumption, index) => (
          <Text key={`${assumption}-${index}`} style={styles.assumption}>• {assumption}</Text>
        ))}
      </View>

      <Pressable style={[styles.logButton, logging && styles.logButtonDisabled]} onPress={handleLog} disabled={logging}>
        <Text style={styles.logButtonText}>{logging ? 'Logging…' : `Log meal · ${displayMeal.calories} kcal`}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  photoWrap: {
    height: 300,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  photo: { width: '100%', height: '100%' },
  photoPreviewText: { color: Colors.textLight },
  aiBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  aiBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.primaryDark },
  eyebrow: { fontSize: 12, letterSpacing: 1, color: Colors.textLight, marginTop: 8, marginBottom: 4 },
  foodName: { fontSize: 26, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  categoryBadge: { overflow: 'hidden', backgroundColor: Colors.primaryLight, color: Colors.primaryDark, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  estimateLabel: { fontSize: 12, color: Colors.textSecondary },
  calorieCard: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  calorieValue: { fontSize: 34, fontWeight: '800', color: Colors.text },
  calorieUnit: { marginLeft: 6, fontSize: 15, color: Colors.textSecondary },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  macroCard: { width: '31%', minWidth: 92, flexGrow: 1, padding: 12, borderRadius: BorderRadius.lg, backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  macroValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  macroLabel: { marginTop: 3, fontSize: 12, color: Colors.textSecondary },
  chipRow: { marginBottom: 20 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  chipText: { fontSize: 14, color: Colors.text },
  portionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginBottom: 20,
  },
  portionLabel: { fontSize: 16, fontWeight: '600' },
  portionSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: Colors.text },
  stepValue: { fontSize: 18, fontWeight: '600', marginHorizontal: 14 },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: Colors.cardBackground,
  },
  nutritionHeaderText: { fontSize: 16, fontWeight: '600' },
  chevron: { fontSize: 14, color: Colors.textLight },
  nutritionBody: { borderWidth: StyleSheet.hairlineWidth, borderTopWidth: 0, borderColor: Colors.border, borderBottomLeftRadius: BorderRadius.lg, borderBottomRightRadius: BorderRadius.lg, backgroundColor: Colors.cardBackground, paddingHorizontal: 16 },
  sectionBlock: { paddingVertical: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  itemTextWrap: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  itemMacros: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemAmount: { fontSize: 12, color: Colors.textSecondary, textAlign: 'right' },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  nutrientName: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  nutrientAmount: { fontSize: 14, fontWeight: '600', color: Colors.text, marginRight: 10 },
  nutrientPct: { fontSize: 13, color: Colors.textLight, width: 54, textAlign: 'right' },
  noticeCard: { backgroundColor: Colors.warningSoft, borderColor: Colors.warningBorder, borderWidth: StyleSheet.hairlineWidth, borderRadius: BorderRadius.lg, padding: 14, marginTop: 16 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  noticeText: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  assumption: { fontSize: 12, lineHeight: 18, color: Colors.textSecondary, marginTop: 4 },
  logButton: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  logButtonDisabled: { opacity: 0.6 },
  logButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
