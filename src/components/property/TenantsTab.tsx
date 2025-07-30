import React, { useState, useMemo } from "react";
import {
  FlatList,
  useWindowDimensions,
  StyleSheet,
  Pressable,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TenantCard from "./TenantCard";
import { mockTenants } from "@/src/constants/mockTenants";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import { TenantFilter, emptyTenantFilter } from "@/src/constants/tenantFilter";
import SearchBar from "@/src/components/SearchBar";
import * as Haptics from "expo-haptics";
import AddButton from "../Common/AddButton";

const tenantSections: Section[] = [
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
    key: "status",
    label: "Status",
    mode: "checkbox",
    options: ["Active", "Dues", "Under Notice"].map((s) => ({
      label: s,
      value: s,
    })),
  },
  {
    key: "joinDate",
    label: "Joining Date",
    mode: "date",
  },
  {
    key: "downloadStatus",
    label: "Download Status",
    mode: "checkbox",
    options: [
      { label: "App Downloaded", value: "App Downloaded" },
      { label: "App Not Downloaded", value: "App Not Downloaded" },
    ],
  },
];

export default function TenantsTab() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<TenantFilter>(emptyTenantFilter);

  const cols = useMemo(
    () => (width >= 1000 ? 3 : width >= 740 ? 2 : 1),
    [width]
  );

  const tenants = useMemo(() => {
    let filtered = mockTenants;

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
    }

    if (filter.sharing.length)
      filtered = filtered.filter((t) => filter.sharing.includes(t.sharing));
    if (filter.status.length)
      filtered = filtered.filter((t) => filter.status.includes(t.status));
    if (filter.downloadedApp.length)
      filtered = filtered.filter((t) =>
        filter.downloadedApp.includes(t.downloadedApp)
      );

    if (filter.fromDate)
      filtered = filtered.filter(
        (t) => new Date(t.joinedOn) >= filter.fromDate!
      );
    if (filter.toDate)
      filtered = filtered.filter((t) => new Date(t.joinedOn) <= filter.toDate!);

    return filtered;
  }, [query, filter]);

  return (
    <>
      <FlatList
        data={tenants}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TenantCard
            tenant={item}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/protected/tenant/${item.id}`);
            }}
          />
        )}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? styles.columnGap : undefined}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
          rowGap: 14,
        }}
        ListHeaderComponent={
          <SearchBar
            placeholder="Search tenant name"
            onSearch={setQuery}
            onFilter={() => setSheetOpen(true)}
            filterActive={
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

      <FilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={tenantSections}
        resetValue={emptyTenantFilter}
      />
      <AddButton onPress={() => router.push("/protected/tenant/add")} />
    </>
  );
}

const styles = StyleSheet.create({
  columnGap: { gap: 14 },
});
