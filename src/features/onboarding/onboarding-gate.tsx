import type { ReactElement, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

interface OnboardingGate {
  setOnboarded: (value: boolean) => void;
}

const OnboardingGateContext = createContext<OnboardingGate | null>(null);

interface ProviderProps {
  children: ReactNode;
  setOnboarded: (value: boolean) => void;
}

export function OnboardingGateProvider({ children, setOnboarded }: ProviderProps): ReactElement {
  const value = useMemo(() => ({ setOnboarded }), [setOnboarded]);
  return <OnboardingGateContext.Provider value={value}>{children}</OnboardingGateContext.Provider>;
}

export function useOnboardingGate(): OnboardingGate {
  const ctx = useContext(OnboardingGateContext);
  if (!ctx) {
    throw new Error("useOnboardingGate must be used inside OnboardingGateProvider");
  }
  return ctx;
}
