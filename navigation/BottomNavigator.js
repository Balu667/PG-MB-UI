import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import TenantScreen from "../screens/TenantScreen";
import RoomScreen from "../screens/RoomScreen";
import PropertyScreen from "../screens/PropertyScreen";
import ExpenseScreen from "../screens/ExpenseScreen";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = "home-outline"; // Example icon for Dashboard
          } else if (route.name === "Rooms") {
            iconName = "bed-outline"; // Example icon for Rooms
          } else if (route.name === "Properties") {
            iconName = "location-outline"; // Example icon for Properties
            return <FontAwesome5 name="building" size={24} color="black" />;
          } else if (route.name === "Tenants") {
            iconName = "people-outline"; // Example icon for Tenants
          } else if (route.name === "Expense") {
            iconName = "wallet-outline"; // Example icon for Expense
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Rooms" component={PropertyScreen} />
      <Tab.Screen name="Properties" component={RoomScreen} />
      <Tab.Screen name="Tenants" component={TenantScreen} />
      <Tab.Screen name="Expense" component={ExpenseScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
