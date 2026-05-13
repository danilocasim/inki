import type { ReactElement } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react-native";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

/** Renders components with native providers used by the app shell. */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(<SafeAreaProvider initialMetrics={initialWindowMetrics}>{ui}</SafeAreaProvider>, options);
}
