
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

const router = useRouter();
const OTP_LENGTH = 4;
const { width, height } = Dimensions.get("window");
const scale = (size: number) => (width / 375) * size;
const OtpScreen = () => {
type OtpRouteProp = RouteProp<RootStackParamList, "otp">;
const navigation =useNavigation()
const route = useRoute<OtpRouteProp>();
const { phoneNumber, userId } = route.params;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  const dispatch=useDispatch();
  const onSuccess=async (data:any)=>{
    try{
    // Store token
    await AsyncStorage.setItem("userToken", data);
    dispatch(setProfileDetails({userId,signedIn:true,phoneNumber}));
   router.replace("/protected/(tabs)");
    }catch(error){
      console.log(error)
    }

  }
    const {mutate}=useVerifyOtp(onSuccess);
    const resendSuccess=(data:any)=>{
      Toast.show({
    type: 'success',
    text1: 'resent successfully',
    text2: data.message,
  });
    }
type ResendOtpPayload = {
  id: string;
  phoneNumber: string;
};
const resendPayload: ResendOtpPayload = {
  id: userId,
  phoneNumber: phoneNumber,
};
    const {mutate:resendOtp}=useResendOtp(resendSuccess);
  const handleChangeText = (text: string, index: number) => {
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
    mutate({_id:userId,otp:fullOtp})
  };

  const formattedPhone = `+91 ${phoneNumber?.substring(0, 5)} ${phoneNumber?.substring(5)}`;

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
              source={require("@/assets/images/otp-image.png")}
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
                .fill(undefined)
                .map((_, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputs.current[index] = ref; }}
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
<View style={styles.resendContainer}>
  <Text style={styles.resendText}>Didn't receive code? </Text>
  <TouchableOpacity onPress={()=>{resendOtp(resendPayload)}}>
    <Text style={styles.resendLink}>Resend</Text>
  </TouchableOpacity>
</View>
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
