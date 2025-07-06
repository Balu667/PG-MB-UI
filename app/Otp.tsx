import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";

const Otp = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<TextInput[]>([]);

  const handleChangeText = (text: string, index: any) => {
    let otpCopy = [...otp];
    otpCopy[index] = text;
    setOtp(otpCopy);
    if (text && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (!text && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.upperCurvedContainer}>
        <View style={styles.rightSideCurvedContainer}></View>

        <View style={styles.bottomCenterContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../assets/images/otplogo.jpg")}
              style={styles.logoImg}
            />
          </View>
        </View>
      </View>
      <View style={styles.otpTextContainer}>
        <Text style={styles.otpText}>OTP Verification</Text>
        <View style={{ marginTop: 10 }}>
          <Text style={styles.descriptionText}>
            We will send you a one time password on
          </Text>
          <Text style={styles.descriptionText}>
            this <Text style={{ fontWeight: "600" }}>Mobile Number</Text>
          </Text>
        </View>
        <View style={styles.numberContainer}>
          <View>
            <Text style={styles.mobileNumberText}>+91 8779404201</Text>
          </View>
          <MaterialIcons
            name="edit"
            size={20}
            color="black"
            onPress={() => router.push("/")}
          />
        </View>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              maxLength={1}
              // keyboardType="numeric"
              style={styles.input}
              autoFocus={index === 0}
              ref={(el) => (inputRefs.current[index] = el!)}
            />
          ))}
        </View>
        <View>
          <Text style={styles.timerText}>00 : 30</Text>
        </View>
        <View style={styles.resendOtpContainer}>
          <Text style={styles.timerText}>Do not send OTP ? </Text>
          <TouchableOpacity>
            <Text style={styles.sendOtpText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
  },
  upperCurvedContainer: {
    position: "relative",
    height: 300,
    backgroundColor: "#256D85",
    opacity: 0.4,
    width: "100%",
    borderBottomLeftRadius: "40%",
    borderBottomRightRadius: "40%",
  },

  rightSideCurvedContainer: {
    height: 160,
    backgroundColor: "#256D85",
    width: "50%",
    opacity: 0.8,
    top: 0,
    left: 250,
    borderBottomLeftRadius: "40%",
    borderBottomRightRadius: "40%",
  },

  logoWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    marginBottom: 10,
  },

  bottomCenterContainer: {
    position: "absolute",
    bottom: -50,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    zIndex: 999,
    opacity: 1,
    alignItems: "center",
  },

  logoImg: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  otpTextContainer: {
    marginTop: 70,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  otpText: {
    fontSize: 22,
    textAlign: "center",
    fontWeight: "600",
  },
  descriptionText: {
    fontSize: 16,
    textAlign: "center",
  },
  numberContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 5,
  },
  mobileNumberText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "bold",
  },
  btn: {
    width: "60%",
    backgroundColor: "#256D85",
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    marginTop: 30,
  },
  submitText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 1,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
  },
  input: {
    width: 60,
    height: 60,
    borderColor: "#256D85",
    borderWidth: 1,
    textAlign: "center",
    fontSize: 24,
    marginHorizontal: 5,
    borderRadius: 50,
  },
  timerText: {
    fontSize: 16,
    color: "grey",
  },
  resendOtpContainer: {
    marginTop: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  sendOtpText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#256D85",
  },
});

export default Otp;
