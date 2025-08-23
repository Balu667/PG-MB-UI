import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";

interface Props {
  value: string;
  onChangeText: (value: string) => void;
}

const PhoneInput: React.FC<Props> = ({ value, onChangeText }) => {
  const [error, setError] = useState("");
  const { colors, radius } = useTheme();

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    onChangeText(digits);

    if (digits.length === 10) setError("");
  };

  const handleBlur = () => {
    if (value.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
    } else {
      setError("");
    }
  };

  const styles = StyleSheet.create({
    container: { marginBottom: 10 },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.white,
      borderRadius: radius.lg,
      height: 56,
      paddingHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: error ? colors.error : colors.textMuted,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      elevation: 2,
    },
    countryCode: {
      paddingRight: 12,
      borderRightWidth: 1,
      borderRightColor: colors.disabled,
      marginRight: 12,
    },
    countryCodeText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    textInput: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
      letterSpacing: 0.7,
      color: colors.textPrimary,
    },
    errorText: {
      fontSize: 13,
      color: colors.error,
      marginLeft: 5,
      marginTop: 2,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="Enter Mobile Number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          maxLength={10}
          value={value}
          onChangeText={handleChange}
          onBlur={handleBlur}
          returnKeyType="done"
          textContentType={Platform.OS === "ios" ? "telephoneNumber" : "none"}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default PhoneInput;
