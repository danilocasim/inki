import type { TextStyle, ViewStyle } from "react-native";

/** Figma-derived primitive tokens for the first static Inki mobile shell. */
export const tokens = {
  color: {
    canvas: "#F4EBDD",
    surface: "#FFF9F0",
    surfaceMuted: "#EFE1CD",
    ink: "#201812",
    inkSoft: "#4A3A2F",
    muted: "#7E6F62",
    border: "#DECBB2",
    accent: "#B66A3C",
    accentDark: "#7D3F26",
    leaf: "#65785C",
    moss: "#2F3B2E",
    blush: "#D69B86",
    gold: "#C69A45",
    danger: "#9C3F36",
    white: "#FFFFFF"
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 18,
    lg: 26,
    xl: 34,
    pill: 999
  },
  typography: {
    screenTitle: { fontSize: 34, lineHeight: 40, fontWeight: "800" },
    hero: { fontSize: 28, lineHeight: 34, fontWeight: "800" },
    sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: "800" },
    body: { fontSize: 16, lineHeight: 23, fontWeight: "500" },
    bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: "700" },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
    eyebrow: { fontSize: 11, lineHeight: 15, fontWeight: "800", letterSpacing: 1.1 },
    tab: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
    stat: { fontSize: 24, lineHeight: 30, fontWeight: "900" }
  } satisfies Record<string, TextStyle>,
  shadow: {
    card: {
      shadowColor: "#201812",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 4
    } satisfies ViewStyle
  }
} as const;

export type TextVariant = keyof typeof tokens.typography;
