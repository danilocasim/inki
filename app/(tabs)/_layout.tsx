import type { ReactElement } from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { tokens } from "../../src/ui/tokens";

/** Bottom tab shell matching the Figma labels exactly. */
export default function TabsLayout(): ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.color.accent,
        tabBarInactiveTintColor: tokens.color.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
          textTransform: "lowercase"
        },
        tabBarStyle: {
          backgroundColor: tokens.color.canvas,
          borderTopColor: tokens.color.border,
          height: 78,
          paddingBottom: 18,
          paddingTop: 8
        }
      }}
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
          tabBarIcon: ({ color, size }) => <Feather color={color} name="camera" size={size} />,
          tabBarLabel: "capture",
          title: "capture"
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
