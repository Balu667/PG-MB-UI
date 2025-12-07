// app/public/index.tsx
// Premium Login Screen with animations and security features
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Animated,
  Easing,
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  I18nManager,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRouter } from "expo-router";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native-paper";

import { hexToRgba } from "@/src/theme";
import { useGetLogin } from "@/src/hooks/login";
import { RootStackParamList } from "@/types/navigation";
import { useTheme } from "@/src/theme/ThemeContext";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const formatPhoneDisplay = (phone: string): string => {
  if (phone.length <= 5) return phone;
  return `${phone.slice(0, 5)} ${phone.slice(5)}`;
};

const cleanPhoneNumber = (text: string): string => {
  let digits = text.replace(/\D/g, "");
  
  // Handle paste cases with country code
  if (text.includes("+91")) {
    digits = digits.slice(-10);
  } else if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length > 10) {
    digits = digits.slice(-10);
  } else {
    digits = digits.slice(0, 10);
  }
  
  return digits;
};

const isValidIndianPhone = (phone: string): boolean => {
  if (phone.length !== 10) return false;
  const firstDigit = phone[0];
  return ["6", "7", "8", "9"].includes(firstDigit);
};

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED FEATURE ITEM
───────────────────────────────────────────────────────────────────────────── */

interface FeatureItemProps {
  icon: string;
  text: string;
  delay: number;
}

const FeatureItem = React.memo<FeatureItemProps>(({ icon, text, delay }) => {
  const { colors, spacing } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: hexToRgba(colors.accent, 0.15),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons name={icon as never} size={14} color={colors.accent} />
      </View>
      <Text style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }}>{text}</Text>
    </Animated.View>
  );
});

FeatureItem.displayName = "FeatureItem";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN LOGIN SCREEN
───────────────────────────────────────────────────────────────────────────── */

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();

  // Animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Responsive sizing
  const isSmallScreen = width < 350 || height < 650;
  const isLargeScreen = width > 500 || height > 900;
  const isTablet = width > 768;
  const cardMaxWidth = Math.min(width - spacing.md * 2, 480);

  // Check for reduced motion
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Entry animations
  useEffect(() => {
    if (reduceMotion) {
      logoAnim.setValue(1);
      cardAnim.setValue(1);
      footerAnim.setValue(1);
      return;
    }

    Animated.stagger(200, [
      Animated.spring(logoAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, logoAnim, cardAnim, footerAnim]);

  // Pulse animation for button
  useEffect(() => {
    if (phone.length === 10 && isValidIndianPhone(phone) && !reduceMotion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phone, reduceMotion, pulseAnim]);

  // Shake animation for errors
  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [shakeAnim]);

  // API integration - Login returns user data for OTP verification
  const onLoginSuccess = useCallback(
    (data: { token: string; name: string; _id?: string; userId?: string }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Use _id or userId from API response, fallback to token if not available
      const userId = data._id || data.userId || data.token;
      nav.navigate("otp", { phoneNumber: phone, userId });
    },
    [nav, phone]
  );

  const { mutate, status } = useGetLogin(onLoginSuccess);
  const isLoading = status === "pending";

  // Phone input handlers
  const handlePhoneChange = useCallback((text: string) => {
    const cleaned = cleanPhoneNumber(text);
    setPhone(cleaned);
    setError("");

    // Auto dismiss keyboard when 10 digits
    if (cleaned.length === 10) {
      Keyboard.dismiss();
    }
  }, []);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    if (phone.length > 0 && phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
    } else if (phone.length === 10 && !isValidIndianPhone(phone)) {
      setError("Mobile number must start with 6, 7, 8, or 9");
    }
  }, [phone]);

  // Submit handler
  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();

    if (phone.length !== 10) {
      setError("Please enter a 10-digit mobile number");
      triggerShake();
      return;
    }

    if (!isValidIndianPhone(phone)) {
      setError("Please enter a valid Indian mobile number");
      triggerShake();
      return;
    }

    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    mutate({ phoneNumber: phone });
  }, [phone, mutate, triggerShake]);

  // Navigation handlers
  const handleHelpPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/public/help");
  }, [router]);

  // Validation state
  const isValid = phone.length === 10 && isValidIndianPhone(phone);
  const canSubmit = isValid && !isLoading;

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          flexGrow: 1,
          justifyContent: "space-between",
        },
        // Background elements
        bgCircle1: {
          position: "absolute",
          width: isLargeScreen ? width * 1.4 : width * 1.2,
          height: isLargeScreen ? width * 1.4 : width * 1.2,
          borderRadius: isLargeScreen ? width * 0.7 : width * 0.6,
          backgroundColor: colors.circle1,
          top: isLargeScreen ? -width * 0.7 : -width * 0.6,
          left: isLargeScreen ? -width * 0.5 : -width * 0.4,
          opacity: 0.9,
        },
        bgCircle2: {
          position: "absolute",
          width: width * 0.7,
          height: width * 0.7,
          borderRadius: width * 0.35,
          backgroundColor: colors.circle2,
          top: isLargeScreen ? 60 : 30,
          right: isLargeScreen ? -width * 0.35 : -width * 0.25,
          opacity: 0.7,
        },
        // Content
        mainContent: {
          flex: 1,
          paddingHorizontal: spacing.md,
        },
        logoSection: {
          alignItems: "center",
          paddingTop: isLargeScreen ? 80 : isSmallScreen ? 20 : 50,
          paddingBottom: isLargeScreen ? 40 : 20,
        },
        logo: {
          width: isLargeScreen ? 200 : isSmallScreen ? 140 : 170,
          height: isLargeScreen ? 130 : isSmallScreen ? 90 : 110,
        },
        // Card
        card: {
          backgroundColor: hexToRgba(colors.cardBackground, 0.95),
          borderRadius: radius.xxl,
          borderWidth: 1,
          borderColor: colors.borderColor,
          padding: isLargeScreen ? spacing.lg : spacing.md,
          width: cardMaxWidth,
          alignSelf: "center",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 24,
          elevation: 8,
        },
        cardHeader: {
          marginBottom: spacing.md,
        },
        welcomeText: {
          fontSize: isLargeScreen ? 28 : 24,
          fontWeight: "800",
          color: colors.textPrimary,
          marginBottom: 8,
        },
        subtitleText: {
          fontSize: 15,
          color: colors.textSecondary,
          lineHeight: 22,
        },
        // Input section
        inputSection: {
          marginTop: spacing.sm,
        },
        inputLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        inputContainer: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.cardSurface,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderColor: error
            ? colors.error
            : isFocused
            ? colors.accent
            : hexToRgba(colors.textSecondary, 0.15),
          paddingHorizontal: 16,
          height: 60,
          gap: 12,
        },
        countryCode: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingRight: 12,
          borderRightWidth: 1,
          borderRightColor: hexToRgba(colors.textSecondary, 0.2),
        },
        flagEmoji: {
          fontSize: 20,
        },
        countryCodeText: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        phoneInput: {
          flex: 1,
          fontSize: 18,
          fontWeight: "600",
          color: colors.textPrimary,
          letterSpacing: 1,
        },
        clearButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: hexToRgba(colors.textSecondary, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        // Error
        errorContainer: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 10,
        },
        errorText: {
          fontSize: 13,
          color: colors.error,
          flex: 1,
        },
        // Button
        buttonContainer: {
          marginTop: spacing.md,
          borderRadius: radius.lg,
          overflow: "hidden",
        },
        gradientButton: {
          borderRadius: radius.lg,
        },
        buttonContent: {
          height: 56,
          justifyContent: "center",
          alignItems: "center",
        },
        buttonLabel: {
          color: "#FFFFFF",
          fontSize: 17,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
        loadingContainer: {
          height: 56,
          justifyContent: "center",
          alignItems: "center",
        },
        // Features
        featuresSection: {
          marginTop: spacing.lg,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: hexToRgba(colors.textSecondary, 0.1),
        },
        featuresTitle: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 12,
        },
        // Footer
        footer: {
          paddingHorizontal: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          paddingTop: spacing.md,
          gap: spacing.md,
        },
        helpButton: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          borderRadius: radius.lg,
          backgroundColor: hexToRgba(colors.accent, 0.08),
        },
        helpButtonText: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.accent,
        },
        legalText: {
          fontSize: 12,
          color: colors.textMuted,
          textAlign: "center",
          lineHeight: 18,
        },
        linkText: {
          color: colors.link,
          fontWeight: "600",
        },
        versionText: {
          fontSize: 11,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: 8,
        },
      }),
    [
      colors,
      spacing,
      radius,
      isLargeScreen,
      isSmallScreen,
      width,
      cardMaxWidth,
      error,
      isFocused,
      insets.bottom,
    ]
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
          translucent={false}
        />

        {/* Background decorative elements */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={[
              styles.bgCircle1,
              {
                opacity: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 0.9],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bgCircle2,
              {
                opacity: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.7],
                }),
              },
            ]}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.mainContent}>
              {/* Logo Section */}
              <Animated.View
                style={[
                  styles.logoSection,
                  {
                    opacity: logoAnim,
                    transform: [
                      {
                        translateY: logoAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                      {
                        scale: logoAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Image
                  source={require("@/assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="PGMS Logo"
                />
              </Animated.View>

              {/* Login Card */}
              <Animated.View
                style={[
                  styles.card,
                  {
                    opacity: cardAnim,
                    transform: [
                      {
                        translateY: cardAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                      { translateX: shakeAnim },
                    ],
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.cardHeader}>
                  <Text style={styles.welcomeText}>Welcome! 👋</Text>
                  <Text style={styles.subtitleText}>
                    Enter your mobile number to continue. We'll send you a one-time verification
                    code.
                  </Text>
                </View>

                {/* Phone Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.countryCode}>
                      <Text style={styles.flagEmoji}>🇮🇳</Text>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      ref={inputRef}
                      style={styles.phoneInput}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={14}
                      value={formatPhoneDisplay(phone)}
                      onChangeText={handlePhoneChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      textContentType={Platform.OS === "ios" ? "telephoneNumber" : undefined}
                      autoComplete="tel"
                      editable={!isLoading}
                      accessibilityLabel="Mobile number input"
                      accessibilityHint="Enter your 10-digit Indian mobile number"
                      accessible
                    />
                    {phone.length > 0 && !isLoading && (
                      <Pressable
                        onPress={() => {
                          setPhone("");
                          setError("");
                          inputRef.current?.focus();
                          Haptics.selectionAsync();
                        }}
                        style={styles.clearButton}
                        accessibilityRole="button"
                        accessibilityLabel="Clear phone number"
                        accessible
                      >
                        <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                      </Pressable>
                    )}
                  </View>

                  {/* Error Message */}
                  {error ? (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error-outline" size={16} color={colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Submit Button */}
                <Animated.View
                  style={[
                    styles.buttonContainer,
                    { transform: [{ scale: isValid ? pulseAnim : 1 }] },
                  ]}
                >
                  {isLoading ? (
                    <LinearGradient
                      colors={colors.enabledGradient as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    </LinearGradient>
                  ) : (
                    <LinearGradient
                      colors={
                        canSubmit
                          ? (colors.enabledGradient as [string, string])
                          : (colors.disabledGradient as [string, string])
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.gradientButton, { opacity: canSubmit ? 1 : 0.7 }]}
                    >
                      <Button
                        mode="contained"
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        uppercase={false}
                        style={{ backgroundColor: "transparent", elevation: 0 }}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.buttonLabel}
                        accessibilityLabel="Get OTP"
                        accessibilityHint="Sends a one-time password to your mobile number"
                        accessible
                      >
                        Get OTP
                      </Button>
                    </LinearGradient>
                  )}
                </Animated.View>

                {/* Features */}
                <View style={styles.featuresSection}>
                  <Text style={styles.featuresTitle}>What you can do</Text>
                  <FeatureItem icon="home-city" text="Manage multiple PG properties" delay={400} />
                  <FeatureItem icon="account-group" text="Track tenants and bookings" delay={500} />
                  <FeatureItem
                    icon="cash-multiple"
                    text="Collect rent and manage dues"
                    delay={600}
                  />
                </View>
              </Animated.View>
            </View>

            {/* Footer */}
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: footerAnim,
                  transform: [
                    {
                      translateY: footerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Help Button */}
              <Pressable
                onPress={handleHelpPress}
                style={({ pressed }) => [styles.helpButton, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel="Help and Support"
                accessibilityHint="Opens help and support page"
                accessible
              >
                <Ionicons name="help-circle-outline" size={20} color={colors.accent} />
                <Text style={styles.helpButtonText}>Need Help?</Text>
              </Pressable>

              {/* Legal Text */}
              <Text style={styles.legalText}>
                By continuing, you agree to our{" "}
                <Text style={styles.linkText}>Terms of Service</Text> and{" "}
                <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>

              {/* Version */}
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
