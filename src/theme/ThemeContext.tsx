// src/theme/ThemeContext.tsx
import React, { createContext, useContext } from "react";
import { Appearance } from "react-native";
import { lightTheme, darkTheme, AppTheme } from "./index";

const ThemeContext = createContext<AppTheme>(lightTheme);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const system = Appearance.getColorScheme(); // 'light' | 'dark' | null
  const theme = system === "dark" ? darkTheme : lightTheme;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
