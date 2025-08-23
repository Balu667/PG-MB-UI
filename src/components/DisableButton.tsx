import React from "react";
import { StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/theme/ThemeContext";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const DisableButton: React.FC<Props> = ({ title, onPress, disabled }) => {
  const { colors, button, radius } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      marginVertical: 10,
      borderRadius: button.primary.rad,
      overflow: "hidden",
      opacity: disabled ? 0.68 : 1,
    },
    gradient: {
      borderRadius: radius.extraLarge,
    },
    paperButton: {
      backgroundColor: "transparent",
      elevation: 0,
      shadowColor: "transparent",
    },
    content: {
      height: 52,
      justifyContent: "center",
    },
    label: {
      color: colors.white,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
  });

  return (
    <LinearGradient
      colors={disabled ? colors.disabledGradient : colors.enabledGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.container, styles.gradient]}
    >
      <Button
        mode="contained"
        disabled={disabled}
        onPress={onPress}
        uppercase={false}
        style={styles.paperButton}
        contentStyle={styles.content}
        labelStyle={styles.label}
        accessibilityLabel={title}
      >
        {title}
      </Button>
    </LinearGradient>
  );
};

export default DisableButton;
