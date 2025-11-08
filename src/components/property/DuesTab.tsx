// src/components/property/DuesTab.tsx
import React, { useMemo, useState, useCallback } from "react";
import { FlatList, StyleSheet, View, Text, RefreshControl } from "react-native";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import SearchBar from "@/src/components/SearchBar";
import TenantCard from "@/src/components/property/TenantCard";
import AddButton from "@/src/components/Common/AddButton";

const str = (v: any, f = "") => (v == null ? f : String(v));
const num = (v: any, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || 0;
const getName = (t: any) => str(t?.tenantName ?? t?.name ?? "", "");

type Props = {
  data: any[];
  refreshing: boolean;
  onRefresh: () => void;
};

export default function DuesTab({ data, refreshing, onRefresh }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const [query, setQuery] = useState("");
  const [list, setList] = useState(() => (Array.isArray(data) ? data : []));

  React.useEffect(() => setList(Array.isArray(data) ? data : []), [data]);

  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  const filtered = useMemo(() => {
    let out = list.filter((t) => num(t?.due) > 0);
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      out = out.filter((t) => getName(t).toLowerCase().includes(q));
    }
    return out;
  }, [list, query]);

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

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={(t: any, i) => String(t?._id ?? t?.id ?? i)}
        renderItem={({ item }) => <TenantCard tenant={item} onDelete={handleDelete} />}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? s.columnGap : undefined}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SearchBar
            placeholder="Search tenants with dues"
            onSearch={setQuery}
            onFilter={undefined}
            filterActive={false}
          />
        }
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

      <AddButton
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/protected/tenant/add");
        }}
      />
    </>
  );
}
