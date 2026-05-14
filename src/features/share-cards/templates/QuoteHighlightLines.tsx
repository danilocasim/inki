import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../../../ui/Text";
import { fontFamily, tokens } from "../../../ui/tokens";
import { cleanQuoteText, scaled } from "./template-utils";

const TARGET_LINE_LENGTH = 21;
const MAX_QUOTE_LINES = 5;

export const splitQuoteIntoLines = (quote: string): readonly string[] => {
  const words = cleanQuoteText(quote).split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine.length > 0 ? `${currentLine} ${word}` : word;

    if (candidate.length <= TARGET_LINE_LENGTH || currentLine.length === 0) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  if (lines.length <= MAX_QUOTE_LINES) {
    return lines;
  }

  return [...lines.slice(0, MAX_QUOTE_LINES - 1), lines.slice(MAX_QUOTE_LINES - 1).join(" ")];
};

export interface QuoteHighlightLinesProps {
  alignment?: "left" | "right";
  quote: string;
  scale: number;
  baseFontSize?: number;
  baseLineHeight?: number;
  basePaddingHorizontal?: number;
  basePaddingVertical?: number;
}

export function QuoteHighlightLines({
  alignment = "left",
  quote,
  scale,
  baseFontSize = 40,
  baseLineHeight = 48,
  basePaddingHorizontal = 5,
  basePaddingVertical = 1,
}: QuoteHighlightLinesProps): ReactElement {
  const lines = splitQuoteIntoLines(quote);
  const isRight = alignment === "right";
  const rootAlignStyle = isRight ? styles.rootRight : styles.root;
  const lineAlignStyle = isRight ? styles.lineRight : styles.line;

  return (
    <View style={rootAlignStyle}>
      {lines.map((line, index) => {
        const isFirst = index === 0;
        const isLast = index === lines.length - 1;

        return (
          <Text
            adjustsFontSizeToFit
            key={`${line}-${index}`}
            minimumFontScale={0.74}
            numberOfLines={1}
            style={[
              lineAlignStyle,
              scaled(
                {
                  fontSize: baseFontSize,
                  lineHeight: baseLineHeight,
                  marginBottom: -2,
                  paddingHorizontal: basePaddingHorizontal,
                  paddingVertical: basePaddingVertical,
                },
                scale,
              ),
            ]}
          >
            {`${isFirst ? '"' : ""}${line}${isLast ? '"' : ""}`}
          </Text>
        );
      })}
    </View>
  );
}

const baseLine = {
  backgroundColor: "rgba(143,124,38,0.86)",
  color: tokens.color.white,
  fontFamily: fontFamily.bold,
  fontSize: 40,
  letterSpacing: 0,
  lineHeight: 48,
  overflow: "hidden",
} as const;

const styles = StyleSheet.create({
  line: {
    ...baseLine,
    alignSelf: "flex-start",
  },
  lineRight: {
    ...baseLine,
    alignSelf: "flex-end",
    textAlign: "right",
  },
  root: {
    alignItems: "flex-start",
  },
  rootRight: {
    alignItems: "flex-end",
  },
});
