import React from "react";
import { StyleSheet } from "react-native";
import { FAB, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AddButtonProps {
  onPress?: () => void;
}
const AddButton: React.FC<AddButtonProps> = ({ onPress }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = 60;
  return (
    <FAB
      icon="plus"
      style={[styles.fab, { bottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
      onPress={onPress}
      accessibilityLabel="Add new property"
      color={theme.colors.background}
      size="large"
    />
  );
};

export default AddButton;

const useAddButtonStyles = () => {
  const theme = useTheme();
  return StyleSheet.create({
    // Floating Action Button Styles
    fab: {
      position: "absolute",
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary, // Your primary color
      justifyContent: "center",
      alignItems: "center",
      elevation: 8, // Android shadow
      shadowColor: "#000", // iOS shadow
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      zIndex: 999, // Ensure it's above other elements
    },

    fabPressed: {
      transform: [{ scale: 0.95 }], // Slight scale down when pressed
      opacity: 0.9,
    },
  });
};
const styles = useAddButtonStyles();
