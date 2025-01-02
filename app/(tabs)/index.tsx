import React from "react";
import { StyleSheet, View, Text, TextInput, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Entypo from "@expo/vector-icons/Entypo";
import PropertyCard from "@/components/PropertyCard";

const Index = () => {
  return (
    <View style={styles.container}>
      <View style={styles.profileWrapper}>
        <View style={styles.profileContainer}>
          <View style={styles.textContainer}>
            <View style={styles.profilePic}></View>
            <View>
              <Text style={styles.propertyName}>
                All Properties
                <Entypo name="chevron-down" size={20} color="#fff" />
              </Text>
            </View>
          </View>
          <View style={styles.optionsContainer}>
            <View>
              <MaterialIcons name="notification-add" size={24} color="#fff" />
            </View>
            <View>
              <MaterialCommunityIcons name="menu" size={24} color="#fff" />
            </View>
          </View>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputText}
            placeholder='Search By "Properties"'
            placeholderTextColor={"#fff"}
          />
        </View>
      </View>
      <ScrollView
        style={styles.propertyCards}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.propertiesText}>Properties</Text>
        {[1, 2, 3, 4, 5, 6].map((card, index) => (
          <PropertyCard key={index} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
  profileWrapper: {
    width: "100%",
    height: 150,
    backgroundColor: "#256D85",
    paddingHorizontal: 20,
  },
  profileContainer: {
    width: "100%",
    display: "flex",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profilePic: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 50,
  },
  textContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  optionsContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  propertyName: {
    fontSize: 16,
    color: "#fff",
  },
  inputContainer: {
    marginTop: 5,
  },
  inputText: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#678d9a",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 18,
    lineHeight: 20,
    marginVertical: 10,
    backgroundColor: "#678d9a",
    color: "#fff",
  },

  propertyCards: {
    paddingHorizontal: 20,
  },
  propertiesText: {
    fontSize: 30,
    fontWeight: "bold",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});

export default Index;
