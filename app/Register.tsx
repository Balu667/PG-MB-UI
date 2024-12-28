import { router } from "expo-router";
import React from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";

const Register = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register your account</Text>
      <View style={styles.inputCont}>
        <View style={styles.inputs}>
          <Text style={styles.labels}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputs}>
          <Text style={styles.labels}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            secureTextEntry
          />
        </View>
        <View style={styles.inputs}>
          <Text style={styles.labels}>Aadhar Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your aadhar number"
            secureTextEntry
          />
        </View>
        <View style={styles.inputs}>
          <Text style={styles.labels}>PAN No</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your pan number"
            secureTextEntry
          />
        </View>
      </View>
      <View>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.signinText}>Register</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.registerCont}>
        <Text style={{ fontSize: 14  }}>Already have account?</Text>
        <TouchableOpacity onPress={() => router.push("/Login")}>
          <Text style={styles.registerText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
    color: "#31511E",
    textAlign: "center",
    marginTop: 50,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginVertical: 10,
    backgroundColor: "#fff",
    color: "#000",
  },
  labels: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  btn: {
    width: "100%",
    backgroundColor: "#31511E",
    paddingVertical: 15,
    borderRadius: 15,
    marginVertical: 20,
  },
  inputCont: {
    width: "100%",
  },
  inputs: {
    marginVertical: 4,
  },
  signinText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  registerCont: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    alignItems: "center",
  },
  registerText: {
    color: "grey",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Register;
