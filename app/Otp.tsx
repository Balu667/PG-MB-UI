// // // import React, { useState, useRef } from "react";
// // // import {
// // //   View,
// // //   Text,
// // //   SafeAreaView,
// // //   StyleSheet,
// // //   TextInput,
// // //   TouchableOpacity,
// // //   Keyboard,
// // //   Platform,
// // //   KeyboardAvoidingView,
// // //   TouchableWithoutFeedback,
// // //   Dimensions,
// // //   Image,
// // //   Pressable,
// // // } from "react-native";

// // // import { useNavigation, useRoute } from "@react-navigation/native";
// // // import { lightTheme } from "@/theme";
// // // import DisableButton from "../components/DisableButton";
// // // import { Ionicons } from "@expo/vector-icons";

// // // const OTP_LENGTH = 4;
// // // const { width, height } = Dimensions.get("window");
// // // const scale = (size: number) => (width / 375) * size;
// // // const OtpScreen = () => {
// // //   const route = useRoute();
// // //   const navigation = useNavigation();
// // //   const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
// // //   const inputs = useRef([]);
// // //   const { phoneNumber } = route.params;

// // //   const handleChangeText = (text, index) => {
// // //     const newOtp = [...otp];
// // //     newOtp[index] = text;
// // //     setOtp(newOtp);

// // //     // Auto focus next input
// // //     if (text && index < OTP_LENGTH - 1) {
// // //       inputs.current[index + 1].focus();
// // //     }

// // //     // Submit if last digit entered
// // //     if (index === OTP_LENGTH - 1 && text) {
// // //       Keyboard.dismiss();
// // //     }
// // //   };

// // //   const handleKeyPress = (e, index) => {
// // //     if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
// // //       inputs.current[index - 1].focus();
// // //     }
// // //   };

// // //   const handleSubmit = () => {
// // //     const fullOtp = otp.join("");
// // //     if (fullOtp.length === OTP_LENGTH) {
// // //       // Handle OTP verification
// // //       navigation.navigate("Home");
// // //     }
// // //   };

// // //   const formattedPhone = `+91 ${phoneNumber.substring(0, 5)} ${phoneNumber.substring(5)}`;
// // //   const dynamicStyles = StyleSheet.create({
// // //     circleLarge: {
// // //       width: scale(600),
// // //       height: scale(600),
// // //       borderRadius: scale(300),
// // //       top: scale(-280),
// // //       left: scale(-115),
// // //     },
// // //     circleSmall: {
// // //       width: scale(300),
// // //       height: scale(300),
// // //       borderRadius: scale(150),
// // //       top: scale(-100),
// // //       right: scale(-100),
// // //     },
// // //     logoContainer: {
// // //       paddingTop: height > 800 ? scale(60) : scale(40),
// // //     },
// // //     content: {
// // //       marginBottom: height > 800 ? scale(40) : scale(20),
// // //     },
// // //   });
// // //   return (
// // //     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
// // //       <SafeAreaView style={styles.safeArea}>
// // //         <View style={styles.backgroundContainer}>
// // //           <View style={[styles.circleLarge, dynamicStyles.circleLarge]} />
// // //           <View style={[styles.circleSmall, dynamicStyles.circleSmall]} />
// // //         </View>
// // //         <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
// // //           <Ionicons name="arrow-back" size={24} color="black" />
// // //         </Pressable>
// // //         <KeyboardAvoidingView
// // //           behavior={Platform.OS === "ios" ? "padding" : "height"}
// // //           style={styles.container}
// // //         >
// // //           <View style={[styles.logoContainer, dynamicStyles.logoContainer]}>
// // //             <Image
// // //               source={require("../assets/images/otp-image.png")}
// // //               style={styles.logoImage}
// // //               resizeMode="contain"
// // //             />
// // //           </View>
// // //           <View style={styles.content}>
// // //             <Text style={styles.title}>OTP Verification</Text>
// // //             <Text style={styles.subtitle}>We've sent a verification code to</Text>
// // //             <Text style={styles.phoneText}>{formattedPhone}</Text>

// // //             <View style={styles.otpContainer}>
// // //               {Array(OTP_LENGTH)
// // //                 .fill()
// // //                 .map((_, index) => (
// // //                   <TextInput
// // //                     key={index}
// // //                     ref={(ref) => (inputs.current[index] = ref)}
// // //                     style={styles.otpInput}
// // //                     keyboardType="number-pad"
// // //                     maxLength={1}
// // //                     value={otp[index]}
// // //                     onChangeText={(text) => handleChangeText(text, index)}
// // //                     onKeyPress={(e) => handleKeyPress(e, index)}
// // //                     selectTextOnFocus
// // //                   />
// // //                 ))}
// // //             </View>

// // //             <DisableButton
// // //               title="Verify OTP"
// // //               onPress={handleSubmit}
// // //               disabled={otp.join("").length !== OTP_LENGTH}
// // //             />

// // //             <TouchableOpacity style={styles.resendContainer}>
// // //               <Text style={styles.resendText}>Didn't receive code? </Text>
// // //               <Text style={styles.resendLink}>Resend</Text>
// // //             </TouchableOpacity>
// // //           </View>
// // //         </KeyboardAvoidingView>
// // //       </SafeAreaView>
// // //     </TouchableWithoutFeedback>
// // //   );
// // // };

// // // const styles = StyleSheet.create({
// // //   safeArea: {
// // //     flex: 1,
// // //     backgroundColor: "#FFFFFF",
// // //   },
// // //   backButton: {
// // //     position: "absolute",
// // //     top: 60,
// // //     left: 10,
// // //     zIndex: 10,
// // //     padding: 10,
// // //   },
// // //   backgroundContainer: {
// // //     position: "absolute",
// // //     top: 0,
// // //     left: 0,
// // //     right: 0,
// // //     bottom: 0,
// // //     zIndex: 0,
// // //   },
// // //   logoContainer: {
// // //     alignItems: "center",
// // //     marginTop: scale(10),
// // //   },
// // //   logoImage: {
// // //     width: scale(280),
// // //     height: scale(250),
// // //   },
// // //   circleLarge: {
// // //     position: "absolute",
// // //     backgroundColor: "#c0ebc9",
// // //   },
// // //   circleSmall: {
// // //     position: "absolute",
// // //     backgroundColor: "#a3d9c9",
// // //   },
// // //   gradient: {
// // //     flex: 1,
// // //   },
// // //   container: {
// // //     flex: 1,
// // //     justifyContent: "center",
// // //     paddingHorizontal: 24,
// // //   },
// // //   content: {
// // //     backgroundColor: "rgba(255,255,255,0.05)",
// // //     borderRadius: 20,
// // //     padding: 24,
// // //     paddingVertical: 32,
// // //     alignItems: "center",
// // //   },
// // //   title: {
// // //     fontSize: 24,
// // //     fontWeight: "700",
// // //     // color: "white",
// // //     marginBottom: 8,
// // //   },
// // //   subtitle: {
// // //     fontSize: 16,
// // //     // color: "rgba(255,255,255,0.7)",
// // //     textAlign: "center",
// // //     marginTop: 16,
// // //   },
// // //   phoneText: {
// // //     fontSize: 18,
// // //     fontWeight: "600",
// // //     // color: "white",
// // //     marginBottom: 32,
// // //   },
// // //   otpContainer: {
// // //     flexDirection: "row",
// // //     justifyContent: "space-between",
// // //     width: "100%",
// // //     marginBottom: 32,
// // //   },
// // //   otpInput: {
// // //     width: 60,
// // //     height: 60,
// // //     borderColor: lightTheme.colors.primary,
// // //     borderRadius: 50,
// // //     textAlign: "center",
// // //     fontSize: 24,
// // //     fontWeight: "600",
// // //     borderWidth: 1,
// // //   },
// // //   resendContainer: {
// // //     flexDirection: "row",
// // //     marginTop: 24,
// // //   },
// // //   resendText: {
// // //     // color: "rgba(255,255,255,0.7)",
// // //   },
// // //   resendLink: {
// // //     color: "#4A86F7",
// // //     fontWeight: "500",
// // //   },
// // // });

// // // export default OtpScreen;
// // // OTP Screen with enhanced UX and error handling
// // import React, { useState, useRef } from "react";
// // import {
// //   View,
// //   Text,
// //   SafeAreaView,
// //   StyleSheet,
// //   TextInput,
// //   TouchableOpacity,
// //   Keyboard,
// //   Platform,
// //   KeyboardAvoidingView,
// //   TouchableWithoutFeedback,
// //   Dimensions,
// //   Image,
// //   Pressable,
// //   Alert,
// // } from "react-native";

// // import { useNavigation, useRoute } from "@react-navigation/native";
// // import { lightTheme } from "@/theme";
// // import DisableButton from "../components/DisableButton";
// // import { Ionicons } from "@expo/vector-icons";

// // const OTP_LENGTH = 4;
// // const { width, height } = Dimensions.get("window");
// // const scale = (size: number) => (width / 375) * size;

// // const OtpScreen = () => {
// //   const route = useRoute();
// //   const navigation = useNavigation();
// //   const { phoneNumber } = route.params;

// //   const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
// //   const [error, setError] = useState("");
// //   const inputs = useRef([]);

// //   const handleChangeText = (text, index) => {
// //     setError(""); // Clear errors on typing

// //     // Allow pasting whole OTP
// //     if (text.length > 1) {
// //       const newOtp = text.split("").slice(0, OTP_LENGTH);
// //       setOtp(newOtp);
// //       newOtp.forEach((val, idx) => {
// //         if (inputs.current[idx]) inputs.current[idx].setNativeProps({ text: val });
// //       });
// //       Keyboard.dismiss();
// //       return;
// //     }

// //     const newOtp = [...otp];
// //     newOtp[index] = text;
// //     setOtp(newOtp);

// //     if (text && index < OTP_LENGTH - 1) {
// //       inputs.current[index + 1]?.focus();
// //     }

// //     if (index === OTP_LENGTH - 1 && text) {
// //       Keyboard.dismiss();
// //     }
// //   };

// //   const handleKeyPress = (e, index) => {
// //     if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
// //       inputs.current[index - 1]?.focus();
// //     }
// //   };

// //   const handleBlur = () => {
// //     if (otp.join("").length !== OTP_LENGTH) {
// //       setError("Please enter all 4 digits of the OTP");
// //     }
// //   };

// //   const handleSubmit = () => {
// //     const fullOtp = otp.join("");
// //     if (fullOtp.length !== OTP_LENGTH) {
// //       setError("Please enter the complete 4-digit OTP");
// //       return;
// //     }

// //     // Simulate wrong OTP for now
// //     const isFakeCorrectOtp = "1234";
// //     if (fullOtp !== isFakeCorrectOtp) {
// //       setError("Invalid OTP. Please try again.");
// //       return;
// //     }

// //     navigation.navigate("Home");
// //   };

// //   const formattedPhone = `+91 ${phoneNumber.substring(0, 5)} ${phoneNumber.substring(5)}`;

// //   const dynamicStyles = StyleSheet.create({
// //     circleLarge: {
// //       width: scale(600),
// //       height: scale(600),
// //       borderRadius: scale(300),
// //       top: scale(-280),
// //       left: scale(-115),
// //     },
// //     circleSmall: {
// //       width: scale(300),
// //       height: scale(300),
// //       borderRadius: scale(150),
// //       top: scale(-100),
// //       right: scale(-100),
// //     },
// //     logoContainer: {
// //       paddingTop: height > 800 ? scale(60) : scale(40),
// //     },
// //     content: {
// //       marginBottom: height > 800 ? scale(40) : scale(20),
// //     },
// //   });

// //   return (
// //     <TouchableWithoutFeedback
// //       onPress={() => {
// //         Keyboard.dismiss();
// //         handleBlur();
// //       }}
// //     >
// //       <SafeAreaView style={styles.safeArea}>
// //         <View style={styles.backgroundContainer}>
// //           <View style={[styles.circleLarge, dynamicStyles.circleLarge]} />
// //           <View style={[styles.circleSmall, dynamicStyles.circleSmall]} />
// //         </View>

// //         <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
// //           <Ionicons name="arrow-back" size={24} color="black" />
// //         </Pressable>

// //         <KeyboardAvoidingView
// //           behavior={Platform.OS === "ios" ? "padding" : "height"}
// //           style={styles.container}
// //         >
// //           <View style={[styles.logoContainer, dynamicStyles.logoContainer]}>
// //             <Image
// //               source={require("../assets/images/otp-image.png")}
// //               style={styles.logoImage}
// //               resizeMode="contain"
// //             />
// //           </View>

// //           <View style={[styles.content, dynamicStyles.content]}>
// //             <Text style={styles.title}>OTP Verification</Text>
// //             <Text style={styles.subtitle}>We've sent a verification code to</Text>
// //             <Text style={styles.phoneText}>{formattedPhone}</Text>

// //             <View style={styles.otpContainer}>
// //               {Array(OTP_LENGTH)
// //                 .fill()
// //                 .map((_, index) => (
// //                   <TextInput
// //                     key={index}
// //                     ref={(ref) => (inputs.current[index] = ref)}
// //                     style={[styles.otpInput, error ? styles.otpInputError : null]}
// //                     keyboardType="number-pad"
// //                     maxLength={1}
// //                     value={otp[index]}
// //                     onChangeText={(text) => handleChangeText(text, index)}
// //                     onKeyPress={(e) => handleKeyPress(e, index)}
// //                     onBlur={handleBlur}
// //                     selectTextOnFocus
// //                   />
// //                 ))}
// //             </View>

// //             {!!error && <Text style={styles.errorText}>{error}</Text>}

// //             <DisableButton
// //               title="Verify OTP"
// //               onPress={handleSubmit}
// //               disabled={otp.join("").length !== OTP_LENGTH}
// //             />

// //             <TouchableOpacity style={styles.resendContainer}>
// //               <Text style={styles.resendText}>Didn't receive code? </Text>
// //               <Text style={styles.resendLink}>Resend</Text>
// //             </TouchableOpacity>
// //           </View>
// //         </KeyboardAvoidingView>
// //       </SafeAreaView>
// //     </TouchableWithoutFeedback>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   safeArea: {
// //     flex: 1,
// //     backgroundColor: "#FFFFFF",
// //   },
// //   backButton: {
// //     position: "absolute",
// //     top: 60,
// //     left: 10,
// //     zIndex: 10,
// //     padding: 10,
// //   },
// //   backgroundContainer: {
// //     position: "absolute",
// //     top: 0,
// //     left: 0,
// //     right: 0,
// //     bottom: 0,
// //     zIndex: 0,
// //   },
// //   logoContainer: {
// //     alignItems: "center",
// //     marginTop: scale(10),
// //   },
// //   logoImage: {
// //     width: scale(280),
// //     height: scale(250),
// //   },
// //   circleLarge: {
// //     position: "absolute",
// //     backgroundColor: "#c0ebc9",
// //   },
// //   circleSmall: {
// //     position: "absolute",
// //     backgroundColor: "#a3d9c9",
// //   },
// //   container: {
// //     flex: 1,
// //     justifyContent: "center",
// //     paddingHorizontal: 24,
// //   },
// //   content: {
// //     backgroundColor: "rgba(255,255,255,0.05)",
// //     borderRadius: 20,
// //     padding: 24,
// //     paddingVertical: 32,
// //     alignItems: "center",
// //   },
// //   title: {
// //     fontSize: 24,
// //     fontWeight: "700",
// //     marginBottom: 8,
// //   },
// //   subtitle: {
// //     fontSize: 16,
// //     textAlign: "center",
// //     marginTop: 16,
// //   },
// //   phoneText: {
// //     fontSize: 18,
// //     fontWeight: "600",
// //     marginBottom: 32,
// //   },
// //   otpContainer: {
// //     flexDirection: "row",
// //     justifyContent: "space-between",
// //     width: "100%",
// //     marginBottom: 16,
// //   },
// //   otpInput: {
// //     width: 60,
// //     height: 60,
// //     borderColor: lightTheme.colors.primary,
// //     borderRadius: 50,
// //     textAlign: "center",
// //     fontSize: 24,
// //     fontWeight: "600",
// //     borderWidth: 1,
// //     backgroundColor: "#F9F9F9",
// //   },
// //   otpInputError: {
// //     borderColor: "red",
// //   },
// //   errorText: {
// //     color: "red",
// //     fontSize: 14,
// //     marginBottom: 12,
// //   },
// //   resendContainer: {
// //     flexDirection: "row",
// //     marginTop: 16,
// //   },
// //   resendText: {},
// //   resendLink: {
// //     color: "#4A86F7",
// //     fontWeight: "500",
// //   },
// // });

// // export default OtpScreen;
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
// } from "react-native";

// import { useNavigation, useRoute } from "@react-navigation/native";
// import { lightTheme } from "@/theme";
// import DisableButton from "../components/DisableButton";
// import { Ionicons } from "@expo/vector-icons";

// const OTP_LENGTH = 4;
// const { width, height } = Dimensions.get("window");
// const scale = (size: number) => (width / 375) * size;

// const OtpScreen = () => {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const { phoneNumber } = route.params;

//   const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
//   const [error, setError] = useState("");
//   const inputs = useRef([]);

//   const handleChangeText = (text, index) => {
//     setError("");

//     // Paste support
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

//   const handleKeyPress = (e, index) => {
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

//     // Simulate correct OTP for now
//     const isFakeCorrectOtp = "1234";
//     if (fullOtp !== isFakeCorrectOtp) {
//       setError("Invalid OTP. Please try again.");
//       return;
//     }

//     navigation.navigate("Home");
//   };

//   const formattedPhone = `+91 ${phoneNumber.substring(0, 5)} ${phoneNumber.substring(5)}`;

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
//               source={require("../assets/images/otp-image.png")}
//               style={styles.logoImage}
//               resizeMode="contain"
//             />
//           </View>

//           <View style={[styles.content, dynamicStyles.content]}>
//             <Text style={styles.title}>OTP Verification</Text>
//             <Text style={styles.subtitle}>We've sent a verification code to</Text>
//             <Text style={styles.phoneText}>{formattedPhone}</Text>

//             <View style={styles.otpContainer}>
//               {Array(OTP_LENGTH)
//                 .fill()
//                 .map((_, index) => (
//                   <TextInput
//                     key={index}
//                     ref={(ref) => (inputs.current[index] = ref)}
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

//             <TouchableOpacity style={styles.resendContainer}>
//               <Text style={styles.resendText}>Didn't receive code? </Text>
//               <Text style={styles.resendLink}>Resend</Text>
//             </TouchableOpacity>
//           </View>
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </TouchableWithoutFeedback>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },
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
//   phoneText: {
//     fontSize: scale(17),
//     fontWeight: "600",
//     marginBottom: scale(24),
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
// });

// export default OtpScreen;


import React, { useState, useRef } from "react";
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
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import { lightTheme } from "@/theme";
import DisableButton from "../components/DisableButton";
import { Ionicons } from "@expo/vector-icons";

const OTP_LENGTH = 4;
const { width, height } = Dimensions.get("window");
const scale = (size: number) => (width / 375) * size;

const OtpScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { phoneNumber } = route.params;

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const inputs = useRef([]);

  const handleChangeText = (text, index) => {
    setError("");

    if (text.length > 1) {
      const newOtp = text.split("").slice(0, OTP_LENGTH);
      setOtp(newOtp);
      newOtp.forEach((val, idx) => {
        if (inputs.current[idx]) inputs.current[idx].setNativeProps({ text: val });
      });
      Keyboard.dismiss();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (index === OTP_LENGTH - 1 && text) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e, index) => {
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

    const isFakeCorrectOtp = "1234";
    if (fullOtp !== isFakeCorrectOtp) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    navigation.navigate("Home");
  };

  const formattedPhone = `+91 ${phoneNumber.substring(0, 5)} ${phoneNumber.substring(5)}`;

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
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        handleBlur();
      }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundContainer}>
          <View style={[styles.circleLarge, dynamicStyles.circleLarge]} />
          <View style={[styles.circleSmall, dynamicStyles.circleSmall]} />
        </View>

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={[styles.logoContainer, dynamicStyles.logoContainer]}>
            <Image
              source={require("../assets/images/otp-image.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.content, dynamicStyles.content]}>
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>We've sent a verification code to</Text>

            <View style={styles.phoneRow}>
              <Text style={styles.phoneText}>{formattedPhone}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                <Ionicons
                  name="create-outline"
                  size={scale(20)}
                  color="#4A86F7"
                  style={{ marginLeft: scale(10) }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.otpContainer}>
              {Array(OTP_LENGTH)
                .fill()
                .map((_, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputs.current[index] = ref)}
                    style={[styles.otpInput, error ? styles.otpInputError : null]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={otp[index]}
                    onChangeText={(text) => handleChangeText(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onBlur={handleBlur}
                    selectTextOnFocus
                  />
                ))}
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <DisableButton
              title="Verify OTP"
              onPress={handleSubmit}
              disabled={otp.join("").length !== OTP_LENGTH}
            />

            <TouchableOpacity style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive code? </Text>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>
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
                        navigation.navigate("Login");
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
    top: 60,
    left: 10,
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
    marginTop: scale(10),
  },
  logoImage: {
    width: width * 0.7,
    height: height * 0.3,
  },
  circleLarge: {
    position: "absolute",
    backgroundColor: "#c0ebc9",
  },
  circleSmall: {
    position: "absolute",
    backgroundColor: "#a3d9c9",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scale(20),
    padding: scale(20),
    paddingVertical: scale(28),
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: scale(24),
    fontWeight: "700",
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scale(15),
    textAlign: "center",
    marginTop: scale(12),
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(10),
    marginBottom: scale(24),
  },
  phoneText: {
    fontSize: scale(17),
    fontWeight: "600",
    color: "#000",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: scale(24),
  },
  otpInput: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: "#fff",
    borderColor: lightTheme.colors.primary,
    borderWidth: 1.5,
    textAlign: "center",
    fontSize: scale(22),
    fontWeight: "600",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    color: "#000",
  },
  otpInputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: scale(13),
    marginBottom: scale(8),
    textAlign: "center",
  },
  resendContainer: {
    flexDirection: "row",
    marginTop: scale(16),
  },
  resendText: {
    fontSize: scale(14),
  },
  resendLink: {
    fontSize: scale(14),
    color: "#4A86F7",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  modalContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: scale(16),
    padding: scale(20),
    width: "90%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: scale(16),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: scale(20),
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButtonYes: {
    backgroundColor: "#4A86F7",
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
  },
  modalButtonCancel: {
    backgroundColor: "#aaa",
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: scale(14),
  },
});

export default OtpScreen;
