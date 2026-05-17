import type { ReactElement } from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { GlassTabBar } from "../../src/ui/GlassTabBar";

/** Bottom tab shell — glassmorphism floating capsule with drag-to-select. */
export default function TabsLayout(): ReactElement {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => <Feather color={color} name="home" size={size} />,
          tabBarLabel: "home",
          title: "home"
        }}
      />
      <Tabs.Screen
        name="shelves"
        options={{
          tabBarIcon: ({ color, size }) => <Feather color={color} name="book-open" size={size} />,
          tabBarLabel: "shelf",
          title: "shelf"
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => <Feather color={color} name="user" size={size} />,
          tabBarLabel: "profile",
          title: "profile"
        }}
      />
    </Tabs>
  );
}
