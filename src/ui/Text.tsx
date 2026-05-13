import type { ReactElement } from "react";
import { StyleSheet, Text as NativeText, type TextProps } from "react-native";

import { fontFamily, tokens, type TextVariant } from "./tokens";

export type TextTone = "default" | "muted" | "accent" | "inverse" | "danger" | "button";

export interface InkiTextProps extends TextProps {
  tone?: TextTone;
  variant?: TextVariant;
}

/** Renders app text through the shared Figma-derived type scale. */
export function Text({
  tone = "default",
  variant = "body",
  style,
  ...props
}: InkiTextProps): ReactElement {
  return (
    <NativeText
      {...props}
      style={[styles.base, tokens.typography[variant], toneStyles[tone], style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: tokens.color.ink,
    fontFamily: fontFamily.regular
  }
});

const toneStyles = StyleSheet.create({
  default: {
    color: tokens.color.ink
  },
  muted: {
    color: tokens.color.muted
  },
  accent: {
    color: tokens.color.accent
  },
  inverse: {
    color: tokens.color.ink
  },
  danger: {
    color: tokens.color.danger
  },
  button: {
    color: tokens.color.black
  }
});
