import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import AppHeader from "@/src/components/AppHeader";
import PropertyCard from "@/src/components/PropertyCard";

/* -------------------- dummy data -------------------- */
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
const TAB_BAR_HEIGHT = 60;
const Dashboard = () => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  /* default to first property */
  const [selectedId, setSelectedId] = useState<string>(pgProperties[0]._id);

  /* Placeholder API trigger */
  useEffect(() => {
    console.log("Fetch dashboard data for property:", selectedId);
  }, [selectedId]);

  /* responsive columns */
  let numColumns = 2;
  if (screenWidth >= 900) numColumns = 3;
  else if (screenWidth >= 600) numColumns = 2;
  else numColumns = 1;

  /* ==================================================================== */
  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      {/* ---------- Header ---------- */}
      <AppHeader
        avatarUri="https://via.placeholder.com/40"
        propertyOptions={pgProperties.map(({ _id, propertyName }) => ({
          _id,
          propertyName,
        }))}
        selectedId={selectedId}
        onSelectProperty={setSelectedId}
        onNotificationPress={() => console.log("bell")}
      />

      {/* ---------- List ---------- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          data={pgProperties}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={() => <Text style={styles.sectionTitle}>Your Properties</Text>}
          renderItem={({ item }) => (
            <PropertyCard data={item} onPress={() => router.push(`/properties/${item._id}`)} />
          )}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.cardsContainer,
            { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 12 }, // space for TabBar, no extra gap
          ]}
          columnWrapperStyle={numColumns > 1 ? { justifyContent: "flex-start" } : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No properties found.</Text>}
          getItemLayout={(_, index) => ({
            length: 275,
            offset: 275 * index,
            index,
          })}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F8FA" },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 18,
    marginBottom: 4,
    marginTop: 14,
    color: "#1A2748",
  },

  cardsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 16,
  },

  emptyText: {
    textAlign: "center",
    color: "#aab6c6",
    fontSize: 17,
    marginTop: 80,
  },
});

export default Dashboard;
