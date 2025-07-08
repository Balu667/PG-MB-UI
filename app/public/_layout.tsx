import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { ThemeProvider } from "@/src/theme/ThemeContext";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
        <Slot />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
