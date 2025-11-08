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

import StatsGrid, { Metric } from "@/src/components/StatsGrid";
import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import RoomCard from "./RoomCard";
import { RoomFilter, emptyFilter } from "@/src/constants/roomFilter";
import { useTheme } from "@/src/theme/ThemeContext";

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
    options: ["AC", "Geyser", "WM", "WiFi", "TV", "Furnished"].map((f) => ({
      label: f,
      value: f,
    })),
  },
];

const num = (v: any, fallback = 0) => (typeof v === "number" ? v : Number(v ?? fallback)) || 0;

export default function RoomsTab({ data, meta, refreshing, onRefresh }: Props) {
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

  const renderRoom = ({ item }: ListRenderItemInfo<any>) => <RoomCard room={item} />;

  return (
    <SafeAreaView style={s.safeArea} edges={["left", "right"]}>
      <FlatList
        data={data}
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
              placeholder="Search by room / floor"
              onSearch={setQuery}
              onFilter={() => setSheetOpen(true)}
              filterActive={Object.values(filter).some((a) => a.length)}
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
