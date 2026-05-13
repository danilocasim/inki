import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import RootLayout from "../_layout";
import { hasCompletedOnboarding } from "../../src/features/onboarding/onboarding-storage";

jest.mock("@expo-google-fonts/ibarra-real-nova", () => ({
  IbarraRealNova_400Regular: "IbarraRealNova_400Regular",
  IbarraRealNova_400Regular_Italic: "IbarraRealNova_400Regular_Italic",
  IbarraRealNova_500Medium: "IbarraRealNova_500Medium",
  IbarraRealNova_600SemiBold: "IbarraRealNova_600SemiBold",
  IbarraRealNova_700Bold: "IbarraRealNova_700Bold",
  IbarraRealNova_700Bold_Italic: "IbarraRealNova_700Bold_Italic",
}));

jest.mock("expo-font", () => ({
  useFonts: jest.fn(() => [true]),
}));

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");

  function Stack() {
    return React.createElement(Text, null, "home stack");
  }

  Stack.Screen = function Screen() {
    return null;
  };

  return { Stack };
});

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("../../src/lib/db", () => ({
  DatabaseProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("../../src/features/onboarding/OnboardingScreen", () => ({
  OnboardingScreen: ({ onComplete }: { onComplete: () => void }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");

    return React.createElement(
      Pressable,
      { onPress: onComplete },
      React.createElement(Text, null, "finish onboarding"),
    );
  },
}));

jest.mock("../../src/features/onboarding/onboarding-storage", () => ({
  hasCompletedOnboarding: jest.fn(),
}));

const mockHasCompletedOnboarding = jest.mocked(hasCompletedOnboarding);

describe("RootLayout onboarding gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the home stack when onboarding was already completed", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(true);

    render(<RootLayout />);

    await waitFor(() => expect(screen.getByText("home stack")).toBeTruthy());

    expect(screen.queryByText("finish onboarding")).toBeNull();
  });

  it("opens home after the onboarding flow completes", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(false);

    render(<RootLayout />);

    await waitFor(() => expect(screen.getByText("finish onboarding")).toBeTruthy());

    fireEvent.press(screen.getByText("finish onboarding"));

    await waitFor(() => expect(screen.getByText("home stack")).toBeTruthy());
    expect(screen.queryByText("finish onboarding")).toBeNull();
  });

  it("falls back to onboarding when the saved state cannot be read", async () => {
    mockHasCompletedOnboarding.mockRejectedValue(new Error("prefs unavailable"));

    render(<RootLayout />);

    await waitFor(() => expect(screen.getByText("finish onboarding")).toBeTruthy());

    expect(screen.queryByText("home stack")).toBeNull();
  });
});
