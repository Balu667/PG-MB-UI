import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { ThemeProvider } from "@/src/theme/ThemeContext";
import { StyleSheet } from "react-native";

import { Provider as ReduxProvider } from "react-redux";
import { store, persistor } from "@/src/redux/store";

import { PersistGate } from "redux-persist/integration/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { Slot } from "expo-router";

import { Provider as PaperProvider } from "react-native-paper"; // ✅ Added
import StatusBar from "@/src/components/StatusBar";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <PaperProvider>
              <GestureHandlerRootView style={styles.container}>
                <StatusBar />
                <Toast />
                <Slot />
              </GestureHandlerRootView>
            </PaperProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
