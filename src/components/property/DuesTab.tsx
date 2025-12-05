// src/components/property/DuesTab.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  RefreshControl,
  Pressable,
  Platform,
} from "react-native";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import StatsGrid, { Metric } from "@/src/components/StatsGrid";

/* -------------------------- helpers -------------------------- */
type DateRange = { from?: Date; to?: Date };

const str = (v: any, f = "") => (v == null ? f : String(v));
const num = (v: any, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || 0;
const toDate = (s?: any): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};
const inr = (n: any) => `₹ ${num(n).toLocaleString("en-IN")}`;

/** local date display */
const fmtDate = (iso?: string) => {
  const d = toDate(iso);
  return d
    ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
};
/** month-year like "Oct 2025" */
const monthOf = (iso?: string) => {
  const d = toDate(iso);
  return d ? d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—";
};

/** inclusive within [from..to], on local day boundary */
const withinRange = (dtISO?: string, range?: DateRange) => {
  if (!range || (!range.from && !range.to)) return true;
  const d = toDate(dtISO);
  if (!d) return false;
  const t = d.getTime();
  if (range.from) {
    const from0 = new Date(
      range.from.getFullYear(),
      range.from.getMonth(),
      range.from.getDate(),
      0,
      0,
      0,
      0
    ).getTime();
    if (t < from0) return false;
  }
  if (range.to) {
    const toEnd = new Date(
      range.to.getFullYear(),
      range.to.getMonth(),
      range.to.getDate(),
      23,
      59,
      59,
      999
    ).getTime();
    if (t > toEnd) return false;
  }
  return true;
};

/* --------------------------- types --------------------------- */
type Props = {
  data: any[]; // payments array from API
  metrics?: Metric[]; // dues summary metrics
  refreshing: boolean;
  onRefresh: () => void;
};

/* ------------------------- filter defs ----------------------- */
const sections: Section[] = [
  {
    key: "dueDate",
    label: "Due Date",
    mode: "date",
    dateConfig: { allowFuture: true, fromLabel: "From", toLabel: "To" }, // Dues can be future
  },
];

/* --------------------------- component ----------------------- */
export default function DuesTab({ data, metrics = [], refreshing, onRefresh }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, radius } = useTheme();

  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<{ dueDate?: DateRange }>({});

  const s = useMemo(
    () =>
      StyleSheet.create({
        listContent: {
          paddingHorizontal: spacing.md,
          paddingBottom: insets.bottom + spacing.lg * 2,
          rowGap: spacing.md - 2,
        },

        /* header pack (Stats + Search) */
        headerWrap: {
          paddingTop: spacing.md - 2,
          marginBottom: spacing.sm - 2,
          gap: spacing.md - 2,
        },

        /* card */
        card: {
          borderRadius: 18,
          padding: spacing.md + 2,
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.borderColor,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        },
        leftWrap: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
        avatar: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hexToRgba(colors.accent, 0.12),
        },
        avatarTxt: { color: colors.accent, fontWeight: "800", fontSize: 16 },
        titleWrap: { flex: 1 },
        title: { color: colors.textPrimary, fontWeight: "800", fontSize: typography.fontSizeMd },
        subTitle: { color: colors.textSecondary, marginTop: 2, fontWeight: "600" },

        amountBig: { color: colors.textPrimary, fontWeight: "800", fontSize: 18 },

        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
          gap: 12,
        },
        label: { color: colors.textSecondary, fontWeight: "700" },
        value: { color: colors.textPrimary, fontWeight: "800" },

        chipsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: spacing.sm,
          marginBottom: spacing.sm,
        },
        chip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
        },
        chipTxt: { color: colors.textPrimary, fontWeight: "700" },

        sep: {
          height: 1,
          backgroundColor: hexToRgba(colors.textSecondary, 0.1),
          marginVertical: spacing.sm,
        },

        actions: {
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: spacing.sm,
          gap: 10,
        },
        payBtn: {
          borderRadius: radius.lg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: hexToRgba("#16A34A", 0.15), // light green
          borderWidth: 1,
          borderColor: hexToRgba("#16A34A", 0.35),
        },
        payTxt: { fontWeight: "800", color: "#166534" },
        editBtn: {
          borderRadius: radius.lg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderColor,
        },
        editTxt: { fontWeight: "800", color: colors.textPrimary },

        emptyWrap: { padding: spacing.md },
        emptyTxt: { color: colors.textSecondary },
      }),
    [colors, spacing, typography, radius, insets.bottom]
  );

  /* -------------- filter + search ---------------- */
  const filtered = useMemo(() => {
    let out = Array.isArray(data) ? data : [];

    // search by name / room / phone
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((p) => {
        const name = str(p?.tenantDetails?.name).toLowerCase();
        const room = str(p?.tenantDetails?.roomNumber).toLowerCase();
        const phone = str(p?.tenantDetails?.phoneNumber).toLowerCase();
        return name.includes(q) || room.includes(q) || phone.includes(q);
      });
    }

    // due-date range
    const range = filter?.dueDate;
    if (range?.from || range?.to) {
      out = out.filter((p) => withinRange(p?.dueDate, range));
    }

    // guard to dues only if API ever mixes
    out = out.filter((p) => num(p?.status) === 2);

    return out;
  }, [data, query, filter]);

  const filterActive = !!filter?.dueDate?.from || !!filter?.dueDate?.to;

  /* -------------- actions ---------------- */
  const onPayNow = useCallback((item: any) => {
    Haptics.selectionAsync();
    // TODO: integrate payment flow / route when ready
  }, []);

  const onEdit = useCallback((item: any) => {
    Haptics.selectionAsync();
    // TODO: navigate to edit screen when available
  }, []);

  const initials = (name?: string) =>
    str(name)
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w?.[0]?.toUpperCase() || "")
      .join("") || "PG";

  const Header = () => (
    <View style={s.headerWrap}>
      {Array.isArray(metrics) && metrics.length > 0 ? (
        <StatsGrid
          metrics={metrics}
          minVisible={width >= 900 ? 4 : width >= 740 ? 3 : 2}
          cardHeight={92}
        />
      ) : null}

      <SearchBar
        placeholder="Search by name, room or phone"
        onSearch={setQuery}
        onFilter={() => setSheetOpen(true)}
        filterActive={filterActive}
      />
    </View>
  );

  const renderItem = ({ item }: { item: any }) => {
    const name = str(item?.tenantDetails?.name, "—");
    const room = str(item?.tenantDetails?.roomNumber, "—");
    const phone = str(item?.tenantDetails?.phoneNumber, "—");
    const totalAmt = inr(item?.totalAmount);
    const dueAmt = inr(item?.amount);
    const category = str(item?.paymentCategory, "—");
    const dueMonth = monthOf(item?.dueDate);
    const dueOn = fmtDate(item?.dueDate);
    const mode = str(item?.paymentMode, "—");

    return (
      <View style={s.card}>
        {/* header */}
        <View style={s.headerRow}>
          <View style={s.leftWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{initials(name)}</Text>
            </View>
            <View style={s.titleWrap}>
              <Text style={s.title} numberOfLines={1}>
                {name}
              </Text>
              <Text style={s.subTitle}>Room No: {room}</Text>
            </View>
          </View>

          {/* Big Due amount */}
          <Text style={s.amountBig}>{dueAmt}</Text>
        </View>

        {/* chips: category (with month), payment mode, due date */}
        <View style={s.chipsRow}>
          <View style={s.chip}>
            <MaterialIcons name="category" size={16} color={colors.textPrimary} />
            <Text style={s.chipTxt}>
              {category} {dueMonth !== "—" ? `(${dueMonth})` : ""}
            </Text>
          </View>

          <View style={s.chip}>
            <MaterialIcons name="payments" size={16} color={colors.textPrimary} />
            <Text style={s.chipTxt}>{mode}</Text>
          </View>

          <View style={s.chip}>
            <MaterialIcons name="event" size={16} color={colors.textPrimary} />
            <Text style={s.chipTxt}>Due: {dueOn}</Text>
          </View>
        </View>

        <View style={s.sep} />

        {/* details */}
        <View style={s.row}>
          <Text style={s.label}>Name</Text>
          <Text style={s.value}>{name}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Room No</Text>
          <Text style={s.value}>{room}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Phone No</Text>
          <Text style={s.value}>{phone}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Total Amount</Text>
          <Text style={s.value}>{totalAmt}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Due Amount</Text>
          <Text style={s.value}>{dueAmt}</Text>
        </View>

        {/* actions */}
        <View style={s.actions}>
          <Pressable
            onPress={() => onPayNow(item)}
            style={({ pressed }) => [
              s.payBtn,
              pressed && Platform.OS === "ios" && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Pay now"
          >
            <MaterialIcons name="check-circle" size={18} color="#15803D" />
            <Text style={s.payTxt}>Pay now</Text>
          </Pressable>

          <Pressable
            onPress={() => onEdit(item)}
            style={({ pressed }) => [
              s.editBtn,
              pressed && Platform.OS === "ios" && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit"
          >
            <MaterialIcons name="edit" size={18} color={colors.textPrimary} />
            <Text style={s.editTxt}>Edit</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={(t: any, i) => String(t?._id ?? t?.id ?? i)}
        renderItem={renderItem}
        numColumns={1}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={<Header />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyTxt}>No dues found.</Text>
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
        sections={sections}
        resetValue={{}}
      />
    </>
  );
}
