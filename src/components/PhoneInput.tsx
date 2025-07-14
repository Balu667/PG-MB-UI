// import React, { useState } from "react";
// import { View, Text, TextInput, StyleSheet } from "react-native";
// import { lightTheme } from "@/src/theme";

// interface PhoneInputProps {
//   value: string;
//   onChangeText: (text: string) => void;
// }

// const PhoneInput = ({ value, onChangeText }: PhoneInputProps) => {
//   const [error, setError] = useState("");

//   const handleInputChange = (input: string) => {
//     const sanitizedInput = input.replace(/[^0-9]/g, ""); // Only digits
//     onChangeText(sanitizedInput);
//     if (sanitizedInput.length === 10) {
//       setError(""); // clear error when valid
//     }
//   };

//   const handleBlur = () => {
//     if (value.length !== 10) {
//       setError("Please enter a valid 10-digit mobile number");
//     } else {
//       setError("");
//     }
//   };

//   return (
//     <View style={styles.wrapper}>
//       <View style={[styles.container, error ? styles.errorBorder : null]}>
//         <View style={styles.countryCodeContainer}>
//           <Text style={styles.countryCodeText}>+91</Text>
//         </View>
//         <TextInput
//           style={styles.input}
//           placeholder="Enter Mobile Number"
//           placeholderTextColor="#999"
//           keyboardType="phone-pad"
//           maxLength={10}
//           value={value}
//           onChangeText={handleInputChange}
//           returnKeyType="done"
//           onBlur={handleBlur}
//         />
//       </View>
//       {error ? <Text style={styles.errorText}>{error}</Text> : null}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   wrapper: {
//     marginBottom: 10,
//   },
//   container: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "white",
//     borderRadius: 12,
//     overflow: "hidden",
//     height: 56,
//     paddingHorizontal: 16,
//     marginVertical: 8,
//     borderColor: lightTheme.colors.textMuted,
//     borderWidth: 1,
//   },
//   errorBorder: {
//     borderColor: "red",
//   },
//   countryCodeContainer: {
//     paddingRight: 12,
//     borderRightWidth: 1,
//     borderRightColor: "#E0E0E0",
//     marginRight: 12,
//   },
//   countryCodeText: {
//     fontSize: 16,
//     color: "#333",
//     fontWeight: "600",
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: "#333",
//     fontWeight: "600",
//     height: "100%",
//   },
//   errorText: {
//     color: "red",
//     fontSize: 12,
//     marginLeft: 5,
//     marginTop: 2,
//   },
// });

// export default PhoneInput;
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import { lightTheme } from "@/src/theme";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const PhoneInput = ({ value, onChangeText }: PhoneInputProps) => {
  const [error, setError] = useState("");

  // Only allow numeric and trim spaces on paste
  const handleInputChange = (input: string) => {
    let sanitizedInput = input.replace(/\D/g, ""); // remove non-digits
    sanitizedInput = sanitizedInput.replace(/\s+/g, ""); // trim spaces
    onChangeText(sanitizedInput);
    if (sanitizedInput.length === 10) setError("");
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
          textContentType={Platform.OS === "ios" ? "telephoneNumber" : "none"}
          accessible
          accessibilityLabel="Mobile number input"
          allowFontScaling
          importantForAutofill="yes"
          autoCapitalize="none"
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
    borderRadius: 14,
    overflow: "hidden",
    height: 56,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderColor: lightTheme.colors.textMuted,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
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
    fontSize: 17,
    color: "#333",
    fontWeight: "600",
    height: "100%",
    letterSpacing: 0.7,
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginLeft: 5,
    marginTop: 2,
  },
});

export default PhoneInput;
