import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import "react-native-gesture-handler";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  IbarraRealNova_400Regular,
  IbarraRealNova_400Regular_Italic,
  IbarraRealNova_500Medium,
  IbarraRealNova_600SemiBold,
  IbarraRealNova_700Bold,
  IbarraRealNova_700Bold_Italic
} from "@expo-google-fonts/ibarra-real-nova";

import { DatabaseProvider } from "../src/lib/db";
import { ErrorState } from "../src/ui/ErrorState";
import { OnboardingScreen } from "../src/features/onboarding/OnboardingScreen";
import { hasCompletedOnboarding } from "../src/features/onboarding/onboarding-storage";
import { tokens } from "../src/ui/tokens";

export default function RootLayout(): ReactElement {
  const [fontsLoaded] = useFonts({
    IbarraRealNova_400Regular,
    IbarraRealNova_400Regular_Italic,
    IbarraRealNova_500Medium,
    IbarraRealNova_600SemiBold,
    IbarraRealNova_700Bold,
    IbarraRealNova_700Bold_Italic
  });

  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    // TODO: remove — forces onboarding to always show during development
    setOnboarded(false);
    // hasCompletedOnboarding().then(done => setOnboarded(done));
  }, []);

  if (!fontsLoaded || onboarded === null) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: tokens.color.canvas }} />
      </SafeAreaProvider>
    );
  }

  // DatabaseProvider always mounts so onboarding can read/write books
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        {!onboarded ? (
          <OnboardingScreen onComplete={() => setOnboarded(true)} />
        ) : (
          <>
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
            <StatusBar style="light" />
          </>
        )}
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
