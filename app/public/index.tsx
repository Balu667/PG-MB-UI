// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   SafeAreaView,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableWithoutFeedback,
//   Keyboard,
//   Image,
//   Dimensions,
// } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
// import PhoneInput from "@/src/components/PhoneInput";
// import DisableButton from "@/src/components/DisableButton";
// import { lightTheme } from "@/src/theme";
// import { useGetLogin } from "@/src/hooks/login";
// import { RootStackParamList } from "@/src/types/navigation";
// import { ActivityIndicator } from "react-native";

// const COLORS = {
//   primary: "#1d3c34",
//   accent: "#d99136",
//   background: "#FFFFFF",
//   circle1: "#c0ebc9",
//   circle2: "#a3d9c9",
//   textPrimary: "#333333",
//   textSecondary: "#666666",
//   textMuted: "#999999",
//   border: "#E0E0E0",
//   link: "#4A86F7",
//   disabled: "#CCCCCC",
// };

// const FONT = {
//   regular: "400",
//   semiBold: "600",
//   bold: "700",
// };

// const SIZES = {
//   base: 16,
//   padding: 24,
//   margin: 16,
//   radius: 12,
//   inputHeight: 56,
// };

// const { width, height } = Dimensions.get("window");
// const scale = (size: number) => (width / 375) * size;

// const LoginScreen = () => {
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const onSuccessLogin = (data: any) => {
//     const { userId } = data;

//     navigation.navigate("otp", {
//       phoneNumber,
//       userId,
//     });
//   };

//   const { mutate, status } = useGetLogin(onSuccessLogin);

//   const handleContinue = () => {
//     if (phoneNumber.length === 10) {
//       mutate({ phoneNumber }); // invoke the mutation
//     }
//   };

//   const dynamicStyles = StyleSheet.create({
//     circleLarge: {
//       width: scale(600),
//       height: scale(600),
//       borderRadius: scale(300),
//       top: scale(-280),
//       left: scale(-115),
//     },
//     circleSmall: {
//       width: scale(300),
//       height: scale(300),
//       borderRadius: scale(150),
//       top: scale(-100),
//       right: scale(-100),
//     },
//     logoContainer: {
//       paddingTop: height > 800 ? scale(60) : scale(40),
//     },
//     content: {
//       marginBottom: height > 800 ? scale(40) : scale(20),
//     },
//   });

//   return (
//     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//       <SafeAreaView style={viewStyles.safeArea}>
//         {/* Background Circles */}
//         <View style={viewStyles.backgroundContainer}>
//           <View style={[viewStyles.circleLarge, dynamicStyles.circleLarge]} />
//           <View style={[viewStyles.circleSmall, dynamicStyles.circleSmall]} />
//         </View>

//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//           style={viewStyles.container}
//           keyboardVerticalOffset={Platform.OS === "ios" ? -scale(100) : 0}
//         >
//           {/* Logo */}
//           <View style={[viewStyles.logoContainer, dynamicStyles.logoContainer]}>
//             <Image
//               source={require("@/assets/images/logo.png")}
//               style={imageStyles.logoImage}
//               resizeMode="contain"
//             />
//           </View>

//           {/* Content */}
//           <View style={[viewStyles.content, dynamicStyles.content]}>
//             <Text style={textStyles.welcomeText}>Welcome 👋</Text>
//             <Text style={textStyles.subtitle}>
//               Let’s get started by entering your mobile number.
//             </Text>

//             <PhoneInput value={phoneNumber} onChangeText={setPhoneNumber} />

//             {status === "pending" ? (
//               <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
//             ) : (
//               <DisableButton
//                 title="Generate OTP"
//                 onPress={handleContinue}
//                 disabled={phoneNumber.length !== 10}
//               />
//             )}
//           </View>

//           {/* Bottom Motivation Text */}
//           <View style={viewStyles.inspirationBox}>
//             <Text style={textStyles.inspirationText}>
//               “Comfortable living starts with the right place.”
//             </Text>
//           </View>

//           {/* Footer */}
//           <View style={viewStyles.footer}>
//             <Text style={textStyles.footerText}>
//               By continuing, you accept our{" "}
//               <Text style={textStyles.footerLink}>Terms of Service</Text>. Learn how we process your
//               data in our <Text style={textStyles.footerLink}>Privacy Policy and </Text>
//               <Text style={textStyles.footerLink}>Cookies Policy</Text>.
//             </Text>
//           </View>
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </TouchableWithoutFeedback>
//   );
// };

// const viewStyles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   backgroundContainer: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 0,
//   },
//   circleLarge: {
//     position: "absolute",
//     backgroundColor: COLORS.circle1,
//   },
//   circleSmall: {
//     position: "absolute",
//     backgroundColor: COLORS.circle2,
//   },
//   container: {
//     flex: 1,
//     justifyContent: "space-between",
//     paddingHorizontal: SIZES.padding,
//   },
//   logoContainer: {
//     alignItems: "center",
//     marginTop: scale(90),
//   },
//   content: {
//     backgroundColor: "rgba(255, 255, 255, 0.25)", // simulate glass
//     borderRadius: SIZES.radius,
//     padding: SIZES.padding,
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.3)", // light border
//   },
//   inspirationBox: {
//     paddingHorizontal: SIZES.padding,
//     marginTop: scale(10),
//   },
//   footer: {
//     paddingVertical: SIZES.base,
//     marginBottom: SIZES.base,
//     paddingHorizontal: SIZES.padding,
//   },
// });

// const textStyles = StyleSheet.create({
//   welcomeText: {
//     fontSize: scale(20),
//     fontWeight: FONT.bold as any,
//     color: COLORS.primary,
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: scale(14),
//     color: COLORS.textMuted,
//     marginBottom: scale(12),
//   },
//   inspirationText: {
//     fontSize: scale(13),
//     color: COLORS.textSecondary,
//     fontStyle: "italic",
//     textAlign: "center",
//   },
//   footerText: {
//     color: COLORS.textMuted,
//     fontSize: scale(12),
//     textAlign: "center",
//     lineHeight: scale(18),
//     fontWeight: FONT.semiBold as any,
//   },
//   footerLink: {
//     color: COLORS.link,
//     fontWeight: FONT.semiBold as any,
//   },
// });

// const imageStyles = StyleSheet.create({
//   logoImage: {
//     width: scale(170),
//     height: scale(110),
//   },
// });

// export default LoginScreen;
// index.tsx (Login Screen)
import React, { useState, useRef } from "react";
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
  Animated,
  Easing,
  AccessibilityInfo,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import PhoneInput from "@/src/components/PhoneInput";
import DisableButton from "@/src/components/DisableButton";
import { useGetLogin } from "@/src/hooks/login";
import { RootStackParamList } from "@/src/types/navigation";
import { ActivityIndicator } from "react-native";

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
  shadow: "#0d0c22",
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
  radius: 16,
  inputHeight: 56,
};

const { width, height } = Dimensions.get("window");
const scale = (size: number) => Math.round((width / 375) * size); // improved scale

function clampFontSize(size: number) {
  // min 12, max 24, scales with font scale for accessibility
  const { fontScale } = Dimensions.get("window");
  return Math.max(12, Math.min(size * fontScale, 24));
}

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Accessibility: respects user "reduce motion" setting
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    if (!reduceMotion) {
      Animated.stagger(150, [
        Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
        Animated.timing(contentAnim, {
          toValue: 1,
          useNativeDriver: true,
          duration: 600,
          easing: Easing.out(Easing.exp),
        }),
      ]).start();
    } else {
      logoAnim.setValue(1);
      contentAnim.setValue(1);
    }
  }, [reduceMotion]);

  const onSuccessLogin = (data: any) => {
    const { userId } = data;
    navigation.navigate("otp", {
      phoneNumber,
      userId,
    });
  };

  const { mutate, status } = useGetLogin(onSuccessLogin);

  const handleContinue = () => {
    if (phoneNumber.length === 10) {
      // Haptic feedback for button press
      Haptics.selectionAsync();
      mutate({ phoneNumber });
    }
  };

  // Responsive paddings and margins for different screens
  const isSmallDevice = width < 350 || height < 650;
  const isLargeDevice = width > 500 || height > 900;
  const contentPadding = isLargeDevice
    ? SIZES.padding * 2
    : isSmallDevice
    ? SIZES.padding / 2
    : SIZES.padding;
  const logoTop = isLargeDevice ? scale(80) : isSmallDevice ? scale(30) : scale(60);
  const contentMarginBottom = isLargeDevice ? scale(60) : isSmallDevice ? scale(12) : scale(30);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={viewStyles.safeArea}>
        {/* Dynamic Background Circles */}
        <View style={viewStyles.backgroundContainer} pointerEvents="none">
          {/* Main big circle */}
          <Animated.View
            style={[
              viewStyles.circleLarge,
              {
                width: isLargeDevice ? width * 1.3 : width * 1.1,
                height: isLargeDevice ? width * 1.3 : width * 1.1,
                borderRadius: isLargeDevice ? width * 0.65 : width * 0.55,
                top: isLargeDevice ? -width * 0.6 : -width * 0.53,
                left: isLargeDevice ? -width * 0.4 : -width * 0.3,
                opacity: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                backgroundColor: COLORS.circle1,
                shadowColor: COLORS.shadow,
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: 18 },
                shadowRadius: 60,
                elevation: 10,
                position: "absolute",
              },
            ]}
          />
          {/* Accent circle */}
          <Animated.View
            style={[
              viewStyles.circleSmall,
              {
                width: width * 0.6,
                height: width * 0.6,
                borderRadius: width * 0.3,
                top: isLargeDevice ? scale(70) : scale(40),
                right: isLargeDevice ? scale(-110) : scale(-70),
                backgroundColor: COLORS.circle2,
                opacity: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] }),
                position: "absolute",
              },
            ]}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={viewStyles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Logo */}
          <Animated.View
            style={[
              viewStyles.logoContainer,
              {
                marginTop: logoTop,
                opacity: logoAnim,
                transform: [
                  {
                    translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={require("@/assets/images/logo.png")}
              style={[
                imageStyles.logoImage,
                isLargeDevice && { width: scale(230), height: scale(150) },
              ]}
              resizeMode="contain"
              accessible
              accessibilityLabel="PGMS Logo"
            />
          </Animated.View>

          {/* Main Content */}
          <Animated.View
            style={[
              viewStyles.content,
              {
                marginBottom: contentMarginBottom,
                padding: contentPadding,
                opacity: contentAnim,
                transform: [
                  {
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[textStyles.welcomeText, { fontSize: clampFontSize(22) }]}>
              Welcome 👋
            </Text>
            <Text style={[textStyles.subtitle, { fontSize: clampFontSize(15) }]}>
              Let’s get started by entering your mobile number.
            </Text>

            <PhoneInput value={phoneNumber} onChangeText={setPhoneNumber} />

            {status === "pending" ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
            ) : (
              <DisableButton
                title="Generate OTP"
                onPress={handleContinue}
                disabled={phoneNumber.length !== 10}
              />
            )}
          </Animated.View>

          {/* Inspiration / Tagline */}
          <View style={viewStyles.inspirationBox}>
            <Text style={textStyles.inspirationText}>
              “Comfortable living starts with the right place.”
            </Text>
          </View>

          {/* Footer (No overlap with navigation!) */}
          <View
            style={[
              viewStyles.footer,
              {
                paddingBottom:
                  Platform.OS === "android" ? Math.max(24, SIZES.base * 2) : SIZES.base * 1.2,
                minHeight: 50,
              },
            ]}
          >
            <Text style={textStyles.footerText}>
              By continuing, you accept our{" "}
              <Text style={textStyles.footerLink}>Terms of Service</Text>. Learn how we process your
              data in our <Text style={textStyles.footerLink}>Privacy Policy and </Text>
              <Text style={textStyles.footerLink}>Cookies Policy</Text>.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

// Styles
const viewStyles = StyleSheet.create({
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
  circleLarge: {},
  circleSmall: {},
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding / 2,
  },
  logoContainer: {
    alignItems: "center",
  },
  content: {
    backgroundColor: "rgba(255, 255, 255, 0.93)", // Glassy
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: "rgba(220,220,220,0.18)",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.11,
    shadowRadius: 20,
    elevation: 4,
  },
  inspirationBox: {
    paddingHorizontal: SIZES.padding,
    marginTop: 6,
    alignItems: "center",
  },
  footer: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

const textStyles = StyleSheet.create({
  welcomeText: {
    fontWeight: FONT.bold as any,
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  subtitle: {
    color: COLORS.textMuted,
    marginBottom: scale(15),
  },
  inspirationText: {
    color: COLORS.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    fontSize: clampFontSize(13),
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: clampFontSize(12),
    textAlign: "center",
    lineHeight: scale(17),
    fontWeight: FONT.semiBold as any,
  },
  footerLink: {
    color: COLORS.link,
    fontWeight: FONT.semiBold as any,
  },
});

const imageStyles = StyleSheet.create({
  logoImage: {
    width: scale(170),
    height: scale(110),
  },
});

export default LoginScreen;
