import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import HomeScreen from './HomeScreen';
import WorkoutScreen from './WorkoutScreen';
import GoalsScreen from './GoalsScreen';
import ProgressScreen from './ProgressScreen';
import TabBar, { MAIN_TABS } from '../components/TabBar';
import { Colors } from '../theme';

function tabIndexForKey(key) {
  const index = MAIN_TABS.findIndex((tab) => tab.key === key);
  return index < 0 ? 0 : index;
}

export default function MainPagerScreen() {
  const route = useRoute();
  const { width } = useWindowDimensions();
  const requestedIndex = tabIndexForKey(route.params?.tab);
  const [activeIndex, setActiveIndex] = useState(requestedIndex);
  const pagePosition = useRef(new Animated.Value(requestedIndex)).current;
  const pagerRef = useRef(null);
  const currentPositionRef = useRef(requestedIndex);
  const draggingCursorRef = useRef(false);
  const dragOriginPageRef = useRef(requestedIndex);
  const settlingTargetRef = useRef(null);

  const moveToPosition = useCallback((position, animated = false) => {
    const next = Math.max(0, Math.min(MAIN_TABS.length - 1, position));
    currentPositionRef.current = next;
    pagePosition.setValue(next);
    pagerRef.current?.scrollTo({ x: next * width, y: 0, animated });
  }, [pagePosition, width]);

  const selectPage = useCallback((index) => {
    const next = Math.max(0, Math.min(MAIN_TABS.length - 1, index));
    settlingTargetRef.current = next;
    setActiveIndex(next);
    currentPositionRef.current = next;
    pagerRef.current?.scrollTo({ x: next * width, y: 0, animated: true });
  }, [width]);

  const beginCursorDrag = useCallback((position) => {
    draggingCursorRef.current = true;
    settlingTargetRef.current = null;
    dragOriginPageRef.current = activeIndex;
    currentPositionRef.current = position;
    pagerRef.current?.scrollTo({ x: position * width, y: 0, animated: false });
  }, [activeIndex, width]);

  const dragPageToPosition = useCallback((position) => {
    const next = Math.max(0, Math.min(MAIN_TABS.length - 1, position));
    currentPositionRef.current = next;
    // The tab cursor already owns pagePosition during a drag. Only move the
    // page here so delayed native scroll events cannot pull the cursor backward.
    pagerRef.current?.scrollTo({ x: next * width, y: 0, animated: false });
  }, [width]);

  const releaseCursor = useCallback((position) => {
    const origin = dragOriginPageRef.current;
    const delta = position - origin;
    let target = origin;

    if (delta > 0.025) target = Math.ceil(position - 0.001);
    if (delta < -0.025) target = Math.floor(position + 0.001);

    draggingCursorRef.current = false;
    selectPage(target);
  }, [selectPage]);

  useEffect(() => {
    setActiveIndex(requestedIndex);
    requestAnimationFrame(() => moveToPosition(requestedIndex, false));
  }, [route.params?.tabSelectionId, requestedIndex, moveToPosition]);

  useEffect(() => {
    requestAnimationFrame(() => moveToPosition(activeIndex, false));
  }, [width]);

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        scrollEnabled
        bounces={false}
        directionalLockEnabled
        nestedScrollEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pages}
        scrollEventThrottle={8}
        onScroll={(event) => {
          if (!width) return;
          const next = event.nativeEvent.contentOffset.x / width;
          currentPositionRef.current = next;
          if (draggingCursorRef.current) return;
          pagePosition.setValue(next);
        }}
        onScrollBeginDrag={() => {
          settlingTargetRef.current = null;
        }}
        onMomentumScrollEnd={(event) => {
          if (draggingCursorRef.current) return;
          const rawPosition = event.nativeEvent.contentOffset.x / width;
          const next = Math.round(rawPosition);
          const settlingTarget = settlingTargetRef.current;
          if (settlingTarget != null && Math.abs(rawPosition - settlingTarget) > 0.01) return;
          setActiveIndex(next);
          currentPositionRef.current = next;
          pagePosition.setValue(next);
          settlingTargetRef.current = null;
        }}
      >
        <View style={[styles.page, { width }]}><HomeScreen /></View>
        <View style={[styles.page, { width }]}><WorkoutScreen /></View>
        <View style={[styles.page, { width }]}><ProgressScreen /></View>
        <View style={[styles.page, { width }]}><GoalsScreen /></View>
      </ScrollView>

      <TabBar
        active={MAIN_TABS[activeIndex]?.key}
        positionValue={pagePosition}
        onSelectTab={selectPage}
        onBeginTabDrag={beginCursorDrag}
        onDragTabPosition={dragPageToPosition}
        onReleaseTabPosition={releaseCursor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  pages: { height: '100%' },
  page: { height: '100%', overflow: 'hidden' },
});
