// src/components/property/AdvanceBookingTab.tsx
import React, { useMemo, useState, useCallback } from "react";
import { FlatList, StyleSheet, View, Text, RefreshControl } from "react-native";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import SearchBar from "@/src/components/SearchBar";
import AddButton from "@/src/components/Common/AddButton";
import AdvancedBookingCard from "@/src/components/property/AdvancedBookingCard";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import { hexToRgba } from "@/src/theme";

const str = (v: any, f = "") => (v == null ? f : String(v));
const num = (v: any, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || 0;
const getName = (t: any) => str(t?.tenantName ?? t?.name ?? "", "");

/** allowed statuses for this tab */
const ALLOWED = new Set([3, 5, 6]);

/* ---------------------------- Filter typing ---------------------------- */
type DateRange = { from?: Date; to?: Date };
type AdvanceBookingFilter = {
  status: number[]; // {3,5,6}
  bookingDate: DateRange; // filters on tenant.bookingDate
  joiningDate: DateRange; // filters on tenant.joiningDate (or joinedOn/joinDate)
};

const emptyAdvanceBookingFilter: AdvanceBookingFilter = {
  status: [],
  bookingDate: {},
  joiningDate: {},
};

/* ---------------------------- Filter sections ---------------------------- */
const sections: Section[] = [
  {
    key: "status",
    label: "Status",
    mode: "checkbox",
    options: [
      { label: "Active", value: 3 }, // Adv Booking = 3
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
    dateConfig: { allowFuture: true, fromLabel: "From", toLabel: "To" }, // Joining can be future
  },
];

/* ------------------------------ Helpers ------------------------------ */
const parseDate = (v: any) => {
  try {
    const s = str(v, "");
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

// Normalize a Date to the local start/end of day
const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// If user accidentally picks to<from, swap so the range still works
const normalizeRange = (from?: Date, to?: Date) => {
  if (from && to && to.getTime() < from.getTime()) {
    return { from: to, to: from };
  }
  return { from, to };
};

type Props = {
  data: any[];
  refreshing: boolean;
  onRefresh: () => void;
};

export default function AdvanceBookingTab({ data, refreshing, onRefresh }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const [query, setQuery] = useState("");
  const [list, setList] = useState(() => (Array.isArray(data) ? data : []));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<AdvanceBookingFilter>(emptyAdvanceBookingFilter);

  React.useEffect(() => setList(Array.isArray(data) ? data : []), [data]);

  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  const filterIsActive =
    (filter.status?.length ?? 0) > 0 ||
    !!filter.bookingDate.from ||
    !!filter.bookingDate.to ||
    !!filter.joiningDate.from ||
    !!filter.joiningDate.to;

  const filtered = useMemo(() => {
    let out = list.filter((t: any) => ALLOWED.has(num(t?.status)));

    // text search
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      out = out.filter((t) => getName(t).toLowerCase().includes(q));
    }

    // status filter
    if ((filter.status?.length ?? 0) > 0) {
      const sset = new Set(filter.status.map((x) => num(x)));
      out = out.filter((t) => sset.has(num(t?.status)));
    }

    // booking date range (inclusive)
    {
      const { from, to } = normalizeRange(filter.bookingDate.from, filter.bookingDate.to);
      const bFrom = from ? startOfDayLocal(from) : undefined;
      const bTo = to ? endOfDayLocal(to) : undefined;

      if (bFrom || bTo) {
        out = out.filter((t) => {
          const d = parseDate(t?.bookingDate);
          if (!d) return false;
          if (bFrom && d < bFrom) return false;
          if (bTo && d > bTo) return false;
          return true;
        });
      }
    }

    // joining date range (inclusive)
    {
      const { from, to } = normalizeRange(filter.joiningDate.from, filter.joiningDate.to);
      const jFrom = from ? startOfDayLocal(from) : undefined;
      const jTo = to ? endOfDayLocal(to) : undefined;

      if (jFrom || jTo) {
        out = out.filter((t) => {
          const d = parseDate(t?.joiningDate) ?? parseDate(t?.joinedOn) ?? parseDate(t?.joinDate);
          if (!d) return false;
          if (jFrom && d < jFrom) return false;
          if (jTo && d > jTo) return false;
          return true;
        });
      }
    }

    return out;
  }, [list, query, filter]);

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

  const handleDelete = useCallback(
    (id: string) => setList((prev) => prev.filter((t: any) => String(t?._id ?? t?.id) !== id)),
    []
  );

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
    (tenant: any) => {
      const tenantId = str(tenant?._id ?? tenant?.id ?? "", "");
      if (!tenantId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: "/protected/advancedBooking/[id]",
        params: { id: tenantId, mode: "convert" },
      });
    },
    [router]
  );

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={(t: any, i) => String(t?._id ?? t?.id ?? i)}
        renderItem={({ item }) => (
          <AdvancedBookingCard
            tenant={item}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onConvertToTenant={handleConvertToTenant}
          />
        )}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? s.columnGap : undefined}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SearchBar
            placeholder="Search advance bookings"
            onSearch={setQuery}
            onFilter={() => setSheetOpen(true)}
            filterActive={filterIsActive}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyTxt}>No advance bookings found.</Text>
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

      {/* Filter Sheet */}
      <FilterSheet<AdvanceBookingFilter>
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={sections}
        resetValue={emptyAdvanceBookingFilter}
      />

      <AddButton
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/protected/advancedBooking/add");
        }}
      />
    </>
  );
}
