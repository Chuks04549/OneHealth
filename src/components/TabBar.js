import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Spacing } from '../theme';
import { useAppAppearance } from '../contexts/AppearanceContext';

export const MAIN_TABS = [
  { key: 'Home', label: 'Home', icon: 'home', iconOutline: 'home-outline', route: 'Home' },
  { key: 'Workouts', label: 'Workouts', icon: 'barbell', iconOutline: 'barbell-outline', route: 'Workouts' },
  { key: 'Progress', label: 'Progress', icon: 'analytics', iconOutline: 'analytics-outline', route: 'Progress' },
  { key: 'Goals', label: 'Goals', icon: 'flag', iconOutline: 'flag-outline', route: 'Goals' },
];

const TAB_BAR_HORIZONTAL_PADDING = Spacing.md;
const ACTIVE_PILL_WIDTH = 64;

export default function TabBar({
  active,
  positionValue,
  onSelectTab,
  onBeginTabDrag,
  onDragTabPosition,
  onReleaseTabPosition,
  hidden = false,
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useAppAppearance();
  const isDark = colorScheme === 'dark';
  const activeIndex = Math.max(0, MAIN_TABS.findIndex((tab) => tab.key === active));
  const internalPosition = useRef(new Animated.Value(activeIndex)).current;
  const position = positionValue || internalPosition;
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const dragPositionRef = useRef(activeIndex);
  const livePositionRef = useRef(activeIndex);
  const glassRef = useRef(null);
  const tabBarPageXRef = useRef(0);

  useEffect(() => {
    if (positionValue) return;
    Animated.spring(position, {
      toValue: activeIndex,
      stiffness: 230,
      damping: 22,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, position, positionValue]);

  useEffect(() => {
    const listenerId = position.addListener(({ value }) => {
      livePositionRef.current = value;
    });
    return () => position.removeListener(listenerId);
  }, [position]);

  const slotWidth = Math.max(0, (tabBarWidth - (TAB_BAR_HORIZONTAL_PADDING * 2)) / MAIN_TABS.length);
  const indicatorStart = TAB_BAR_HORIZONTAL_PADDING + Math.max(0, (slotWidth - ACTIVE_PILL_WIDTH) / 2);
  const indicatorTranslateX = Animated.multiply(position, slotWidth);
  const cursorPanResponder = useMemo(() => {
    const positionForFinger = (pageX) => {
      const firstSlotCenter = tabBarPageXRef.current + TAB_BAR_HORIZONTAL_PADDING + (slotWidth / 2);
      return Math.max(0, Math.min(MAIN_TABS.length - 1, (pageX - firstSlotCenter) / slotWidth));
    };

    const followFinger = (pageX) => {
      if (!slotWidth || !Number.isFinite(pageX)) return;
      const next = positionForFinger(pageX);
      dragPositionRef.current = next;
      position.setValue(next);
      onDragTabPosition?.(next);
    };

    return PanResponder.create({
    onStartShouldSetPanResponder: () => Boolean(onDragTabPosition && slotWidth > 0),
    onStartShouldSetPanResponderCapture: () => Boolean(onDragTabPosition && slotWidth > 0),
    onMoveShouldSetPanResponder: () => Boolean(onDragTabPosition && slotWidth > 0),
    onMoveShouldSetPanResponderCapture: () => Boolean(onDragTabPosition && slotWidth > 0),
    onPanResponderGrant: (event) => {
      position.stopAnimation();
      const start = Math.max(0, Math.min(MAIN_TABS.length - 1, livePositionRef.current));
      dragPositionRef.current = start;
      onBeginTabDrag?.(start);
      followFinger(event.nativeEvent.pageX);
    },
    onPanResponderMove: (_, gesture) => {
      followFinger(gesture.moveX);
    },
    onPanResponderRelease: () => onReleaseTabPosition?.(dragPositionRef.current),
    onPanResponderTerminate: () => onReleaseTabPosition?.(dragPositionRef.current),
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
    });
  }, [onBeginTabDrag, onDragTabPosition, onReleaseTabPosition, position, slotWidth]);

  const selectTab = (tab, index) => {
    if (onSelectTab) {
      onSelectTab(index, tab);
      return;
    }
    navigation.navigate('Home', { tab: tab.key, tabSelectionId: Date.now() });
  };

  return (
    <View
      pointerEvents={hidden ? 'none' : 'auto'}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      style={[styles.dock, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }, hidden && styles.hidden]}
    > 
      <View
        ref={glassRef}
        onLayout={() => {
          requestAnimationFrame(() => {
            glassRef.current?.measureInWindow((x) => {
              tabBarPageXRef.current = x;
            });
          });
        }}
        style={[styles.glassShadow, { borderColor: Colors.glassBorder }]}
      >
        <BlurView
          intensity={78}
          tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
          experimentalBlurMethod="dimezisBlurView"
          style={styles.tabBar}
          onLayout={(event) => setTabBarWidth(event.nativeEvent.layout.width)}
        >
          <View
            pointerEvents="none"
            style={[styles.glassHighlight, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.30)' }]}
          />
          {tabBarWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.activeIndicator,
                {
                  left: indicatorStart,
                  backgroundColor: isDark ? 'rgba(88, 189, 183, 0.20)' : 'rgba(40, 124, 121, 0.13)',
                  transform: [{ translateX: indicatorTranslateX }],
                },
              ]}
            >
              <View style={[styles.indicatorShine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.50)' }]} />
            </Animated.View>
          ) : null}
          {MAIN_TABS.map((tab, index) => {
            const isActive = active === tab.key;
            const iconProgress = position.interpolate({
              inputRange: MAIN_TABS.map((_, tabIndex) => tabIndex),
              outputRange: MAIN_TABS.map((_, tabIndex) => (tabIndex === index ? 1 : 0)),
              extrapolate: 'clamp',
            });
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => selectTab(tab, index)}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isActive }}
                activeOpacity={1}
              >
                <View style={styles.iconStack}>
                  <Animated.View style={[styles.iconLayer, { opacity: Animated.subtract(1, iconProgress) }]}>
                    <Ionicons name={tab.iconOutline} size={24} color={Colors.textSecondary} />
                  </Animated.View>
                  <Animated.View style={[styles.iconLayer, { opacity: iconProgress }]}>
                    <Ionicons name={tab.icon} size={24} color={Colors.primary} />
                  </Animated.View>
                </View>
              </TouchableOpacity>
            );
          })}
          {onDragTabPosition && tabBarWidth > 0 ? (
            <Animated.View
              {...cursorPanResponder.panHandlers}
              accessibilityRole="adjustable"
              accessibilityLabel="Drag to switch pages"
              style={[
                styles.cursorGrabArea,
                {
                  left: indicatorStart,
                  transform: [{ translateX: indicatorTranslateX }],
                },
              ]}
            />
          ) : null}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: Colors.background,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
  },
  hidden: { opacity: 0 },
  glassShadow: {
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 62,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  glassHighlight: {
    position: 'absolute',
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    borderRadius: BorderRadius.full,
  },
  tabItem: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    width: ACTIVE_PILL_WIDTH,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(88, 189, 183, 0.24)',
    overflow: 'hidden',
  },
  indicatorShine: {
    position: 'absolute',
    top: 1,
    left: 12,
    right: 12,
    height: 1,
    borderRadius: BorderRadius.full,
  },
  iconStack: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorGrabArea: {
    position: 'absolute',
    zIndex: 10,
    top: 2,
    width: ACTIVE_PILL_WIDTH,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: 'transparent',
  },
});
