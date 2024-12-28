import { router } from "expo-router";
import React from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";

const GetStarted = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to our app.</Text>
      <Text style={styles.subtitle}>click on get started and explore it.</Text>

      <View>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace("/Register")}
        >
          <Text style={styles.signinText}>Get Started</Text>
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
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "darkgreen",
  },

  btn: {
    width: "100%",
    backgroundColor: "#31511E",
    paddingVertical: 15,
    borderRadius: 15,
    marginVertical: 20,
  },

  signinText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
});

export default GetStarted;
