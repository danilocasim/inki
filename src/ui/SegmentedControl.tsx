import type { ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { tokens } from "./tokens";

export interface SegmentOption<Value extends string> {
  label: string;
  value: Value;
}

export interface SegmentedControlProps<Value extends string> {
  onValueChange: (value: Value) => void;
  options: readonly SegmentOption<Value>[];
  value: Value;
}

/** Tokenized segmented tabs used for Home filters and shelf view switching. */
export function SegmentedControl<Value extends string>({
  onValueChange,
  options,
  value
}: SegmentedControlProps<Value>): ReactElement {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onValueChange(option.value)}
            style={[styles.option, selected ? styles.optionSelected : undefined]}
          >
            <Text tone={selected ? "button" : "muted"} variant="tab">
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[2]
  },
  option: {
    alignItems: "center",
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: tokens.space[4]
  },
  optionSelected: {
    backgroundColor: tokens.color.accent,
    borderColor: tokens.color.accent
  }
});
