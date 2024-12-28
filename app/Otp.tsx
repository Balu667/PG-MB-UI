import { router } from "expo-router";
import React from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";

const Otp = () => {
  return (
    <View style={styles.container}>
      <View style={styles.upperCurvedContainer}>
        <View style={styles.rightSideCurvedContainer}></View>

        <View style={styles.bottomCenterContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logoImg}
          />
          <Text style={styles.logoName}>Right PG</Text>
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
    opacity: 0.3,
    width: "100%",
    borderBottomLeftRadius: "40%",
    borderBottomRightRadius: "40%",
    display: "flex",
    alignItems: "flex-end",
  },

  rightSideCurvedContainer: {
    height: 200,
    backgroundColor: "#256D85",
    width: "50%",
    opacity: 0.8,
    borderBottomLeftRadius: 80,
  },

  bottomCenterContainer: {
    position: "absolute",
    bottom: -50,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    width: 150,
    height: 150,
    zIndex: 999,
    opacity: 1,
    borderRadius: "50%",
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  logoName: {
    fontSize: 30,
    textAlign: "center",
    color: "#256d85",
  },
});

export default Otp;
