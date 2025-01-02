import { router } from "expo-router";
import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState("+91 8779404201");

  return (
    <View style={styles.container}>
      <View style={styles.upperCurvedContainer}>
        <View style={styles.rightSideCurvedContainer}></View>

        <View style={styles.bottomCenterContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logoImg}
            />
          </View>
          <Text style={styles.logoName}>Right PG</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.title}>Login with your Mobile Number</Text>
        <View style={styles.inputCont}>
          <Text style={styles.labels}>Enter Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            onChangeText={(text) => setMobileNumber(text)}
            value={mobileNumber}
          />
        </View>
        <View>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace("/Otp")}
          >
            <Text style={styles.generateOtpText}>Generate OTP</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.orText}>Or</Text>
        <View style={styles.gmailContainer}>
          <View>
            <Image
              source={require("../assets/images/gmail.png")}
              style={styles.image}
            />
          </View>
          <View>
            <Text style={styles.gmailText}>Sign in with gmail</Text>
          </View>
        </View>
        <View>
          <Text style={styles.termServiceText}>
            By continuing you accept our{" "}
            <Text style={styles.highlightedText}>Term of Service</Text> Also
            learn how we process your data in our{" "}
            <Text style={styles.highlightedText}>Privacy Policy </Text> and{" "}
            <Text style={styles.highlightedText}>Cookies Policy</Text>
          </Text>
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

  logoName: {
    fontSize: 30,
    textAlign: "center",
    color: "#256D85",
    fontWeight: "bold",
  },

  inputContainer: {
    paddingHorizontal: 25,
    marginTop: 70,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#000",
    textAlign: "left",
    marginTop: 50,
  },

  input: {
    width: "100%",
    height: 60,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 20,
    lineHeight: 20,
    marginVertical: 10,
    backgroundColor: "#E9EAEA",
    color: "#5856d6",
  },

  labels: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 5,
    color: "grey",
  },

  btn: {
    width: "100%",
    backgroundColor: "#256D85",
    paddingVertical: 20,
    borderRadius: 10,
    marginVertical: 15,
  },

  inputCont: {
    width: "100%",
  },

  generateOtpText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 1,
  },

  orText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "grey",
    marginVertical: 10,
  },

  gmailContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },

  image: {
    width: 40,
    height: 30,
  },

  gmailText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5856d6",
  },

  highlightedText: {
    color: "#09BD71",
  },

  termServiceText: {
    color: "grey",
    fontSize: 16,
    textAlign: "center",
    padding: 3,
    lineHeight: 22,
    letterSpacing: 1,
  },
});

export default Login;
