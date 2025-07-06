import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { ThemeProvider } from "@/theme/ThemeContext";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
      <ThemeProvider>
        <GestureHandlerRootView style={styles.container}>
          <StatusBar style="auto" />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="Otp" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </GestureHandlerRootView>
      </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
