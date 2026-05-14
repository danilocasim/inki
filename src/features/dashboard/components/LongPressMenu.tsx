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

export function LongPressMenu({
  book,
  onDismiss,
  onPin,
  onShare,
  onShelf,
  reduceMotion: reduceMotionProp,
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

  const positions = useMemo(
    () => computeActionPositions(tileRect, screenWidth),
    [tileRect, screenWidth],
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
            <Text numberOfLines={2} tone="inverse" variant="caption">
              {book.title}
            </Text>
          )}
        </Pressable>
      </Animated.View>

      <ActionButton
        accessibilityLabel="Share book"
        animatedStyle={shareStyle}
        icon="share-2"
        innerRef={shareRef}
        label="Share"
        left={positions.share.x}
        onPress={() => dismiss(onShare)}
        top={positions.share.y}
      />
      <ActionButton
        accessibilityLabel={book.isPinned ? "Unpin book" : "Pin book"}
        active={book.isPinned}
        animatedStyle={pinStyle}
        icon="map-pin"
        label={book.isPinned ? "Unpin" : "Pin"}
        left={positions.pin.x}
        onPress={() => dismiss(onPin)}
        top={positions.pin.y}
      />
      <ActionButton
        accessibilityLabel="Add to shelf"
        animatedStyle={shelfStyle}
        icon="layers"
        label="Shelf"
        left={positions.shelf.x}
        onPress={() => dismiss(onShelf)}
        top={positions.shelf.y}
      />
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
  left: number;
  onPress: () => void;
  top: number;
}

function ActionButton({
  accessibilityLabel,
  active = false,
  animatedStyle,
  icon,
  innerRef,
  label,
  left,
  onPress,
  top,
}: ActionButtonProps): ReactElement {
  return (
    <Animated.View
      ref={innerRef}
      style={[styles.actionWrap, { left, top }, animatedStyle]}
    >
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
        <Feather
          color={active ? tokens.color.accent : tokens.color.ink}
          name={icon}
          size={22}
        />
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

const ARC_RADIUS = 72;
const LABEL_HEIGHT = 18;
const ACTION_FOOTPRINT = BTN_DIAMETER + LABEL_HEIGHT;

const clampX = (x: number, screenWidth: number): number =>
  Math.max(EDGE_PADDING, Math.min(screenWidth - BTN_DIAMETER - EDGE_PADDING, x));

export function computeActionPositions(
  tile: LayoutRectangle,
  screenWidth: number,
): ActionPositions {
  const tileCenterX = tile.x + tile.width / 2;
  const yAbove = Math.max(EDGE_PADDING, tile.y - ACTION_FOOTPRINT - 8);

  return {
    share: {
      x: clampX(tileCenterX - BTN_DIAMETER / 2, screenWidth),
      y: yAbove,
    },
    pin: {
      x: clampX(tileCenterX - ARC_RADIUS - BTN_DIAMETER / 2, screenWidth),
      y: yAbove + 18,
    },
    shelf: {
      x: clampX(tileCenterX + ARC_RADIUS - BTN_DIAMETER / 2, screenWidth),
      y: yAbove + 18,
    },
  };
}

const styles = StyleSheet.create({
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
    marginTop: 2,
    textAlign: "center",
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
    position: "absolute",
    width: BTN_DIAMETER,
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
    aspectRatio: 0.67,
    borderRadius: tokens.radius.sm,
    flex: 1,
    overflow: "hidden",
    padding: tokens.space[3],
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
