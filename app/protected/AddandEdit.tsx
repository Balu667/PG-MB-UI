// src/screens/AddEditScreen.tsx

import React from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import {
  componentRegistry,
  ComponentKey,
} from "@/src/components/AddandEditComponentRegistry/CompomnentRegistry";
import type { AddEditComponentProps } from "@/src/components/AddandEditComponentRegistry/CompomnentRegistry";

export default function AddEditScreen() {
  const { type = "add", componentKey = "", formData } = useLocalSearchParams();
  console.log(componentKey);
  const Component = componentRegistry[componentKey as ComponentKey];

  if (!Component) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>❌ Invalid component key: "{componentKey}"</Text>
      </View>
    );
  }

  let parsedData: any = {};
  try {
    parsedData = formData ? JSON.parse(formData as string) : {};
  } catch (err) {
    console.warn("Failed to parse formData:", err);
  }

  const formType: AddEditComponentProps["type"] =
    type === "edit" ? "edit" : "add";

  return <Component type={formType} propertyData={parsedData} />;
}
