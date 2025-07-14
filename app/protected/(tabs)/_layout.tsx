import { Tabs } from "expo-router";
import TabBar from "@/src/components/TabBar";

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="Rooms" options={{ title: "Rooms" }} />
      <Tabs.Screen name="Properties" options={{ title: "Properties" }} />
      <Tabs.Screen name="People" options={{ title: "People" }} />
      <Tabs.Screen name="Store" options={{ title: "Store" }} />
    </Tabs>
  );
}
