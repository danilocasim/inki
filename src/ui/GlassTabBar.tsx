import type { ReactElement } from "react";
import { useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { Text } from "./Text";
import { tokens } from "./tokens";

const BAR_RADIUS = 999;
// Fixed compact tab cell so the three tabs sit close together.
const TAB_WIDTH = 84;
// Highlight pill: a large capsule that reaches near the bar border and
// slightly overlaps the neighbouring tabs (wider than a single tab cell).
const PILL_WIDTH = 104;
const PILL_INSET_Y = 4;
// Routes registered with the navigator that should never show a tab.
const HIDDEN_ROUTES = new Set(["capture", "_sitemap", "+not-found"]);
// Slightly overdamped — snappy travel with no overshoot past the end tabs.
const SPRING: WithSpringConfig = { damping: 48, stiffness: 520 };
const FADE_IN = { duration: 90 };
const FADE_OUT = { duration: 180 };

/**
 * Glassmorphism floating tab bar with a long-press-style drag interaction:
 * press and slide along the bar to preview tabs (capsule highlight + haptic
 * ticks), release to commit. A plain tap also selects. The highlight pill is
 * only visible while interacting — it fades away when idle.
 */
export function GlassTabBar({
  descriptors,
  navigation,
  state,
}: BottomTabBarProps): ReactElement {
  const routes = state.routes.filter((route) => !HIDDEN_ROUTES.has(route.name));
  const activeKey = state.routes[state.index]?.key;
  const activeIndex = Math.max(
    0,
    routes.findIndex((route) => route.key === activeKey),
  );
  const tabCount = routes.length;

  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const rowWidthRef = useRef(0);

  // `indicator` is a fractional tab index the highlight pill animates toward.
  const indicator = useSharedValue(activeIndex);
  // `visible` fades the pill in only while a gesture is in progress.
  const visible = useSharedValue(0);
  const rowWidth = useSharedValue(0);

  const handleRowLayout = (event: LayoutChangeEvent): void => {
    const width = event.nativeEvent.layout.width;
    rowWidthRef.current = width;
    rowWidth.value = width;
  };

  const indexAt = (x: number): number | null => {
    const width = rowWidthRef.current;
    if (width <= 0 || tabCount === 0) return null;
    const tabWidth = width / tabCount;
    return Math.min(tabCount - 1, Math.max(0, Math.floor(x / tabWidth)));
  };

  // Finger touched down — show the pill snapped onto the touched tab.
  const beginHover = (x: number): void => {
    draggingRef.current = true;
    hoveredRef.current = null;
    visible.value = withTiming(1, FADE_IN);

    const index = indexAt(x);
    if (index === null) return;
    hoveredRef.current = index;
    setHovered(index);
    indicator.value = index;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  // Finger sliding — glide the pill onto whichever tab it crosses.
  const hoverAt = (x: number): void => {
    const index = indexAt(x);
    if (index === null || index === hoveredRef.current) return;
    hoveredRef.current = index;
    setHovered(index);
    indicator.value = withSpring(index, SPRING);
    // Crisp tick each time the finger crosses onto a new tab.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  // Finger lifted — navigate to the hovered tab, then hide the pill.
  const commitHover = (): void => {
    const target = hoveredRef.current ?? activeIndex;
    const route = routes[target];
    draggingRef.current = false;
    hoveredRef.current = null;
    setHovered(null);
    visible.value = withTiming(0, FADE_OUT);

    if (!route) return;

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (target !== activeIndex && !event.defaultPrevented) {
      // Satisfying commit thump when a new tab is selected.
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
      navigation.navigate(route.name);
    }
  };

  // Touch stream interrupted — just hide the pill.
  const cancelHover = (): void => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    hoveredRef.current = null;
    setHovered(null);
    visible.value = withTiming(0, FADE_OUT);
  };

  // Raw touch callbacks fire for taps *and* drags regardless of whether the
  // pan ever activates, so a plain tap reliably navigates.
  const gesture = Gesture.Pan()
    .onTouchesDown((event) => {
      const touch = event.changedTouches[0];
      if (touch) runOnJS(beginHover)(touch.x);
    })
    .onTouchesMove((event) => {
      const touch = event.changedTouches[0];
      if (touch) runOnJS(hoverAt)(touch.x);
    })
    .onTouchesUp(() => {
      runOnJS(commitHover)();
    })
    .onTouchesCancelled(() => {
      runOnJS(cancelHover)();
    });

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = tabCount > 0 ? rowWidth.value / tabCount : 0;
    return {
      opacity: visible.value,
      transform: [{ translateX: indicator.value * tabWidth + (tabWidth - PILL_WIDTH) / 2 }],
    };
  });

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.bar}>
        {/* Clip layer keeps the blur strictly inside the capsule shape. */}
        <View style={styles.clip}>
          <BlurView intensity={36} style={styles.blur} tint="dark" />
        </View>
        <GestureDetector gesture={gesture}>
          {/* Rounded + clipped so the pill can never spill past the capsule. */}
          <View onLayout={handleRowLayout} style={styles.row}>
            <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />
            {routes.map((route, index) => {
              const { options } = descriptors[route.key]!;
              const isHovered = hovered !== null && index === hovered;
              // Idle: only the active tab is lit. Interacting: the hovered tab.
              const lit = isHovered || (hovered === null && index === activeIndex);
              const color = lit ? tokens.color.white : tokens.color.muted;
              const label =
                typeof options.tabBarLabel === "string"
                  ? options.tabBarLabel
                  : (options.title ?? route.name);

              return (
                <View key={route.key} style={styles.tab}>
                  <View
                    style={[styles.tabContent, { transform: [{ scale: isHovered ? 1.1 : 1 }] }]}
                  >
                    {options.tabBarIcon?.({ color, focused: lit, size: 22 })}
                    <Text style={[styles.label, { color }]} variant="caption">
                      {label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: BAR_RADIUS,
    borderWidth: 1,
    elevation: 16,
    height: 64,
    shadowColor: "#000",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,15,15,0.55)",
  },
  clip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_RADIUS,
    overflow: "hidden",
  },
  indicator: {
    backgroundColor: "rgba(255,255,255,0.13)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: BAR_RADIUS,
    borderWidth: 1,
    bottom: PILL_INSET_Y,
    position: "absolute",
    top: PILL_INSET_Y,
    width: PILL_WIDTH,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "lowercase",
  },
  row: {
    borderRadius: BAR_RADIUS,
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    width: TAB_WIDTH,
  },
  tabContent: {
    alignItems: "center",
    gap: 3,
  },
  wrap: {
    alignItems: "center",
    bottom: 24,
    left: 0,
    position: "absolute",
    right: 0,
  },
});
