// src/components/StatusBar.tsx
// Theme-aware StatusBar component
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useTheme } from "@/src/theme/ThemeContext";

export default function StatusBar() {
  const { scheme } = useTheme();
  
  // Use "light" style for dark backgrounds (dark mode), "dark" style for light backgrounds (light mode)
  return <ExpoStatusBar style={scheme === "dark" ? "light" : "dark"} />;
}

