import React, { useMemo } from "react";
import { FlatList, useWindowDimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import StatsGrid from "./StatsGrid";
import RoomSearchBar from "./RoomSearchBar";
import RoomCard from "./RoomCard";
import { mockRooms } from "@/src/constants/mockRooms";

/* ------------------------------------------------------------------ */
export default function RoomsTab() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  /* same responsive break‑points you already use elsewhere */
  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  return (
    <FlatList
      data={mockRooms} /* ← the 15 dummy rooms            */
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <RoomCard room={item} />}
      numColumns={cols}
      columnWrapperStyle={cols > 1 ? styles.columnGap : undefined}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: insets.bottom + 40,
        rowGap: 14 /* vertical gap between rows       */,
      }}
      ListHeaderComponent={
        <>
          <StatsGrid />
          <RoomSearchBar
            onSearch={(q) => console.log("search:", q)}
            onFilter={() => console.log("open filter panel")}
          />
        </>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  columnGap: { gap: 14 } /* horizontal gap between cards    */,
});
