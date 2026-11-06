import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ChatScreen from '../eugene/screens/ChatScreen';
import { Colors } from '../theme';

export default function ChatScreenWrapper() {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View style={styles.container}>
      <ChatScreen
        onBack={() => navigation.goBack()}
        onLogWorkout={() => navigation.navigate('WorkoutLog')}
        initialDraft={route.params?.draft}
        draftId={route.params?.draftId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
