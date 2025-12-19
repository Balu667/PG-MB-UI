// src/components/property/AdvanceBookingTab.tsx
// Premium Advance Booking Tab - Compact, modern design
import React, { useMemo, useState, useCallback, RefObject } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  RefreshControl,
  Platform,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import SearchBar from "@/src/components/SearchBar";
import AddButton from "@/src/components/Common/AddButton";
import AdvancedBookingCard from "@/src/components/property/AdvancedBookingCard";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import StatsGrid from "@/src/components/StatsGrid";
import type { Metric } from "@/src/components/StatsGrid";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const str = (v: unknown, f = "") => (v == null ? f : String(v));
const num = (v: unknown, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || f;
const getName = (t: Record<string, unknown>) => str(t?.tenantName ?? t?.name ?? "", "");
const getPhone = (t: Record<string, unknown>) => str(t?.phoneNumber ?? t?.phone ?? "", "");
const getRoom = (t: Record<string, unknown>) => str(t?.roomNumber ?? t?.room ?? "", "");

/** Allowed statuses for advance booking tab */
const ALLOWED_STATUSES = new Set([3, 5, 6]);

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER TYPES & SECTIONS
───────────────────────────────────────────────────────────────────────────── */

type DateRange = { from?: Date; to?: Date };

interface AdvanceBookingFilter {
  status: number[];
  bookingDate: DateRange;
  joiningDate: DateRange;
}

const emptyFilter: AdvanceBookingFilter = {
  status: [],
  bookingDate: {},
  joiningDate: {},
};

const filterSections: Section[] = [
  {
    key: "status",
    label: "Booking Status",
    mode: "checkbox",
    options: [
      { label: "Active Booking", value: 3 },
      { label: "Expired", value: 5 },
      { label: "Cancelled", value: 6 },
    ],
  },
  {
    key: "bookingDate",
    label: "Booking Date",
    mode: "date",
    dateConfig: { allowFuture: false, fromLabel: "From", toLabel: "To" },
  },
  {
    key: "joiningDate",
    label: "Joining Date",
    mode: "date",
    dateConfig: { allowFuture: true, fromLabel: "From", toLabel: "To" },
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   DATE HELPERS
───────────────────────────────────────────────────────────────────────────── */

const parseDate = (v: unknown): Date | null => {
  try {
    const s = str(v, "");
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const endOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const normalizeRange = (from?: Date, to?: Date) => {
  if (from && to && to.getTime() < from.getTime()) {
    return { from: to, to: from };
  }
  return { from, to };
};

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  filtered: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ filtered }) => {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xl * 2,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
        }}
      >
        <MaterialCommunityIcons
          name={filtered ? "filter-off" : "calendar-blank-multiple"}
          size={28}
          color={colors.accent}
        />
      </View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: 4,
        }}
      >
        {filtered ? "No Results Found" : "No Advance Bookings"}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.textSecondary,
          textAlign: "center",
          maxWidth: 240,
        }}
      >
        {filtered
          ? "Try adjusting your filters or search query."
          : "Tap the + button to create an advance booking."}
      </Text>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface Props {
  data: Record<string, unknown>[];
  refreshing: boolean;
  onRefresh: () => void;
  scrollRef?: RefObject<FlatList>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export default function AdvanceBookingTab({ data, refreshing, onRefresh, scrollRef, onScroll }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();

  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<AdvanceBookingFilter>(emptyFilter);

  // Ensure data is always an array
  const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Responsive columns
  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalBookings = list.length;
    const activeBookings = list.filter((t) => num(t?.status) === 3).length;
    const expiredBookings = list.filter((t) => num(t?.status) === 5).length;
    const cancelledBookings = list.filter((t) => num(t?.status) === 6).length;
    const totalAmount = list.reduce((sum, t) => {
      return sum + num(t?.advanceRentAmountPaid) + num(t?.advanceDepositAmountPaid);
    }, 0);

    return { totalBookings, activeBookings, expiredBookings, cancelledBookings, totalAmount };
  }, [list]);

  // Metrics for StatsGrid
  const metrics: Metric[] = useMemo(
    () => [
      {
        key: "total",
        label: "Total Bookings",
        value: stats.totalBookings,
        icon: "calendar-multiple",
        iconBg: "#DBEAFE",
        iconColor: "#2563EB",
      },
      {
        key: "active",
        label: "Active",
        value: stats.activeBookings,
        icon: "calendar-check",
        iconBg: "#DCFCE7",
        iconColor: "#16A34A",
      },
      {
        key: "expired",
        label: "Expired",
        value: stats.expiredBookings,
        icon: "calendar-remove",
        iconBg: "#FEE2E2",
        iconColor: "#DC2626",
      },
      {
        key: "cancelled",
        label: "Cancelled",
        value: stats.cancelledBookings,
        icon: "close-circle",
        iconBg: "#F3F4F6",
        iconColor: "#6B7280",
      },
    ],
    [stats]
  );

  // Check if filter is active
  const filterIsActive = useMemo(
    () =>
    (filter.status?.length ?? 0) > 0 ||
    !!filter.bookingDate.from ||
    !!filter.bookingDate.to ||
    !!filter.joiningDate.from ||
      !!filter.joiningDate.to,
    [filter]
  );

  // Apply filters
  const filtered = useMemo(() => {
    let out = list.filter((t) => ALLOWED_STATUSES.has(num(t?.status)));

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      out = out.filter(
        (t) =>
          getName(t).toLowerCase().includes(q) ||
          getPhone(t).toLowerCase().includes(q) ||
          getRoom(t).toLowerCase().includes(q)
      );
    }

    // Status filter
    if ((filter.status?.length ?? 0) > 0) {
      const statusSet = new Set(filter.status.map((x) => num(x)));
      out = out.filter((t) => statusSet.has(num(t?.status)));
    }

    // Booking date range
    const { from: bFrom, to: bTo } = normalizeRange(
      filter.bookingDate.from,
      filter.bookingDate.to
    );
    if (bFrom || bTo) {
      const bFromLocal = bFrom ? startOfDayLocal(bFrom) : undefined;
      const bToLocal = bTo ? endOfDayLocal(bTo) : undefined;

        out = out.filter((t) => {
          const d = parseDate(t?.bookingDate);
          if (!d) return false;
        if (bFromLocal && d < bFromLocal) return false;
        if (bToLocal && d > bToLocal) return false;
          return true;
        });
      }

    // Joining date range
    const { from: jFrom, to: jTo } = normalizeRange(
      filter.joiningDate.from,
      filter.joiningDate.to
    );
    if (jFrom || jTo) {
      const jFromLocal = jFrom ? startOfDayLocal(jFrom) : undefined;
      const jToLocal = jTo ? endOfDayLocal(jTo) : undefined;

        out = out.filter((t) => {
        const d =
          parseDate(t?.joiningDate) ?? parseDate(t?.joinedOn) ?? parseDate(t?.joinDate);
          if (!d) return false;
        if (jFromLocal && d < jFromLocal) return false;
        if (jToLocal && d > jToLocal) return false;
          return true;
        });
      }

    // Sort: Active first, then by booking date (most recent first)
    out.sort((a, b) => {
      const statusA = num(a?.status);
      const statusB = num(b?.status);
      if (statusA === 3 && statusB !== 3) return -1;
      if (statusB === 3 && statusA !== 3) return 1;
      const dateA = parseDate(a?.bookingDate)?.getTime() ?? 0;
      const dateB = parseDate(b?.bookingDate)?.getTime() ?? 0;
      return dateB - dateA;
    });

    return out;
  }, [list, query, filter]);

  // Handlers
  const handleEdit = useCallback(
    (tenantId: string) => {
      if (!tenantId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: "/protected/advancedBooking/[id]",
        params: { id: tenantId, mode: "edit" },
      });
    },
    [router]
  );

  const handleConvertToTenant = useCallback(
    (tenant: Record<string, unknown>) => {
      const tenantId = str(tenant?._id ?? tenant?.id ?? "", "");
      if (!tenantId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: "/protected/advancedBooking/[id]",
        params: { id: tenantId, mode: "convert" },
      });
    },
    [router]
  );

  const handleAddBooking = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/protected/advancedBooking/add");
  }, [router]);

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          paddingHorizontal: spacing.xs,
          paddingTop: spacing.xs,
        },
        sectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: spacing.xs,
          marginBottom: spacing.xs,
        },
        sectionIconBadge: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        sectionTitle: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.textPrimary,
          flex: 1,
        },
        countBadge: {
          backgroundColor: hexToRgba(colors.accent, 0.12),
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.full,
        },
        countText: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.accent,
        },
        columnGap: {
          gap: spacing.md,
        },
        listContent: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.lg * 2,
          rowGap: spacing.md,
        },
      }),
    [colors, spacing, radius, insets.bottom]
  );

  // List header
  const ListHeader = useMemo(
    () => (
      <View style={styles.header}>
        {/* Stats Grid */}
        {metrics.length > 0 && (
          <StatsGrid
            metrics={metrics}
            minVisible={3}
            cardHeight={72}
          />
        )}

        {/* Search bar */}
          <SearchBar
          placeholder="Search by name, phone, room..."
            onSearch={setQuery}
            onFilter={() => setSheetOpen(true)}
            filterActive={filterIsActive}
          />

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBadge}>
            <MaterialCommunityIcons
              name="calendar-multiple"
              size={14}
              color={colors.accent}
            />
          </View>
          <Text style={styles.sectionTitle}>Bookings</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        </View>
          </View>
    ),
    [styles, metrics, width, filterIsActive, filtered.length, colors.accent]
  );

  const renderItem = useCallback(
    ({ item }: { item: Record<string, unknown> }) => (
      <AdvancedBookingCard
        tenant={item}
        onEdit={handleEdit}
        onConvertToTenant={handleConvertToTenant}
      />
    ),
    [handleEdit, handleConvertToTenant]
  );

  const keyExtractor = useCallback(
    (item: Record<string, unknown>, index: number) =>
      String(item?._id ?? item?.id ?? index),
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={scrollRef}
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={cols}
        key={cols}
        columnWrapperStyle={cols > 1 ? styles.columnGap : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={<EmptyState filtered={!!query.trim() || filterIsActive} />}
        refreshControl={
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
        removeClippedSubviews
        initialNumToRender={10}
        windowSize={10}
        maxToRenderPerBatch={10}
      />

      {/* Filter Sheet */}
      <FilterSheet<AdvanceBookingFilter>
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={filterSections}
        resetValue={emptyFilter}
      />

      {/* Add Button */}
      <AddButton onPress={handleAddBooking} />
    </View>
  );
}
