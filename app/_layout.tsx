import type { ReactElement } from "react";
import "react-native-gesture-handler";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DatabaseProvider } from "../src/lib/db";
import { ErrorState } from "../src/ui/ErrorState";

/** Root Expo Router layout: providers only, no auth gate by design. */
export default function RootLayout(): ReactElement {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(modals)/log-book" options={{ presentation: "modal" }} />
          <Stack.Screen name="book/[id]" />
          <Stack.Screen name="shelves/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="capture/index" />
          <Stack.Screen name="capture/barcode" />
          <Stack.Screen name="capture/page" />
          <Stack.Screen name="share/[cardType]" />
        </Stack>
        <StatusBar style="dark" />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps): ReactElement {
  return (
    <SafeAreaProvider>
      <ErrorState
        actionLabel="Try again"
        message={error.message}
        onAction={retry}
        title="Inki hit a local error"
      />
    </SafeAreaProvider>
  );
}
