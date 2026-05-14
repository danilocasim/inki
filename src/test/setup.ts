import "react-native-gesture-handler/jestSetup";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

type SafeAreaProviderProps = {
  children?: ReactNode;
};

type SafeAreaViewProps = SafeAreaProviderProps & {
  edges?: readonly string[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

jest.mock("react-native-reanimated", () => jest.requireActual("react-native-reanimated/mock"));

jest.mock("@expo/vector-icons", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    Feather: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("@gorhom/bottom-sheet", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");

  const BottomSheet = React.forwardRef(({ children, ...props }: { children?: ReactNode }, _ref) =>
    React.createElement(View, props, children),
  );
  BottomSheet.displayName = "MockBottomSheet";
  const passthrough = ({ children, ...props }: { children?: ReactNode }) =>
    React.createElement(View, props, children);

  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetView: passthrough,
    BottomSheetScrollView: passthrough,
    BottomSheetBackdrop: () => null,
    BottomSheetModal: BottomSheet,
    BottomSheetModalProvider: passthrough,
  };
});

jest.mock("react-native-safe-area-context", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    SafeAreaProvider: ({ children }: SafeAreaProviderProps) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }: SafeAreaViewProps) =>
      React.createElement(View, props, children),
    initialWindowMetrics: {
      frame: { height: 852, width: 393, x: 0, y: 0 },
      insets: { bottom: 0, left: 0, right: 0, top: 0 },
    },
    useSafeAreaFrame: () => ({ height: 852, width: 393, x: 0, y: 0 }),
    useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
  };
});
