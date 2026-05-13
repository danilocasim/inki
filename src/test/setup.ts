import "react-native-gesture-handler/jestSetup";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

type SafeAreaProviderProps = {
  children?: ReactNode;
};

type SafeAreaViewProps = SafeAreaProviderProps & {
  style?: StyleProp<ViewStyle>;
};

jest.mock("react-native-reanimated", () => jest.requireActual("react-native-reanimated/mock"));

jest.mock("react-native-safe-area-context", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    SafeAreaProvider: ({ children }: SafeAreaProviderProps) => React.createElement(View, null, children),
    SafeAreaView: ({ children, style }: SafeAreaViewProps) =>
      React.createElement(View, { style }, children),
    initialWindowMetrics: {
      frame: { height: 852, width: 393, x: 0, y: 0 },
      insets: { bottom: 0, left: 0, right: 0, top: 0 }
    },
    useSafeAreaFrame: () => ({ height: 852, width: 393, x: 0, y: 0 }),
    useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 })
  };
});
