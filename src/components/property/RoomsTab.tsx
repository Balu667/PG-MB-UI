/* ------------------------------------------------------------------
   RoomsTab – lists the cards, runs search + filter
------------------------------------------------------------------- */
import { useState, useMemo } from "react";
import { FlatList, useWindowDimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SearchBar from "@/src/components/SearchBar";
import StatsGrid from "./StatsGrid";
import RoomSearchBar from "./RoomSearchBar";
import RoomCard from "./RoomCard";
import RoomFilterSheet, {
  RoomFilter,
  emptyFilter,
} from "@/src/components/property/RoomFilterSheet";

import { mockRooms } from "@/src/constants/mockRooms"; // ← your 15 dummy rooms

/* --------------------------------------------------------------- */
export default function RoomsTab() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  /* ───────────────── state ───────────────── */
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<RoomFilter>(emptyFilter);

  /* ───────────────── responsive columns ───────────────── */
  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  /* ───────────────── search + filter ───────────────── */
  const rooms = useMemo(() => {
    /* ① text search (roomNo OR floor) */
    const q = query.trim().toLowerCase();
    const byQ = q
      ? mockRooms.filter(
          (r) => r.roomNo.toLowerCase().includes(q) || r.floor.toLowerCase().includes(q)
        )
      : mockRooms;

    /* ② checkbox filters */
    return byQ
      .filter((r) => !filter.status.length || filter.status.includes(r.status))
      .filter((r) => !filter.sharing.length || filter.sharing.includes(r.sharing))
      .filter((r) => !filter.floor.length || filter.floor.includes(r.floor))
      .filter(
        (r) => !filter.facilities.length || filter.facilities.every((f) => r.facilities.includes(f))
      );
  }, [query, filter]);

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
            <StatsGrid />
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
      <RoomFilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  columnGap: { gap: 14 }, // horizontal gap between cards
});
