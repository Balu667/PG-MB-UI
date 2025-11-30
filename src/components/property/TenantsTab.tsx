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
    // includes "Dues" as a pseudo-status (due > 0)
    options: ["Active", "Under Notice", "Dues"].map((s) => ({ label: s, value: s })),
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
  // Prefer the correct field; only fall back to bookingDate if needed
  const s = str(t?.joiningDate ?? t?.joinedOn ?? t?.joinDate ?? t?.bookingDate ?? "", "");
  try {
    return s ? new Date(s) : null;
  } catch {
    return null;
  }
};

const getDownloaded = (t: any) =>
  num(t?.downloaded) === 1 ? "App Downloaded" : "App Not Downloaded";

// normalize "App Downloaded"/"Downloaded" and "App Not Downloaded"/"Not Downloaded"
const normalizeDownloadLabel = (v: string) =>
  str(v, "")
    .replace(/^app\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// due amount
const getDue = (t: any) => num(t?.due);

// ---- robust day helpers (local time) ----
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const addDays = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, 0, 0, 0, 0);

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

    // ---- search by name ----
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((t) => getName(t).toLowerCase().includes(q));
    }

    // ---- sharing filter ----
    if (Array.isArray(filter.sharing) && filter.sharing.length) {
      out = out.filter((t) => filter.sharing.includes(getSharing(t)));
    }

    // ---- status + dues union filter ----
    if (Array.isArray(filter.status) && filter.status.length) {
      const wantsDues = filter.status.includes("Dues" as any);
      const realStatuses = filter.status.filter((s) => s !== ("Dues" as any));
      out = out.filter((t) => {
        const statusLabel = getStatus(t);
        const statusMatch = realStatuses.length ? realStatuses.includes(statusLabel as any) : false;
        const duesMatch = wantsDues ? getDue(t) > 0 : false;
        return statusMatch || duesMatch;
      });
    }

    // ---- download status (support both filter keys: downloadedApp & downloadStatus) ----
    const fromDownloadedApp = Array.isArray(filter.downloadedApp) ? filter.downloadedApp : [];
    const fromDownloadStatus = Array.isArray((filter as any)?.downloadStatus)
      ? (filter as any).downloadStatus
      : [];
    const selectedDownload = [...fromDownloadedApp, ...fromDownloadStatus]
      .filter(Boolean)
      .map(normalizeDownloadLabel);

    if (selectedDownload.length) {
      out = out.filter((t) => selectedDownload.includes(normalizeDownloadLabel(getDownloaded(t))));
    }

    // ---- join date range (support both fromDate/toDate and joinDate.{from,to}) ----
    const joinDateRange: { from?: Date | string; to?: Date | string } =
      (filter as any)?.joinDate && typeof (filter as any).joinDate === "object"
        ? (filter as any).joinDate
        : {};

    const coerceDate = (d?: Date | string) => {
      if (!d) return undefined;
      if (d instanceof Date) return d;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const rawFrom = filter.fromDate ?? coerceDate(joinDateRange.from);
    const rawTo = filter.toDate ?? coerceDate(joinDateRange.to);

    // NEW: use [fromStart, toNextStart) for inclusive end-day
    const fromStart = rawFrom ? startOfDay(rawFrom) : undefined;
    const toNextStart = rawTo ? addDays(startOfDay(rawTo), 1) : undefined;

    if (fromStart) {
      const fromMs = fromStart.getTime();
      out = out.filter((t) => {
        const j = getJoinedOn(t);
        return j ? j.getTime() >= fromMs : false;
      });
    }

    if (toNextStart) {
      const toMs = toNextStart.getTime();
      out = out.filter((t) => {
        const j = getJoinedOn(t);
        return j ? j.getTime() < toMs : false; // exclusive next-day start
      });
    }

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

  const filterActive =
    (Array.isArray(filter.sharing) && filter.sharing.length > 0) ||
    (Array.isArray(filter.status) && filter.status.length > 0) ||
    (Array.isArray(filter.downloadedApp) && filter.downloadedApp.length > 0) ||
    (Array.isArray((filter as any)?.downloadStatus) && (filter as any).downloadStatus.length > 0) ||
    !!filter.fromDate ||
    !!filter.toDate ||
    !!(filter as any)?.joinDate?.from ||
    !!(filter as any)?.joinDate?.to;

  return (
    <>
      <FlatList
        data={tenants?.filter((item) => item?.status === 1 || item?.status === 2)}
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
            filterActive={filterActive}
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
