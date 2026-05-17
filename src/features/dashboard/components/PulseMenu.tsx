import type { ReactElement } from "react";
import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface PulseMenuProps {
  onDismiss: () => void;
  onShare: () => void;
}

const BTN_DIAMETER = 56;
const FADE_OUT_MS = 150;

/** Minimal long-press menu for The Pulse — a single share action, like the book menu. */
export function PulseMenu({ onDismiss, onShare }: PulseMenuProps): ReactElement {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Heavy thump as the menu opens, matching the book long-press menu.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    opacity.value = withTiming(1, { duration: 160 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (after?: () => void): void => {
    opacity.value = withTiming(0, { duration: FADE_OUT_MS });
    setTimeout(() => {
      after?.();
      onDismiss();
    }, FADE_OUT_MS + 20);
  };

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Modal animationType="none" onRequestClose={() => dismiss()} transparent visible>
      <Animated.View style={[styles.dim, fadeStyle]}>
        <Pressable
          accessibilityLabel="Close menu"
          accessibilityRole="button"
          onPress={() => dismiss()}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View pointerEvents="box-none" style={styles.layer}>
        <Animated.View style={[styles.actionWrap, fadeStyle]}>
          <Pressable
            accessibilityLabel="Share The Pulse"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => dismiss(onShare)}
            style={({ pressed }) => [styles.actionBtn, pressed ? styles.actionPressed : undefined]}
          >
            <Feather color={tokens.color.ink} name="share-2" size={22} />
          </Pressable>
          <Text style={styles.actionLabel} variant="caption">
            Share
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
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
  actionLabel: {
    color: tokens.color.white,
    marginTop: tokens.space[1],
    textAlign: "center",
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.9 }],
  },
  actionWrap: {
    alignItems: "center",
  },
  dim: {
    backgroundColor: "rgba(0,0,0,0.6)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  layer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
