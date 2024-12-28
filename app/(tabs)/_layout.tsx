import TabBar from "@/components/TabBar";
import { Tabs } from "expo-router";
import React from "react";

const _layout = () => {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="Room" options={{ title: "Room" }} />
      <Tabs.Screen name="Property" options={{ title: "Property" }} />
      <Tabs.Screen name="People" options={{ title: "People" }} />
      <Tabs.Screen name="Store" options={{ title: "Store" }} />
    </Tabs>
  );
};

export default _layout;
