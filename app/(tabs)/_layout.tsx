import type { ReactElement } from "react";
import { Tabs } from "expo-router";

import { tokens } from "../../src/ui/tokens";

/** Bottom tab shell matching the Figma labels exactly. */
export default function TabsLayout(): ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.color.ink,
        tabBarInactiveTintColor: tokens.color.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
          textTransform: "lowercase"
        },
        tabBarStyle: {
          backgroundColor: tokens.color.surface,
          borderTopColor: tokens.color.border,
          height: 78,
          paddingBottom: 18,
          paddingTop: 8
        }
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: "home", title: "home" }} />
      <Tabs.Screen name="shelves" options={{ tabBarLabel: "shelf", title: "shelf" }} />
      <Tabs.Screen name="profile" options={{ tabBarLabel: "profile", title: "profile" }} />
    </Tabs>
  );
}
