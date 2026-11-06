// src/components/FoodLogBubble.js
//
// Mirrors RunLogBubble — a logged meal appears in the chat as data the
// coach can visibly reference, not a toast that vanishes into a
// separate tab.

import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, type } from '../theme';

const MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export default function FoodLogBubble({ food }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>◆</Text>
        </View>
        <Text style={styles.eyebrow}>{(MEAL_LABEL[food.meal] || food.meal).toUpperCase()} LOGGED</Text>
      </View>
      <Text style={styles.title}>{food.description}</Text>
      {!!food.calories && (
        <Text style={styles.subtitle}>
          {food.calories} cal ({food.source === 'photo_estimate' ? 'photo estimate' : 'self-reported'})
        </Text>
      )}
      {!!food.note && <Text style={styles.note}>"{food.note}"</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.foodSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#f0d5a5',
    padding: 16,
    marginBottom: 18,
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.food,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  iconGlyph: { color: colors.white, fontSize: 11, fontWeight: '700' },
  eyebrow: { ...type.label, color: colors.foodDark },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  subtitle: { fontSize: 13, color: colors.inkMuted },
  note: { fontSize: 13, color: colors.inkMuted, marginTop: 6, fontStyle: 'italic' },
});
