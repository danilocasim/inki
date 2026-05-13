import type { ReactElement, ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { tokens } from "./tokens";

export type CardVariant = "surface" | "elevated" | "ink";

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
}

/** Rounded container primitive matching the dark screenshot card language. */
export function Card({ children, style, variant = "surface" }: CardProps): ReactElement {
  return <View style={[styles.base, variantStyles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.lg,
    padding: tokens.space[4]
  }
});

const variantStyles = StyleSheet.create({
  elevated: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: 1,
    ...tokens.shadow.card
  },
  ink: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderWidth: 1
  },
  surface: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: 1
  }
});
