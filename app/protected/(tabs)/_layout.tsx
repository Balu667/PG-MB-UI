import TabBar from "@/src/components/TabBar";
import { Tabs } from "expo-router";
import React from "react";

const _layout = () => {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Properties" }} />
      <Tabs.Screen name="Rooms" options={{ title: "Rooms" }} />
      <Tabs.Screen name="Dashboard" options={{ title: "dashboard" }} />
      <Tabs.Screen name="People" options={{ title: "People" }} />
      <Tabs.Screen name="Store" options={{ title: "Store" }} />
    </Tabs>
  );
};

export default _layout;
