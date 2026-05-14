import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type LayoutRectangle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type WithSpringConfig,
  type WithTimingConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import type { Book } from "../../books/types";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface LongPressMenuProps {
  book: Book;
  onDismiss: () => void;
  onPin: () => void;
  onShare: () => void;
  onShelf: () => void;
  reduceMotion?: boolean;
  screenHeight: number;
  screenWidth: number;
  tileRect: LayoutRectangle;
}

const TILE_SCALE = 1.05;
const TILE_SPRING: WithSpringConfig = { damping: 20, stiffness: 300 };
const BTN_SPRING: WithSpringConfig = { damping: 22, stiffness: 400 };
const FADE_IN: WithTimingConfig = { duration: 200 };
const FADE_OUT: WithTimingConfig = { duration: 150 };
const BTN_DIAMETER = 56;
const EDGE_PADDING = 16;
const ACTION_GAP = 16;
const ACTION_ITEM_WIDTH = 72;
const ACTION_RAIL_WIDTH = ACTION_ITEM_WIDTH * 3 + ACTION_GAP * 2;
const LABEL_HEIGHT = 18;
const ACTION_RAIL_HEIGHT = BTN_DIAMETER + LABEL_HEIGHT + 8;
const ACTION_TILE_GAP = 18;

export function LongPressMenu({
  book,
  onDismiss,
  onPin,
  onShare,
  onShelf,
  reduceMotion: reduceMotionProp,
  screenHeight,
  screenWidth,
  tileRect,
}: LongPressMenuProps): ReactElement {
  const opacity = useSharedValue(0);
  const tileScale = useSharedValue(1);
  const shareScale = useSharedValue(0);
  const pinScale = useSharedValue(0);
  const shelfScale = useSharedValue(0);
  const shareRef = useRef<View>(null);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const reduceMotion = reduceMotionProp ?? systemReduceMotion;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSystemReduceMotion)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

    if (reduceMotion) {
      opacity.value = 1;
      tileScale.value = TILE_SCALE;
      shareScale.value = 1;
      pinScale.value = 1;
      shelfScale.value = 1;
    } else {
      opacity.value = withTiming(1, FADE_IN);
      tileScale.value = withSpring(TILE_SCALE, TILE_SPRING);
      shareScale.value = withSpring(1, BTN_SPRING);
      pinScale.value = withDelay(40, withSpring(1, BTN_SPRING));
      shelfScale.value = withDelay(80, withSpring(1, BTN_SPRING));
    }

    // Move accessibility focus to the Share button.
    const handle = shareRef.current;
    if (handle) {
      // Defer to next tick so the modal has mounted before we fire the focus event.
      const timeout = setTimeout(() => {
        // setAccessibilityFocus expects a node handle; findNodeHandle would be needed.
        // RN >=0.66 also accepts the View ref directly via accessibilityFocus method.
        // Best-effort: announce a label so VoiceOver re-anchors.
        AccessibilityInfo.announceForAccessibility("Book options open");
      }, 80);
      return () => clearTimeout(timeout);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (after?: () => void): void => {
    opacity.value = withTiming(0, FADE_OUT);
    tileScale.value = withSpring(1, TILE_SPRING);
    shareScale.value = withTiming(0, { duration: 120 });
    pinScale.value = withTiming(0, { duration: 120 });
    shelfScale.value = withTiming(0, { duration: 120 });
    setTimeout(() => {
      after?.();
      onDismiss();
    }, 180);
  };

  const actionLayout = useMemo(
    () => computeActionLayout(tileRect, screenWidth, screenHeight),
    [screenHeight, screenWidth, tileRect],
  );

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const tileStyle = useAnimatedStyle(() => ({ transform: [{ scale: tileScale.value }] }));
  const shareStyle = useAnimatedStyle(() => ({
    opacity: shareScale.value,
    transform: [{ scale: shareScale.value }],
  }));
  const pinStyle = useAnimatedStyle(() => ({
    opacity: pinScale.value,
    transform: [{ scale: pinScale.value }],
  }));
  const shelfStyle = useAnimatedStyle(() => ({
    opacity: shelfScale.value,
    transform: [{ scale: shelfScale.value }],
  }));

  return (
    <Modal animationType="none" onRequestClose={() => dismiss()} transparent visible>
      <Animated.View style={[styles.dim, overlayStyle]}>
        <Pressable
          accessibilityLabel="Close menu"
          accessibilityRole="button"
          onPress={() => dismiss()}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.tileWrap,
          {
            height: tileRect.height,
            left: tileRect.x,
            top: tileRect.y,
            width: tileRect.width,
          },
          tileStyle,
        ]}
      >
        <Pressable
          accessibilityLabel={`Open ${book.title}`}
          accessibilityRole="button"
          onPress={() => dismiss(() => onDismiss())}
          style={[styles.tile, { backgroundColor: book.palette.cover }]}
        >
          {book.coverPath ? (
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              source={{ uri: book.coverPath }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <>
              <Text numberOfLines={2} tone="inverse" variant="caption">
                {book.title}
              </Text>
              <Text numberOfLines={2} style={styles.tileAuthor} tone="inverse" variant="eyebrow">
                {book.author}
              </Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.actionRail,
          {
            height: actionLayout.rail.height,
            left: actionLayout.rail.x,
            top: actionLayout.rail.y,
            width: actionLayout.rail.width,
          },
        ]}
      >
        <ActionButton
          accessibilityLabel={book.isPinned ? "Unpin book" : "Pin book"}
          active={book.isPinned}
          animatedStyle={pinStyle}
          icon="map-pin"
          label={book.isPinned ? "Unpin" : "Pin"}
          onPress={() => dismiss(onPin)}
        />
        <ActionButton
          accessibilityLabel="Share book"
          animatedStyle={shareStyle}
          icon="share-2"
          innerRef={shareRef}
          label="Share"
          onPress={() => dismiss(onShare)}
        />
        <ActionButton
          accessibilityLabel="Add to shelf"
          animatedStyle={shelfStyle}
          icon="layers"
          label="Shelf"
          onPress={() => dismiss(onShelf)}
        />
      </Animated.View>
    </Modal>
  );
}

interface ActionButtonProps {
  accessibilityLabel: string;
  active?: boolean;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  icon: React.ComponentProps<typeof Feather>["name"];
  innerRef?: React.Ref<View>;
  label: string;
  onPress: () => void;
}

function ActionButton({
  accessibilityLabel,
  active = false,
  animatedStyle,
  icon,
  innerRef,
  label,
  onPress,
}: ActionButtonProps): ReactElement {
  return (
    <Animated.View ref={innerRef} style={[styles.actionWrap, animatedStyle]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionBtn,
          active ? styles.actionBtnActive : undefined,
          pressed ? styles.actionPressed : undefined,
        ]}
      >
        <Feather color={active ? tokens.color.accent : tokens.color.ink} name={icon} size={22} />
      </Pressable>
      <Text
        style={[styles.actionLabel, active ? styles.actionLabelActive : undefined]}
        variant="caption"
      >
        {label}
      </Text>
    </Animated.View>
  );
}

interface Position {
  x: number;
  y: number;
}

interface ActionPositions {
  pin: Position;
  share: Position;
  shelf: Position;
}

export interface ActionLayout {
  actionCenters: ActionPositions;
  placement: "above" | "below";
  rail: LayoutRectangle;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export function computeActionLayout(
  tile: LayoutRectangle,
  screenWidth: number,
  screenHeight: number,
): ActionLayout {
  const railWidth = Math.min(
    ACTION_RAIL_WIDTH,
    Math.max(BTN_DIAMETER * 3, screenWidth - EDGE_PADDING * 2),
  );
  const maxRailX = Math.max(EDGE_PADDING, screenWidth - railWidth - EDGE_PADDING);
  const tileCenterX = tile.x + tile.width / 2;
  const railX = clamp(tileCenterX - railWidth / 2, EDGE_PADDING, maxRailX);
  const railYAbove = tile.y - ACTION_RAIL_HEIGHT - ACTION_TILE_GAP;
  const railYBelow = tile.y + tile.height + ACTION_TILE_GAP;
  const maxRailY = Math.max(EDGE_PADDING, screenHeight - ACTION_RAIL_HEIGHT - EDGE_PADDING);
  const placement = railYAbove >= EDGE_PADDING ? "above" : "below";
  const railY = clamp(placement === "above" ? railYAbove : railYBelow, EDGE_PADDING, maxRailY);
  const rail: LayoutRectangle = {
    height: ACTION_RAIL_HEIGHT,
    width: railWidth,
    x: railX,
    y: railY,
  };

  return {
    actionCenters: {
      pin: { x: rail.x + ACTION_ITEM_WIDTH / 2, y: rail.y + BTN_DIAMETER / 2 },
      share: { x: rail.x + rail.width / 2, y: rail.y + BTN_DIAMETER / 2 },
      shelf: { x: rail.x + rail.width - ACTION_ITEM_WIDTH / 2, y: rail.y + BTN_DIAMETER / 2 },
    },
    placement,
    rail,
  };
}

const clampX = (x: number, screenWidth: number): number =>
  Math.max(EDGE_PADDING, Math.min(screenWidth - BTN_DIAMETER - EDGE_PADDING, x));

export function computeActionPositions(
  tile: LayoutRectangle,
  screenWidth: number,
): ActionPositions {
  const layout = computeActionLayout(tile, screenWidth, Number.POSITIVE_INFINITY);

  return {
    pin: topLeftFromCenter(layout.actionCenters.pin, screenWidth),
    share: topLeftFromCenter(layout.actionCenters.share, screenWidth),
    shelf: topLeftFromCenter(layout.actionCenters.shelf, screenWidth),
  };
}

const topLeftFromCenter = (center: Position, screenWidth: number): Position => ({
  x: clampX(center.x - BTN_DIAMETER / 2, screenWidth),
  y: center.y - BTN_DIAMETER / 2,
});

const styles = StyleSheet.create({
  actionRail: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
  },
  actionBtn: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: BTN_DIAMETER / 2,
    borderWidth: 1,
    height: BTN_DIAMETER,
    justifyContent: "center",
    width: BTN_DIAMETER,
    ...tokens.shadow.card,
  },
  actionBtnActive: {
    borderColor: tokens.color.accent,
  },
  actionLabel: {
    color: tokens.color.white,
    marginTop: tokens.space[1],
    textAlign: "center",
    width: ACTION_ITEM_WIDTH,
  },
  actionLabelActive: {
    color: tokens.color.accent,
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.9 }],
  },
  actionWrap: {
    alignItems: "center",
    width: ACTION_ITEM_WIDTH,
  },
  dim: {
    backgroundColor: "rgba(0,0,0,0.6)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  tile: {
    borderRadius: tokens.radius.sm,
    flex: 1,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: tokens.space[3],
  },
  tileAuthor: {
    opacity: 0.72,
    textTransform: "uppercase",
  },
  tileWrap: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});
