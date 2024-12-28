import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";

const Profile = () => {
  return (
    <View style={styles.container}>
      <Text>People</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
});

export default Profile;
