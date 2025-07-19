/* --------------------------------------------------------------------------
 * Property‑Details screen
 * route: /protected/property/[id]?tab=<rooms|tenants|…>
 * ------------------------------------------------------------------------ */

import React, { useMemo, useState, useRef } from "react";
import * as Haptics from "expo-haptics";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Easing,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AppHeader from "@/src/components/AppHeader";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { pgProperties } from "@/src/constants/mockData";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // for tablet padding

const TABS = ["Property Details", "Rooms", "Tenants", "Expenses", "Facilities", "Staff"] as const;
type TabKey = (typeof TABS)[number];
/* ---------- design tokens ---------- */
const COLORS = {
  primary: "#256D85",
  bgCard: "#FFFFFF",
  textMain: "#1A2748",
  textMuted: "#6B7280",
  textAccent: "#111827",
  surface: "#F2F7FA",
  shadow: "#000",
};
const roomStats = [
  { key: "rooms", label: "Total Rooms", value: 0, icon: "office-building", bg: "#BFDBFE" },
  { key: "beds", label: "Total Beds", value: 0, icon: "bed", bg: "#BFDBFE" },
  { key: "vacant", label: "Vacant Beds", value: 0, icon: "bed", bg: "#BBF7D0" },
  { key: "notice", label: "Under Notice Beds", value: 0, icon: "bed", bg: "#DDD6FE" },
];

const FONTS = {
  title: { fontFamily: "System", fontWeight: "700" } as const,
  medium: { fontFamily: "System", fontWeight: "600" } as const,
};

/* -------------------------------------------------------------------------- */
export default function PropertyDetails() {
  const { id, tab = "Property Details" } = useLocalSearchParams<{
    id: string;
    tab?: TabKey;
  }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  /* active PG object ------------------------------------------------------- */
  const property = useMemo(() => pgProperties.find((p) => p._id === id) ?? pgProperties[0], [id]);

  /* internal tab state ----------------------------------------------------- */
  const [activeTab, setActiveTab] = useState<TabKey>(tab as TabKey);

  /* animated underline ----------------------------------------------------- */
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineW = useRef(new Animated.Value(0)).current;
  //   const tabMeta: { x: number; w: number }[] = [];
  const tabMeta = useRef<{ x: number; w: number }[]>(
    Array(TABS.length).fill({ x: 0, w: 0 })
  ).current;
  const initialised = useRef(false);

  /* ---------------------------------------------------------------------- */
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      {/* ---------- header with back arrow ---------- */}
      <AppHeader
        showBack
        onBackPress={() => router.replace("/protected/(tabs)/index")}
        avatarUri=""
        propertyOptions={[]} // no dropdown here
        selectedId=""
        onSelectProperty={() => {}}
      />

      {/* ---------- basic info ---------- */}
      <View style={styles.topInfo}>
        <Text style={styles.pgName} numberOfLines={1}>
          {property.propertyName}
        </Text>

        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
          <Text style={styles.location} numberOfLines={1}>
            {property.area}, {property.city}
          </Text>
        </View>
      </View>

      {/* ---------- slim segment bar ---------- */}
      <View style={styles.barContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barScroll}
        >
          {/* moving indicator */}
          <Animated.View
            style={[
              styles.underline,
              { transform: [{ translateX: underlineX }], width: underlineW },
            ]}
          />

          {TABS.map((t, idx) => {
            const selected = activeTab === t;
            return (
              <TouchableOpacity
                key={t}
                activeOpacity={0.7}
                onLayout={(e) => {
                  tabMeta[idx] = {
                    x: e.nativeEvent.layout.x,
                    w: e.nativeEvent.layout.width,
                  };
                  /* set initial underline only once */
                  if (selected && !initialised.current) {
                    underlineX.setValue(tabMeta[idx].x);
                    underlineW.setValue(tabMeta[idx].w);
                    initialised.current = true;
                  }
                }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(t);

                  const { x, w } = tabMeta[idx];
                  Animated.parallel([
                    Animated.timing(underlineX, {
                      toValue: x,
                      duration: 260,
                      easing: Easing.out(Easing.exp),
                      useNativeDriver: false,
                    }),
                    Animated.timing(underlineW, {
                      toValue: w,
                      duration: 260,
                      easing: Easing.out(Easing.exp),
                      useNativeDriver: false,
                    }),
                  ]).start();
                }}
                style={styles.barItem}
              >
                <Text style={[styles.barLabel, selected && styles.barLabelActive]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ---------- body ---------- */}
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

        {activeTab === "Rooms" && <StatsGrid />}
        {activeTab === "Tenants" && <Placeholder label="Tenants list goes here…" />}
        {activeTab === "Expenses" && <Placeholder label="Expenses list goes here…" />}
        {activeTab === "Facilities" && <Placeholder label="Facilities list goes here…" />}
        {activeTab === "Staff" && <Placeholder label="Staff list goes here…" />}
      </ScrollView>
    </SafeAreaView>
  );
}

/* --------------------------------------------------------------------------
 * helpers
 * ------------------------------------------------------------------------ */

function InfoCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: number | string;
  sub: Record<string, number | string>;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>

      <View style={styles.subRow}>
        {Object.entries(sub).map(([k, v]) => (
          <View key={k} style={styles.subItem}>
            <Text style={styles.subKey}>{k}</Text>
            <Text style={styles.subVal}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------
 * Small responsive grid (2‑up phones, 4‑up tablets)
 * --------------------------------------------------------------------- */
function StatsGrid() {
  const { width } = useWindowDimensions();
  const COLS = width >= 1000 ? 4 : width >= 740 ? 3 : 2; // default for phones

  /* Gap between cards */
  const GAP = 14;
  const sidePadding = 32; // your SafeArea 16 × 2
  const cardW = (width - sidePadding - GAP * (COLS - 1)) / COLS;

  return (
    <View style={{ marginTop: 15 }}>
      <FlatList
        data={roomStats}
        keyExtractor={(item) => item.key}
        numColumns={COLS}
        scrollEnabled={false} /* we’re inside a ScrollView already */
        columnWrapperStyle={{ gap: GAP }} /* horizontal gap */
        contentContainerStyle={{ rowGap: GAP }} /* vertical gap */
        renderItem={({ item }) => (
          <View style={[styles.statCard, { width: cardW }]}>
            <View style={[styles.iconBubble, { backgroundColor: item.bg }]}>
              <MaterialCommunityIcons name={item.icon as any} size={18} color="#256D85" />
            </View>

            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        )}
      />
    </View>
  );
}

const Placeholder = ({ label }: { label: string }) => (
  <Text style={styles.placeholder}>{label}</Text>
);

/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  topInfo: {
    padding: 30,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  pgName: {
    fontSize: 24,
    ...FONTS.title,
    color: COLORS.textMain,
    letterSpacing: 0.2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  location: { color: COLORS.textMuted, fontSize: 14 },

  /* segment bar */
  barContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  barScroll: { paddingHorizontal: 14, position: "relative" },
  barItem: { paddingVertical: 14, marginRight: 24 },
  barLabel: { fontSize: 15, color: COLORS.textMuted },
  barLabelActive: { color: COLORS.textAccent, ...FONTS.medium },
  underline: {
    position: "absolute",
    bottom: 0,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: COLORS.primary,
  },

  /* body */
  bodyContent: { paddingHorizontal: 16, paddingBottom: 50, gap: 14 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 6,
    gap: 12,
  },
  cardTitle: { fontSize: 16, color: COLORS.textMuted, ...FONTS.medium },
  cardValue: { fontSize: 30, ...FONTS.title, color: COLORS.primary },
  subRow: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  subItem: { minWidth: 60 },
  subKey: { color: COLORS.textMuted, fontSize: 13 },
  subVal: { ...FONTS.medium, color: COLORS.primary },

  placeholder: { textAlign: "center", marginTop: 60, color: "#9CA3AF", fontSize: 16 },

  /* ------------ Rooms grid ------------ */
  gridWrap: { flexDirection: "row", flexWrap: "wrap" },

  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end", // keeps it top‑right
  },

  statValue: { fontSize: 28, fontWeight: "700", color: "#111827", marginTop: 6 },
  statLabel: { fontSize: 14, color: "#4B5563", marginTop: 2, lineHeight: 18 },
});
