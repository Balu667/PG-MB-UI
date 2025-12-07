import React, { useMemo } from "react";
import { StyleSheet, Platform, Pressable, Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";

interface AddButtonProps {
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AddButton: React.FC<AddButtonProps> = ({
  onPress,
  accessibilityLabel = "Add new item",
  accessibilityHint,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Position above the non-floating tab bar
  const bottomPosition = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0) + 70;

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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
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
      }),
    [colors.primary, bottomPosition]
  );

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessible
      >
        <Animated.View style={[styles.fab, { transform: [{ scale: scaleAnim }] }]}>
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default AddButton;
