import React from "react";
import { StyleSheet, View, Text } from "react-native";

const Rooms = () => {
  return (
    <View style={styles.container}>
      <Text>Room</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
});

export default Rooms;
