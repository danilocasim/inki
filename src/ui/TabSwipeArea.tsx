import type { ReactElement, ReactNode } from "react";
import { useCallback, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

/** Bottom-tab order, used to resolve which tab a swipe should land on. */
const TAB_ORDER = ["index", "shelves", "profile"] as const;

export type TabName = (typeof TAB_ORDER)[number];

const TAB_PATHS: Record<TabName, string> = {
  index: "/(tabs)",
  shelves: "/(tabs)/shelves",
  profile: "/(tabs)/profile",
};

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;

export interface TabSwipeAreaProps {
  children: ReactNode;
  current: TabName;
}

/**
 * Wraps a bottom-tab screen so a horizontal swipe navigates to the
 * adjacent tab. Vertical scrolling is unaffected — the pan only
 * engages on a clear horizontal drag.
 */
export function TabSwipeArea({ children, current }: TabSwipeAreaProps): ReactElement {
  const router = useRouter();
  const currentRef = useRef<TabName>(current);
  currentRef.current = current;

  const goToAdjacentTab = useCallback(
    (direction: -1 | 1): void => {
      const index = TAB_ORDER.indexOf(currentRef.current);
      const nextIndex = index + direction;
      const nextTab = TAB_ORDER[nextIndex];
      if (nextTab === undefined) {
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      router.navigate(TAB_PATHS[nextTab]);
    },
    [router],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-18, 18])
        .onEnd((event) => {
          if (event.translationX <= -SWIPE_DISTANCE || event.velocityX <= -SWIPE_VELOCITY) {
            runOnJS(goToAdjacentTab)(1);
          } else if (
            event.translationX >= SWIPE_DISTANCE ||
            event.velocityX >= SWIPE_VELOCITY
          ) {
            runOnJS(goToAdjacentTab)(-1);
          }
        }),
    [goToAdjacentTab],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.flex}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
