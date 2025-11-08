// src/components/property/CollectionsTab.tsx
import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, View, Text, RefreshControl } from "react-native";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import SearchBar from "@/src/components/SearchBar";

type Collection = {
  _id?: string;
  id?: string;
  tenantName?: string;
  name?: string;
  amount?: number;
  date?: string; // ISO
  mode?: string; // UPI/Cash/etc.
};

type Props = {
  data: Collection[];
  refreshing: boolean;
  onRefresh: () => void;
};

const str = (v: any, f = "") => (v == null ? f : String(v));
const num = (v: any, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || 0;

export default function CollectionsTab({ data, refreshing, onRefresh }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let out = Array.isArray(data) ? data : [];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((c) =>
        str(c?.tenantName ?? c?.name)
          .toLowerCase()
          .includes(q)
      );
    }
    return out;
  }, [data, query]);

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
        card: {
          borderRadius: 14,
          padding: spacing.md,
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        title: {
          color: colors.textPrimary,
          fontWeight: "600",
          fontSize: typography.fontSizeMd,
        },
        sub: { color: colors.textSecondary, marginTop: 4 },
        right: { color: colors.textPrimary, fontWeight: "700", marginTop: 6 },
        emptyWrap: { padding: spacing.md },
        emptyTxt: { color: colors.textSecondary },
      }),
    [spacing, insets.bottom, colors, typography]
  );

  const renderItem = ({ item }: { item: Collection }) => {
    const name = str(item?.tenantName ?? item?.name, "—");
    const amt = num(item?.amount);
    const mode = str(item?.mode, "");
    const when = str(item?.date, "");
    return (
      <View style={s.card}>
        <Text style={s.title}>{name}</Text>
        <Text style={s.sub}>
          {when ? `Date: ${when}` : "—"} {mode ? ` • ${mode}` : ""}
        </Text>
        <Text style={s.right}>₹ {amt.toLocaleString("en-IN")}</Text>
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
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SearchBar
            placeholder="Search collections"
            onSearch={setQuery}
            onFilter={undefined}
            filterActive={false}
          />
        }
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
    </>
  );
}
