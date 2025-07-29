/* ------------------------------------------------------------------
   RoomsTab – lists the cards, runs search + filter
------------------------------------------------------------------- */
import { useState, useMemo } from "react";
import { FlatList, useWindowDimensions, StyleSheet, Text } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import SearchBar from "@/src/components/SearchBar";
import StatsGrid from "@/src/components/StatsGrid";
import RoomCard from "./RoomCard";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import { RoomFilter, emptyFilter } from "@/src/constants/roomFilter";
import { useLocalSearchParams } from "expo-router";
import { mockRooms } from "@/src/constants/mockRooms"; // ← your 15 dummy rooms
import { useGetAllRooms } from "@/src/hooks/room";

const roomMetrics: Metric[] = [
  {
    key: "rooms",
    label: "Total Rooms",
    value: 37,
    icon: "office-building",
    iconBg: "#DBEAFE",
  },
  {
    key: "beds",
    label: "Total Beds",
    value: 128,
    icon: "bed",
    iconBg: "#DBEAFE",
  },
  {
    key: "vacant",
    label: "Vacant Beds",
    value: 24,
    icon: "bed",
    iconBg: "#BBF7D0",
    iconColor: "#059669",
  },
  {
    key: "notice",
    label: "Under Notice",
    value: 5,
    icon: "bed",
    iconBg: "#DDD6FE",
    iconColor: "#7C3AED",
  },
];

const roomSections: Section[] = [
  {
    key: "status",
    label: "Room Status",
    mode: "checkbox",
    options: ["Available", "Partial", "Filled"].map((s) => ({
      label: s,
      value: s,
    })),
  },
  {
    key: "sharing",
    label: "Sharing",
    mode: "checkbox",
    options: Array.from({ length: 10 }, (_, i) => ({
      label: `${i + 1} Sharing`,
      value: i + 1,
    })),
  },
  {
    key: "floor",
    label: "Floor",
    mode: "checkbox",
    options: ["GF", ...Array.from({ length: 10 }, (_, i) => `${i + 1}F`)].map(
      (f) => ({
        label: f === "GF" ? "Ground Floor" : `${f.replace("F", "")} Floor`,
        value: f,
      })
    ),
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

/* --------------------------------------------------------------- */
export default function RoomsTab() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const { data, isLoading, isRefetching } = useGetAllRooms(id as string);
  console.log(data, isLoading, "params in RoomsTab");

  /* ───────────────── state ───────────────── */
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<RoomFilter>(emptyFilter);

  /* ───────────────── responsive columns ───────────────── */
  const cols = useMemo(
    () => (width >= 1000 ? 3 : width >= 740 ? 2 : 1),
    [width]
  );

  /* ───────────────── search + filter ───────────────── */
  const rooms = useMemo(() => {
    /* ① text search (roomNo OR floor) */
    const q = query.trim().toLowerCase();
    const byQ = q
      ? mockRooms.filter(
          (r) =>
            r.roomNo.toLowerCase().includes(q) ||
            r.floor.toLowerCase().includes(q)
        )
      : mockRooms;

    /* ② checkbox filters */
    return byQ
      .filter((r) => !filter.status.length || filter.status.includes(r.status))
      .filter(
        (r) => !filter.sharing.length || filter.sharing.includes(r.sharing)
      )
      .filter((r) => !filter.floor.length || filter.floor.includes(r.floor))
      .filter(
        (r) =>
          !filter.facilities.length ||
          filter.facilities.every((f) => r.facilities.includes(f))
      );
  }, [query, filter]);

  if (isLoading || isRefetching) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  /* ───────────────── render ───────────────── */
  return (
    <>
      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <RoomCard room={item} />}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? styles.columnGap : undefined}
        ListHeaderComponent={
          <>
            <StatsGrid metrics={roomMetrics} />
            <SearchBar
              placeholder="Search by room type"
              onSearch={setQuery}
              onFilter={() => setSheetOpen(true)}
              filterActive={Object.values(filter).some((a) => a.length)}
            />
          </>
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
          rowGap: 14, // vertical space between card rows
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* bottom‑sheet */}
      <FilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={roomSections}
        resetValue={emptyFilter}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F8FA" },
  columnGap: { gap: 14 }, // horizontal gap between cards
});
