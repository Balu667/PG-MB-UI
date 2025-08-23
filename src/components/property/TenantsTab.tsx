// import React, { useMemo, useState } from "react";
// import { FlatList, useWindowDimensions, StyleSheet, ListRenderItemInfo, Text } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import * as Haptics from "expo-haptics";

// import SearchBar from "@/src/components/SearchBar";
// import FilterSheet, { Section } from "@/src/components/FilterSheet";
// import TenantCard from "./TenantCard";
// import AddButton from "../Common/AddButton";

// import { mockTenants } from "@/src/constants/mockTenants";
// import { TenantFilter, emptyTenantFilter } from "@/src/constants/tenantFilter";

// import { useTheme } from "@/src/theme/ThemeContext";

// /* ------------------------------------------------------------------ */
// /*  FILTER-SIDEBAR CONFIG                                              */
// /* ------------------------------------------------------------------ */
// const tenantSections: Section[] = [
//   {
//     key: "sharing",
//     label: "Sharing",
//     mode: "checkbox",
//     options: Array.from({ length: 10 }, (_, i) => ({
//       label: `${i + 1} Sharing`,
//       value: i + 1,
//     })),
//   },
//   {
//     key: "status",
//     label: "Status",
//     mode: "checkbox",
//     options: ["Active", "Dues", "Under Notice"].map((s) => ({
//       label: s,
//       value: s,
//     })),
//   },
//   { key: "joinDate", label: "Joining Date", mode: "date" },
//   {
//     key: "downloadStatus",
//     label: "Download Status",
//     mode: "checkbox",
//     options: [
//       { label: "App Downloaded", value: "App Downloaded" },
//       { label: "App Not Downloaded", value: "App Not Downloaded" },
//     ],
//   },
// ];

// /* ------------------------------------------------------------------ */
// /*  COMPONENT                                                          */
// /* ------------------------------------------------------------------ */
// export default function TenantsTab() {
//   const { width } = useWindowDimensions();
//   const insets = useSafeAreaInsets();
//   const router = useRouter();
//   const { colors, spacing } = useTheme();

//   /* ---------------- state ---------------- */
//   const [query, setQuery] = useState("");
//   const [sheetOpen, setSheetOpen] = useState(false);
//   const [filter, setFilter] = useState<TenantFilter>(emptyTenantFilter);

//   /* ---------------- responsive cols ------- */
//   const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

//   /* ---------------- search + filter ------- */
//   const tenants = useMemo(() => {
//     let data = mockTenants;

//     /* text search */
//     if (query.trim()) {
//       const q = query.trim().toLowerCase();
//       data = data.filter((t) => t.name.toLowerCase().includes(q));
//     }

//     /* sharing - status - app download */
//     if (filter.sharing.length) data = data.filter((t) => filter.sharing.includes(t.sharing));
//     if (filter.status.length) data = data.filter((t) => filter.status.includes(t.status));
//     if (filter.downloadedApp.length)
//       data = data.filter((t) => filter.downloadedApp.includes(t.downloadedApp));

//     /* date range */
//     if (filter.fromDate) data = data.filter((t) => new Date(t.joinedOn) >= filter.fromDate!);
//     if (filter.toDate) data = data.filter((t) => new Date(t.joinedOn) <= filter.toDate!);

//     return data;
//   }, [query, filter]);

//   /* ---------------- themed styles --------- */
//   const s = useMemo(
//     () =>
//       StyleSheet.create({
//         columnGap: { gap: spacing.md - 2 },
//         listContent: {
//           paddingHorizontal: spacing.md,
//           paddingTop: spacing.md,
//           paddingBottom: insets.bottom + spacing.lg * 2,
//           rowGap: spacing.md - 2,
//         },
//       }),
//     [spacing, insets.bottom]
//   );

//   /* ---------------- render helpers -------- */
//   const renderTenant = ({ item }: ListRenderItemInfo<any>) => (
//     <TenantCard
//       tenant={item}
//       onPress={() => {
//         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//         router.push(`/protected/tenant/${item.id}`);
//       }}
//     />
//   );

//   const filterIsActive =
//     filter.sharing.length > 0 ||
//     filter.status.length > 0 ||
//     filter.downloadedApp.length > 0 ||
//     !!filter.fromDate ||
//     !!filter.toDate;

//   /* ---------------- render ---------------- */
//   return (
//     <>
//       <FlatList
//         data={tenants}
//         keyExtractor={(t) => t.id}
//         renderItem={renderTenant}
//         numColumns={cols}
//         columnWrapperStyle={cols > 1 ? s.columnGap : undefined}
//         contentContainerStyle={s.listContent}
//         showsVerticalScrollIndicator={false}
//         ListHeaderComponent={
//           <SearchBar
//             placeholder="Search tenant name"
//             onSearch={setQuery}
//             onFilter={() => setSheetOpen(true)}
//             filterActive={filterIsActive}
//           />
//         }
//       />

//       {/* bottom-sheet */}
//       <FilterSheet
//         visible={sheetOpen}
//         value={filter}
//         onChange={setFilter}
//         onClose={() => setSheetOpen(false)}
//         sections={tenantSections}
//         resetValue={emptyTenantFilter}
//       />

//       {/* add-new button (floats on screen) */}
//       <AddButton onPress={() => router.push("/protected/tenant/add")} />
//     </>
//   );
// }

// src/components/property/TenantsTab.tsx
import React, { useMemo, useState, useCallback } from "react";
import { FlatList, useWindowDimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import TenantCard from "./TenantCard";
import AddButton from "../Common/AddButton";

import { mockTenants, Tenant } from "@/src/constants/mockTenants";
import { TenantFilter, emptyTenantFilter } from "@/src/constants/tenantFilter";

import { useTheme } from "@/src/theme/ThemeContext";

const tenantSections: Section[] = [
  {
    key: "sharing",
    label: "Sharing",
    mode: "checkbox",
    options: Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1} Sharing`, value: i + 1 })),
  },
  {
    key: "status",
    label: "Status",
    mode: "checkbox",
    options: ["Active", "Dues", "Under Notice"].map((s) => ({ label: s, value: s })),
  },
  { key: "joinDate", label: "Joining Date", mode: "date" },
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
  const { colors, spacing } = useTheme();

  // Make a local working copy so we can delete from list
  const [list, setList] = useState<Tenant[]>(() => [...mockTenants]);

  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<TenantFilter>(emptyTenantFilter);

  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  const tenants = useMemo(() => {
    let data = list;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      data = data.filter((t) => t.name.toLowerCase().includes(q));
    }
    if (filter.sharing.length) data = data.filter((t) => filter.sharing.includes(t.sharing));
    if (filter.status.length) data = data.filter((t) => filter.status.includes(t.status));
    if (filter.downloadedApp.length)
      data = data.filter((t) => filter.downloadedApp.includes(t.downloadedApp));
    if (filter.fromDate) data = data.filter((t) => new Date(t.joinedOn) >= filter.fromDate!);
    if (filter.toDate) data = data.filter((t) => new Date(t.joinedOn) <= filter.toDate!);

    return data;
  }, [query, filter, list]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        columnGap: { gap: spacing.md - 2 },
        listContent: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.lg * 2,
          rowGap: spacing.md - 2,
        },
      }),
    [spacing, insets.bottom]
  );

  const handleDelete = useCallback((id: string) => {
    setList((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      <FlatList
        data={tenants}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TenantCard tenant={item} onDelete={handleDelete} />}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? s.columnGap : undefined}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
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
      />

      <FilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={tenantSections}
        resetValue={emptyTenantFilter}
      />

      <AddButton
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/protected/tenant/add");
        }}
      />
    </>
  );
}
