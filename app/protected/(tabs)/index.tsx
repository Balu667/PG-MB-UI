import React from "react";
import { StyleSheet, View, Text, TextInput, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Entypo from "@expo/vector-icons/Entypo";
import PropertyCard from "@/src/components/PropertyCard";

const pgProperties = [
  {
    _id: "6801cc72e26fc33c842415e1",
    metadata: {
      totalRooms: 15,
      totalBeds: 56,
      vacantBeds: 48,
      advancedBookings: 4,
      occupiedBeds: 4,
      underNotice: 0,
      expenses: 0,
      dues: 63000,
      income: 0,
    },
    propertyId: "PG-00031",
    propertyName: "Hanuman Gen's PG",
    tenantType: "Male",
    mealType: "Both",
    doorNo: "900",
    streetName: "100 Feet Road",
    area: "Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500098",
    country: "India",
    landmark: "Near Tea shop",
    facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV"],
    notifications: {
      sms: true,
      whatsapp: true,
    },
    noticePeriod: "30",
  },
  {
    _id: "6801ccbce26fc33c842415ec",
    metadata: {
      totalRooms: 1,
      totalBeds: 1,
      vacantBeds: 0,
      advancedBookings: 0,
      occupiedBeds: 1,
      underNotice: 1,
      expenses: 0,
      dues: 4000,
      income: 0,
    },
    propertyId: "PG-00032",
    propertyName: "Hanuman Gen's PG",
    tenantType: "Male",
    mealType: "Both",
    doorNo: "900",
    streetName: "Btm Layout",
    area: "Btm Layout",
    city: "Bangalore Urban",
    state: "Karnataka",
    pincode: "524004",
    country: "India",
    landmark: "Near Water tank",
    facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV", "AC"],
    notifications: {
      sms: true,
      whatsapp: true,
    },
    noticePeriod: "30",
  },
];


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
        {pgProperties.map((property, index) => (
          <PropertyCard key={property?._id} data={property} />
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
