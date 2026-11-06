import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { getFoods } from '../eugene/services/storage';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import AskEugeneText from '../components/AskEugeneText';
import { sortMicronutrientsByDailyValue } from '../utils/nutrition';
import useFloatingTabBarClearance from '../hooks/useFloatingTabBarClearance';
import LiquidGlassBackButton from '../components/LiquidGlassBackButton';

const MACROS = [
  ['protein_g', 'Protein'],
  ['carbs_g', 'Carbs'],
  ['fat_g', 'Fat'],
  ['fiber_g', 'Fiber'],
  ['sugar_g', 'Sugar'],
];

function formatDate(value) {
  if (!value) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function MealLogDetailScreen() {
  const navigation = useNavigation();
  const tabBarClearance = useFloatingTabBarClearance();
  const route = useRoute();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getFoods().then((foods) => {
        if (active) {
          setFood((foods || []).find((entry) => entry.id === route.params?.foodId) || null);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [route.params?.foodId]),
  );

  if (loading || !food) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.backButton}><LiquidGlassBackButton onPress={() => navigation.goBack()} /></View>
          <Text style={styles.headerTitle}>Nutrition Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.empty}>
          {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.emptyText}>This meal log is no longer available.</Text>}
        </View>
      </View>
    );
  }

  const sortedMicronutrients = sortMicronutrientsByDailyValue(food.micros);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.backButton}><LiquidGlassBackButton onPress={() => navigation.goBack()} /></View>
        <Text style={styles.headerTitle}>Nutrition Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]} showsVerticalScrollIndicator={false}>
        {food.photoUri ? <Image source={{ uri: food.photoUri }} style={styles.photo} /> : null}
        <Text style={styles.source}>{food.source === 'photo_estimate' ? 'PHOTO ESTIMATE' : 'TYPED FOOD ESTIMATE'}</Text>
        <AskEugeneText style={styles.title}>{food.description}</AskEugeneText>
        <Text style={styles.date}>{formatDate(food.date)}</Text>

        <View style={styles.calorieRow}>
          <Text style={styles.calories}>{food.calories ?? 0}</Text>
          <Text style={styles.calorieUnit}>kcal</Text>
          {food.portion?.grams ? <Text style={styles.portion}>~{food.portion.grams} g serving</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Macronutrients</Text>
        <View style={styles.macroGrid}>
          {MACROS.map(([key, label]) => (
            <View key={key} style={styles.macroCard}>
              <AskEugeneText style={styles.macroValue} text={`${label}: ${food.macros?.[key] ?? 0} g`}>{food.macros?.[key] ?? 0} g</AskEugeneText>
              <AskEugeneText style={styles.macroLabel}>{label}</AskEugeneText>
            </View>
          ))}
        </View>

        {(food.components || []).length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Detected Foods</Text>
            <View style={styles.listCard}>
              {food.components.map((item, index) => (
                <View key={`${item.name}-${index}`} style={[styles.row, index > 0 && styles.rowBorder]}>
                  <View style={styles.rowMain}>
                    <AskEugeneText style={styles.rowName}>{item.name}</AskEugeneText>
                    <AskEugeneText style={styles.rowDetail} text={`${item.name}: ${item.protein_g}g protein, ${item.carbs_g}g carbs, ${item.fat_g}g fat`}>{item.protein_g}g protein · {item.carbs_g}g carbs · {item.fat_g}g fat</AskEugeneText>
                  </View>
                  <Text style={styles.rowValue}>{item.calories} kcal</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Vitamins & Minerals</Text>
        <View style={styles.listCard}>
          {sortedMicronutrients.length > 0 ? sortedMicronutrients.map((item, index) => (
            <View key={`${item.name}-${index}`} style={[styles.row, index > 0 && styles.rowBorder]}>
              <AskEugeneText style={styles.rowName}>{item.name}</AskEugeneText>
              <AskEugeneText style={styles.rowValue} text={`${item.name}: ${item.amount} ${item.unit}${item.dailyPct != null ? `, ${item.dailyPct}% daily reference` : ''}`}>{item.amount} {item.unit}{item.dailyPct != null ? ` · ${item.dailyPct}% ${/omega.?3/i.test(item.name) ? 'daily ref.' : 'DV'}` : ''}</AskEugeneText>
            </View>
          )) : <Text style={styles.unavailable}>Detailed micronutrients were not stored for this older entry.</Text>}
        </View>

        {(food.warning || (food.assumptions || []).length > 0) ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>About this estimate</Text>
            {food.warning ? <Text style={styles.noticeText}>{food.warning}</Text> : null}
            {(food.assumptions || []).map((item, index) => <Text key={`${item}-${index}`} style={styles.assumption}>• {item}</Text>)}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  backButton: { width: 52, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerSpacer: { width: 52 },
  headerTitle: { flex: 1, textAlign: 'center', color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  photo: { width: '100%', height: 260, borderRadius: BorderRadius.xl, backgroundColor: Colors.backgroundSecondary, marginBottom: Spacing.lg },
  source: { color: Colors.primary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, letterSpacing: 0.8 },
  title: { color: Colors.text, fontSize: 26, fontWeight: Typography.fontWeight.bold, marginTop: Spacing.xs },
  date: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: Spacing.xs },
  calorieRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.lg },
  calories: { color: Colors.text, fontSize: 36, fontWeight: '800' },
  calorieUnit: { color: Colors.textSecondary, fontSize: Typography.fontSize.md, marginLeft: Spacing.xs },
  portion: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginLeft: 'auto' },
  sectionTitle: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, letterSpacing: 0.9, textTransform: 'uppercase', marginTop: Spacing.xl, marginBottom: Spacing.md },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  macroCard: { width: '31%', flexGrow: 1, minWidth: 92, padding: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  macroValue: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  macroLabel: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 2 },
  listCard: { backgroundColor: Colors.cardBackground, borderRadius: BorderRadius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, paddingHorizontal: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  rowMain: { flex: 1 },
  rowName: { flex: 1, color: Colors.text, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  rowDetail: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 2 },
  rowValue: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginLeft: Spacing.md, textAlign: 'right' },
  unavailable: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20, paddingVertical: Spacing.lg },
  notice: { backgroundColor: Colors.warningSoft, borderColor: Colors.warningBorder, borderWidth: StyleSheet.hairlineWidth, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.xl },
  noticeTitle: { color: Colors.text, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold },
  noticeText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20, marginTop: Spacing.xs },
  assumption: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: Spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, textAlign: 'center' },
});
