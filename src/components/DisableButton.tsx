import React from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "@/src/theme";

const DisableButton = ({ title, onPress, disabled = false }: any) => {
  return (
    <TouchableOpacity
      onPress={() => {
        if (!disabled) onPress();
      }}
      activeOpacity={0.7}
      disabled={disabled}
      style={[styles.buttonContainer, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={title}
    >
      <LinearGradient
        colors={
          disabled ? ["#cccccc", "#aaaaaa"] : [lightTheme.colors.primary, lightTheme.colors.primary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    marginVertical: 10,
  },
  gradient: {
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.68,
  },
});

export default DisableButton;
