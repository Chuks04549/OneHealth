import React from 'react';
import { Alert, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AskEugeneText({ children, text, style, onAsk, ...props }) {
  const navigation = useNavigation();
  const concept = String(text ?? children ?? '').trim();

  const askEugene = () => {
    if (!concept) return;
    const draft = `Tell me more about ${concept}`;
    Alert.alert('Ask Eugene', concept, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Ask Eugene',
        onPress: () => onAsk ? onAsk(draft) : navigation.navigate('Chat', { draft, draftId: Date.now() }),
      },
    ]);
  };

  return (
    <Text selectable style={style} onLongPress={askEugene} {...props}>
      {children ?? text}
    </Text>
  );
}
