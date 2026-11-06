import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, type } from '../theme';

export default function WorkoutLogBubble({ workout }) {
  if (!workout) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>●</Text>
        </View>
        <Text style={styles.eyebrow}>WORKOUT LOGGED</Text>
      </View>
      <Text style={styles.title}>{workout.title}</Text>
      <Text style={styles.subtitle}>{workout.durationMin} min</Text>
      {!!workout.note && <Text style={styles.note}>“{workout.note}”</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.workoutSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.workoutDark,
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
    backgroundColor: colors.workout,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  iconGlyph: { color: colors.white, fontSize: 11, fontWeight: '700' },
  eyebrow: { ...type.label, color: colors.workoutDark },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  subtitle: { fontSize: 13, color: colors.inkMuted },
  note: { fontSize: 13, color: colors.inkMuted, marginTop: 6, fontStyle: 'italic' },
});
