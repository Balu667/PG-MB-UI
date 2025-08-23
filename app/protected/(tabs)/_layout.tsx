import { Tabs } from "expo-router";
import TabBar from "@/src/components/TabBar";

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <TabBar {...p} />}>
      <Tabs.Screen name="Dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="Rooms" options={{ title: "Rooms" }} />
      <Tabs.Screen name="Properties" options={{ title: "Properties" }} />
      <Tabs.Screen name="Tenants" options={{ title: "Tenants" }} />
      <Tabs.Screen name="Store" options={{ title: "Store" }} />
    </Tabs>
  );
}
