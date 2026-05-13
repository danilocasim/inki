import type { ReactElement } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Text, type TextTone } from "./Text";
import { tokens } from "./tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: ButtonVariant;
}

/** Accessible 48pt action primitive used by feature screens and error states. */
export function Button({
  disabled = false,
  label,
  loading = false,
  onPress,
  variant = "primary"
}: ButtonProps): ReactElement {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined
      ]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={indicatorColors[variant]} /> : null}
        <Text tone={labelTones[variant]} variant="bodyStrong">
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const labelTones: Record<ButtonVariant, TextTone> = {
  primary: "inverse",
  secondary: "accent",
  ghost: "default"
};

const indicatorColors: Record<ButtonVariant, string> = {
  primary: tokens.color.surface,
  secondary: tokens.color.accentDark,
  ghost: tokens.color.ink
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: tokens.radius.pill,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: tokens.space[5]
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[2],
    justifyContent: "center"
  },
  disabled: {
    opacity: 0.45
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }]
  }
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: tokens.color.ink
  },
  secondary: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: 1
  },
  ghost: {
    backgroundColor: "transparent"
  }
});
