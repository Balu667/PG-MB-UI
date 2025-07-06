import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, AppTheme } from "./index";

// Create context with default theme
const ThemeContext = createContext<AppTheme>(lightTheme);

// Provide theme based on system scheme
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const scheme = useColorScheme(); // 'light' | 'dark' | null
  // const theme = scheme === "dark" ? darkTheme : lightTheme;
  const theme = lightTheme;

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => useContext(ThemeContext);
