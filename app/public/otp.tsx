// app/public/otp.tsx
// Premium OTP Verification Screen with animations and security features
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Image,
  Pressable,
  Modal,
  Animated,
  AccessibilityInfo,
  BackHandler,
  AppState,
  useWindowDimensions,
  I18nManager,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native-paper";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import * as Clipboard from "expo-clipboard";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useResendOtp, useVerifyOtp } from "@/src/hooks/login";
import { JwtPayload } from "@/src/interfaces";
import { setProfileDetails } from "@/src/redux/slices/profileSlice";
import { RootStackParamList } from "@/types/navigation";

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const OTP_LENGTH = 4;
const RESEND_TIMER = 30;

/* ─────────────────────────────────────────────────────────────────────────────
   OTP INPUT BOX COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface OtpBoxProps {
  value: string;
  isFocused: boolean;
  hasError: boolean;
  index: number;
  size: number;
}

const OtpBox = React.memo<OtpBoxProps>(({ value, isFocused, hasError, index, size }) => {
  const { colors, radius } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [value, scaleAnim]);

  useEffect(() => {
    if (isFocused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(0);
    }
  }, [isFocused, bounceAnim]);

  const borderColor = hasError
    ? colors.error
    : isFocused
    ? colors.accent
    : value
    ? colors.success
    : hexToRgba(colors.textSecondary, 0.2);

  const backgroundColor = value
    ? hexToRgba(colors.accent, 0.08)
    : colors.cardSurface;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderColor,
          backgroundColor,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: isFocused ? colors.accent : "#000000",
          shadowOffset: { width: 0, height: isFocused ? 4 : 2 },
          shadowOpacity: isFocused ? 0.2 : 0.08,
          shadowRadius: isFocused ? 8 : 4,
          elevation: isFocused ? 6 : 2,
          transform: [
            {
              scale: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              }),
            },
          ],
        }}
      >
        <Text
          style={{
            fontSize: size * 0.45,
            fontWeight: "700",
            color: value ? colors.textPrimary : colors.textMuted,
          }}
        >
          {value || ""}
        </Text>
        {isFocused && !value && (
          <View
            style={{
              position: "absolute",
              width: 2,
              height: size * 0.45,
              backgroundColor: colors.accent,
              borderRadius: 1,
            }}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
});

OtpBox.displayName = "OtpBox";

/* ─────────────────────────────────────────────────────────────────────────────
   TIMER COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface TimerProps {
  seconds: number;
  onResend: () => void;
  isResending: boolean;
  isCompact: boolean;
}

const ResendTimer = React.memo<TimerProps>(({ seconds, onResend, isResending, isCompact }) => {
  const { colors, spacing, radius } = useTheme();

  const formatTime = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isResending) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={{ fontSize: isCompact ? 13 : 14, color: colors.textSecondary }}>Sending...</Text>
      </View>
    );
  }

  if (seconds > 0) {
    return (
      <View style={{ alignItems: "center", gap: isCompact ? 6 : 8 }}>
        <Text style={{ fontSize: isCompact ? 13 : 14, color: colors.textSecondary }}>
          Resend code in
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: hexToRgba(colors.accent, 0.1),
            paddingHorizontal: isCompact ? 12 : 16,
            paddingVertical: isCompact ? 6 : 8,
            borderRadius: radius.full,
          }}
        >
          <MaterialCommunityIcons name="timer-outline" size={isCompact ? 16 : 18} color={colors.accent} />
          <Text style={{ fontSize: isCompact ? 14 : 16, fontWeight: "700", color: colors.accent }}>
            {formatTime(seconds)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center", gap: isCompact ? 6 : 8 }}>
      <Text style={{ fontSize: isCompact ? 13 : 14, color: colors.textSecondary }}>
        Didn't receive the code?
      </Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onResend();
        }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: isCompact ? 16 : 20,
          paddingVertical: isCompact ? 10 : 12,
          borderRadius: radius.lg,
          backgroundColor: pressed
            ? hexToRgba(colors.accent, 0.15)
            : hexToRgba(colors.accent, 0.1),
        })}
        accessibilityRole="button"
        accessibilityLabel="Resend OTP"
        accessibilityHint="Sends a new verification code to your phone"
        accessible
      >
        <MaterialCommunityIcons name="refresh" size={isCompact ? 16 : 18} color={colors.accent} />
        <Text style={{ fontSize: isCompact ? 14 : 15, fontWeight: "600", color: colors.accent }}>
          Resend Code
        </Text>
      </Pressable>
    </View>
  );
});

ResendTimer.displayName = "ResendTimer";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN OTP SCREEN
───────────────────────────────────────────────────────────────────────────── */

export default function OtpScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const dispatch = useDispatch();
  const scrollViewRef = useRef<ScrollView>(null);

  type OtpRouteParams = RouteProp<RootStackParamList, "otp">;
  const { params } = useRoute<OtpRouteParams>();

  // State
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [clipboardOtp, setClipboardOtp] = useState<string | null>(null);

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(RESEND_TIMER);
  const lastTickRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const inputRef = useRef<TextInput>(null);
  const logoAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Responsive sizing
  const isSmallScreen = width < 350 || height < 650;
  const isCompactScreen = height < 800;
  const isLargeScreen = width > 500 && height > 900;
  const isTablet = width > 768;
  const cardMaxWidth = Math.min(width - spacing.md * 2, 480);
  const otpBoxSize = isCompactScreen ? 52 : isSmallScreen ? 50 : isTablet ? 70 : 60;

  // Format phone for display
  const formattedPhone = useMemo(() => {
    const phone = params?.phoneNumber ?? "";
    if (phone.length === 10) {
      return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return `+91 ${phone}`;
  }, [params?.phoneNumber]);

  // Keyboard listeners
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        // Scroll to make OTP input visible
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Check clipboard for OTP on mount and focus
  const checkClipboardForOtp = useCallback(async () => {
    try {
      const content = await Clipboard.getStringAsync();
      if (content) {
        const digits = content.replace(/\D/g, "");
        if (digits.length === OTP_LENGTH) {
          setClipboardOtp(digits);
        }
      }
    } catch {
      // Clipboard access denied
    }
  }, []);

  useEffect(() => {
    checkClipboardForOtp();
  }, [checkClipboardForOtp]);

  // Paste OTP from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const content = await Clipboard.getStringAsync();
      if (content) {
        const digits = content.replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (digits.length > 0) {
          const newOtp = digits.split("");
          while (newOtp.length < OTP_LENGTH) {
            newOtp.push("");
          }
          setOtp(newOtp);
          setClipboardOtp(null);
          setError("");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (digits.length === OTP_LENGTH) {
            Keyboard.dismiss();
            setFocusedIndex(-1);
          } else {
            setFocusedIndex(digits.length);
          }
          Toast.show({
            type: "success",
            text1: "OTP Pasted",
            text2: "Code has been filled from clipboard",
          });
        }
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Paste Failed",
        text2: "Could not access clipboard",
      });
    }
  }, []);

  // Timer functions
  const restartTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    lastTickRef.current = Date.now();
    setSecondsLeft(RESEND_TIMER);
    timerRef.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - lastTickRef.current) / 1000);
      setSecondsLeft(Math.max(RESEND_TIMER - elapsed, 0));
    }, 1000);
  }, []);

  useEffect(() => {
    restartTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [restartTimer]);

  // App state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const elapsed = Math.round((Date.now() - lastTickRef.current) / 1000);
        setSecondsLeft(Math.max(RESEND_TIMER - elapsed, 0));
        checkClipboardForOtp();
      }
    });
    return () => subscription.remove();
  }, [checkClipboardForOtp]);

  // Back button handler
  useFocusEffect(
    useCallback(() => {
      const handleBack = () => {
        setShowBackModal(true);
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", handleBack);
      return () => subscription.remove();
    }, [])
  );

  // Reduced motion
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Entry animations
  useEffect(() => {
    if (reduceMotion) {
      logoAnim.setValue(1);
      cardAnim.setValue(1);
      return;
    }

    Animated.stagger(150, [
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
    ]).start();
  }, [reduceMotion, logoAnim, cardAnim]);

  // Shake animation
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

  // API: Verify OTP success
  const onVerifySuccess = useCallback(
    async (token: string) => {
      try {
        await AsyncStorage.setItem("userToken", token);
        const decoded = jwtDecode<JwtPayload>(token);
        dispatch(
          setProfileDetails({
            userId: decoded._id,
            signedIn: true,
            phoneNumber: decoded.phoneNumber,
            role: decoded.role,
          })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/protected/(tabs)");
      } catch {
        setError("Something went wrong. Please try again.");
        setIsVerifying(false);
      }
    },
    [dispatch, router]
  );

  // API: Verify OTP hook
  const { mutate: verifyOtp } = useVerifyOtp(onVerifySuccess, {
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      const message = err?.response?.data?.message || err?.message || "Invalid OTP. Please try again.";
      setError(message);
      setIsVerifying(false);
      triggerShake();
    },
  });

  // API: Resend OTP hook
  const { mutate: resendOtp } = useResendOtp((data: { message?: string }) => {
    Toast.show({
      type: "success",
      text1: "Code Sent!",
      text2: data?.message || "A new verification code has been sent.",
    });
    setIsResending(false);
    restartTimer();
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
    setFocusedIndex(0);
    inputRef.current?.focus();
  });

  // Handle OTP input - FIXED BACKSPACE LOGIC
  const handleOtpChange = useCallback(
    (text: string) => {
      setError("");
      const digits = text.replace(/\D/g, "");

      // Handle paste (multiple digits)
      if (digits.length > 1) {
        const newOtp = digits.slice(0, OTP_LENGTH).split("");
        while (newOtp.length < OTP_LENGTH) {
          newOtp.push("");
        }
        setOtp(newOtp);
        if (digits.length >= OTP_LENGTH) {
          Keyboard.dismiss();
          setFocusedIndex(-1);
        } else {
          setFocusedIndex(Math.min(digits.length, OTP_LENGTH - 1));
        }
        return;
      }

      // Handle single digit
      if (digits.length === 1) {
        const newOtp = [...otp];
        newOtp[focusedIndex] = digits;
        setOtp(newOtp);

        if (focusedIndex < OTP_LENGTH - 1) {
          setFocusedIndex(focusedIndex + 1);
        } else {
          Keyboard.dismiss();
          setFocusedIndex(-1);
        }
      }
    },
    [otp, focusedIndex]
  );

  // Handle backspace - COMPLETELY FIXED
  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }) => {
      if (e.nativeEvent.key === "Backspace") {
        setError("");
        const newOtp = [...otp];
        
        // If current position has a value, clear it
        if (newOtp[focusedIndex]) {
          newOtp[focusedIndex] = "";
          setOtp(newOtp);
          // Stay at current position
        } else if (focusedIndex > 0) {
          // If current is empty, move back and clear previous
          const prevIndex = focusedIndex - 1;
          newOtp[prevIndex] = "";
          setOtp(newOtp);
          setFocusedIndex(prevIndex);
        }
      }
    },
    [otp, focusedIndex]
  );

  // Handle box press
  const handleBoxPress = useCallback((index: number) => {
    setFocusedIndex(index);
    inputRef.current?.focus();
    Haptics.selectionAsync();
  }, []);

  // Clear all OTP
  const handleClearAll = useCallback(() => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setFocusedIndex(0);
    setError("");
    inputRef.current?.focus();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Submit OTP
  const handleSubmit = useCallback(() => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the complete 4-digit OTP");
      triggerShake();
      return;
    }

    setIsVerifying(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    verifyOtp({ _id: params.userId, otp: code, role: 1 });
  }, [otp, params.userId, verifyOtp, triggerShake]);

  // Handle resend
  const handleResend = useCallback(() => {
    setIsResending(true);
    resendOtp({ id: params.userId, phoneNumber: params.phoneNumber });
  }, [params.userId, params.phoneNumber, resendOtp]);

  // Back navigation
  const handleBack = useCallback(() => {
    setShowBackModal(true);
  }, []);

  const confirmBack = useCallback(() => {
    setShowBackModal(false);
    router.back();
  }, [router]);

  // Validation
  const isComplete = otp.every((d) => d);
  const canSubmit = isComplete && !isVerifying;

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
          paddingBottom: keyboardVisible ? 20 : (isCompactScreen ? 80 : 40),
        },
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
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: isCompactScreen ? spacing.xs : spacing.sm,
        },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: hexToRgba(colors.textSecondary, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        mainContent: {
          flex: 1,
          paddingHorizontal: spacing.md,
        },
        illustrationSection: {
          alignItems: "center",
          paddingTop: isCompactScreen ? 8 : isLargeScreen ? 40 : 20,
          paddingBottom: isCompactScreen ? 8 : 15,
        },
        illustration: {
          width: isCompactScreen ? 140 : isLargeScreen ? 220 : 180,
          height: isCompactScreen ? 90 : isLargeScreen ? 160 : 130,
        },
        card: {
          backgroundColor: hexToRgba(colors.cardBackground, 0.95),
          borderRadius: radius.xxl,
          borderWidth: 1,
          borderColor: colors.borderColor,
          padding: isCompactScreen ? spacing.md : isLargeScreen ? spacing.lg : spacing.md,
          width: cardMaxWidth,
          alignSelf: "center",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 24,
          elevation: 8,
        },
        cardHeader: {
          alignItems: "center",
          marginBottom: isCompactScreen ? spacing.sm : spacing.md,
        },
        securityBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: hexToRgba(colors.success, 0.1),
          paddingHorizontal: 12,
          paddingVertical: isCompactScreen ? 4 : 6,
          borderRadius: radius.full,
          marginBottom: isCompactScreen ? spacing.sm : spacing.md,
        },
        securityText: {
          fontSize: isCompactScreen ? 11 : 12,
          fontWeight: "600",
          color: colors.success,
        },
        title: {
          fontSize: isCompactScreen ? 22 : isLargeScreen ? 28 : 24,
          fontWeight: "800",
          color: colors.textPrimary,
          marginBottom: isCompactScreen ? 4 : 8,
          textAlign: "center",
        },
        subtitle: {
          fontSize: isCompactScreen ? 14 : 15,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: isCompactScreen ? 20 : 22,
        },
        phoneRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: isCompactScreen ? 8 : 12,
          marginBottom: isCompactScreen ? spacing.md : spacing.lg,
        },
        phoneText: {
          fontSize: isCompactScreen ? 15 : 17,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        editButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        otpSection: {
          marginBottom: isCompactScreen ? spacing.md : spacing.lg,
        },
        otpLabelRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isCompactScreen ? 12 : 16,
        },
        otpLabel: {
          fontSize: isCompactScreen ? 12 : 13,
          fontWeight: "600",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        otpActions: {
          flexDirection: "row",
          gap: 8,
        },
        actionButton: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: radius.md,
          backgroundColor: hexToRgba(colors.accent, 0.1),
        },
        actionButtonText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.accent,
        },
        otpBoxes: {
          flexDirection: "row",
          justifyContent: "center",
          gap: isCompactScreen ? 10 : isTablet ? 20 : 14,
        },
        hiddenInput: {
          position: "absolute",
          opacity: 0,
          height: 0,
          width: 0,
        },
        errorContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginTop: isCompactScreen ? 8 : 12,
          paddingHorizontal: spacing.md,
        },
        errorText: {
          fontSize: isCompactScreen ? 13 : 14,
          color: colors.error,
          textAlign: "center",
        },
        buttonContainer: {
          marginTop: isCompactScreen ? spacing.sm : spacing.sm,
          marginBottom: isCompactScreen ? spacing.md : spacing.md,
          borderRadius: radius.lg,
          overflow: "hidden",
        },
        gradientButton: {
          borderRadius: radius.lg,
        },
        buttonContent: {
          height: isCompactScreen ? 50 : 56,
          justifyContent: "center",
          alignItems: "center",
        },
        buttonLabel: {
          color: "#FFFFFF",
          fontSize: isCompactScreen ? 16 : 17,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
        loadingContainer: {
          height: isCompactScreen ? 50 : 56,
          justifyContent: "center",
          alignItems: "center",
        },
        timerSection: {
          alignItems: "center",
          marginTop: isCompactScreen ? spacing.xs : spacing.sm,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: hexToRgba("#000000", 0.6),
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.md,
        },
        modalContent: {
          width: "90%",
          maxWidth: 400,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xxl,
          padding: spacing.lg,
          alignItems: "center",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 16,
        },
        modalIcon: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
        },
        modalTitle: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: 8,
          textAlign: "center",
        },
        modalText: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
          marginBottom: spacing.lg,
        },
        modalButtons: {
          flexDirection: "row",
          gap: 12,
          width: "100%",
        },
        modalButton: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: radius.lg,
          alignItems: "center",
          justifyContent: "center",
        },
        modalButtonPrimary: {
          backgroundColor: colors.accent,
        },
        modalButtonSecondary: {
          backgroundColor: hexToRgba(colors.textSecondary, 0.1),
        },
        modalButtonTextPrimary: {
          fontSize: 15,
          fontWeight: "700",
          color: "#FFFFFF",
        },
        modalButtonTextSecondary: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.textPrimary,
        },
      }),
    [
      colors,
      spacing,
      radius,
      width,
      isLargeScreen,
      isSmallScreen,
      isCompactScreen,
      isTablet,
      cardMaxWidth,
      keyboardVisible,
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

        {/* Background */}
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

        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            android_ripple={{ color: hexToRgba(colors.textSecondary, 0.2), borderless: true }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the login screen"
            accessible
          >
            <MaterialIcons
              name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.mainContent}>
              {/* Illustration */}
              <Animated.View
                style={[
                  styles.illustrationSection,
                  {
                    opacity: logoAnim,
                    transform: [
                      {
                        translateY: logoAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Image
                  source={require("@/assets/images/otp-image.png")}
                  style={styles.illustration}
                  resizeMode="contain"
                  accessibilityLabel="OTP verification illustration"
                />
              </Animated.View>

              {/* OTP Card */}
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
                  <View style={styles.securityBadge}>
                    <MaterialCommunityIcons name="shield-check" size={14} color={colors.success} />
                    <Text style={styles.securityText}>Secure Verification</Text>
                  </View>
                  <Text style={styles.title}>Enter OTP</Text>
                  <Text style={styles.subtitle}>
                    We've sent a 4-digit verification code to
                  </Text>
                  <View style={styles.phoneRow}>
                    <Text style={styles.phoneText}>{formattedPhone}</Text>
                    <Pressable
                      onPress={handleBack}
                      style={({ pressed }) => [
                        styles.editButton,
                        pressed && { opacity: 0.7 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Edit phone number"
                      accessible
                    >
                      <MaterialIcons name="edit" size={16} color={colors.accent} />
                    </Pressable>
                  </View>
                </View>

                {/* OTP Input */}
                <View style={styles.otpSection}>
                  <View style={styles.otpLabelRow}>
                    <Text style={styles.otpLabel}>Verification Code</Text>
                    <View style={styles.otpActions}>
                      {/* Paste from clipboard button */}
                      <Pressable
                        onPress={handlePasteFromClipboard}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && { opacity: 0.7 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Paste OTP from clipboard"
                        accessible
                      >
                        <MaterialCommunityIcons name="content-paste" size={14} color={colors.accent} />
                        <Text style={styles.actionButtonText}>Paste</Text>
                      </Pressable>
                      {/* Clear button */}
                      {otp.some((d) => d) && (
                        <Pressable
                          onPress={handleClearAll}
                          style={({ pressed }) => [
                            styles.actionButton,
                            { backgroundColor: hexToRgba(colors.error, 0.1) },
                            pressed && { opacity: 0.7 },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Clear all OTP digits"
                          accessible
                        >
                          <MaterialIcons name="clear" size={14} color={colors.error} />
                          <Text style={[styles.actionButtonText, { color: colors.error }]}>Clear</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  <View style={styles.otpBoxes}>
                    {otp.map((digit, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleBoxPress(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`OTP digit ${index + 1}${digit ? `: ${digit}` : ""}`}
                        accessible
                      >
                        <OtpBox
                          value={digit}
                          isFocused={focusedIndex === index}
                          hasError={!!error}
                          index={index}
                          size={otpBoxSize}
                        />
                      </Pressable>
                    ))}
                  </View>

                  {/* Hidden input */}
                  <TextInput
                    ref={inputRef}
                    style={styles.hiddenInput}
                    value=""
                    onChangeText={handleOtpChange}
                    onKeyPress={handleKeyPress}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    autoFocus
                    textContentType={Platform.OS === "ios" ? "oneTimeCode" : undefined}
                    autoComplete="sms-otp"
                    caretHidden
                    accessibilityLabel="OTP input"
                    accessible
                  />

                  {/* Error Message */}
                  {error ? (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error-outline" size={16} color={colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Verify Button */}
                <View style={styles.buttonContainer}>
                  {isVerifying ? (
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
                        accessibilityLabel="Verify OTP"
                        accessibilityHint="Verifies your OTP and logs you in"
                        accessible
                      >
                        Verify & Continue
                      </Button>
                    </LinearGradient>
                  )}
                </View>

                {/* Resend Timer */}
                <View style={styles.timerSection}>
                  <ResendTimer
                    seconds={secondsLeft}
                    onResend={handleResend}
                    isResending={isResending}
                    isCompact={isCompactScreen}
                  />
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Back Modal */}
        <Modal
          visible={showBackModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBackModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowBackModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalIcon}>
                    <Ionicons name="help-circle" size={32} color={colors.accent} />
                  </View>
                  <Text style={styles.modalTitle}>Change Number?</Text>
                  <Text style={styles.modalText}>
                    You'll return to the login screen to enter a different mobile number.
                  </Text>
                  <View style={styles.modalButtons}>
                    <Pressable
                      onPress={() => setShowBackModal(false)}
                      style={[styles.modalButton, styles.modalButtonSecondary]}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel"
                      accessible
                    >
                      <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={confirmBack}
                      style={[styles.modalButton, styles.modalButtonPrimary]}
                      accessibilityRole="button"
                      accessibilityLabel="Yes, go back"
                      accessible
                    >
                      <Text style={styles.modalButtonTextPrimary}>Yes, Go Back</Text>
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
