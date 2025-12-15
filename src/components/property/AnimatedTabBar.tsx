// src/components/property/AnimatedTabBar.tsx
// Production-ready animated tab bar with smooth underline indicator
import React, { useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  I18nManager,
  LayoutChangeEvent,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

export interface TabConfig {
  key: string;
  title: string;
}

interface TabLayout {
  x: number;
  width: number;
}

interface AnimatedTabBarProps {
  tabs: readonly TabConfig[] | TabConfig[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, spacing, typography } = useTheme();

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const tabLayoutsRef = useRef<Map<string, TabLayout>>(new Map());
  const indicatorAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const indicatorWidth = useRef(new Animated.Value(60)).current;

  // Handle tab press
  const handleTabPress = useCallback(
    (key: string) => {
      if (Platform.OS !== "web") {
        Haptics.selectionAsync();
      }
      onTabChange(key);
    },
    [onTabChange]
  );

  // Handle tab layout measurement
  const handleTabLayout = useCallback(
    (key: string, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      tabLayoutsRef.current.set(key, { x, width });

      // Update indicator if this is the active tab
      if (key === activeTab) {
        animateIndicator(x, width);
      }
    },
    [activeTab]
  );

  // Animate indicator to new position
  const animateIndicator = useCallback(
    (x: number, width: number) => {
      Animated.parallel([
        Animated.spring(indicatorAnim, {
          toValue: { x, y: 0 },
          useNativeDriver: true,
          tension: 300,
          friction: 25,
        }),
        Animated.spring(indicatorWidth, {
          toValue: width,
          useNativeDriver: false, // width can't use native driver
          tension: 300,
          friction: 25,
        }),
      ]).start();
    },
    [indicatorAnim, indicatorWidth]
  );

  // Update indicator when active tab changes
  useEffect(() => {
    const layout = tabLayoutsRef.current.get(activeTab);
    if (layout) {
      animateIndicator(layout.x, layout.width);

      // Scroll to center the active tab for better visibility
      // Use setTimeout to ensure scroll happens after any pending layout
      setTimeout(() => {
        const tabLayout = tabLayoutsRef.current.get(activeTab);
        if (tabLayout) {
          // Calculate scroll position to center the tab in the viewport
          const scrollX = Math.max(0, tabLayout.x - (screenWidth / 2) + (tabLayout.width / 2));
          scrollViewRef.current?.scrollTo({
            x: scrollX,
            animated: true,
          });
        }
      }, 50);
    }
  }, [activeTab, animateIndicator, screenWidth]);

  // Styles
  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.borderColor, 0.3),
        },
        scrollContent: {
          paddingHorizontal: spacing.sm,
          flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          alignItems: "center",
        },
        tabButton: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          minHeight: 44,
          justifyContent: "center",
          alignItems: "center",
        },
        tabText: {
          fontSize: typography.fontSizeSm,
          color: colors.textMuted,
          fontWeight: "500",
          letterSpacing: 0.2,
        },
        tabTextActive: {
          color: colors.accent,
          fontWeight: "700",
          fontSize: typography.fontSizeSm + 0.5,
        },
        indicatorContainer: {
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
        },
        indicator: {
          height: 3,
          backgroundColor: colors.accent,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        },
      }),
    [colors, spacing, typography]
  );

  return (
    <View style={s.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        bounces={false}
        scrollEventThrottle={16}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              onLayout={(e) => handleTabLayout(tab.key, e)}
              style={({ pressed }) => [
                s.tabButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.title}
              accessible
            >
              <Text
                style={[s.tabText, isActive && s.tabTextActive]}
                numberOfLines={1}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}

        {/* Animated Indicator */}
        <Animated.View
          style={[
            s.indicatorContainer,
            {
              transform: [{ translateX: indicatorAnim.x }],
            },
          ]}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              s.indicator,
              { width: indicatorWidth },
            ]}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default React.memo(AnimatedTabBar);

