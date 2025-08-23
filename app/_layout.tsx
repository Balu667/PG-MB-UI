// import { StatusBar } from "expo-status-bar";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import "react-native-reanimated";
// import { ThemeProvider } from "@/src/theme/ThemeContext";
// import { StyleSheet } from "react-native";

// import { Provider } from "react-redux";
// import { store, persistor } from "@/src/redux/store";

// import { PersistGate } from "redux-persist/integration/react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import Toast from "react-native-toast-message";
// import { Slot } from "expo-router";

// const queryClient = new QueryClient();

// export default function RootLayout() {
//   return (
//     <Provider store={store}>
//       <PersistGate loading={null} persistor={persistor}>
//         <QueryClientProvider client={queryClient}>
//           <ThemeProvider>
//             <GestureHandlerRootView style={styles.container}>
//               <StatusBar style="auto" />
//               <Toast />
//               <Slot/>
//             </GestureHandlerRootView>
//           </ThemeProvider>
//         </QueryClientProvider>
//       </PersistGate>
//     </Provider>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });
import { StatusBar } from "expo-status-bar";
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

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <PaperProvider>
              {" "}
              {/* ✅ Wrap your app here */}
              <GestureHandlerRootView style={styles.container}>
                <StatusBar style="auto" />
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
