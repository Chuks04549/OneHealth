import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { analyzeMealPhoto } from '../services/foodAI';
import { Colors } from '../../theme';
import useFloatingTabBarClearance from '../../hooks/useFloatingTabBarClearance';

export default function HomeScreen({ onMealAnalyzed, onManualEntry }) {
  const tabBarClearance = useFloatingTabBarClearance();
  const [loading, setLoading] = useState(false);

  const runAnalysis = async (asset) => {
    setLoading(true);
    try {
      if (!asset?.base64) throw new Error('The selected photo could not be read. Please choose it again.');
      const meal = await analyzeMealPhoto(asset.base64, asset.mimeType || 'image/jpeg');
      if (!meal.isFood) {
        Alert.alert('No food detected', meal.warning || 'Try a closer, well-lit photo with the full meal visible.');
        return;
      }
      onMealAnalyzed(asset.uri, meal);
    } catch (err) {
      Alert.alert(
        'Meal could not be analyzed',
        `${err.message || 'The analysis did not finish.'}\n\nFor the best result, show the full plate in good light and avoid blur or heavy shadows.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Enable camera access in Settings to log a meal.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      exif: false,
    });
    if (!result.canceled) runAnalysis(result.assets[0]);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo library permission needed', 'Enable access in Settings to choose a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      exif: false,
    });
    if (!result.canceled) runAnalysis(result.assets[0]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingBottom: tabBarClearance }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Identifying foods and estimating nutrition…</Text>
        <Text style={styles.loadingHint}>This can take a few moments.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingBottom: tabBarClearance }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroIcon}>
        <Feather name="camera" size={34} color={Colors.primary} />
      </View>
      <Text style={styles.title}>Log a meal</Text>
      <Text style={styles.subtitle}>Snap a photo of any meal, snack, or drink and we’ll estimate the nutrition.</Text>

      <View style={styles.buttonGroup}>
        <Pressable style={styles.primaryButton} onPress={takePhoto}>
          <Feather name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Take photo</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={pickPhoto}>
          <Feather name="image" size={20} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>Choose from library</Text>
        </Pressable>
        <Pressable style={styles.manualButton} onPress={onManualEntry}>
          <Feather name="edit-3" size={20} color={Colors.textSecondary} />
          <Text style={styles.manualButtonText}>Type food manually</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors.background },
  heroIcon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8, color: Colors.text },
  subtitle: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32, maxWidth: 320 },
  buttonGroup: { width: '100%', maxWidth: 380, gap: 12 },
  primaryButton: { minHeight: 54, borderRadius: 27, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { minHeight: 54, borderRadius: 27, backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondaryButtonText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  manualButton: { minHeight: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  manualButtonText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  loadingText: { marginTop: 16, fontSize: 16, color: Colors.textSecondary },
  loadingHint: { marginTop: 6, fontSize: 13, color: Colors.textLight },
});
