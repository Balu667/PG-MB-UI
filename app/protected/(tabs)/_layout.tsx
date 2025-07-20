import { Tabs } from "expo-router";
import TabBar from "@/src/components/TabBar";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="Dashboard" options={{ title: "dashboard" }} />
      <Tabs.Screen name="Rooms" options={{ title: "Rooms" }} />
      <Tabs.Screen name="index" options={{ title: "Properties" }} />
      <Tabs.Screen name="Tenants" options={{ title: "Tenants" }} />
      <Tabs.Screen name="Store" options={{ title: "Store" }} />
    </Tabs>
  );
}
