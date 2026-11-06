import React, { useEffect, useMemo, useState } from 'react';
import { Appearance, Keyboard, Platform, View, StyleSheet, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainPagerScreen from './src/screens/MainPagerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen';
import BrowseByMuscleScreen from './src/screens/BrowseByMuscleScreen';
import ChatScreenWrapper from './src/screens/ChatScreenWrapper';
import FoodLogCaptureScreen from './src/screens/FoodLogCaptureScreen';
import MealLogsScreen from './src/screens/MealLogsScreen';
import MealLogDetailScreen from './src/screens/MealLogDetailScreen';
import DailyLogDetailScreen from './src/screens/DailyLogDetailScreen';
import WorkoutLogScreen from './src/screens/WorkoutLogScreen';
import TabBar from './src/components/TabBar';
import { Colors } from './src/theme';
import { AppearanceContext } from './src/contexts/AppearanceContext';
import { UnitContext } from './src/contexts/UnitContext';
import { scheduleHealthReminders } from './src/utils/notifications';
import { getAppearancePreference, getUnitSystem, getUserProfile, saveAppearancePreference, saveUnitSystem } from './src/eugene/services/storage';

// Appearance.setColorScheme only exists on iOS/Android — calling it on web
// threw "setColorScheme is not a function" at startup.
function applyColorScheme(preference) {
  if (typeof Appearance.setColorScheme !== 'function') return;
  try {
    Appearance.setColorScheme(preference === 'system' ? null : preference);
  } catch (error) {
    console.warn('appearance: could not apply color scheme', error);
  }
}

const Stack = createNativeStackNavigator();
const ACTIVE_TABS = {
  FoodLog: 'Home',
  MealLogs: 'Home',
  MealLogDetail: 'Home',
  DailyLogDetail: 'Home',
  WorkoutLog: 'Home',
  WorkoutDetail: 'Workouts',
  BrowseByMuscle: 'Workouts',
  Chat: 'Home',
  Settings: 'Home',
  Progress: 'Progress',
};

function GlobalTabBar({ keyboardVisible }) {
  const currentRoute = useNavigationState((state) => state?.routes?.[state?.index]?.name);
  const hidden = !currentRoute || keyboardVisible || currentRoute === 'Onboarding' || currentRoute === 'Home';
  return <TabBar active={ACTIVE_TABS[currentRoute] || 'Home'} hidden={hidden} />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Ubuntu_400Regular: require('@expo-google-fonts/ubuntu/400Regular/Ubuntu_400Regular.ttf'),
    Ubuntu_500Medium: require('@expo-google-fonts/ubuntu/500Medium/Ubuntu_500Medium.ttf'),
    Ubuntu_700Bold: require('@expo-google-fonts/ubuntu/700Bold/Ubuntu_700Bold.ttf'),
    Ubuntu_400Regular_Italic: require('@expo-google-fonts/ubuntu/400Regular_Italic/Ubuntu_400Regular_Italic.ttf'),
    Ubuntu_500Medium_Italic: require('@expo-google-fonts/ubuntu/500Medium_Italic/Ubuntu_500Medium_Italic.ttf'),
    Ubuntu_700Bold_Italic: require('@expo-google-fonts/ubuntu/700Bold_Italic/Ubuntu_700Bold_Italic.ttf'),
  });
  const systemColorScheme = useColorScheme() || 'light';
  const [appearancePreference, setAppearancePreference] = useState('system');
  const [unitSystem, setUnitSystemState] = useState('imperial');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // null until we know whether this user already finished (or skipped) setup.
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    getUserProfile()
      .then((profile) => {
        const returning = profile.onboardingComplete || profile.onboardingSkipped;
        setInitialRoute(returning ? 'Home' : 'Onboarding');
        // Keep reminders scheduled (and the weigh-in reminder pointed at the
        // right day) every time the app starts. Skip first launch so the
        // permission prompt doesn't appear before onboarding.
        if (returning) scheduleHealthReminders();
      })
      .catch(() => setInitialRoute('Onboarding'));
  }, []);

  useEffect(() => {
    getAppearancePreference().then((preference) => {
      applyColorScheme(preference);
      setAppearancePreference(preference);
    });
  }, []);

  useEffect(() => {
    getUnitSystem().then(setUnitSystemState);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const updateAppearancePreference = async (preference) => {
    applyColorScheme(preference);
    setAppearancePreference(preference);
    await saveAppearancePreference(preference);
  };

  const colorScheme = appearancePreference === 'system' ? systemColorScheme : appearancePreference;
  const updateUnitSystem = async (nextUnitSystem) => {
    const next = nextUnitSystem === 'metric' ? 'metric' : 'imperial';
    setUnitSystemState(next);
    await saveUnitSystem(next);
  };
  const navigationTheme = colorScheme === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, primary: Colors.primary, background: Colors.background, card: Colors.cardBackground, text: Colors.text, border: Colors.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: Colors.primary, background: Colors.background, card: Colors.cardBackground, text: Colors.text, border: Colors.border } };
  const appearanceValue = useMemo(() => ({
    preference: appearancePreference,
    colorScheme,
    setPreference: updateAppearancePreference,
  }), [appearancePreference, colorScheme]);

  if ((!fontsLoaded && !fontError) || !initialRoute) return null;

  return (
    <AppearanceContext.Provider value={appearanceValue}>
      <UnitContext.Provider value={{ unitSystem, setUnitSystem: updateUnitSystem }}>
        <SafeAreaProvider>
      <NavigationContainer
        theme={navigationTheme}
      >
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.app}>
            <Stack.Navigator
              initialRouteName={initialRoute}
              screenOptions={{
                headerShown: false,
                contentStyle: styles.screen,
                animation: 'none',
                gestureEnabled: false,
              }}
            >
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Home" component={MainPagerScreen} />
              <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
              <Stack.Screen name="BrowseByMuscle" component={BrowseByMuscleScreen} />
              <Stack.Screen name="Chat" component={ChatScreenWrapper} />
              <Stack.Screen name="FoodLog" component={FoodLogCaptureScreen} />
              <Stack.Screen name="MealLogs" component={MealLogsScreen} />
              <Stack.Screen name="MealLogDetail" component={MealLogDetailScreen} />
              <Stack.Screen name="DailyLogDetail" component={DailyLogDetailScreen} />
              <Stack.Screen name="WorkoutLog" component={WorkoutLogScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
            <GlobalTabBar keyboardVisible={keyboardVisible} />
          </View>
        </SafeAreaView>
      </NavigationContainer>
        </SafeAreaProvider>
      </UnitContext.Provider>
    </AppearanceContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  app: { flex: 1, backgroundColor: Colors.background },
  screen: { backgroundColor: Colors.background },
});
