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

export function QuoteHighlightLines({
  quote,
  scale,
}: {
  quote: string;
  scale: number;
}): ReactElement {
  const lines = splitQuoteIntoLines(quote);

  return (
    <View style={styles.root}>
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
              styles.line,
              scaled(
                {
                  fontSize: 40,
                  lineHeight: 48,
                  marginBottom: -2,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
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

const styles = StyleSheet.create({
  line: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(143,124,38,0.86)",
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 48,
    overflow: "hidden",
  },
  root: {
    alignItems: "flex-start",
  },
});
