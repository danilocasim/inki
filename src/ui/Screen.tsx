import type { ReactElement, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "./Text";
import { tokens } from "./tokens";

export interface ScreenProps {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  subtitle?: string;
  title?: string;
}

/** Provides consistent safe-area, keyboard, and dark canvas treatment. */
export function Screen({
  children,
  contentStyle,
  scrollEnabled = true,
  subtitle,
  title,
}: ScreenProps): ReactElement {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea} testID="screen-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
        >
          {title ? <Text variant="screenTitle">{title}</Text> : null}
          {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: tokens.space[4],
    paddingBottom: tokens.space[10],
    paddingHorizontal: tokens.space[5],
    paddingTop: tokens.space[3],
  },
  keyboard: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: tokens.color.canvas,
    flex: 1,
  },
});
