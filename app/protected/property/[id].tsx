/* --------------------------------------------------------------------------
 * Property‑Details screen
 * route: /protected/property/[id]?tab=<rooms|tenants|…>
 * ------------------------------------------------------------------------ */

import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AppHeader from "@/src/components/AppHeader";
import TopInfo from "@/src/components/property/TopInfo";
import SegmentBar from "@/src/components/property/SegmentBar";
import InfoCard from "@/src/components/property/InfoCard";
import StatsGrid from "@/src/components/property/StatsGrid";
import { pgProperties } from "@/src/constants/mockData";
import RoomSearchBar from "@/src/components/property/RoomSearchBar";
import RoomCard from "@/src/components/property/RoomCard";
import { mockRooms } from "@/src/constants/mockRooms";
import { useWindowDimensions } from "react-native";
import RoomsTab from "@/src/components/property/RoomsTab";

const TABS = ["Property Details", "Rooms", "Tenants", "Expenses", "Facilities", "Staff"] as const;
type TabKey = (typeof TABS)[number];

export default function PropertyDetails() {
  const { width } = useWindowDimensions();

  const cols = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  /* ------------------------------------------------ props */
  const { id, tab = TABS[0] } = useLocalSearchParams<{ id: string; tab?: TabKey }>();
  const router = useRouter();

  /* ------------------------------------------------ data */
  const property = useMemo(() => pgProperties.find((p) => p._id === id) ?? pgProperties[0], [id]);

  /* ------------------------------------------------ local state */
  const [activeTab, setActiveTab] = useState<TabKey>(tab as TabKey);

  /* ------------------------------------------------ render */
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <AppHeader
        showBack
        onBackPress={() => router.replace("/protected/(tabs)/index")}
        avatarUri=""
        propertyOptions={[]}
        selectedId=""
        onSelectProperty={() => {}}
      />

      {/* hero / address */}
      <TopInfo name={property.propertyName} area={property.area} city={property.city} />

      {/* internal tabs */}
      <SegmentBar tabs={TABS} value={activeTab} onChange={(t) => setActiveTab(t as TabKey)} />
      {activeTab === "Rooms" ? (
        /* 🟢 NO outer ScrollView here – just the FlatList component */
        <RoomsTab />
      ) : (
        /* other tabs keep the ScrollView */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "Property Details" && (
            <InfoCard
              title="Total Beds"
              value={property.metadata.totalBeds}
              sub={{
                Vacant: property.metadata.vacantBeds,
                Filled: property.metadata.occupiedBeds,
                Booking: property.metadata.advancedBookings,
                Notice: property.metadata.underNotice,
              }}
            />
          )}
          {activeTab === "Tenants" && <Placeholder l="Tenants list goes here…" />}
          {activeTab === "Expenses" && <Placeholder l="Expenses list goes here…" />}
          {activeTab === "Facilities" && <Placeholder l="Facilities list goes here…" />}
          {activeTab === "Staff" && <Placeholder l="Staff list goes here…" />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const Placeholder = ({ l }: { l: string }) => (
  <Text style={{ textAlign: "center", marginTop: 60, color: "#9CA3AF", fontSize: 16 }}>{l}</Text>
);

const styles: any = StyleSheet.create({ body: { padding: 16, gap: 14, paddingBottom: 50 } });
