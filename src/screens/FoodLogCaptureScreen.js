import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FoodLogHome from '../foodlog/screens/HomeScreen';
import ConfirmMealScreen from '../foodlog/screens/ConfirmMealScreen';
import LogFoodModal from '../eugene/components/LogFoodModal';
import { addFood } from '../eugene/services/storage';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';
import LiquidGlassBackButton from '../components/LiquidGlassBackButton';

export default function FoodLogCaptureScreen() {
  const navigation = useNavigation();
  const [photoUri, setPhotoUri] = useState(null);
  const [meal, setMeal] = useState(null);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);

  const handleMealAnalyzed = (uri, analyzedMeal) => {
    setPhotoUri(uri);
    setMeal(analyzedMeal);
  };

  const handleDone = () => {
    navigation.navigate('Home', { tab: 'Home', tabSelectionId: Date.now() });
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setMeal(null);
  };

  const handleManualSave = async (food) => {
    try {
      await addFood(food);
      setManualEntryVisible(false);
      navigation.navigate('Home', { tab: 'Home', tabSelectionId: Date.now() });
    } catch (error) {
      Alert.alert('Could not log food', error.message || 'Please try again.');
    }
  };

  if (meal) {
    return (
      <View style={styles.container}>
        <ConfirmMealScreen
          photoUri={photoUri}
          meal={meal}
          onDone={handleDone}
          onRetake={handleRetake}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backButton}><LiquidGlassBackButton onPress={() => navigation.goBack()} /></View>
        <Text style={styles.headerTitle}>Log Food</Text>
        <TouchableOpacity
          style={styles.logsButton}
          onPress={() => navigation.navigate('MealLogs', { logType: 'meals', selectionId: Date.now() })}
        >
          <Text style={styles.logsButtonText}>View Logs</Text>
        </TouchableOpacity>
      </View>
      <FoodLogHome
        onMealAnalyzed={handleMealAnalyzed}
        onManualEntry={() => setManualEntryVisible(true)}
      />
      <LogFoodModal
        visible={manualEntryVisible}
        onClose={() => setManualEntryVisible(false)}
        onSave={handleManualSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  logsButton: { minWidth: 72, minHeight: 40, justifyContent: 'center', alignItems: 'flex-end' },
  logsButtonText: { color: Colors.primary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
});
