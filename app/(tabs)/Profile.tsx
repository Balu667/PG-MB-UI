import CommonPopup from "@/components/CommonPopup";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";

const Profile = () => {
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profilePicContainer}>
        <Image
          source={{ uri: "https://randomuser.me/api/portraits/men/0.jpg" }}
          style={styles.profilepic}
        />
        <Text style={styles.username}>Hey John</Text>
        <Text style={styles.mbnumber}>+91 7799331234</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton}>
          <MaterialIcons name="password" size={24} color="black" />
          <Text style={styles.optionText} onPress={()=>toggleModal()}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => router.replace("/Login")}
        >
          <AntDesign name="login" size={24} color="black" />
          <Text style={styles.optionText}>Sign Out</Text>
        </TouchableOpacity>

        {isModalVisible && (
          <CommonPopup
            isModalVisible={isModalVisible}
            toggleModal={toggleModal}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profilePicContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#31511E",
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  profilepic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: "#4e4e4e",
    borderWidth: 2,
  },
  username: {
    fontSize: 24,
    color: "white",
    textAlign: "center",
    marginTop: 20,
  },
  mbnumber: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 5,
  },
  optionsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  optionButton: {
    paddingVertical: 15,
    marginVertical: 10,
    borderRadius: 10,
    borderBottomWidth: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  optionText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Profile;
