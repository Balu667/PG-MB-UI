import React from "react";
import { StyleSheet, View, Text } from "react-native";

const Store = () => {
  return (
    <View style={styles.container}>
      <Text>Store</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
  },
});

export default Store;
