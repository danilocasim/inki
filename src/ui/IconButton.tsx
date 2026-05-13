import type { ComponentProps, ReactElement } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { tokens } from "./tokens";

export type FeatherIconName = ComponentProps<typeof Feather>["name"];
export type IconButtonVariant = "accent" | "danger" | "ghost" | "surface";

export interface IconButtonProps {
  disabled?: boolean;
  label: string;
  name: FeatherIconName;
  onPress: () => void;
  size?: number;
  variant?: IconButtonVariant;
}

/** Compact icon-only action with a stable 48pt touch target. */
export function IconButton({
  disabled = false,
  label,
  name,
  onPress,
  size = 20,
  variant = "surface"
}: IconButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined
      ]}
    >
      <Feather color={iconColors[variant]} name={name} size={size} />
    </Pressable>
  );
}

const iconColors: Record<IconButtonVariant, string> = {
  accent: tokens.color.black,
  danger: tokens.color.danger,
  ghost: tokens.color.ink,
  surface: tokens.color.accent
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: tokens.radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  disabled: {
    opacity: 0.45
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }]
  }
});

const variantStyles = StyleSheet.create({
  accent: {
    backgroundColor: tokens.color.accent
  },
  danger: {
    backgroundColor: "#2A1717"
  },
  ghost: {
    backgroundColor: "transparent"
  },
  surface: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: 1
  }
});
