// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Appearance, useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { lightTheme, darkTheme, type AppTheme } from "./index";

/** Preference key for AsyncStorage */
const THEME_PREFERENCE_KEY = "@app_theme_preference";

/** Theme preference types */
type Preference = "auto" | "light" | "dark";

type ThemeContextValue = {
  colors: AppTheme["colors"];
  spacing: AppTheme["spacing"];
  radius: AppTheme["radius"];
  typography: AppTheme["typography"];
  button: AppTheme["button"];
  /** Current active scheme */
  scheme: "light" | "dark";
  /** User's preference setting */
  preference: Preference;
  /** Update theme preference */
  setPreference: (p: Preference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current system scheme (updates automatically when user flips system appearance)
  const systemScheme = useColorScheme();

  // Theme preference state - defaults to "light"
  const [preference, setPreferenceState] = useState<Preference>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (saved && ["auto", "light", "dark"].includes(saved)) {
          setPreferenceState(saved as Preference);
        }
        // If no saved preference, keep default "light"
      } catch {
        // Silently fail - use default
      } finally {
        setIsLoaded(true);
      }
    };
    loadPreference();
  }, []);

  // Persist preference when changed
  const setPreference = useCallback(async (newPref: Preference) => {
    setPreferenceState(newPref);
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newPref);
    } catch {
      // Silently fail
    }
  }, []);

  // Determine active scheme based on preference
  const scheme: "light" | "dark" = useMemo(() => {
    if (preference === "auto") {
      return systemScheme ?? "light";
    }
    return preference;
  }, [preference, systemScheme]);

  // Pick tokens based on scheme
  const tokens: AppTheme = scheme === "dark" ? darkTheme : lightTheme;

  // Keep native system UI background in sync to avoid flashes on theme flip
  useEffect(() => {
    if (isLoaded) {
      SystemUI.setBackgroundColorAsync(tokens.colors.background).catch(() => {});
    }
  }, [tokens.colors.background, isLoaded]);

  // Listen to system Appearance changes for auto mode
  useEffect(() => {
    const sub = Appearance.addChangeListener((e) => {
      if (preference === "auto") {
        SystemUI.setBackgroundColorAsync(
          (e.colorScheme === "dark" ? darkTheme : lightTheme).colors.background
        ).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [preference]);

  // Bridge our tokens to react-native-paper so Paper components re-theme too
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
    [tokens, scheme, preference, setPreference]
  );

  // Don't render until preference is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

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
