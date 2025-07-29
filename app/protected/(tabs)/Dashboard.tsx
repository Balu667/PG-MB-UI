import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/src/components/AppHeader";
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
    streetName: "100 Feet Road",
    area: "Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500098",
    country: "India",
    landmark: "Near Tea shop",
    facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV"],
    notifications: { sms: true, whatsapp: true },
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
    streetName: "BTM Layout",
    area: "BTM Layout",
    city: "Bangalore Urban",
    state: "Karnataka",
    pincode: "524004",
    country: "India",
    landmark: "Near Water tank",
    facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV", "AC"],
    notifications: { sms: true, whatsapp: true },
    noticePeriod: "30",
  },
];
const Dashboard = () => {
  const [selectedId, setSelectedId] = useState<string>(pgProperties[0]._id);
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <AppHeader
        avatarUri="https://via.placeholder.com/40"
        propertyOptions={pgProperties} // No dropdown yet
        selectedId={selectedId}
        onSelectProperty={setSelectedId}
        onNotificationPress={() => {}}
      />

      <View style={styles.container}>
        <Text style={styles.comingSoon}>Charts coming soon…</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoon: { fontSize: 18, fontWeight: "600", color: "#888" },
});

export default Dashboard;
