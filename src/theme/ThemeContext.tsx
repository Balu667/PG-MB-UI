// // src/theme/ThemeContext.tsx
// import React, { createContext, useContext } from "react";
// import { Appearance } from "react-native";
// import { lightTheme, darkTheme, AppTheme } from "./index";

// const ThemeContext = createContext<AppTheme>(lightTheme);

// export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
//   const system = Appearance.getColorScheme(); // 'light' | 'dark' | null
//   const theme = system === "dark" ? darkTheme : lightTheme;

//   return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
// };

// export const useTheme = () => useContext(ThemeContext);
// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, ColorSchemeName, useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { lightTheme, darkTheme, type AppTheme } from "./index";

type Preference = "system" | "light" | "dark";

type ThemeContextValue = {
  colors: AppTheme["colors"];
  spacing: AppTheme["spacing"];
  radius: AppTheme["radius"];
  typography: AppTheme["typography"];
  button: AppTheme["button"];
  // convenience
  scheme: "light" | "dark";
  preference: Preference;
  setPreference: (p: Preference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // current system scheme (updates automatically when user flips system appearance)
  const systemScheme = useColorScheme(); // "light" | "dark" | null

  // allow future manual override; default to following system
  const [preference, setPreference] = useState<Preference>("system");

  // pick active scheme
  const scheme: "light" | "dark" = preference === "system" ? systemScheme ?? "light" : preference;

  // pick tokens
  const tokens: AppTheme = scheme === "dark" ? darkTheme : lightTheme;

  // keep native system UI background in sync to avoid flashes on theme flip
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(tokens.colors.background).catch(() => {});
  }, [tokens.colors.background]);

  // (Optional) listen to Appearance directly as a backup on some OEM Android skins
  useEffect(() => {
    const sub = Appearance.addChangeListener((e) => {
      // If following system, flipping device theme should re-render via useColorScheme,
      // but this ensures we repaint immediately even on rare devices.
      if (preference === "system") {
        // no-op: useColorScheme already triggers render; this just forces a micro-tick
        // by setting background again.
        SystemUI.setBackgroundColorAsync(
          (e.colorScheme === "dark" ? darkTheme : lightTheme).colors.background
        ).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [preference]);

  // bridge our tokens to react-native-paper so Paper components re-theme too
  const paperTheme = useMemo(() => {
    const base = scheme === "dark" ? MD3DarkTheme : MD3LightTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: tokens.colors.accent,
        background: tokens.colors.background,
        surface: tokens.colors.surface,
        error: tokens.colors.error,
        onSurface: tokens.colors.textPrimary,
        outline: tokens.colors.borderColor,
      },
      roundness: tokens.radius.md,
    };
  }, [scheme, tokens]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...tokens,
      scheme,
      preference,
      setPreference,
    }),
    [tokens, scheme, preference]
  );

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
