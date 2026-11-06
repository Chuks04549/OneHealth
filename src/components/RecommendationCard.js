import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getFoods, getRuns } from '../eugene/services/storage';
import { buildRecommendation } from '../utils/recommendationEngine';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';
import { useUnits } from '../contexts/UnitContext';

const EMPTY_RECOMMENDATION = {
  icon: 'sparkles-outline',
  title: 'For You',
  body: "Log a workout or a meal and I'll start tailoring suggestions to what you actually do.",
  detail: null,
};

export default function RecommendationCard({ style, compact = false }) {
  const navigation = useNavigation();
  const { unitSystem } = useUnits();
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadRecommendation = async () => {
        setLoading(true);
        try {
          const [runs, foods] = await Promise.all([getRuns(), getFoods()]);
          if (isActive) setRecommendation(buildRecommendation(runs, foods, unitSystem));
        } catch (error) {
          console.warn('Unable to build home recommendation', error);
          if (isActive) setRecommendation(EMPTY_RECOMMENDATION);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      loadRecommendation();
      return () => {
        isActive = false;
      };
    }, [unitSystem]),
  );

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard, style]}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!recommendation) return null;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Chat')}
      accessibilityRole="button"
      accessibilityLabel={`${recommendation.title}. ${recommendation.body}`}
    >
      <View style={styles.cardIcon}>
        <Ionicons name={recommendation.icon} size={28} color={Colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{recommendation.title}</Text>
        <Text style={styles.cardBody} numberOfLines={compact ? 3 : undefined}>{recommendation.body}</Text>
        {!compact && recommendation.detail ? <Text style={styles.cardDetail}>{recommendation.detail}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 96,
  },
  loadingCard: { justifyContent: 'center', alignItems: 'center', minHeight: 64 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardBody: { fontSize: Typography.fontSize.sm, color: Colors.text, lineHeight: 20 },
  cardDetail: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: Spacing.xs },
});
