// src/components/property/RoomsTab.tsx
import React, { useState, useMemo } from "react";
import {
  FlatList,
  useWindowDimensions,
  StyleSheet,
  Text,
  ListRenderItemInfo,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import StatsGrid, { Metric } from "@/src/components/StatsGrid";
import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import RoomCard from "./RoomCard";
import { RoomFilter, emptyFilter } from "@/src/constants/roomFilter";
import { useTheme } from "@/src/theme/ThemeContext";
import AddButton from "@/src/components/Common/AddButton";

/* -------------------------- helpers / utils -------------------------- */
const num = (v: any, fallback = 0) => (typeof v === "number" ? v : Number(v ?? fallback)) || 0;
const str = (v: any, fallback = "") => (v == null ? fallback : String(v));

type DerivedStatus = "Available" | "Partial" | "Filled";

/** Compute room status exactly like RoomCard */
const deriveStatus = (room: any): DerivedStatus => {
  const totalBeds =
    num(room?.totalBeds) ||
    num(room?.bedsTotal) ||
    num(room?.bedCount) ||
    num(room?.capacity) ||
    num(room?.beds) ||
    0;

  const occupiedBeds = num(room?.occupiedBeds);
  const underNotice = num(room?.underNotice);
  const advanceBookings = num(room?.advancedBookings) || num(room?.advanceBookingBeds);

  const hasVacantField = room?.vacantBeds !== undefined && room?.vacantBeds !== null;
  const vacantBeds = hasVacantField
    ? num(room?.vacantBeds)
    : Math.max(totalBeds - (occupiedBeds + underNotice + advanceBookings), 0);

  if (totalBeds <= 0) return "Available";
  if (vacantBeds <= 0) return "Filled";
  if (vacantBeds >= totalBeds) return "Available";
  return "Partial";
};

/** Floor label helpers: UI uses GF / 1F / 2F... while API sends numeric floors */
const toFloorLabel = (floor?: number | string) => {
  const f = num(floor, NaN);
  if (Number.isNaN(f)) return "";
  return f === 0 ? "GF" : `${f}F`;
};
const floorLabelToNumber = (label: string) => {
  if (!label) return NaN;
  if (label === "GF") return 0;
  const n = Number(label.replace(/F$/i, ""));
  return Number.isFinite(n) ? n : NaN;
};

/** Facilities canonical keys (match API) with pretty labels for UI */
const FACILITY_OPTIONS: { label: string; value: string }[] = [
  { label: "Washing Machine", value: "washingMachine" },
  { label: "Hot Water", value: "hotWater" },
  { label: "Table", value: "table" },
  { label: "WiFi", value: "wifi" },
  { label: "TV", value: "tv" },
  { label: "AC", value: "ac" },
  { label: "Gym", value: "gym" },
  { label: "Fridge", value: "fridge" },
];

/* --------------------------- filter sections ------------------------- */
const roomSections: Section[] = [
  {
    key: "status",
    label: "Room Status",
    mode: "checkbox",
    options: ["Available", "Partial", "Filled"].map((s) => ({ label: s, value: s })),
  },
  {
    key: "sharing",
    label: "Sharing",
    mode: "checkbox",
    options: Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1} Sharing`, value: i + 1 })),
  },
  {
    key: "floor",
    label: "Floor",
    mode: "checkbox",
    options: ["GF", ...Array.from({ length: 10 }, (_, i) => `${i + 1}F`)].map((f) => ({
      label: f === "GF" ? "Ground Floor" : `${f.replace("F", "")} Floor`,
      value: f,
    })),
  },
  {
    key: "facilities",
    label: "Facilities",
    mode: "checkbox",
    options: FACILITY_OPTIONS,
  },
];

type Props = {
  data: any[];
  meta: {
    totalBeds: number;
    vacantBeds: number;
    occupiedBeds: number;
    advanceBookingBeds: number;
    underNoticeBeds: number;
    roomsTotal: number;
  };
  refreshing: boolean;
  onRefresh: () => void;
};

export default function RoomsTab({ data, meta, refreshing, onRefresh }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<RoomFilter>(emptyFilter);

  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  const metrics: Metric[] = useMemo(
    () => [
      {
        key: "rooms",
        label: "Total Rooms",
        value: num(meta?.roomsTotal),
        icon: "office-building",
        iconBg: "#DBEAFE",
      },
      {
        key: "beds",
        label: "Total Beds",
        value: num(meta?.totalBeds),
        icon: "bed",
        iconBg: "#DBEAFE",
      },
      {
        key: "vacant",
        label: "Vacant Beds",
        value: num(meta?.vacantBeds),
        icon: "bed",
        iconBg: "#BBF7D0",
        iconColor: "#059669",
      },
      {
        key: "notice",
        label: "Under Notice",
        value: num(meta?.underNoticeBeds),
        icon: "bed",
        iconBg: "#DDD6FE",
        iconColor: "#7C3AED",
      },
    ],
    [meta]
  );

  const s = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        columnGap: { gap: spacing.md - 2 },
        listContent: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.lg * 2,
          rowGap: spacing.md - 2,
        },
        emptyWrap: { padding: spacing.md },
        emptyTxt: { color: colors.textSecondary },
      }),
    [colors, spacing, insets.bottom]
  );

  /** ------------------------- FILTERING CORE ------------------------- */
  const filteredData = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Pre-build lookups for faster comparisons
    const statusSet = new Set(filter.status);
    const sharingSet = new Set(filter.sharing);
    const floorSet = new Set(filter.floor); // values like "GF", "1F"
    const facilitiesSet = new Set(filter.facilities); // canonical API keys

    return (data ?? []).filter((room) => {
      // 1) Search by room number
      const roomNo = str(room?.roomNo ?? room?.roomNumber ?? room?.name ?? room?.code, "");
      if (q && !roomNo.toLowerCase().includes(q)) return false;

      // 2) Status
      if (statusSet.size) {
        const st = deriveStatus(room);
        if (!statusSet.has(st)) return false;
      }

      // 3) Sharing (beds count)
      if (sharingSet.size) {
        const sh = num(room?.beds);
        if (!sharingSet.has(sh)) return false;
      }

      // 4) Floor (map numeric to GF/1F… and compare against selected values)
      if (floorSet.size) {
        const floorLabel = toFloorLabel(room?.floor);
        if (!floorSet.has(floorLabel)) return false;
      }

      // 5) Facilities (room must have ANY of the selected facilities)
      if (facilitiesSet.size) {
        const facArr: string[] = Array.isArray(room?.facilities) ? room.facilities : [];
        const hasAny = facArr.some((f) => facilitiesSet.has(f));
        if (!hasAny) return false;
      }

      return true;
    });
  }, [data, query, filter]);

  const renderRoom = ({ item }: ListRenderItemInfo<any>) => <RoomCard room={item} />;

  return (
    <SafeAreaView style={s.safeArea} edges={["left", "right"]}>
      <FlatList
        data={filteredData}
        keyExtractor={(r: any, index) =>
          String(r?._id ?? r?.id ?? r?.roomNo ?? r?.roomNumber ?? index)
        }
        renderItem={renderRoom}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? s.columnGap : undefined}
        ListHeaderComponent={
          <View>
            <StatsGrid metrics={metrics} />
            <SearchBar
              placeholder="Search by room number"
              onSearch={setQuery}
              onFilter={() => setSheetOpen(true)}
              filterActive={Object.values(filter).some((a) => Array.isArray(a) && a.length)}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyTxt}>No rooms found.</Text>
          </View>
        }
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        removeClippedSubviews
        initialNumToRender={10}
        windowSize={10}
      />

      {/* Floating Add */}
      <AddButton
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/protected/rooms/add");
        }}
      />

      <FilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={roomSections}
        resetValue={emptyFilter}
      />
    </SafeAreaView>
  );
}
