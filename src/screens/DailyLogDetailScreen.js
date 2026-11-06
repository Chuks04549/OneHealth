import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { getFoods, getRuns, getWorkouts } from '../eugene/services/storage';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import LiquidGlassBackButton from '../components/LiquidGlassBackButton';
import { formatDistance, formatPace, useUnits } from '../contexts/UnitContext';

const asDay = (value) => String(value || '').slice(0, 10);
const effort = { easy: 'Easy', moderate: 'Moderate', hard: 'Hard' };

export default function DailyLogDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { unitSystem } = useUnits();
  const [data, setData] = useState({ foods: [], workouts: [], runs: [] });
  const [loading, setLoading] = useState(true);
  const date = route.params?.date;

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([getFoods(), getWorkouts(), getRuns()]).then(([foods, workouts, runs]) => {
      if (!active) return;
      setData({ foods: (foods || []).filter((item) => asDay(item.date) === date), workouts: (workouts || []).filter((item) => asDay(item.date) === date), runs: (runs || []).filter((item) => asDay(item.date) === date) });
      setLoading(false);
    });
    return () => { active = false; };
  }, [date]));

  const totals = useMemo(() => data.foods.reduce((sum, item) => ({ calories: sum.calories + (Number(item.calories) || 0), protein: sum.protein + (Number(item.macros?.protein_g) || 0), carbs: sum.carbs + (Number(item.macros?.carbs_g) || 0), fat: sum.fat + (Number(item.macros?.fat_g) || 0) }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [data.foods]);
  const title = date ? new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : 'Daily log';
  const items = [...data.foods, ...data.workouts, ...data.runs];

  return <View style={styles.screen}>
    <View style={styles.header}><LiquidGlassBackButton onPress={() => navigation.goBack()} /><Text style={styles.headerTitle}>Day details</Text><View style={styles.spacer} /></View>
    {loading ? <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.date}>{title}</Text><Text style={styles.count}>{items.length ? `${items.length} entries logged` : 'No entries logged'}</Text>
      <View style={styles.summary}><View><Text style={styles.calories}>{Math.round(totals.calories)}</Text><Text style={styles.muted}>kcal consumed</Text></View><View style={styles.macroStack}><Text style={styles.macro}>P {Math.round(totals.protein)}g</Text><Text style={styles.macro}>C {Math.round(totals.carbs)}g</Text><Text style={styles.macro}>F {Math.round(totals.fat)}g</Text></View></View>
      {data.foods.length ? <Section title="Meals">{data.foods.map((item) => <TouchableOpacity key={item.id} style={styles.row} onPress={() => navigation.navigate('MealLogDetail', { foodId: item.id })}><View style={[styles.rowIcon, { backgroundColor: Colors.foodSoft }]}><Feather name="coffee" size={18} color={Colors.foodDark}/></View><View style={styles.rowBody}><Text style={styles.rowTitle}>{item.description}</Text><Text style={styles.rowText}>{Math.round(item.calories || 0)} kcal · P {Math.round(item.macros?.protein_g || 0)}g · C {Math.round(item.macros?.carbs_g || 0)}g · F {Math.round(item.macros?.fat_g || 0)}g</Text></View><Feather name="chevron-right" size={18} color={Colors.textLight}/></TouchableOpacity>)}</Section> : null}
      {data.workouts.length ? <Section title="Workouts">{data.workouts.map((item) => <LogRow key={item.id} icon="dumbbell" color={Colors.workoutLog} title={item.title} text={`${item.durationMin || 0} min${item.note ? ` · ${item.note}` : ''}`} />)}</Section> : null}
      {data.runs.length ? <Section title="Runs">{data.runs.map((item) => <LogRow key={item.id} icon="run" color={Colors.run} title={`${formatDistance(item.km, unitSystem)} run`} text={`${item.durationMin || 0} min · ${formatPace(item.paceMinPerKm, unitSystem)} · ${effort[item.effort] || item.effort}`} />)}</Section> : null}
      {!items.length ? <View style={styles.empty}><Feather name="calendar" size={28} color={Colors.primary}/><Text style={styles.emptyTitle}>Nothing logged for this day</Text><Text style={styles.muted}>Choose another day from your log history, or add a new entry.</Text></View> : null}
    </ScrollView>}
  </View>;
}
function Section({ title, children }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.group}>{children}</View></View>; }
function LogRow({ icon, color, title, text }) { return <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: `${color}20` }]}><MaterialCommunityIcons name={icon} size={19} color={color}/></View><View style={styles.rowBody}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowText}>{text}</Text></View></View>; }
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.background }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg }, headerTitle: { flex: 1, color: Colors.text, textAlign: 'center', fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold }, spacer: { width: 44 }, content: { padding: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.xxxl }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, date: { color: Colors.text, fontSize: 28, fontWeight: Typography.fontWeight.bold }, count: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: 4 }, summary: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginTop: Spacing.xl }, calories: { color: Colors.primaryDark, fontSize: 30, fontWeight: Typography.fontWeight.bold }, muted: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20 }, macroStack: { justifyContent: 'center', alignItems: 'flex-end', gap: 4 }, macro: { color: Colors.primaryDark, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold }, section: { marginTop: Spacing.xxl }, sectionTitle: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, letterSpacing: 1, marginBottom: Spacing.sm }, group: { backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, borderRadius: BorderRadius.xl, overflow: 'hidden' }, row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider }, rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md }, rowBody: { flex: 1 }, rowTitle: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold }, rowText: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 3 }, empty: { alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.sm }, emptyTitle: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, marginTop: Spacing.sm } });
