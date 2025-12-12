// src/components/property/SegmentBar.tsx
// Modern animated tab bar with Reanimated - Production Ready
import React, { useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  Platform,
  I18nManager,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ─────────────────────────────────────────────────────────────────────────────
   TAB CONFIG TYPE (Future-proof)
───────────────────────────────────────────────────────────────────────────── */

export interface TabConfig {
  key: string;
  title: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROPS INTERFACE
───────────────────────────────────────────────────────────────────────────── */

interface Props {
  /** Array of tab configurations */
  tabs: readonly string[] | readonly TabConfig[];
  /** Currently selected tab key/title */
  value: string;
  /** Callback when user taps a tab */
  onChange: (tab: string) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SPRING CONFIG
───────────────────────────────────────────────────────────────────────────── */

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED TAB ITEM
───────────────────────────────────────────────────────────────────────────── */

interface TabItemProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  colors: ReturnType<typeof useTheme>["colors"];
  spacing: ReturnType<typeof useTheme>["spacing"];
}

const TabItem = React.memo<TabItemProps>(
  ({ label, isSelected, onPress, onLayout, colors, spacing }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }, [scale]);

    const handlePress = useCallback(() => {
      Haptics.selectionAsync();
      onPress();
    }, [onPress]);

    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLayout={onLayout}
        style={[styles.tabItem, { marginRight: spacing.lg - 4 }]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${label} tab`}
        accessibilityHint={`Switch to ${label}`}
        accessible
      >
        <Animated.View style={animatedStyle}>
          <Text
            style={[
              styles.tabLabel,
              { color: isSelected ? colors.accent : colors.textMuted },
              isSelected && styles.tabLabelSelected,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }
);

TabItem.displayName = "TabItem";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function SegmentBar({ tabs, value, onChange }: Props) {
  const { colors, spacing } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // Normalize tabs to string array
  const normalizedTabs = useMemo(() => {
    return tabs.map((t) => (typeof t === "string" ? t : t.title));
  }, [tabs]);

  // Tab measurements
  const tabMeasurements = useRef<{ x: number; width: number }[]>([]);
  const hasInitialized = useRef(false);

  // Animated values for underline
  const underlineX = useSharedValue(0);
  const underlineWidth = useSharedValue(0);

  // Get current index
  const currentIndex = useMemo(() => {
    return normalizedTabs.findIndex((t) => t === value);
  }, [normalizedTabs, value]);

  // Update underline position when value changes
  useEffect(() => {
    if (currentIndex === -1) return;

    const measurement = tabMeasurements.current[currentIndex];
    if (measurement) {
      underlineX.value = withSpring(measurement.x, SPRING_CONFIG);
      underlineWidth.value = withSpring(measurement.width, SPRING_CONFIG);

      // Auto-scroll to keep selected tab visible
      scrollRef.current?.scrollTo({
        x: Math.max(0, measurement.x - 50),
        animated: true,
      });
    }
  }, [currentIndex, underlineX, underlineWidth]);

  // Animated underline style
  const underlineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: underlineX.value }],
      width: underlineWidth.value,
    };
  });

  // Handle tab layout
  const handleTabLayout = useCallback(
    (index: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      tabMeasurements.current[index] = { x, width };

      // Initialize underline position on first layout of selected tab
      if (!hasInitialized.current && index === currentIndex) {
        underlineX.value = x;
        underlineWidth.value = width;
        hasInitialized.current = true;
      }
    },
    [currentIndex, underlineX, underlineWidth]
  );

  // Handle tab press
  const handleTabPress = useCallback(
    (tab: string) => {
      if (tab !== value) {
        onChange(tab);
      }
    },
    [value, onChange]
  );

  // Dynamic styles
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: colors.background,
        borderBottomColor: hexToRgba(colors.borderColor, 0.5),
      },
    ],
    [colors]
  );

  const underlineBaseStyle = useMemo(
    () => [
      styles.underline,
      { backgroundColor: colors.accent },
      underlineStyle,
    ],
    [colors.accent, underlineStyle]
  );

  return (
    <View style={containerStyle}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.md },
        ]}
        scrollEventThrottle={16}
      >
        {/* Tab Items */}
        {normalizedTabs.map((tab, index) => (
          <TabItem
            key={tab}
            label={tab}
            isSelected={value === tab}
            onPress={() => handleTabPress(tab)}
            onLayout={handleTabLayout(index)}
            colors={colors}
            spacing={spacing}
          />
        ))}

        {/* Animated Underline */}
        <Animated.View style={underlineBaseStyle} />
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    position: "relative",
  },
  tabItem: {
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  tabLabelSelected: {
    fontWeight: Platform.OS === "ios" ? "600" : "700",
    fontSize: 15.5,
  },
  underline: {
    position: "absolute",
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
  },
});
