// src/components/property/CollectionsTab.tsx
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

type Collection = {
  _id?: string;
  id?: string;
  tenantDetails?: {
    _id?: string;
    name?: string;
    roomNumber?: string;
  };
  paymentDate?: string; // ISO
  dueDate?: string; // ISO
  paymentCategory?: string; // "rent" | ...
  totalAmount?: number;
  amount?: number;
  paymentMode?: string; // "cash" | "upi" | ...
  status?: number;
};

type Props = {
  data: Collection[];
  metrics?: Metric[];
  refreshing: boolean;
  onRefresh: () => void;
};

type DateFilter = { from?: Date; to?: Date };
type FilterShape = { paymentDate?: DateFilter };

const str = (v: any, f = "") => (v == null ? f : String(v));
const num = (v: any, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || 0;
const toDate = (s?: any): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};
const inr = (n: any) => `₹ ${num(n).toLocaleString("en-IN")}`;
const fmtDate = (iso?: string) => {
  const d = toDate(iso);
  return d
    ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
};
const monthOf = (iso?: string) => {
  const d = toDate(iso);
  return d ? d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—";
};

// inclusive date range filter: [from, to]
const withinRange = (dtISO?: string, range?: DateFilter) => {
  if (!range || (!range.from && !range.to)) return true;
  const d = toDate(dtISO);
  if (!d) return false;
  const t = d.getTime();
  if (
    range.from &&
    t <
      new Date(
        range.from.getFullYear(),
        range.from.getMonth(),
        range.from.getDate(),
        0,
        0,
        0,
        0
      ).getTime()
  )
    return false;
  if (
    range.to &&
    t >
      new Date(
        range.to.getFullYear(),
        range.to.getMonth(),
        range.to.getDate(),
        23,
        59,
        59,
        999
      ).getTime()
  )
    return false;
  return true;
};

const sections: Section[] = [{ key: "paymentDate", label: "Payment Date", mode: "date" }];

export default function CollectionsTab({ data, metrics = [], refreshing, onRefresh }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, radius } = useTheme();

  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<FilterShape>({});

  // ---------- category color map (subtle, themed) ----------
  const catColor = useCallback(
    (cat?: string) => {
      const key = str(cat).toLowerCase();
      if (key.includes("rent")) {
        return { bg: hexToRgba(colors.accent, 0.08), fg: colors.accent };
      }
      if (key.includes("water")) {
        return { bg: hexToRgba("#06B6D4", 0.12), fg: "#0E7490" };
      }
      if (key.includes("internet") || key.includes("wifi")) {
        return { bg: hexToRgba("#A78BFA", 0.14), fg: "#6D28D9" };
      }
      return { bg: hexToRgba(colors.textSecondary, 0.08), fg: colors.textPrimary };
    },
    [colors]
  );

  const s = useMemo(
    () =>
      StyleSheet.create({
        listContent: {
          paddingHorizontal: spacing.md,
          paddingBottom: insets.bottom + spacing.lg * 2,
          rowGap: spacing.md - 2,
        },

        // ---------- header ----------
        headerWrap: {
          paddingTop: spacing.md - 2,
          marginBottom: spacing.sm - 2,
          gap: spacing.md - 2,
        },

        // ---------- card ----------
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

        // meta chips row
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

        // divider
        sep: {
          height: 1,
          backgroundColor: hexToRgba(colors.textSecondary, 0.1),
          marginVertical: spacing.sm,
        },

        // footer rows
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
          gap: 12,
        },
        label: { color: colors.textSecondary, fontWeight: "700" },
        value: { color: colors.textPrimary, fontWeight: "800" },

        // actions
        actions: {
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: spacing.sm,
          gap: 10,
        },
        dlBtn: {
          borderWidth: 1,
          borderColor: colors.borderColor,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        dlTxt: { color: colors.textPrimary, fontWeight: "800" },

        emptyWrap: { padding: spacing.md },
        emptyTxt: { color: colors.textSecondary },
      }),
    [colors, spacing, typography, radius, insets.bottom]
  );

  // ---------- search + filter ----------
  const filtered = useMemo(() => {
    let out = Array.isArray(data) ? data : [];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((c) => str(c?.tenantDetails?.name).toLowerCase().includes(q));
    }

    const range = filter?.paymentDate;
    if (range?.from || range?.to) {
      out = out.filter((c) => withinRange(c?.paymentDate, range));
    }

    // keep status=1 only if present
    out = out.filter((c) => c?.status == null || Number(c.status) === 1);

    return out;
  }, [data, query, filter]);

  const filterActive = !!filter?.paymentDate?.from || !!filter?.paymentDate?.to;

  const onDownload = useCallback((item: Collection) => {
    Haptics.selectionAsync();
    // future: download receipt here
  }, []);

  const initials = (name?: string) =>
    str(name)
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w?.[0]?.toUpperCase() || "")
      .join("") || "PG";

  const Header = () => (
    <View style={s.headerWrap}>
      {/* ✅ StatsGrid now SCROLLS with list (not fixed) */}
      {Array.isArray(metrics) && metrics.length > 0 ? (
        <StatsGrid
          metrics={metrics}
          minVisible={width >= 900 ? 4 : width >= 740 ? 3 : 2}
          cardHeight={92}
        />
      ) : null}

      <SearchBar
        placeholder="Search collections by tenant name"
        onSearch={setQuery}
        onFilter={() => setSheetOpen(true)}
        filterActive={filterActive}
      />
    </View>
  );

  const renderItem = ({ item }: { item: Collection }) => {
    const name = str(item?.tenantDetails?.name, "—");
    const room = str(item?.tenantDetails?.roomNumber, "—");
    const pDate = fmtDate(item?.paymentDate);
    const cat = str(item?.paymentCategory, "—");
    const dueMon = monthOf(item?.dueDate);
    const totalAmt = inr(item?.totalAmount);
    const paidAmt = inr(item?.amount);
    const mode = str(item?.paymentMode, "—");
    const cc = catColor(cat);

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

          <Text style={s.amountBig}>{paidAmt}</Text>
        </View>

        {/* chips */}
        <View style={s.chipsRow}>
          <View style={s.chip}>
            <MaterialIcons name="event" size={16} color={colors.textPrimary} />
            <Text style={s.chipTxt}>{pDate}</Text>
          </View>

          <View style={[s.chip, { backgroundColor: cc.bg, borderColor: hexToRgba(cc.fg, 0.25) }]}>
            <MaterialIcons name="category" size={16} color={cc.fg} />
            <Text style={[s.chipTxt, { color: cc.fg }]}>
              {cat} {dueMon !== "—" ? `(${dueMon})` : ""}
            </Text>
          </View>

          <View style={s.chip}>
            <MaterialIcons name="payments" size={16} color={colors.textPrimary} />
            <Text style={s.chipTxt}>{mode}</Text>
          </View>
        </View>

        <View style={s.sep} />

        {/* totals + actions */}
        <View style={s.row}>
          <Text style={s.label}>Total Amount</Text>
          <Text style={s.value}>{totalAmt}</Text>
        </View>

        <View style={s.actions}>
          <Pressable
            onPress={() => onDownload(item)}
            style={({ pressed }) => [
              s.dlBtn,
              pressed && Platform.OS === "ios" && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Download receipt"
          >
            <MaterialIcons name="download" size={18} color={colors.textPrimary} />
            <Text style={s.dlTxt}>Download</Text>
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
            <Text style={s.emptyTxt}>No collections found.</Text>
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
