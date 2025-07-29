/* ------------------------------------------------------------------
   PGLayout – summary ▸ sticky legend ▸ compact floor layout
------------------------------------------------------------------- */
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  FlatList,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import StatsGrid, { Metric } from "@/src/components/StatsGrid";
import { mockRooms } from "@/src/constants/mockRooms";
import Colors from "@/src/constants/Colors";
import * as Haptics from "expo-haptics";

/* ────────────────────────────────────────────────────────────────
   1 ▸  demo data
   ──────────────────────────────────────────────────────────────── */
type BedStatus = "vacant" | "filled" | "notice" | "advance";
const ALL_STAT: BedStatus[] = ["vacant", "filled", "notice", "advance"];
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

type RoomInfo = { roomNo: string; beds: { id: string; status: BedStatus }[] };
type GroupInfo = { sharing: number; rooms: RoomInfo[] };
type FloorInfo = { name: string; groups: GroupInfo[] };

const makeRooms = (sh: number, f: number): RoomInfo[] =>
  Array.from({ length: 2 + (sh % 2) }).map((_, r) => ({
    roomNo: `${f + 1}${sh}${r}`,
    beds: Array.from({ length: sh }, (_, b) => ({
      id: `b${b}`,
      status: pick(ALL_STAT),
    })),
  }));

const floors: FloorInfo[] = ["1st Floor", "2nd Floor"].map((name, fIdx) => ({
  name,
  groups: Array.from({ length: 5 }, (_, i) => {
    const sh = i + 1 + fIdx * 5;
    return { sharing: sh, rooms: makeRooms(sh, fIdx) };
  }),
}));

/* ────────────────────────────────────────────────────────────────
   2 ▸  metrics
   ──────────────────────────────────────────────────────────────── */
const metricsFromRooms = (): Metric[] => {
  const totalRooms = mockRooms.length;
  const totalBeds = mockRooms.reduce((n, r) => n + r.totalBeds, 0);
  const vacantBeds = mockRooms.reduce((n, r) => n + r.vacantBeds, 0);
  const occupiedBeds = mockRooms.reduce((n, r) => n + r.occupiedBeds, 0);

  return [
    {
      key: "rooms",
      label: "Total Rooms",
      value: totalRooms,
      icon: "office-building",
      iconBg: "#DBEAFE",
    },
    { key: "beds", label: "Total Beds", value: totalBeds, icon: "bed", iconBg: "#DBEAFE" },
    {
      key: "vacant",
      label: "Vacant Beds",
      value: vacantBeds,
      icon: "bed",
      iconBg: "#BBF7D0",
      iconColor: "#059669",
    },
    {
      key: "occupied",
      label: "Occupied",
      value: occupiedBeds,
      icon: "bed",
      iconBg: "#FECACA",
      iconColor: "#B91C1C",
    },
  ];
};

/* ────────────────────────────────────────────────────────────────
   3 ▸  glyph helpers
   ──────────────────────────────────────────────────────────────── */
const BED_COLOR: Record<BedStatus, string> = {
  vacant: "#059669",
  filled: "#B91C1C",
  notice: "#7C3AED",
  advance: "#EA580C",
};
const Bed = ({ status }: { status: BedStatus }) => (
  <MaterialCommunityIcons name="bed" size={17} color={BED_COLOR[status]} style={{ margin: 1 }} />
);

/* ────────────────────────────────────────────────────────────────
   4 ▸  main
   ──────────────────────────────────────────────────────────────── */
export default function PGLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = useMemo(metricsFromRooms, []);
  const [outerScrollEnabled, setOuterScrollEnabled] = useState(true);

  return (
    <ScrollView
      stickyHeaderIndices={[1]}
      style={{ flex: 1, backgroundColor: Colors.surface }}
      contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
      scrollEnabled={outerScrollEnabled}
      showsVerticalScrollIndicator={false}
    >
      <StatsGrid metrics={metrics} />

      {/* sticky legend (wraps automatically) */}
      <LegendCard />

      <FlatList
        data={floors}
        keyExtractor={(f) => f.name}
        renderItem={({ item }) => (
          <FloorBlock floor={item} setOuterScroll={setOuterScrollEnabled} />
        )}
        scrollEnabled={false}
        contentContainerStyle={{ gap: 30 }}
      />
    </ScrollView>
  );
}

/* ────────────────────────────────────────────────────────────────
   5 ▸  Legend card (no horizontal scroll)
   ──────────────────────────────────────────────────────────────── */
const LegendPill = ({ status, label }: { status: BedStatus; label: string }) => (
  <View style={styles.legendPill}>
    <MaterialCommunityIcons
      name="circle"
      size={10}
      color={BED_COLOR[status]}
      style={{ marginRight: 6 }}
    />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const LegendCard = () => (
  <View style={styles.legendCard}>
    <LegendPill status="notice" label="Notice" />
    <LegendPill status="vacant" label="Vacant" />
    <LegendPill status="filled" label="Filled" />
    <LegendPill status="advance" label="Adv. Book" />
  </View>
);

/* ────────────────────────────────────────────────────────────────
   6 ▸  Floor + Sharing card
   ──────────────────────────────────────────────────────────────── */
function FloorBlock({
  floor,
  setOuterScroll,
}: {
  floor: FloorInfo;
  setOuterScroll: (v: boolean) => void;
}) {
  const { width } = useWindowDimensions();
  const cardW = Math.max(160, width * (width >= 780 ? 0.33 : 0.4));

  return (
    <View>
      <Text style={styles.floorTitle}>{floor.name}</Text>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={floor.groups}
        keyExtractor={(g) => String(g.sharing)}
        contentContainerStyle={{ gap: 14, paddingRight: 10 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { width: cardW }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-group" size={15} color="#2563EB" />
              <Text style={styles.cardHeaderTxt}>{item.sharing} Sharing</Text>
            </View>

            <ScrollView
              style={{ maxHeight: 210 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled /* android needs this */
              onScrollBeginDrag={() => setOuterScroll(false)}
              onScrollEndDrag={() => setOuterScroll(true)}
              onMomentumScrollEnd={() => setOuterScroll(true)}
              contentContainerStyle={styles.roomGrid}
            >
              {item.rooms.map((r) => (
                <Pressable
                  key={r.roomNo}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  android_ripple={{ color: "#E2E8F0" }}
                  style={styles.roomTile}
                >
                  <Text style={styles.roomNo}>{r.roomNo}</Text>
                  <View style={styles.bedRow}>
                    {r.beds.map((b) => (
                      <Bed key={b.id} status={b.status} />
                    ))}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      />
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────
   7 ▸  styles
   ──────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 28 },

  /* legend card */
  legendCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FFFFFFCC",
    borderRadius: 16,
    borderWidth: 0.8,
    borderColor: "#EEF1F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  legendPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  legendText: { fontSize: 13, color: Colors.textMuted },

  /* floor */
  floorTitle: { fontSize: 16, fontWeight: "700", color: Colors.textMain, marginBottom: 12 },

  /* sharing card */
  card: {
    backgroundColor: "#FFFFFFCC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 0.8,
    borderColor: "#EEF1F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    marginBottom: 6,
  },
  cardHeaderTxt: { fontWeight: "700", color: "#2563EB", fontSize: 13 },

  /* room grid */
  roomGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roomTile: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 90,
    marginBottom: 10,

    borderWidth: 1, // a hair bolder
    borderColor: "#CBD5E1", // slate‑300
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#F9FAFB", // very subtle surface tint

    /* slight shadow on iOS / elevation on Android */
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  roomNo: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF", // indigo‑50
    color: Colors.textAccent,

    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  bedRow: { flexDirection: "row", flexWrap: "wrap" },
});
