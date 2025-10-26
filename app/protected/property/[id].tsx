import React, { useMemo, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useProperty } from "@/src/context/PropertyContext";

import TopInfo from "@/src/components/property/TopInfo";
import SegmentBar from "@/src/components/property/SegmentBar";
import InfoCard from "@/src/components/property/InfoCard";
import PGLayout from "@/src/components/property/PGLayout";
import RoomsTab from "@/src/components/property/RoomsTab";
import TenantsTab from "@/src/components/property/TenantsTab";
import ExpensesTab from "@/src/components/property/ExpensesTab";

import { pgProperties } from "@/src/constants/mockData";
import { useTheme } from "@/src/theme/ThemeContext";

/* ------------------------------------------------------------------ */
/*  TAB SETUP                                                          */
/* ------------------------------------------------------------------ */
const TABS = [
  "Property Details",
  "PG Layout",
  "Rooms",
  "Tenants",
  "Expenses",
  "Facilities",
  "Staff",
] as const;

type TabKey = (typeof TABS)[number];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */
export default function PropertyDetails() {
  /* ---------------- hooks & params ---------------------------------- */
  const { id, tab = TABS[0] } = useLocalSearchParams<{ id: string; tab?: TabKey }>();
  console.log(id, "---------");
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { selectedId } = useProperty();

  /* ---------------- memoised styles (theme-aware) ------------------- */
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        bodyContent: {
          padding: spacing.md,
          gap: spacing.md,
          paddingBottom: spacing.lg * 2, // bottom breathing room
        },
        placeholder: {
          textAlign: "center",
          marginTop: 60,
          color: colors.textMuted,
          fontSize: typography.fontSizeMd,
        },
      }),
    [colors, spacing, typography]
  );

  /* ---------------- data -------------------------------------------- */
  const property = React.useMemo(
    () => pgProperties.find((p) => p._id === id) ?? pgProperties[0],
    [id]
  );

  /* ---------------- tab state --------------------------------------- */
  const [activeTab, setActiveTab] = useState<TabKey>(tab as TabKey);
  useEffect(() => {
    if (!selectedId) return;
    if (selectedId !== id) {
      router.replace({
        pathname: `/protected/property/${selectedId}`,
        params: { tab: activeTab },
      });
    }
  }, [selectedId]);

  /* ---------------- render ------------------------------------------ */
  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      {/* ---- Hero header with name & address ---- */}
      <TopInfo name={property.propertyName} area={property.area} city={property.city} />

      {/* ---- Internal segment bar ---- */}
      <SegmentBar tabs={TABS} value={activeTab} onChange={(t) => setActiveTab(t as TabKey)} />

      {/* ---- Conditional tab bodies ---- */}
      {activeTab === "PG Layout" ? (
        <PGLayout />
      ) : activeTab === "Rooms" ? (
        <RoomsTab />
      ) : activeTab === "Tenants" ? (
        <TenantsTab />
      ) : activeTab === "Expenses" ? (
        <ExpensesTab />
      ) : (
        /* All remaining tabs share the simple ScrollView wrapper */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "Property Details" && (
            <InfoCard
              title="Total Beds"
              value={property.metadata.totalBeds}
              sub={{
                Vacant: property.metadata.vacantBeds,
                Filled: property.metadata.occupiedBeds,
                Booking: property.metadata.advancedBookings,
                Notice: property.metadata.underNotice,
              }}
            />
          )}

          {activeTab === "Facilities" && (
            <Placeholder label="Facilities list goes here…" style={styles.placeholder} />
          )}
          {activeTab === "Staff" && (
            <Placeholder label="Staff list goes here…" style={styles.placeholder} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Placeholder({ label, style }: { label: string; style: any }) {
  return <Text style={style}>{label}</Text>;
}
