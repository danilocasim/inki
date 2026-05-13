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
            <Text tone={selected ? "inverse" : "muted"} variant="tab">
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
    backgroundColor: tokens.color.surfaceMuted,
    borderRadius: tokens.radius.pill,
    flexDirection: "row",
    gap: tokens.space[1],
    padding: tokens.space[1]
  },
  option: {
    alignItems: "center",
    borderRadius: tokens.radius.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: tokens.space[3]
  },
  optionSelected: {
    backgroundColor: tokens.color.ink
  }
});
