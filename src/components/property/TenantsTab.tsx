import React, { useState, useMemo } from "react";
import { FlatList, useWindowDimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TenantSearchBar from "./RoomSearchBar";
import TenantCard from "./TenantCard";
import { emptyTenantFilter, TenantFilter } from "@/src/constants/tenantFilter";
import { mockTenants } from "@/src/constants/mockTenants";
import TenantFilterSheet from "./TenantFilterSheet";

export default function TenantsTab() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<TenantFilter>(emptyTenantFilter);

  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  const tenants = useMemo(() => {
    let filtered = mockTenants;

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
    }

    if (filter.sharing.length)
      filtered = filtered.filter((t) => filter.sharing.includes(t.sharing));
    if (filter.status.length) filtered = filtered.filter((t) => filter.status.includes(t.status));
    if (filter.downloadedApp.length)
      filtered = filtered.filter((t) => filter.downloadedApp.includes(t.downloadedApp));

    if (filter.fromDate)
      filtered = filtered.filter((t) => new Date(t.joinedOn) >= filter.fromDate!);
    if (filter.toDate) filtered = filtered.filter((t) => new Date(t.joinedOn) <= filter.toDate!);

    return filtered;
  }, [query, filter]);

  return (
    <>
      <FlatList
        data={tenants}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TenantCard tenant={item} />}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? styles.columnGap : undefined}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
          rowGap: 14,
        }}
        ListHeaderComponent={
          <TenantSearchBar
            onSearch={setQuery}
            onFilter={() => setSheetOpen(true)}
            active={
              filter.sharing.length > 0 ||
              filter.status.length > 0 ||
              filter.downloadedApp.length > 0 ||
              !!filter.fromDate ||
              !!filter.toDate
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TenantFilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  columnGap: { gap: 14 },
});
