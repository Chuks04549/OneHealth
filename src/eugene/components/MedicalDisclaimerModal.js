import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, radius } from '../theme';

/**
 * Blocking modal shown once, before the user can send a single message to
 * the coach. This is a fitness/goal-planning assistant, not a medical
 * provider — the user must acknowledge that before the chat unlocks.
 */
export default function MedicalDisclaimerModal({ visible, onAcknowledge }) {
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>⚠</Text>
          </View>

          <Text style={styles.title}>Before you start</Text>

          <ScrollView style={styles.bodyScroll}>
            <Text style={styles.body}>
              Eugene is an AI training coach. It suggests workouts and goals based on your
              activity data — it is <Text style={styles.bold}>not</Text> a doctor, physical
              therapist, or emergency service, and it cannot see or respond to your physical
              condition in real time.
            </Text>

            <Text style={[styles.body, styles.warningBlock]}>
              If you experience chest pain, shortness of breath, dizziness, fainting,
              irregular heartbeat, or any other concerning symptom — during a workout or
              at any other time — stop immediately and contact emergency services (911 in
              the US) or a medical professional. Do not wait for a response from this app.
            </Text>

            <Text style={styles.body}>
              Always talk to a doctor before starting a new training program, especially if
              you have an existing health condition, injury, or haven't exercised regularly
              before.
            </Text>
          </ScrollView>

          <Pressable style={styles.button} onPress={onAcknowledge}>
            <Text style={styles.buttonText}>I understand, continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,52,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 4,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 26 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: 14 },
  bodyScroll: { marginBottom: 20 },
  body: { fontSize: 14, lineHeight: 21, color: colors.inkMuted, marginBottom: 14 },
  bold: { fontWeight: '700', color: colors.ink },
  warningBlock: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 12,
    color: colors.danger,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg - 4,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
