// Shown when the user skipped onboarding, so they know the numbers are
// based on placeholder details until they add their own.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BorderRadius, Colors, Spacing } from '../../theme';

export default function SetupPrompt() {
  const navigation = useNavigation();
  return (
    <View style={styles.box}>
      <Ionicons name="person-circle-outline" size={22} color={Colors.warning} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Add your details for accurate numbers</Text>
        <Text style={styles.body}>Calories and projections are using placeholder age, height and weight until you add yours.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Onboarding')} accessibilityRole="button">
          <Text style={styles.link}>Finish setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, padding: Spacing.md, borderRadius: BorderRadius.xl, backgroundColor: Colors.warningSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.warningBorder },
  title: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  body: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },
  link: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 6 },
});
