// import React, { useState, useRef } from "react";
// import {
//   View,
//   Text,
//   SafeAreaView,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   Keyboard,
//   Platform,
//   KeyboardAvoidingView,
//   TouchableWithoutFeedback,
//   Dimensions,
//   Image,
//   Pressable,
//   Modal,
// } from "react-native";

// import { useRoute, RouteProp } from "@react-navigation/native";
// import { lightTheme } from "@/src/theme";
// import DisableButton from "@/src/components/DisableButton";
// import { Ionicons } from "@expo/vector-icons";
// import { RootStackParamList } from "@/src/types/navigation";
// import { useResendOtp, useVerifyOtp } from "@/src/hooks/login";
// import { setProfileDetails } from "@/src/redux/slices/profileSlice";
// import { useDispatch } from "react-redux";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useNavigation, useRouter } from "expo-router";
// import Toast from "react-native-toast-message";

// const router = useRouter();
// const OTP_LENGTH = 4;
// const { width, height } = Dimensions.get("window");
// const scale = (size: number) => (width / 375) * size;
// const OtpScreen = () => {
// type OtpRouteProp = RouteProp<RootStackParamList, "otp">;
// const navigation =useNavigation()
// const route = useRoute<OtpRouteProp>();
// const { phoneNumber, userId } = route.params;
//   const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
//   const [error, setError] = useState("");
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const inputs = useRef<Array<TextInput | null>>([]);
//   const dispatch=useDispatch();
//   const onSuccess=async (data:any)=>{
//     try{
//     // Store token
//     await AsyncStorage.setItem("userToken", data);
//     dispatch(setProfileDetails({userId,signedIn:true,phoneNumber}));
//    router.replace("/protected/(tabs)");
//     }catch(error){
//       console.log(error)
//     }

//   }
//     const {mutate}=useVerifyOtp(onSuccess);
//     const resendSuccess=(data:any)=>{
//       Toast.show({
//     type: 'success',
//     text1: 'resent successfully',
//     text2: data.message,
//   });
//     }
// type ResendOtpPayload = {
//   id: string;
//   phoneNumber: string;
// };
// const resendPayload: ResendOtpPayload = {
//   id: userId,
//   phoneNumber: phoneNumber,
// };
//     const {mutate:resendOtp}=useResendOtp(resendSuccess);
//   const handleChangeText = (text: string, index: number) => {
//     setError("");

//     if (text.length > 1) {
//       const newOtp = text.split("").slice(0, OTP_LENGTH);
//       setOtp(newOtp);
//       newOtp.forEach((val, idx) => {
//         if (inputs.current[idx]) inputs.current[idx].setNativeProps({ text: val });
//       });
//       Keyboard.dismiss();
//       return;
//     }

//     const newOtp = [...otp];
//     newOtp[index] = text;
//     setOtp(newOtp);

//     if (text && index < OTP_LENGTH - 1) {
//       inputs.current[index + 1]?.focus();
//     }

//     if (index === OTP_LENGTH - 1 && text) {
//       Keyboard.dismiss();
//     }
//   };

//   const handleKeyPress = (e: any, index: number) => {
//     if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
//       inputs.current[index - 1]?.focus();
//     }
//   };

//   const handleBlur = () => {
//     if (otp.join("").length !== OTP_LENGTH) {
//       setError("Please enter all 4 digits of the OTP");
//     }
//   };

//   const handleSubmit = () => {
//     const fullOtp = otp.join("");
//     if (fullOtp.length !== OTP_LENGTH) {
//       setError("Please enter the complete 4-digit OTP");
//       return;
//     }
//     mutate({_id:userId,otp:fullOtp})
//   };

//   const formattedPhone = `+91 ${phoneNumber?.substring(0, 5)} ${phoneNumber?.substring(5)}`;

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
//     <TouchableWithoutFeedback
//       onPress={() => {
//         Keyboard.dismiss();
//         handleBlur();

//       }}
//     >
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.backgroundContainer}>
//           <View style={[styles.circleLarge, dynamicStyles.circleLarge]} />
//           <View style={[styles.circleSmall, dynamicStyles.circleSmall]} />
//         </View>

//         <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="black" />
//         </Pressable>

//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//           style={styles.container}
//         >
//           <View style={[styles.logoContainer, dynamicStyles.logoContainer]}>
//             <Image
//               source={require("@/assets/images/otp-image.png")}
//               style={styles.logoImage}
//               resizeMode="contain"
//             />
//           </View>

//           <View style={[styles.content, dynamicStyles.content]}>
//             <Text style={styles.title}>OTP Verification</Text>
//             <Text style={styles.subtitle}>We've sent a verification code to</Text>

//             <View style={styles.phoneRow}>
//               <Text style={styles.phoneText}>{formattedPhone}</Text>
//               <TouchableOpacity onPress={() => setIsModalVisible(true)}>
//                 <Ionicons
//                   name="create-outline"
//                   size={scale(20)}
//                   color="#4A86F7"
//                   style={{ marginLeft: scale(10) }}
//                 />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.otpContainer}>
//               {Array(OTP_LENGTH)
//                 .fill(undefined)
//                 .map((_, index) => (
//                   <TextInput
//                     key={index}
//                     ref={(ref) => { inputs.current[index] = ref; }}
//                     style={[styles.otpInput, error ? styles.otpInputError : null]}
//                     keyboardType="number-pad"
//                     maxLength={1}
//                     value={otp[index]}
//                     onChangeText={(text) => handleChangeText(text, index)}
//                     onKeyPress={(e) => handleKeyPress(e, index)}
//                     onBlur={handleBlur}
//                     selectTextOnFocus
//                   />
//                 ))}
//             </View>

//             {!!error && <Text style={styles.errorText}>{error}</Text>}

//             <DisableButton
//               title="Verify OTP"
//               onPress={handleSubmit}
//               disabled={otp.join("").length !== OTP_LENGTH}
//             />
// <View style={styles.resendContainer}>
//   <Text style={styles.resendText}>Didn't receive code? </Text>
//   <TouchableOpacity onPress={()=>{resendOtp(resendPayload)}}>
//     <Text style={styles.resendLink}>Resend</Text>
//   </TouchableOpacity>
// </View>
//           </View>
//         </KeyboardAvoidingView>

//         {/* Modal */}
//         <Modal
//           visible={isModalVisible}
//           transparent
//           animationType="fade"
//           onRequestClose={() => setIsModalVisible(false)}
//         >
//           <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
//             <View style={styles.modalOverlay}>
//               <TouchableWithoutFeedback>
//                 <View style={styles.modalContainer}>
//                   <Text style={styles.modalTitle}>Do you want to edit the number?</Text>
//                   <View style={styles.modalButtons}>
//                     <TouchableOpacity
//                       onPress={() => {
//                         setIsModalVisible(false);
//                         navigation.navigate("Login" as never);
//                       }}
//                       style={styles.modalButtonYes}
//                     >
//                       <Text style={styles.modalButtonText}>Yes</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       onPress={() => setIsModalVisible(false)}
//                       style={styles.modalButtonCancel}
//                     >
//                       <Text style={styles.modalButtonText}>Cancel</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               </TouchableWithoutFeedback>
//             </View>
//           </TouchableWithoutFeedback>
//         </Modal>
//       </SafeAreaView>
//     </TouchableWithoutFeedback>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
//   backButton: {
//     position: "absolute",
//     top: 60,
//     left: 10,
//     zIndex: 10,
//     padding: 10,
//   },
//   backgroundContainer: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 0,
//   },
//   logoContainer: {
//     alignItems: "center",
//     marginTop: scale(10),
//   },
//   logoImage: {
//     width: width * 0.7,
//     height: height * 0.3,
//   },
//   circleLarge: {
//     position: "absolute",
//     backgroundColor: "#c0ebc9",
//   },
//   circleSmall: {
//     position: "absolute",
//     backgroundColor: "#a3d9c9",
//   },
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     paddingHorizontal: 24,
//   },
//   content: {
//     backgroundColor: "rgba(255,255,255,0.05)",
//     borderRadius: scale(20),
//     padding: scale(20),
//     paddingVertical: scale(28),
//     alignItems: "center",
//     width: "100%",
//   },
//   title: {
//     fontSize: scale(24),
//     fontWeight: "700",
//     marginBottom: scale(8),
//   },
//   subtitle: {
//     fontSize: scale(15),
//     textAlign: "center",
//     marginTop: scale(12),
//   },
//   phoneRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: scale(10),
//     marginBottom: scale(24),
//   },
//   phoneText: {
//     fontSize: scale(17),
//     fontWeight: "600",
//     color: "#000",
//   },
//   otpContainer: {
//     flexDirection: "row",
//     justifyContent: "space-evenly",
//     width: "100%",
//     marginBottom: scale(24),
//   },
//   otpInput: {
//     width: scale(60),
//     height: scale(60),
//     borderRadius: scale(30),
//     backgroundColor: "#fff",
//     borderColor: lightTheme.colors.primary,
//     borderWidth: 1.5,
//     textAlign: "center",
//     fontSize: scale(22),
//     fontWeight: "600",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 3,
//     elevation: 4,
//     color: "#000",
//   },
//   otpInputError: {
//     borderColor: "red",
//   },
//   errorText: {
//     color: "red",
//     fontSize: scale(13),
//     marginBottom: scale(8),
//     textAlign: "center",
//   },
//   resendContainer: {
//     flexDirection: "row",
//     marginTop: scale(16),
//   },
//   resendText: {
//     fontSize: scale(14),
//   },
//   resendLink: {
//     fontSize: scale(14),
//     color: "#4A86F7",
//     fontWeight: "500",
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.3)",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: scale(20),
//   },
//   modalContainer: {
//     backgroundColor: "rgba(255,255,255,0.95)",
//     borderRadius: scale(16),
//     padding: scale(20),
//     width: "90%",
//     maxWidth: 320,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.25,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   modalTitle: {
//     fontSize: scale(16),
//     fontWeight: "600",
//     textAlign: "center",
//     marginBottom: scale(20),
//     color: "#333",
//   },
//   modalButtons: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   modalButtonYes: {
//     backgroundColor: "#4A86F7",
//     paddingVertical: scale(10),
//     paddingHorizontal: scale(20),
//     borderRadius: scale(10),
//   },
//   modalButtonCancel: {
//     backgroundColor: "#aaa",
//     paddingVertical: scale(10),
//     paddingHorizontal: scale(20),
//     borderRadius: scale(10),
//   },
//   modalButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: scale(14),
//   },
// });

// export default OtpScreen;

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
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { lightTheme } from "@/src/theme";
import DisableButton from "@/src/components/DisableButton";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/src/types/navigation";
import { useResendOtp, useVerifyOtp } from "@/src/hooks/login";
import { setProfileDetails } from "@/src/redux/slices/profileSlice";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

const OTP_LENGTH = 4;
const { width, height } = Dimensions.get("window");

function scale(size: number) {
  // improved: don't over-scale on tablets
  if (width > 600) return Math.round(size * (width / 600));
  return Math.round((width / 375) * size);
}

function clamp(min: number, val: number, max: number) {
  return Math.max(min, Math.min(val, max));
}

// Get device type for more control (mini, phone, big phone, tablet, ipad)
const isSmall = width < 340;
const isTablet = width > 600;

const OtpScreen = () => {
  type OtpRouteProp = RouteProp<RootStackParamList, "otp">;
  const navigation = useNavigation();
  const route = useRoute<OtpRouteProp>();
  const { phoneNumber, userId } = route.params;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  const dispatch = useDispatch();
  const router = useRouter();

  // Animation refs
  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    if (!reduceMotion) {
      Animated.stagger(120, [
        Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
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

  // --------- OTP Logic (untouched) ----------
  const onSuccess = async (data: any) => {
    try {
      await AsyncStorage.setItem("userToken", data);
      dispatch(setProfileDetails({ userId, signedIn: true, phoneNumber }));
      router.replace("/protected/(tabs)");
    } catch (error) {
      console.log(error);
    }
  };
  const { mutate } = useVerifyOtp(onSuccess);
  const resendSuccess = (data: any) => {
    Toast.show({
      type: "success",
      text1: "Resent successfully",
      text2: data.message,
    });
  };
  type ResendOtpPayload = { id: string; phoneNumber: string };
  const resendPayload: ResendOtpPayload = { id: userId, phoneNumber };
  const { mutate: resendOtp } = useResendOtp(resendSuccess);

  // --------- Handle OTP Change/Paste ---------
  const handleChangeText = (text: string, index: number) => {
    setError("");
    // Support full paste from keyboard (OTP autofill or manual paste)
    if (text.length > 1) {
      let pasted = text.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      setOtp((prev) => {
        // Fill in as many as are pasted
        const newOtp = Array(OTP_LENGTH).fill("");
        for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
        return newOtp;
      });
      // update input fields with pasted
      pasted.forEach((val, idx) => {
        if (inputs.current[idx]) inputs.current[idx].setNativeProps({ text: val });
      });
      Keyboard.dismiss();
      return;
    }
    // normal single digit entry
    const newOtp = [...otp];
    newOtp[index] = text.replace(/\D/g, "");
    setOtp(newOtp);

    // move to next input
    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    // auto-dismiss on last digit
    if (index === OTP_LENGTH - 1 && text) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleBlur = () => {
    if (otp.join("").length !== OTP_LENGTH) {
      setError("Please enter all 4 digits of the OTP");
    }
  };

  const handleSubmit = () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== OTP_LENGTH) {
      setError("Please enter the complete 4-digit OTP");
      return;
    }
    // Haptic feedback for button only
    Haptics.selectionAsync();
    mutate({ _id: userId, otp: fullOtp });
  };

  const formattedPhone = `+91 ${phoneNumber?.substring(0, 5)} ${phoneNumber?.substring(5)}`;

  // --------- Responsive/Adaptive Sizes ---------
  // OTP box sizing
  const otpBoxSize = clamp(40, isTablet ? width / 12 : isSmall ? width / 8 : width / 9, 72);
  const otpFontSize = clamp(19, otpBoxSize * 0.45, 28);
  const contentPadding = isTablet ? scale(36) : isSmall ? scale(16) : scale(24);
  const contentRadius = isTablet ? 30 : 18;
  const logoHeight = isTablet ? height * 0.21 : isSmall ? height * 0.19 : height * 0.24;

  // Circle backgrounds
  const circleLargeStyle = {
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
  };
  const circleSmallStyle = {
    width: isTablet ? width * 0.62 : width * 0.46,
    height: isTablet ? width * 0.62 : width * 0.46,
    borderRadius: isTablet ? width * 0.31 : width * 0.23,
    top: isTablet ? scale(95) : scale(45),
    right: isTablet ? scale(-135) : scale(-70),
    backgroundColor: "#a3d9c9",
    opacity: 0.75,
    position: "absolute",
  };

  // --------- Render ---------
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        handleBlur();
      }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Circles (dynamic) */}
        <View style={styles.backgroundContainer} pointerEvents="none">
          <Animated.View style={circleLargeStyle} />
          <Animated.View style={circleSmallStyle} />
        </View>

        {/* Back Button */}
        <Pressable
          style={[styles.backButton, { top: isTablet ? scale(40) : scale(58), left: scale(8) }]}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={28} color="#222" />
        </Pressable>

        {/* Keyboard handling */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? scale(0) : 0}
        >
          {/* Logo Animation */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                marginTop: isTablet ? scale(30) : isSmall ? scale(5) : scale(16),
                opacity: logoAnim,
                transform: [
                  {
                    translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }),
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
              accessible
              accessibilityLabel="OTP Illustration"
            />
          </Animated.View>

          {/* Main content */}
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
            <Text style={[styles.title, { fontSize: clamp(18, scale(isTablet ? 27 : 24), 32) }]}>
              OTP Verification
            </Text>
            <Text style={[styles.subtitle, { fontSize: clamp(13, scale(isTablet ? 17 : 15), 22) }]}>
              We've sent a verification code to
            </Text>

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

            <View
              style={[styles.otpContainer, { marginBottom: scale(20), gap: isTablet ? 22 : 13 }]}
            >
              {Array(OTP_LENGTH)
                .fill(undefined)
                .map((_, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      {
                        width: otpBoxSize,
                        height: otpBoxSize,
                        borderRadius: otpBoxSize / 2,
                        fontSize: otpFontSize,
                        backgroundColor: "#fff",
                        borderColor: error ? "red" : lightTheme.colors.primary,
                      },
                    ]}
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    maxLength={1}
                    value={otp[index]}
                    onChangeText={(text) => handleChangeText(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onBlur={handleBlur}
                    selectTextOnFocus
                    importantForAutofill="yes"
                    textContentType={
                      index === 0 ? (Platform.OS === "ios" ? "oneTimeCode" : "none") : "none"
                    }
                    accessible
                    accessibilityLabel={`OTP digit ${index + 1}`}
                    allowFontScaling
                  />
                ))}
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <DisableButton
              title="Verify OTP"
              onPress={handleSubmit}
              disabled={otp.join("").length !== OTP_LENGTH}
            />

            {/* Resend row */}
            <View style={styles.resendContainer}>
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
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        {/* Modal */}
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
                  <Text style={styles.modalTitle}>Do you want to edit the number?</Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsModalVisible(false);
                        navigation.navigate("Login" as never);
                      }}
                      style={styles.modalButtonYes}
                    >
                      <Text style={styles.modalButtonText}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsModalVisible(false)}
                      style={styles.modalButtonCancel}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  backButton: {
    position: "absolute",
    zIndex: 10,
    padding: 10,
  },
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
  phoneText: {
    fontWeight: "600",
    color: "#000",
    fontSize: scale(17),
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: scale(20),
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
  resendText: {
    fontSize: scale(14),
    color: "#444",
  },
  resendLink: {
    fontSize: scale(14),
    color: "#4A86F7",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(15),
  },
  modalContainer: {
    backgroundColor: "rgba(255,255,255,0.99)",
    borderRadius: scale(13),
    padding: scale(16),
    width: "90%",
    maxWidth: 330,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.19,
    shadowRadius: 13,
    elevation: 10,
  },
  modalTitle: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: scale(15),
    color: "#333",
    fontSize: scale(16),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButtonYes: {
    backgroundColor: "#4A86F7",
    paddingVertical: scale(9),
    paddingHorizontal: scale(17),
    borderRadius: scale(10),
  },
  modalButtonCancel: {
    backgroundColor: "#aaa",
    paddingVertical: scale(9),
    paddingHorizontal: scale(17),
    borderRadius: scale(10),
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: scale(14),
  },
});

export default OtpScreen;
