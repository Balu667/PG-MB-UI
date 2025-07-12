import React from "react";
import { StyleSheet, View, Text } from "react-native";

const Dashboard = () => {
  return (
    <View style={styles.container}>
      <Text>In DashBoard</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
});

export default Dashboard;
