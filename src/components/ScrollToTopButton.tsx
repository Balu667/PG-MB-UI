// src/components/ScrollToTopButton.tsx
// Reusable floating scroll-to-top button component
import React, { useEffect, useRef, useMemo } from "react";
import { StyleSheet, Pressable, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

interface ScrollToTopButtonProps {
  visible: boolean;
  onPress: () => void;
  bottomOffset?: number; // Additional offset from bottom (for FAB buttons, etc.)
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  visible,
  onPress,
  bottomOffset = 0,
}) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
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
      // Hide animation
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: "absolute",
          right: spacing.lg + 6,
          bottom: Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0) + 150 + bottomOffset,
          width: 36,
          height: 36,
          borderRadius: 28,
          backgroundColor: colors.accent,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 1000,
        },
        icon: {
          color: colors.background,
        },
      }),
    [colors, spacing, insets.bottom, bottomOffset]
  );

  if (!visible && opacityAnim._value === 0) {
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
        style={({ pressed }) => [
          {
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 28,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Scroll to top"
        accessibilityHint="Scrolls the list to the top"
        accessible
      >
        <MaterialIcons name="keyboard-arrow-up" size={28} color={styles.icon.color} />
      </Pressable>
    </Animated.View>
  );
};

export default React.memo(ScrollToTopButton);

