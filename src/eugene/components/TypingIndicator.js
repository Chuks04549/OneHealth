import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

function Dot({ delay }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, { toValue: -6, duration: 260, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce, delay]);

  return <Animated.View style={[styles.dot, { transform: [{ translateY: bounce }] }]} />;
}

export default function TypingIndicator() {
  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <View style={styles.dotWrapper}><Dot delay={0} /></View>
        <View style={styles.dotWrapper}><Dot delay={150} /></View>
        <View style={styles.dotWrapper}><Dot delay={300} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignSelf: 'flex-start', marginBottom: 18 },
  bubble: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dotWrapper: { marginHorizontal: 2 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.inkFaint },
});
