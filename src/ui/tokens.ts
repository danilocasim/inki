import type { TextStyle, ViewStyle } from "react-native";

export const fontFamily = {
  regular: "IbarraRealNova_400Regular",
  regularItalic: "IbarraRealNova_400Regular_Italic",
  medium: "IbarraRealNova_500Medium",
  semiBold: "IbarraRealNova_600SemiBold",
  bold: "IbarraRealNova_700Bold",
  boldItalic: "IbarraRealNova_700Bold_Italic"
} as const;

/** Screenshot-derived primitives for Inki's dark editorial mobile shell. */
export const tokens = {
  color: {
    canvas: "#1B1B1B",
    surface: "#252525",
    surfaceMuted: "#111111",
    surfaceRaised: "#2A2A2A",
    ink: "#F1EEE8",
    inkSoft: "#BEB8B0",
    muted: "#777675",
    border: "#333333",
    accent: "#9EC7FA",
    accentDark: "#78A8E8",
    leaf: "#365F50",
    moss: "#263B29",
    blush: "#9B3F41",
    gold: "#C99668",
    danger: "#D24B43",
    black: "#080808",
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
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 28,
    pill: 999
  },
  typography: {
    screenTitle: { fontFamily: fontFamily.bold, fontSize: 34, lineHeight: 40, fontWeight: "700", letterSpacing: 0 },
    hero: { fontFamily: fontFamily.bold, fontSize: 26, lineHeight: 32, fontWeight: "700", letterSpacing: 0 },
    sectionTitle: { fontFamily: fontFamily.bold, fontSize: 21, lineHeight: 27, fontWeight: "700", letterSpacing: 0 },
    body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 23, fontWeight: "400", letterSpacing: 0 },
    bodyStrong: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 23, fontWeight: "700", letterSpacing: 0 },
    caption: { fontFamily: fontFamily.semiBold, fontSize: 13, lineHeight: 18, fontWeight: "600", letterSpacing: 0 },
    eyebrow: { fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 15, fontWeight: "700", letterSpacing: 2 },
    tab: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 16, fontWeight: "600", letterSpacing: 0 },
    stat: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 38, fontWeight: "700", letterSpacing: 0 }
  } satisfies Record<string, TextStyle>,
  shadow: {
    card: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 5
    } satisfies ViewStyle
  }
} as const;

export type TextVariant = keyof typeof tokens.typography;
