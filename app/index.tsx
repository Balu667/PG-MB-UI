import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PhoneInput from "@/components/PhoneInput";
import DisableButton from "@/components/DisableButton";
import { lightTheme } from "@/theme";

const COLORS = {
  primary: "#1d3c34",
  accent: "#d99136",
  background: "#FFFFFF",
  circle1: "#c0ebc9",
  circle2: "#a3d9c9",
  textPrimary: "#333333",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E0E0E0",
  link: "#4A86F7",
  disabled: "#CCCCCC",
};

const FONT = {
  regular: "400",
  semiBold: "600",
  bold: "700",
};

const SIZES = {
  base: 16,
  padding: 24,
  margin: 16,
  radius: 12,
  inputHeight: 56,
};

const { width, height } = Dimensions.get("window");
const scale = (size: number) => (width / 375) * size;

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigation = useNavigation();

  const handleContinue = () => {
    if (phoneNumber.length === 10) {
      navigation.navigate("Otp", { phoneNumber });
    }
  };

  const dynamicStyles = StyleSheet.create({
    circleLarge: {
      width: scale(600),
      height: scale(600),
      borderRadius: scale(300),
      top: scale(-280),
      left: scale(-115),
    },
    circleSmall: {
      width: scale(300),
      height: scale(300),
      borderRadius: scale(150),
      top: scale(-100),
      right: scale(-100),
    },
    logoContainer: {
      paddingTop: height > 800 ? scale(60) : scale(40),
    },
    content: {
      marginBottom: height > 800 ? scale(40) : scale(20),
    },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        {/* Background Circles */}
        <View style={styles.backgroundContainer}>
          <View style={[styles.circleLarge, dynamicStyles.circleLarge]} />
          <View style={[styles.circleSmall, dynamicStyles.circleSmall]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? -scale(100) : 0}
        >
          {/* Logo */}
          <View style={[styles.logoContainer, dynamicStyles.logoContainer]}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Content */}
          <View style={[styles.content, dynamicStyles.content]}>
            <Text style={styles.welcomeText}>Welcome 👋</Text>
            <Text style={styles.subtitle}>Let’s get started by entering your mobile number.</Text>

            <PhoneInput value={phoneNumber} onChangeText={setPhoneNumber} />

            <DisableButton
              title="Generate OTP"
              onPress={handleContinue}
              disabled={phoneNumber.length !== 10}
            />
          </View>

          {/* Bottom Motivation Text */}
          <View style={styles.inspirationBox}>
            <Text style={styles.inspirationText}>
              “Comfortable living starts with the right place.”
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you accept our <Text style={styles.footerLink}>Terms of Service</Text>.
              Learn how we process your data in our{" "}
              <Text style={styles.footerLink}>Privacy Policy</Text> and{" "}
              <Text style={styles.footerLink}>Cookies Policy</Text>.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  circleLarge: {
    position: "absolute",
    backgroundColor: COLORS.circle1,
  },
  circleSmall: {
    position: "absolute",
    backgroundColor: COLORS.circle2,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: scale(90),
  },
  logoImage: {
    width: scale(170),
    height: scale(110),
  },

  content: {
    backgroundColor: "rgba(255, 255, 255, 0.25)", // simulate glass
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)", // light border
  },

  welcomeText: {
    fontSize: scale(20),
    fontWeight: FONT.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: scale(14),
    color: COLORS.textMuted,
    marginBottom: scale(12),
  },
  inspirationBox: {
    paddingHorizontal: SIZES.padding,
    marginTop: scale(10),
  },
  inspirationText: {
    fontSize: scale(13),
    color: COLORS.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  footer: {
    paddingVertical: SIZES.base,
    marginBottom: SIZES.base,
    paddingHorizontal: SIZES.padding,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: scale(12),
    textAlign: "center",
    lineHeight: scale(18),
    fontWeight: FONT.semiBold,
  },
  footerLink: {
    color: COLORS.link,
    fontWeight: FONT.semiBold,
  },
});

export default LoginScreen;
