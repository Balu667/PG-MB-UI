import React, { useState, useRef, useEffect, useCallback } from "react";
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
  BackHandler,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp, useNavigation, useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { useTheme } from "@/src/theme/ThemeContext";
import { AppTheme } from "@/src/theme";
import DisableButton from "@/src/components/DisableButton";
import { useResendOtp, useVerifyOtp } from "@/src/hooks/login";
import { JwtPayload } from "@/src/interfaces";
import { setProfileDetails } from "@/src/redux/slices/profileSlice";
import { RootStackParamList } from "@/types/navigation";

const { width, height } = Dimensions.get("window");
const clamp = (min: number, v: number, max: number) => Math.max(min, Math.min(v, max));
const scale = (n: number) => Math.round((width / 375) * n);

const OTP_LEN = 4;
const SMALL = width < 350;
const TABLET = width > 600;
const OtpScreen: React.FC = () => {
  const t = useTheme();
  const { colors, spacing, radius } = t;
  const insets = useSafeAreaInsets();

  type Rt = RouteProp<RootStackParamList, "otp">;
  const { params } = useRoute<Rt>();
  const nav = useNavigation();
  const router = useRouter();

  const [boxes, setBoxes] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const logoA = useRef(new Animated.Value(0)).current;
  const cardA = useRef(new Animated.Value(0)).current;

  const [secLeft, setSecLeft] = useState(30);
  const lastTick = useRef(Date.now());
  const timer = useRef<NodeJS.Timeout>();
  const restartTimer = () => {
    clearInterval(timer.current as NodeJS.Timeout);
    lastTick.current = Date.now();
    setSecLeft(30);
    timer.current = setInterval(() => {
      const diff = Math.round((Date.now() - lastTick.current) / 1000);
      setSecLeft(Math.max(30 - diff, 0));
    }, 1000);
  };
  useEffect(() => {
    restartTimer();
    return () => clearInterval(timer.current as NodeJS.Timeout);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        const diff = Math.round((Date.now() - lastTick.current) / 1000);
        setSecLeft(Math.max(30 - diff, 0));
      }
    });
    return () => sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const h = () => {
        setModal(true);
        return true; // block default
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", h);
      return () => sub.remove();
    }, [])
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);
  useEffect(() => {
    if (reduceMotion) {
      logoA.setValue(1);
      cardA.setValue(1);
    } else {
      Animated.stagger(120, [
        Animated.spring(logoA, { toValue: 1, bounciness: 8, useNativeDriver: true }),
        Animated.timing(cardA, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [reduceMotion]);

  const refs = useRef<Array<TextInput | null>>([]);

  const handleChange = (txt: string, idx: number) => {
    setErr("");

    if (txt.length > 1) {
      const digs = txt.replace(/\D/g, "").slice(0, OTP_LEN).split("");
      const filled = Array(OTP_LEN).fill("");
      digs.forEach((d, i) => (filled[i] = d));
      setBoxes(filled);
      digs.length === OTP_LEN && Keyboard.dismiss();
      refs.current.forEach((r, i) => r?.setNativeProps({ text: filled[i] }));
      return;
    }

    const next = [...boxes];
    next[idx] = txt.replace(/\D/g, "");
    setBoxes(next);
    if (txt && idx < OTP_LEN - 1) refs.current[idx + 1]?.focus();
    if (idx === OTP_LEN - 1 && txt) Keyboard.dismiss();
  };

  const handleKey = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !boxes[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const onBlur = () => {
    if (boxes.join("").length !== OTP_LEN) setErr("Please enter all 4 digits of the OTP");
  };

  const dispatch = useDispatch();

  const onVerifySuccess = async (token: string) => {
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
    router.replace("/protected/(tabs)");
  };
  const { mutate: verifyOtp } = useVerifyOtp(onVerifySuccess);

  const { mutate: resendOtp } = useResendOtp((d) => {
    Toast.show({ type: "success", text1: "OTP resent", text2: d.message });
    restartTimer();
  });

  const submit = () => {
    const code = boxes.join("");
    if (code.length !== OTP_LEN) return setErr("Please enter the complete 4‑digit OTP");
    Haptics.selectionAsync();
    verifyOtp({ _id: params.userId, otp: code, role: 1 });
  };

  const box = clamp(44, TABLET ? width / 12 : width / 9, 72);
  const boxFont = clamp(18, box * 0.45, 30);
  const contentPad = TABLET ? spacing.xl : SMALL ? spacing.sm : spacing.lg;
  const logoH = TABLET ? height * 0.22 : SMALL ? height * 0.19 : height * 0.24;
  const formatted = `+91 ${params.phoneNumber.slice(0, 5)} ${params.phoneNumber.slice(5)}`;
  const st = s(colors, spacing, radius, box, boxFont);
  const cardW = TABLET ? Math.min(width * 1.65, 580) : "100%";
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        onBlur();
      }}
    >
      <SafeAreaView style={[st.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* decorative circles */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View style={st.circle1(TABLET, logoA)} />
          <Animated.View style={st.circle2(TABLET, logoA)} />
        </View>

        {/* back btn */}
        <Pressable
          onPress={() => setModal(true)}
          style={[st.backBtn, { top: insets.top + scale(10) }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
        </Pressable>

        {/* main */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={st.main(TABLET)}
        >
          {/* illustration */}
          <Animated.View style={st.logoWrap(logoA, TABLET)}>
            <Image
              source={require("@/assets/images/otp-image.png")}
              style={{ width: width * (TABLET ? 0.43 : 0.7), height: logoH, maxHeight: 250 }}
              resizeMode="contain"
            />
          </Animated.View>

          {/* card */}
          <Animated.View style={st.card(cardA, contentPad, TABLET, cardW)}>
            <Text style={st.h1(TABLET)}>OTP Verification</Text>
            <Text style={st.sub(TABLET)}>We've sent a verification code to</Text>

            {/* phone row */}
            <View style={st.phoneRow}>
              <Text style={st.phone}>{formatted}</Text>
              <TouchableOpacity onPress={() => setModal(true)} accessibilityRole="button">
                <Ionicons
                  name="create-outline"
                  size={scale(20)}
                  color={colors.link}
                  style={{ marginLeft: scale(10) }}
                />
              </TouchableOpacity>
            </View>

            {/* otp boxes */}
            <View style={st.boxRow(TABLET)}>
              {Array.from({ length: OTP_LEN }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(r) => (refs.current[i] = r)}
                  autoFocus={i === 0}
                  style={st.box(boxFont, err)}
                  keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                  maxLength={1}
                  value={boxes[i]}
                  onChangeText={(txt) => handleChange(txt, i)}
                  onKeyPress={(e) => handleKey(e, i)}
                  onBlur={onBlur}
                  selectTextOnFocus
                  importantForAutofill="yes"
                  textContentType={i === 0 && Platform.OS === "ios" ? "oneTimeCode" : "none"}
                  accessibilityLabel={`OTP digit ${i + 1}`}
                />
              ))}
            </View>

            {!!err && <Text style={st.err}>{err}</Text>}

            <DisableButton
              title="Verify OTP"
              onPress={submit}
              disabled={boxes.join("").length !== OTP_LEN}
            />

            {/* resend */}
            <View style={st.resendRow}>
              {secLeft > 0 ? (
                <Text style={st.resendTxt}>Resend in 0:{secLeft.toString().padStart(2, "0")}</Text>
              ) : (
                <>
                  <Text style={st.resendTxt}>Didn't receive code? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      resendOtp({ id: params.userId, phoneNumber: params.phoneNumber });
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={st.resendLink}>Resend</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        <Modal
          visible={modal}
          transparent
          animationType="fade"
          onRequestClose={() => setModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModal(false)}>
            <View style={st.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={st.modalBox}>
                  <Ionicons
                    name="help-circle"
                    size={40}
                    color={colors.accent}
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={st.modalH}>Edit mobile number?</Text>
                  <Text style={st.modalP}>
                    You’ll return to the previous screen to enter a different number.
                  </Text>
                  <View style={st.modalBtns}>
                    <TouchableOpacity
                      style={st.modalYes}
                      onPress={() => {
                        setModal(false);
                        router.back();
                      }}
                    >
                      <Text style={st.modalYesTxt}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.modalCancel} onPress={() => setModal(false)}>
                      <Text style={st.modalCancelTxt}>Cancel</Text>
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

const s = (
  c: AppTheme["colors"],
  sp: AppTheme["spacing"],
  r: AppTheme["radius"],
  box: number,
  font: number
) => {
  const shadow = {
    shadowColor: c.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 60,
    elevation: 10,
  };
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    backBtn: { position: "absolute", padding: 10, zIndex: 10 },

    circle1: (tab: boolean, a: Animated.Value) => ({
      position: "absolute",
      width: tab ? width * 1.3 : width * 1.1,
      height: tab ? width * 1.3 : width * 1.1,
      borderRadius: tab ? width * 0.65 : width * 0.55,
      top: tab ? -width * 0.6 : -width * 0.53,
      left: tab ? -width * 0.42 : -width * 0.3,
      backgroundColor: c.circle1,
      ...shadow,
      opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
    }),
    circle2: (tab: boolean, a: Animated.Value) => ({
      position: "absolute",
      width: width * 0.6,
      height: width * 0.6,
      borderRadius: width * 0.3,
      top: tab ? scale(95) : scale(45),
      right: tab ? scale(-135) : scale(-70),
      backgroundColor: c.circle2,
      opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] }),
    }),

    main: (tab: boolean) => ({
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: tab ? sp.xl * 1.6 : SMALL ? sp.sm : sp.lg,
    }),

    logoWrap: (a: Animated.Value, tab: boolean) => ({
      alignItems: "center",
      marginTop: tab ? scale(30) : SMALL ? scale(5) : scale(16),
      opacity: a,
      transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }],
    }),

    card: (a: Animated.Value, pad: number, tab: boolean, w: number | string) => ({
      width: w,
      alignSelf: "center",
      backgroundColor: c.background2,
      borderRadius: TABLET ? r.extremeLarge : r.extraLarge,
      padding: pad,
      borderWidth: 1,
      borderColor: c.circle2,
      opacity: a,
      transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }) }],
      alignItems: "center",
    }),

    h1: (tab: boolean) => ({
      color: c.primary,
      fontWeight: "700",
      fontSize: clamp(18, scale(tab ? 27 : 24), 32),
      marginBottom: scale(7),
      textAlign: "center",
    }),
    sub: (tab: boolean) => ({
      color: c.textSecondary,
      fontSize: clamp(13, scale(tab ? 17 : 15), 22),
      textAlign: "center",
      marginTop: scale(10),
    }),

    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: scale(9),
      marginBottom: scale(21),
    },
    phone: { color: c.textPrimary, fontWeight: "600", fontSize: scale(17) },

    boxRow: (tab: boolean) => ({
      flexDirection: "row",
      justifyContent: "space-evenly",
      width: "100%",
      marginBottom: scale(20),
      gap: tab ? 22 : 13,
    }),
    box: (errorFont: number, error?: string) => ({
      width: box,
      height: box,
      borderRadius: box / 2,
      backgroundColor: c.white,
      borderWidth: 1.5,
      borderColor: error ? c.error : c.primary,
      textAlign: "center",
      fontWeight: "600",
      color: c.textPrimary,
      fontSize: errorFont,
      ...Platform.select({
        ios: {
          shadowColor: c.shadow,
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 3,
        },
        android: { elevation: 3, shadowColor: c.shadow },
      }),
    }),

    err: { color: c.error, fontSize: scale(13), marginBottom: scale(7), textAlign: "center" },

    resendRow: {
      flexDirection: "row",
      marginTop: scale(14),
      alignItems: "center",
      justifyContent: "center",
    },
    resendTxt: { color: c.textSecondary, fontSize: scale(14) },
    resendLink: { color: c.link, fontSize: scale(14), fontWeight: "700" },

    modalOverlay: {
      flex: 1,
      backgroundColor: c.backDrop,
      justifyContent: "center",
      alignItems: "center",
      padding: sp.md,
    },
    modalBox: {
      width: "88%",
      maxWidth: 580,
      backgroundColor: c.background,
      borderRadius: TABLET ? r.extraLarge : r.xxl,
      borderColor: c.circle2,
      borderWidth: 1,
      paddingVertical: sp.lg + 4,
      paddingHorizontal: sp.lg,
      alignItems: "center",
      shadowColor: c.shadow2,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 12,
    },
    modalH: {
      fontSize: scale(18),
      fontWeight: "700",
      color: c.accent,
      textAlign: "center",
      marginBottom: scale(6),
    },
    modalP: {
      fontSize: scale(14),
      color: c.textSecondary,
      textAlign: "center",
      marginBottom: scale(20),
      lineHeight: scale(20),
    },
    modalBtns: { flexDirection: "row", width: "100%", gap: scale(12) },
    modalYes: {
      flex: 1,
      backgroundColor: c.accent,
      paddingVertical: scale(12),
      borderRadius: TABLET ? r.xxl : r.lg,
      alignItems: "center",
    },
    modalCancel: {
      flex: 1,
      backgroundColor: c.surface,
      paddingVertical: scale(12),
      borderRadius: r.lg,
      alignItems: "center",
    },
    modalYesTxt: {
      fontWeight: "700",
      fontSize: scale(14),
      color: c.white,
    },
    modalCancelTxt: { color: c.textPrimary, fontWeight: "700", fontSize: scale(14) },
  });
};

export default OtpScreen;
