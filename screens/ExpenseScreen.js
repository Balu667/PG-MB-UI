// src/screens/HomeScreen.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ExpenseScreen = () => (
  <View style={styles.container}>
    <Text>Expense Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ExpenseScreen;
