import React from "react";
import { StyleSheet, View, Text } from "react-native";

const Properties = () => {
  return (
    <View style={styles.container}>
      <Text>Property</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
});

export default Properties;
