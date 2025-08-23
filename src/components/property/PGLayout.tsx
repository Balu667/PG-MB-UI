import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";

import StatsGrid, { Metric } from "@/src/components/StatsGrid";
import { mockRooms } from "@/src/constants/mockRooms";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ────────────────────────────────────────────────────────────────
   1 ▸  mock (demo) data for layout
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

const floors: FloorInfo[] = ["1st Floor", "2nd Floor"].map((name, fIdx) => ({
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
      key: "occ",
      label: "Occupied",
      value: occupiedBeds,
      icon: "bed",
      iconBg: "#FECACA",
      iconColor: "#B91C1C",
    },
  ];
};

/* ────────────────────────────────────────────────────────────────
   3 ▸  glyph helper
   ──────────────────────────────────────────────────────────────── */
const Bed = ({ status, color }: { status: BedStatus; color: string }) => (
  <MaterialCommunityIcons name="bed" size={17} color={color} style={{ margin: 1 }} />
);

/* ------------------------------------------------------------------
   4 ▸  main component
------------------------------------------------------------------- */
export default function PGLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = useMemo(metricsFromRooms, []);

  const { colors, spacing, radius } = useTheme();
  const isAndroid = Platform.OS === "android";

  /* outer scroll disabling (Android only, during vertical drags) */
  const [outerScrollEnabled, setOuterScrollEnabled] = useState(true);

  /* ---------- static colours ---------- */
  const BED_COLOR: Record<BedStatus, string> = {
    vacant: colors.availableBeds,
    filled: colors.filledBeds,
    notice: colors.underNoticeBeds,
    advance: colors.advBookedBeds,
  };

  /* ---------- styles ---------- */
  const s = useMemo(
    () =>
      StyleSheet.create({
        body: { paddingHorizontal: spacing.md, paddingTop: spacing.lg + 4 },

        legendCard: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          padding: 12,
          marginBottom: spacing.sm,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          borderWidth: 0.8,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06,
          shadowRadius: 5,
          elevation: 4,
        },
        legendPill: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: 16,
          paddingVertical: 6,
          paddingHorizontal: 12,
        },
        legendText: { fontSize: 13, color: colors.textSecondary },

        floorTitle: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: 12,
        },

        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          padding: 12,
          borderWidth: 0.8,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
          shadowColor: colors.shadow,
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
          borderColor: hexToRgba(colors.textSecondary, 0.2),
          marginBottom: 6,
        },
        cardHeaderTxt: { fontWeight: "700", color: colors.accent, fontSize: 13 },

        roomGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

        roomTile: {
          flexBasis: "48%",
          flexGrow: 1,
          minWidth: 90,
          marginBottom: 10,

          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.3),
          borderRadius: 12,
          padding: 10,
          backgroundColor: colors.surface,

          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
        roomNo: {
          alignSelf: "flex-start",
          backgroundColor: hexToRgba(colors.primary, 0.1),
          color: colors.textPrimary,
          fontSize: 13,
          fontWeight: "700",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 6,
          marginBottom: 6,
        },
        bedRow: { flexDirection: "row", flexWrap: "wrap" },
      }),
    [colors, spacing, radius]
  );

  /* ---------- legend ---------- */
  const LegendPill = useCallback(
    ({ status, label }: { status: BedStatus; label: string }) => (
      <View style={s.legendPill}>
        <MaterialCommunityIcons
          name="circle"
          size={10}
          color={BED_COLOR[status]}
          style={{ marginRight: 6 }}
        />
        <Text style={s.legendText}>{label}</Text>
      </View>
    ),
    [s.legendPill, s.legendText, BED_COLOR]
  );

  const LegendCard = () => (
    <View style={s.legendCard}>
      <LegendPill status="notice" label="Notice" />
      <LegendPill status="vacant" label="Vacant" />
      <LegendPill status="filled" label="Filled" />
      <LegendPill status="advance" label="Adv. Book" />
    </View>
  );

  /* ---------- floor block ---------- */
  const FloorBlock = ({
    floor,
    setOuterScroll,
  }: {
    floor: FloorInfo;
    setOuterScroll: (v: boolean) => void;
  }) => {
    const cardW = Math.max(160, width * (width >= 780 ? 0.33 : 0.4));

    return (
      <View>
        <Text style={s.floorTitle}>{floor.name}</Text>

        {/* horizontal list of sharing cards – never disables outer scroll */}
        <FlatList
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          data={floor.groups}
          keyExtractor={(g) => String(g.sharing)}
          contentContainerStyle={{ gap: 14, paddingRight: 10 }}
          renderItem={({ item }) => (
            <View style={[s.card, { width: cardW }]}>
              <View style={s.cardHeader}>
                <MaterialCommunityIcons name="account-group" size={15} color={colors.accent} />
                <Text style={s.cardHeaderTxt}>{item.sharing} Sharing</Text>
              </View>

              {/* vertical bed list – pause outer scroll only while dragging (Android) */}
              <ScrollView
                style={{ maxHeight: 210 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                scrollEventThrottle={16}
                onTouchStart={isAndroid ? () => setOuterScroll(false) : undefined}
                onTouchEnd={isAndroid ? () => setOuterScroll(true) : undefined}
                onMomentumScrollEnd={isAndroid ? () => setOuterScroll(true) : undefined}
                contentContainerStyle={s.roomGrid}
              >
                {item.rooms.map((r) => (
                  <Pressable
                    key={r.roomNo}
                    android_ripple={{ color: hexToRgba(colors.textSecondary, 0.15) }}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    style={s.roomTile}
                  >
                    <Text style={s.roomNo}>{r.roomNo}</Text>
                    <View style={s.bedRow}>
                      {r.beds.map((b) => (
                        <Bed key={b.id} status={b.status} color={BED_COLOR[b.status]} />
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
  };

  /* ---------- render ---------- */
  return (
    <ScrollView
      stickyHeaderIndices={[1]}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        ...s.body,
        paddingBottom: insets.bottom + spacing.lg * 2,
      }}
      scrollEnabled={isAndroid ? outerScrollEnabled : true}
      showsVerticalScrollIndicator={false}
    >
      <StatsGrid metrics={metrics} />
      <LegendCard />

      <FlatList
        data={floors}
        keyExtractor={(f) => f.name}
        renderItem={({ item }) => (
          <FloorBlock floor={item} setOuterScroll={setOuterScrollEnabled} />
        )}
        scrollEnabled={false}
        contentContainerStyle={{ gap: spacing.lg + 6 }}
      />
    </ScrollView>
  );
}
