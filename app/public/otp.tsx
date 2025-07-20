/* --------------------------------------------------------------------------
 * OTP Verification screen
 * --------------------------------------------------------------------------
 * – Respects notches, punch‑holes and the Android gesture bar by using
 *   react‑native‑safe‑area‑context.
 * – All existing layout / animations / responsiveness preserved.
 * – Heavily commented so your team understands every piece.
 * -------------------------------------------------------------------------- */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
  Pressable,
  Modal,
  Animated,
  Easing,
  AccessibilityInfo,
  BackHandler, // 🆕 for hardware‑back capture
  AppState, // 🆕 keep timer accurate when app backgrounded
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  RouteProp,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // 🆕
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useDispatch } from "react-redux";

import { lightTheme } from "@/src/theme";
import DisableButton from "@/src/components/DisableButton";
import { RootStackParamList } from "@/types/navigation";
import { useResendOtp, useVerifyOtp } from "@/src/hooks/login";
import { setProfileDetails } from "@/src/redux/slices/profileSlice";
import { jwtDecode } from "jwt-decode";

// Define the shape of your token payload
type JwtPayload = {
  _id: string;
  role: string;
  [key: string]: any;
};

/* ============================================================================
   Constants & helpers
   ========================================================================== */
const OTP_LENGTH = 4;
const { width, height } = Dimensions.get("window");

const scale = (size: number) => {
  if (width > 600) return Math.round(size * (width / 600)); // avoid over‑scaling on tablets
  return Math.round((width / 375) * size);
};

const clamp = (min: number, value: number, max: number) =>
  Math.max(min, Math.min(value, max));

const isSmall = width < 340;
const isTablet = width > 600;

/* ============================================================================
   Component
   ========================================================================== */
const OtpScreen = () => {
  /* -------------- Navigation / route -------------- */
  type OtpRouteProp = RouteProp<RootStackParamList, "otp">;
  const navigation = useNavigation();
  const route = useRoute<OtpRouteProp>();
  const router = useRouter();

  /* -------------- Safe area -------------- */
  const insets = useSafeAreaInsets(); // 🆕

  /* -------------- Local state -------------- */
  const { phoneNumber, userId } = route.params;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [reduceMotion, setReduceMotion] = useState(false);

  const inputs = useRef<Array<TextInput | null>>([]);
  const dispatch = useDispatch();

  /* -------------- Animations -------------- */
  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  /* ---------- 30‑second resend timer ---------- */
  const [secondsLeft, setSecondsLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* Keep track of when we last started the timer so
   we can resume accurately after backgrounding  */
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    if (!reduceMotion) {
      Animated.stagger(120, [
        Animated.spring(logoAnim, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 8,
        }),
        Animated.timing(contentAnim, {
          toValue: 1,
          useNativeDriver: true,
          duration: 550,
          easing: Easing.out(Easing.exp),
        }),
      ]).start();
    } else {
      logoAnim.setValue(1);
      contentAnim.setValue(1);
    }
  }, [reduceMotion]);

  /* ---------- Countdown logic ---------- */
  useEffect(() => {
    // Clear any previous interval
    if (timerRef.current) clearInterval(timerRef.current);

    // Reset for a fresh 30‑seconds
    setSecondsLeft(30);
    lastTickRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const diff = Math.round((Date.now() - lastTickRef.current) / 1000);
        return Math.max(30 - diff, 0);
      });
    }, 1000);

    return () => clearInterval(timerRef.current as NodeJS.Timeout);
  }, []); // ⬅️ runs once when the screen mounts

  /* ---------- Handle app going to background ---------- */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        // Re‑calculate how many seconds remain
        setSecondsLeft((prev) => {
          const diff = Math.round((Date.now() - lastTickRef.current) / 1000);
          return Math.max(30 - diff, 0);
        });
      }
    });
    return () => sub.remove();
  }, []);

  /* ---------- Capture Android hardware‑back ---------- */
  // useFocusEffect(
  //   React.useCallback(() => {
  //     const onBack = () => {
  //       setIsModalVisible(true); // show the confirmation modal you already styled
  //       return true; // prevent automatic pop
  //     };
  //     BackHandler.addEventListener("hardwareBackPress", onBack);
  //     return () => BackHandler.removeEventListener("hardwareBackPress", onBack);
  //   }, [])
  // );
  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        setIsModalVisible(true); // open the “Edit number?” popup
        return true; // block the default back‑navigation
      };

      // ✅ modern API: returns a subscription object
      const backSub = BackHandler.addEventListener("hardwareBackPress", onBack);

      // ✅ clean‑up
      return () => backSub.remove();
    }, [])
  );

  /* ==========================================================================
     API calls (unchanged)
     ======================================================================== */
  const onVerifySuccess = async (data: string) => {
    try {
      await AsyncStorage.setItem("userToken", data);
      dispatch(setProfileDetails({ userId, signedIn: true, phoneNumber }));
      router.replace("/protected/(tabs)");
    } catch (err) {
      console.log(err);
    }
  };
  const { mutate } = useVerifyOtp(onVerifySuccess);

  const resendSuccess = (data: any) => {
    Toast.show({
      type: "success",
      text1: "Resent successfully",
      text2: data.message,
    });

    // ⏱️ restart the 30‑second countdown
    lastTickRef.current = Date.now();
    setSecondsLeft(30);
  };

  const { mutate: resendOtp } = useResendOtp(resendSuccess);
  const resendPayload = { id: userId, phoneNumber };

  /* ==========================================================================
     Handlers
     ======================================================================== */
  const handleChangeText = (text: string, index: number) => {
    setError("");
    /* ------ Support full OTP paste (4 digits at once) ------ */
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const newOtp = Array(OTP_LENGTH).fill("");
      pasted.forEach((d, i) => {
        newOtp[i] = d;
        inputs.current[i]?.setNativeProps({ text: d });
      });
      setOtp(newOtp);
      Keyboard.dismiss();
      return;
    }

    /* ------ Normal single‑digit entry ------ */
    const newOtp = [...otp];
    newOtp[index] = text.replace(/\D/g, "");
    setOtp(newOtp);

    /* Move focus */
    if (text && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (index === OTP_LENGTH - 1 && text) Keyboard.dismiss();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleBlur = () => {
    if (otp.join("").length !== OTP_LENGTH)
      setError("Please enter all 4 digits of the OTP");
  };

  const handleSubmit = () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== OTP_LENGTH) {
      setError("Please enter the complete 4‑digit OTP");
      return;
    }
    Haptics.selectionAsync();
    mutate({ _id: userId, otp: fullOtp });
  };

  /* --------------------------------------------------------------------------
   * Responsive values (unchanged)
   * ------------------------------------------------------------------------ */
  const otpBoxSize = clamp(
    40,
    isTablet ? width / 12 : isSmall ? width / 8 : width / 9,
    72
  );
  const otpFontSize = clamp(19, otpBoxSize * 0.45, 28);
  const contentPadding = isTablet ? scale(36) : isSmall ? scale(16) : scale(24);
  const contentRadius = isTablet ? 30 : 18;
  const logoHeight = isTablet
    ? height * 0.21
    : isSmall
    ? height * 0.19
    : height * 0.24;
  const formattedPhone = `+91 ${phoneNumber?.substring(
    0,
    5
  )} ${phoneNumber?.substring(5)}`;

  /* ==========================================================================
     Render
     ======================================================================== */
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        handleBlur();
      }}
    >
      {/* SafeAreaView now receives dynamic top/bottom padding */}
      <SafeAreaView
        style={[
          styles.safeArea,
          { paddingTop: insets.top, paddingBottom: insets.bottom }, // 🆕
        ]}
      >
        {/* ---------------- Decorative circles ---------------- */}
        <View style={styles.backgroundContainer} pointerEvents="none">
          <Animated.View
            style={{
              width: isTablet ? width * 1.4 : width * 1.15,
              height: isTablet ? width * 1.4 : width * 1.15,
              borderRadius: isTablet ? width * 0.7 : width * 0.58,
              top: isTablet ? -width * 0.58 : -width * 0.48,
              left: isTablet ? -width * 0.42 : -width * 0.3,
              backgroundColor: "#c0ebc9",
              opacity: 1,
              shadowColor: "#0d0c22",
              shadowOpacity: 0.06,
              shadowOffset: { width: 0, height: 22 },
              shadowRadius: 60,
              elevation: 8,
              position: "absolute",
            }}
          />
          <Animated.View
            style={{
              width: isTablet ? width * 0.62 : width * 0.46,
              height: isTablet ? width * 0.62 : width * 0.46,
              borderRadius: isTablet ? width * 0.31 : width * 0.23,
              top: isTablet ? scale(95) : scale(45),
              right: isTablet ? scale(-135) : scale(-70),
              backgroundColor: "#a3d9c9",
              opacity: 0.75,
              position: "absolute",
            }}
          />
        </View>

        {/* ---------------- Back button ---------------- */}
        <Pressable
          onPress={() => setIsModalVisible(true)}
          style={[
            styles.backButton,
            { top: insets.top + (isTablet ? scale(8) : scale(12)) }, // 🆕 respects notch
          ]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={28} color="#222" />
        </Pressable>

        {/* ---------------- Main layout ---------------- */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
          keyboardVerticalOffset={0}
        >
          {/* ----------- Illustration (animated) ----------- */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                marginTop: isTablet
                  ? scale(30)
                  : isSmall
                  ? scale(5)
                  : scale(16),
                opacity: logoAnim,
                transform: [
                  {
                    translateY: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [32, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={require("@/assets/images/otp-image.png")}
              style={{
                width: width * (isTablet ? 0.43 : 0.7),
                height: logoHeight,
                maxHeight: 250,
              }}
              resizeMode="contain"
              accessibilityLabel="OTP Illustration"
            />
          </Animated.View>

          {/* --------------- Card ---------------- */}
          <Animated.View
            style={[
              styles.content,
              {
                marginBottom: isTablet ? scale(42) : scale(16),
                padding: contentPadding,
                borderRadius: contentRadius,
                opacity: contentAnim,
                transform: [
                  {
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [48, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                { fontSize: clamp(18, scale(isTablet ? 27 : 24), 32) },
              ]}
            >
              OTP Verification
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: clamp(13, scale(isTablet ? 17 : 15), 22) },
              ]}
            >
              We've sent a verification code to
            </Text>

            {/* Phone number row */}
            <View style={styles.phoneRow}>
              <Text style={styles.phoneText}>{formattedPhone}</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Edit phone number"
              >
                <Ionicons
                  name="create-outline"
                  size={scale(20)}
                  color="#4A86F7"
                  style={{ marginLeft: scale(10) }}
                />
              </TouchableOpacity>
            </View>

            {/* OTP inputs */}
            <View
              style={[
                styles.otpContainer,
                { marginBottom: scale(20), gap: isTablet ? 22 : 13 },
              ]}
            >
              {Array(OTP_LENGTH)
                .fill(null)
                .map((_, idx: any) => (
                  <TextInput
                    key={idx}
                    ref={(ref) => {
                      inputs.current[idx] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      {
                        width: otpBoxSize,
                        height: otpBoxSize,
                        borderRadius: otpBoxSize / 2,
                        fontSize: otpFontSize,
                        borderColor: error ? "red" : lightTheme.colors.primary,
                      },
                    ]}
                    keyboardType={
                      Platform.OS === "ios" ? "number-pad" : "numeric"
                    }
                    maxLength={1}
                    value={otp[idx]}
                    onChangeText={(t) => handleChangeText(t, idx)}
                    onKeyPress={(e) => handleKeyPress(e, idx)}
                    onBlur={handleBlur}
                    selectTextOnFocus
                    importantForAutofill="yes"
                    textContentType={
                      idx === 0 && Platform.OS === "ios"
                        ? "oneTimeCode"
                        : "none"
                    }
                    accessibilityLabel={`OTP digit ${idx + 1}`}
                  />
                ))}
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <DisableButton
              title="Verify OTP"
              onPress={handleSubmit}
              disabled={otp.join("").length !== OTP_LENGTH}
            />

            {/* Resend row */}
            <View style={styles.resendContainer}>
              {secondsLeft > 0 ? (
                <Text style={styles.resendText}>
                  Resend in 0:{secondsLeft.toString().padStart(2, "0")}
                </Text>
              ) : (
                <>
                  <Text style={styles.resendText}>Didn't receive code? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      resendOtp(resendPayload);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Resend OTP"
                  >
                    <Text style={styles.resendLink}>Resend</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        {/* ---------------- Edit‑number modal ---------------- */}
        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <Ionicons
                    name="help-circle"
                    size={40}
                    color="#1d3c34"
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={styles.modalTitle}>Edit mobile number?</Text>
                  <Text style={styles.modalSubtitle}>
                    You’ll return to the previous screen to enter a different
                    number.
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsModalVisible(false);
                        router.back();
                      }}
                      style={styles.modalButtonYes}
                    >
                      <Text style={styles.modalButtonYesText}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsModalVisible(false)}
                      style={styles.modalButtonCancel}
                    >
                      <Text style={styles.modalButtonCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

/* ============================================================================
   Styles (the core palette/layout is unchanged)
   ========================================================================== */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },

  backButton: { position: "absolute", zIndex: 10, padding: 10 },

  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: isTablet ? scale(70) : isSmall ? scale(10) : scale(24),
  },

  content: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(210,210,210,0.13)",
    shadowColor: "#0d0c22",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
    alignItems: "center",
    width: "100%",
  },

  title: {
    fontWeight: "700",
    marginBottom: scale(7),
    color: "#1d3c34",
    letterSpacing: 0.1,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: scale(10),
    color: "#444",
    fontWeight: "500",
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(9),
    marginBottom: scale(21),
  },
  phoneText: { fontWeight: "600", color: "#000", fontSize: scale(17) },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },

  otpInput: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    textAlign: "center",
    fontWeight: "600",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    color: "#000",
  },

  errorText: {
    color: "red",
    fontSize: scale(13),
    marginBottom: scale(7),
    textAlign: "center",
  },

  resendContainer: {
    flexDirection: "row",
    marginTop: scale(14),
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: { fontSize: scale(14), color: "#444" },
  resendLink: { fontSize: scale(14), color: "#4A86F7", fontWeight: "700" },

  /* ------------ Modal styles ------------ */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)", // darker backdrop
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },

  modalContainer: {
    width: "88%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: scale(26),
    paddingHorizontal: scale(22),
    alignItems: "center",

    // soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: scale(18),
    color: "#1d3c34",
    textAlign: "center",
    marginBottom: scale(6),
  },
  modalSubtitle: {
    fontSize: scale(14),
    color: "#555",
    textAlign: "center",
    marginBottom: scale(20),
    lineHeight: scale(20),
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: scale(12),
  },
  modalButtonYes: {
    flex: 1,
    backgroundColor: "#1d3c34",
    paddingVertical: scale(12),
    borderRadius: 14,
    alignItems: "center",
  },

  modalButtonCancel: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    paddingVertical: scale(12),
    borderRadius: 14,
    alignItems: "center",
  },
  modalButtonYesText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: scale(14),
  },

  modalButtonCancelText: {
    color: "#333",
    fontWeight: "700",
    fontSize: scale(14),
  },
});

export default OtpScreen;
