// src/components/Common/AddButton.tsx
// Unified AddButton component - can work as simple button or speed dial
import React, { useState, useMemo, useRef } from "react";
import {
  StyleSheet,
  Platform,
  Pressable,
  Animated,
  View,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

export interface SpeedDialOption {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  iconFamily?: "material" | "materialCommunity";
  onPress: () => void;
  color?: string;
}

interface AddButtonProps {
  /** Simple button mode: onPress handler */
  onPress?: () => void;
  /** Speed dial mode: array of options */
  speedDialOptions?: SpeedDialOption[];
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

const AddButton: React.FC<AddButtonProps> = ({
  onPress,
  speedDialOptions,
  accessibilityLabel = "Add new item",
  accessibilityHint,
}) => {
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Determine if we're in speed dial mode
  const isSpeedDialMode = !!speedDialOptions && speedDialOptions.length > 0;

  // Position above the non-floating tab bar
  const bottomPosition = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0) + 70;

  // Speed dial state and animations (only used in speed dial mode)
  const [isOpen, setIsOpen] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const buttonAnims = useRef(
    isSpeedDialMode
      ? (speedDialOptions || []).map(() => new Animated.Value(0))
      : []
  ).current;

  // Simple button handlers
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handleSimplePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  // Speed dial handlers
  const openDial = () => {
    setIsOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      ...buttonAnims.map((anim, index) =>
        Animated.spring(anim, {
          toValue: 1,
          delay: index * 50,
          useNativeDriver: true,
          friction: 8,
          tension: 65,
        })
      ),
    ]).start();
  };

  const closeDial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      ...buttonAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        })
      ),
    ]).start(() => {
      setIsOpen(false);
    });
  };

  const handleMainPress = () => {
    if (isSpeedDialMode) {
      if (isOpen) {
        closeDial();
      } else {
        openDial();
      }
    } else {
      handleSimplePress();
    }
  };

  const handleOptionPress = (option: SpeedDialOption) => {
    closeDial();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    option.onPress();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: "absolute",
          right: 20,
          bottom: bottomPosition,
          zIndex: 999,
        },
        fab: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          ...(Platform.OS === "ios"
            ? {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }
            : { elevation: 8 }),
        },
        backdrop: {
          position: "absolute",
          top: -10000,
          left: -10000,
          right: -10000,
          bottom: -10000,
          backgroundColor: hexToRgba("#000000", 0.4),
        },
        optionsContainer: {
          position: "absolute",
          right: 0,
          bottom: 70,
          alignItems: "flex-end",
          gap: 12,
        },
        optionButton: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.cardBackground,
          borderRadius: radius.full,
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 10,
          minWidth: 140,
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }
            : { elevation: 4 }),
        },
        optionIcon: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: hexToRgba(colors.primary, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        optionLabel: {
          fontSize: typography.fontSizeSm,
          fontWeight: "600",
          color: colors.textPrimary,
        },
      }),
    [colors, spacing, radius, typography, bottomPosition]
  );

  return (
    <View style={styles.container}>
      {/* Backdrop - Only in speed dial mode */}
      {isSpeedDialMode && isOpen && (
        <TouchableWithoutFeedback onPress={closeDial}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Options - Only in speed dial mode */}
      {isSpeedDialMode && isOpen && speedDialOptions && (
        <View style={styles.optionsContainer}>
          {speedDialOptions.map((option, index) => {
            const IconComponent =
              option.iconFamily === "materialCommunity"
                ? MaterialCommunityIcons
                : MaterialIcons;
            const translateY = buttonAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            });
            const opacity = buttonAnims[index];

            return (
              <Animated.View
                key={option.label}
                style={{
                  opacity,
                  transform: [{ translateY }],
                }}
              >
                <Pressable
                  style={styles.optionButton}
                  onPress={() => handleOptionPress(option)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  android_ripple={{
                    color: hexToRgba(colors.primary, 0.1),
                    borderless: false,
                  }}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: hexToRgba(option.color || colors.primary, 0.12) },
                    ]}
                  >
                    <IconComponent
                      name={option.icon as never}
                      size={20}
                      color={option.color || colors.primary}
                    />
                  </View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Main FAB */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleMainPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessible
      >
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [
                { scale: scaleAnim },
                ...(isSpeedDialMode && isOpen
                  ? [
                      {
                        rotate: buttonAnims[0]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "45deg"],
                        }) || "0deg",
                      },
                    ]
                  : []),
              ],
            },
          ]}
        >
          <MaterialIcons
            name={isSpeedDialMode && isOpen ? "close" : "add"}
            size={28}
            color="#FFFFFF"
          />
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default AddButton;
