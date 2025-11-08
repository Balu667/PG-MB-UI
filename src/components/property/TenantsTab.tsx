// src/components/property/TenantsTab.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  FlatList,
  useWindowDimensions,
  StyleSheet,
  View,
  RefreshControl,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import TenantCard from "./TenantCard";
import AddButton from "../Common/AddButton";

import { TenantFilter, emptyTenantFilter } from "@/src/constants/tenantFilter";
import { useTheme } from "@/src/theme/ThemeContext";

/** Props are injected by [id].tsx so this tab does not fetch on its own */
type Props = {
  data: any[];
  meta?: {
    totalTenants?: number;
    underNoticeTenants?: number;
    advancedBookings?: number;
    expiredBookings?: number;
    cancelledBookings?: number;
    totalDues?: number;
    appNotDownloaded?: number;
  };
  refreshing: boolean;
  onRefresh: () => void;
};

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
    options: ["Active", "Under Notice", "Adv Booking", "Expired Booking", "Canceled Booking"].map(
      (s) => ({ label: s, value: s })
    ),
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

const num = (v: any, fallback = 0) => (typeof v === "number" ? v : Number(v ?? fallback)) || 0;
const str = (v: any, fallback = "") => (v == null ? fallback : String(v));

/** Normalizers for filtering/searching */
const getName = (t: any) => str(t?.tenantName ?? t?.name ?? "", "");
const getSharing = (t: any) => num(t?.sharingType ?? t?.sharing ?? t?.sharingCount ?? 0);
const statusFromCode = (code: any): string => {
  switch (num(code)) {
    case 1:
      return "Active";
    case 2:
      return "Under Notice";
    case 3:
      return "Adv Booking";
    case 5:
      return "Expired Booking";
    case 6:
      return "Canceled Booking";
    default:
      return "";
  }
};
const getStatus = (t: any) => statusFromCode(t?.status);
const getJoinedOn = (t: any) => {
  const s = str(t?.joiningDate ?? t?.joinedOn ?? t?.joinDate ?? "", "");
  return s ? new Date(s) : null;
};
const getDownloaded = (t: any) =>
  num(t?.downloaded) === 1 ? "App Downloaded" : "App Not Downloaded";

export default function TenantsTab({ data, meta, refreshing, onRefresh }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const [list, setList] = useState<any[]>(() => (Array.isArray(data) ? data : []));
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<TenantFilter>(emptyTenantFilter);

  // keep local list synced with incoming data (so deletions remain local but refresh replaces)
  React.useEffect(() => {
    setList(Array.isArray(data) ? data : []);
  }, [data]);

  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  const tenants = useMemo(() => {
    let out = list;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((t) => getName(t).toLowerCase().includes(q));
    }

    if (filter.sharing.length) {
      out = out.filter((t) => filter.sharing.includes(getSharing(t)));
    }

    if (filter.status.length) {
      out = out.filter((t) => filter.status.includes(getStatus(t)));
    }

    if (filter.downloadedApp.length) {
      out = out.filter((t) => filter.downloadedApp.includes(getDownloaded(t)));
    }

    if (filter.fromDate)
      out = out.filter((t) => {
        const j = getJoinedOn(t);
        return j ? j >= filter.fromDate! : false;
      });
    if (filter.toDate)
      out = out.filter((t) => {
        const j = getJoinedOn(t);
        return j ? j <= filter.toDate! : false;
      });

    return out;
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
        emptyWrap: { padding: spacing.md },
        emptyTxt: { color: colors.textSecondary },
      }),
    [spacing, insets.bottom, colors.textSecondary, spacing.lg]
  );

  const handleDelete = useCallback((id: string) => {
    setList((prev) => prev.filter((t: any) => (t?._id ?? t?.id) !== id));
  }, []);

  return (
    <>
      <FlatList
        data={tenants}
        keyExtractor={(t: any, i) => String(t?._id ?? t?.id ?? i)}
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
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyTxt}>No tenants found.</Text>
          </View>
        }
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
