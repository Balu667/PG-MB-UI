import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Dimensions,
  Animated,
  Easing,
  AccessibilityInfo,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hexToRgba } from "@/src/theme";
import PhoneInput from "@/src/components/PhoneInput";
import DisableButton from "@/src/components/DisableButton";
import { useGetLogin } from "@/src/hooks/login";
import { RootStackParamList } from "@/types/navigation";
import { useTheme } from "@/src/theme/ThemeContext";
import { AppTheme, lightTheme } from "@/src/theme";

const { width, height } = Dimensions.get("window");
const scale = (n: number) => Math.round((width / 375) * n);
const clamp = (n: number) => Math.max(12, Math.min(n * Dimensions.get("window").fontScale, 24));

const LoginScreen = () => {
  const [phone, setPhone] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);

  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const { colors, spacing, radius } = theme;

  const logoA = useRef(new Animated.Value(0)).current;
  const contentA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    if (reduceMotion) {
      logoA.setValue(1);
      contentA.setValue(1);
      return;
    }
    Animated.stagger(150, [
      Animated.spring(logoA, { toValue: 1, bounciness: 10, useNativeDriver: true }),
      Animated.timing(contentA, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion]);

  const onSuccess = (d: any) => nav.navigate("otp", { phoneNumber: phone, userId: d.userId });
  const { mutate, status } = useGetLogin(onSuccess);

  const submit = () => {
    if (phone.length === 10) {
      Haptics.selectionAsync();
      mutate({ phoneNumber: phone });
    }
  };

  const small = width < 350 || height < 650;
  const large = width > 500 || height > 900;
  const pad = large ? spacing.lg : small ? spacing.sm : spacing.lg;
  const logoT = large ? scale(80) : small ? scale(30) : scale(60);
  const cardMB = large ? scale(60) : small ? scale(12) : scale(30);
  const cardWidth = Math.min(width - spacing.sm * 2, 540);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView
        style={[styles.safe(theme), { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <View style={styles.blobWrap}>
          <Animated.View
            style={[
              styles.blobLarge(theme, large),
              { opacity: logoA.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ]}
          />
          <Animated.View
            style={[
              styles.blobSmall(theme, large),
              { opacity: logoA.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] }) },
            ]}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.main}
        >
          <Animated.View
            style={[
              {
                alignItems: "center",
                marginTop: logoT,
                opacity: logoA,
                transform: [
                  { translateY: logoA.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                ],
              },
            ]}
          >
            <Image
              source={require("@/assets/images/logo.png")}
              style={{ width: scale(170), height: scale(110) }}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.card(theme, pad, hexToRgba),
              {
                width: cardWidth,
                alignSelf: "center",
                marginBottom: cardMB,
                opacity: contentA,
                transform: [
                  {
                    translateY: contentA.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }),
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.h1(theme), { fontSize: clamp(22) }]}>Welcome👋</Text>
            <Text style={[styles.subtitle(theme), { fontSize: clamp(15) }]}>
              Let’s get started by entering your mobile number.
            </Text>

            <PhoneInput value={phone} onChangeText={setPhone} />

            {status === "pending" ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
            ) : (
              <DisableButton title="Generate OTP" onPress={submit} disabled={phone.length !== 10} />
            )}
          </Animated.View>

          <View style={{ paddingHorizontal: spacing.md, alignItems: "center" }}>
            <Text style={styles.quote(theme)}>
              “Comfortable living starts with the right place.”
            </Text>
          </View>

          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingBottom:
                insets.bottom +
                (Platform.OS === "android" ? Math.max(24, spacing.md * 2) : spacing.md * 1.2),
              minHeight: 50,
            }}
          >
            <Text style={styles.footer(theme)}>
              By continuing, you accept our <Text style={styles.link(theme)}>Terms of Service</Text>
              . Learn how we process your data in our{" "}
              <Text style={styles.link(theme)}>Privacy Policy</Text> and{" "}
              <Text style={styles.link(theme)}>Cookies Policy</Text>.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = {
  safe: (t: AppTheme) =>
    ({
      flex: 1,
      backgroundColor: t.colors.background,
    } as const),

  blobWrap: { ...StyleSheet.absoluteFillObject, zIndex: 0 } as const,

  blobLarge: (t: AppTheme, large: boolean) =>
    ({
      position: "absolute",
      width: large ? width * 1.3 : width * 1.1,
      height: large ? width * 1.3 : width * 1.1,
      borderRadius: large ? width * 0.65 : width * 0.55,
      top: large ? -width * 0.6 : -width * 0.53,
      left: large ? -width * 0.4 : -width * 0.3,
      backgroundColor: t.colors.circle1,
      shadowColor: t.colors.shadow,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 18 },
      shadowRadius: 60,
      elevation: 10,
    } as const),

  blobSmall: (t: AppTheme, large: boolean) =>
    ({
      position: "absolute",
      width: width * 0.6,
      height: width * 0.6,
      borderRadius: width * 0.3,
      top: large ? scale(70) : scale(40),
      right: large ? scale(-110) : scale(-70),
      backgroundColor: t.colors.circle2,
    } as const),

  main: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: lightTheme.spacing.sm,
  } as const,

  card: (t: AppTheme, pad: number, opacity: any) =>
    ({
      borderRadius: t.radius.extraLarge,
      borderWidth: 1,
      padding: pad,
      borderColor: t.colors.borderColor,
      backgroundColor: hexToRgba(t.colors.background2, 1),
    } as const),

  h1: (t: AppTheme) =>
    ({
      color: t.colors.primary,
      fontWeight: "700",
      marginBottom: 8,
    } as const),

  subtitle: (t: AppTheme) =>
    ({
      color: t.colors.textMuted,
      marginBottom: scale(15),
    } as const),

  quote: (t: AppTheme) =>
    ({
      color: t.colors.textSecondary,
      fontStyle: "italic",
      textAlign: "center",
      fontSize: clamp(13),
    } as const),

  footer: (t: AppTheme) =>
    ({
      color: t.colors.textMuted,
      fontSize: clamp(12),
      textAlign: "center",
      lineHeight: scale(17),
      fontWeight: "600",
    } as const),

  link: (t: AppTheme) =>
    ({
      color: t.colors.link,
      fontWeight: "600",
    } as const),
};

export default LoginScreen;
