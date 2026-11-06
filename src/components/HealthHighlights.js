import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RecommendationCard from './RecommendationCard';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';

const HEALTH_FACTS = [
  'A short walk can break up long periods of sitting and add meaningful movement to your day.',
  'Sleep supports memory, mood, immune function, and physical recovery—not just energy levels.',
  'Muscles adapt during recovery, so rest is part of training rather than time away from it.',
  'Thirst and urine color can be useful everyday hydration cues because fluid needs vary by person and activity.',
  'Consistent, moderate activity generally matters more than making every workout intense.',
  'Fiber supports digestion and is found in foods such as beans, vegetables, fruit, and whole grains.',
  'Balance and strength exercises support everyday movement as well as athletic performance.',
];

function currentFactIndex() {
  return Math.floor(Date.now() / 30000) % HEALTH_FACTS.length;
}

export default function HealthHighlights() {
  const listRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(1);
  const [factIndex, setFactIndex] = useState(currentFactIndex);
  const cards = [
    { type: 'recommendation', id: 'for-you' },
    { type: 'fact', id: 'health-fact', body: HEALTH_FACTS[factIndex] },
  ];

  useEffect(() => {
    const timer = setInterval(() => setFactIndex((index) => (index + 1) % HEALTH_FACTS.length), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleLayout = (event) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (!nextWidth || nextWidth === width) return;
    setWidth(nextWidth);
    requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: 1, animated: false }));
  };

  return (
    <View onLayout={handleLayout}>
      {width > 0 ? (
        <FlatList
          ref={listRef}
          horizontal
          pagingEnabled
          data={cards}
          initialScrollIndex={1}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={(event) => {
            const nextIndex = Math.max(0, Math.min(1, Math.round(event.nativeEvent.contentOffset.x / width)));
            if (nextIndex !== activeIndex) setActiveIndex(nextIndex);
          }}
          renderItem={({ item }) => (
            <View style={[styles.page, { width }]}>
              {item.type === 'recommendation' ? (
                <RecommendationCard compact style={styles.banner} />
              ) : (
                <View style={[styles.factCard, styles.banner]}>
                  <View style={styles.iconBox}>
                    <Ionicons name="bulb-outline" size={28} color={Colors.primary} />
                  </View>
                  <View style={styles.factContent}>
                    <Text style={styles.factTitle}>Fun Health Fact</Text>
                    <Text style={styles.factBody} numberOfLines={3}>{item.body}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        />
      ) : null}
      <View style={styles.dots}>
        {cards.map((item, index) => (
          <View key={item.id} style={[styles.dot, activeIndex === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 1 },
  banner: { height: 96, minHeight: 96, marginBottom: 0 },
  factCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.xxl, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.primaryBorder, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  iconBox: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.cardBackground, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  factContent: { flex: 1 },
  factTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.text, marginBottom: Spacing.xs, letterSpacing: 0.8, textTransform: 'uppercase' },
  factBody: { fontSize: Typography.fontSize.sm, color: Colors.text, lineHeight: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 16, backgroundColor: Colors.primary },
});
