// src/components/ChatBubble.js
//
// Plain text message bubble. Coach messages can carry an optional
// `reasoning` string — when present it renders as a visible "Why"
// strip under the bubble by default, not hidden behind a tap. That's
// the whole point: the reasoning IS the differentiator, so it can't be
// opt-in.

import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, type } from '../theme';
import AskEugeneText from '../../components/AskEugeneText';

export default function ChatBubble({ message, onAsk }) {
  const isUser = message.sender === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowCoach]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleCoach]}>
        <AskEugeneText style={isUser ? styles.textUser : styles.textCoach} onAsk={onAsk}>{message.text}</AskEugeneText>
      </View>

      {!isUser && !!message.reasoning && (
        <View style={styles.reasoningBox}>
          <Text style={styles.reasoningLabel}>WHY</Text>
          <AskEugeneText style={styles.reasoningText} onAsk={onAsk}>{message.reasoning}</AskEugeneText>
        </View>
      )}

      <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampCoach]}>
        {message.timestamp}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 18, width: '85%', minWidth: 0 },
  rowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowCoach: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    maxWidth: '100%',
    minWidth: 0,
    flexShrink: 1,
  },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleCoach: { backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: 6 },
  textUser: { color: colors.white, fontSize: 15, lineHeight: 21, flexWrap: 'wrap', flexShrink: 1 },
  textCoach: { color: colors.ink, fontSize: 15, lineHeight: 21, flexWrap: 'wrap', flexShrink: 1 },
  reasoningBox: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    backgroundColor: colors.accentSoft,
    maxWidth: '100%',
  },
  reasoningLabel: { ...type.label, color: colors.accentDark, marginBottom: 3, fontSize: 10 },
  reasoningText: { fontSize: 13, lineHeight: 18, color: colors.ink, flexWrap: 'wrap' },
  timestamp: { fontSize: 11, color: colors.inkFaint, marginTop: 4, marginHorizontal: 4 },
  timestampUser: {},
  timestampCoach: {},
});
