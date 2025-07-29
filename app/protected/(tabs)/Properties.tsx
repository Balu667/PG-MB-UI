import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import AppHeader from "@/src/components/AppHeader";
import PropertyCard from "@/src/components/PropertyCard";
import { useSelector } from "react-redux";
import { useGetPropertyDetailsList } from "@/src/hooks/propertyHook";

const TAB_BAR_HEIGHT = 60;
const Properties = () => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  // Import RootState from your store file if not already imported
  // import { RootState } from "@/src/store"; // adjust the path as needed
  const { profileData } = useSelector((state: any) => state.profileDetails);
  // For better type safety, replace 'any' with your actual RootState type if available:
  // const { profileData } = useSelector((state: RootState) => state.profileDetails);

  console.log("Profile Data:", profileData);

  const {
    isLoading,
    data: propertyData,
    isFetching,
  } = useGetPropertyDetailsList(profileData);

  console.log("Property Data:", propertyData);

  const insets = useSafeAreaInsets();

  /* default to first property */
  const [selectedId, setSelectedId] = useState<string>(propertyData?.[0]?._id);

  /* Placeholder API trigger */
  useEffect(() => {
    // console.log(state, "redux state");
    setSelectedId(propertyData?.[0]?._id);
    console.log("Fetch dashboard data for property:", selectedId);
  }, [propertyData]);

  /* responsive columns */
  let numColumns = 2;
  if (screenWidth >= 900) numColumns = 3;
  else if (screenWidth >= 600) numColumns = 2;
  else numColumns = 1;

  if (isLoading || isFetching) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  console.log(propertyData, "propertyData");

  /* ==================================================================== */
  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      {/* ---------- Header ---------- */}
      <AppHeader
        avatarUri="https://via.placeholder.com/40"
        propertyOptions={propertyData.map(({ _id, propertyName }) => ({
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
          data={propertyData}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={() => (
            <Text style={styles.sectionTitle}>Your Properties</Text>
          )}
          renderItem={({ item }) => (
            <PropertyCard
              data={item}
              onPress={() => router.push(`/protected/property/${item._id}`)}
            />
          )}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.cardsContainer,
            { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 12 }, // space for TabBar, no extra gap
          ]}
          columnWrapperStyle={
            numColumns > 1 ? { justifyContent: "flex-start" } : undefined
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No properties found.</Text>
          }
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

export default Properties;
