import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { lightTheme } from "@/src/theme";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const PhoneInput = ({ value, onChangeText }: PhoneInputProps) => {
  const [error, setError] = useState("");

  const handleInputChange = (input: string) => {
    const sanitizedInput = input.replace(/[^0-9]/g, ""); // Only digits
    onChangeText(sanitizedInput);
    if (sanitizedInput.length === 10) {
      setError(""); // clear error when valid
    }
  };

  const handleBlur = () => {
    if (value.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
    } else {
      setError("");
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, error ? styles.errorBorder : null]}>
        <View style={styles.countryCodeContainer}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter Mobile Number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          maxLength={10}
          value={value}
          onChangeText={handleInputChange}
          returnKeyType="done"
          onBlur={handleBlur}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    height: 56,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderColor: lightTheme.colors.textMuted,
    borderWidth: 1,
  },
  errorBorder: {
    borderColor: "red",
  },
  countryCodeContainer: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    height: "100%",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 5,
    marginTop: 2,
  },
});

export default PhoneInput;
