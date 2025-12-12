// src/components/ScrollToTopButton.tsx
// Reusable floating scroll-to-top button with optional refresh capability
import React, { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { StyleSheet, Pressable, Animated, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

interface ScrollToTopButtonProps {
  /** Whether the button is visible */
  visible: boolean;
  /** Callback to scroll to top */
  onPress: () => void;
  /** Optional callback to refresh data - triggered after scroll to top */
  onRefresh?: () => void | Promise<void>;
  /** Whether a refresh is currently in progress */
  isRefreshing?: boolean;
  /** Additional offset from bottom (for FAB buttons, etc.) */
  bottomOffset?: number;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  visible,
  onPress,
  onRefresh,
  isRefreshing = false,
  bottomOffset = 0,
}) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Local refreshing state for when we trigger refresh ourselves
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const showRefreshIndicator = isRefreshing || localRefreshing;

  // Visibility animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  // Rotation animation for refresh indicator
  useEffect(() => {
    if (showRefreshIndicator) {
      const spin = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [showRefreshIndicator, rotateAnim]);

  // Handle press - scroll to top, then refresh
  const handlePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // First scroll to top
    onPress();
    
    // Then trigger refresh if handler exists and not already refreshing
    if (onRefresh && !showRefreshIndicator) {
      setLocalRefreshing(true);
      try {
        await onRefresh();
      } catch {
        // Silently handle errors - the tab's own error handling will manage this
      } finally {
        // Small delay for visual feedback
        setTimeout(() => setLocalRefreshing(false), 400);
      }
    }
  }, [onPress, onRefresh, showRefreshIndicator]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: "absolute",
          right: spacing.lg,
          bottom: Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0) + 140 + bottomOffset,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.accent,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 6,
          zIndex: 1000,
        },
        pressable: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 22,
        },
        iconContainer: {
          width: 24,
          height: 24,
          justifyContent: "center",
          alignItems: "center",
        },
      }),
    [colors, spacing, insets.bottom, bottomOffset]
  );

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Don't render if not visible and animation complete
  if (!visible && !showRefreshIndicator) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Pressable
        onPress={handlePress}
        disabled={showRefreshIndicator}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: pressed && !showRefreshIndicator ? 0.7 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={onRefresh ? "Scroll to top and refresh" : "Scroll to top"}
        accessibilityHint={onRefresh ? "Scrolls to top and refreshes data" : "Scrolls the list to the top"}
        accessible
      >
        <View style={styles.iconContainer}>
          {showRefreshIndicator ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialIcons name="refresh" size={22} color={colors.background} />
            </Animated.View>
          ) : (
            <MaterialIcons name="keyboard-arrow-up" size={26} color={colors.background} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default React.memo(ScrollToTopButton);
