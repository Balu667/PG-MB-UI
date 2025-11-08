// src/components/property/ExpensesTab.tsx
import React, { useState, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ListRenderItemInfo,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import ExpenseCard from "./ExpenseCard";

import { ExpenseFilter, emptyExpenseFilter } from "@/src/constants/expenseFilter";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ---------- Types used internally ---------- */
export type ExpenseItem = {
  id: string;
  date: string; // dd/MM/yyyy for display
  amount: number;
  category: string;
  description: string;
  _dateObj: Date; // internal for comparisons
};

type Props = {
  data: any[]; // raw API rows
  refreshing: boolean;
  onRefresh: () => void;
};

/* ---------- Filter config ---------- */
const sections: Section[] = [{ key: "dateRange", label: "Date Range", mode: "date" }];

/* ---------- Helpers ---------- */
const toDDMMYYYY = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

/* ---------- Component ---------- */
export default function ExpensesTab({ data, refreshing, onRefresh }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();

  const columns = width >= 1000 ? 3 : width >= 740 ? 2 : 1;

  // normalize API → UI items (stable reference when data changes)
  const baseList: ExpenseItem[] = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .map((e) => {
        const dateObj = e?.date ? new Date(e.date) : null;
        if (!dateObj || isNaN(dateObj.getTime())) return null;
        return {
          id: String(e?._id ?? e?.id ?? ""),
          date: toDDMMYYYY(dateObj),
          amount: Number(e?.amount ?? 0),
          category: String(e?.category ?? "Other"),
          description: String(e?.description ?? ""),
          _dateObj: dateObj,
        } as ExpenseItem;
      })
      .filter(Boolean) as ExpenseItem[];
  }, [data]);

  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<ExpenseFilter>(emptyExpenseFilter);

  // apply search + date filters
  const expenses = useMemo(() => {
    let list = baseList;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (e) => e.category.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
    }

    const { from, to } = filter.dateRange;
    if (from) list = list.filter((e) => e._dateObj >= from);
    if (to) list = list.filter((e) => e._dateObj <= to);

    return list;
  }, [query, filter, baseList]);

  // today’s total (computed from filtered list, same as before)
  const todayKey = toDDMMYYYY(new Date());
  const totalToday = useMemo(
    () => expenses.filter((e) => e.date === todayKey).reduce((sum, e) => sum + e.amount, 0),
    [expenses, todayKey]
  );

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
        emptyText: {
          textAlign: "center",
          color: colors.textMuted,
          fontSize: 16,
          marginTop: 60,
        },
        summaryWrap: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: hexToRgba(colors.accent, 0.08),
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.md,
          borderRadius: radius.lg,
          marginBottom: spacing.md - 2,
        },
        summaryLabel: { fontSize: 14, fontWeight: "600", color: colors.accent },
        summaryVal: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
      }),
    [colors, spacing, radius, insets.bottom]
  );

  const renderExpense = ({ item }: ListRenderItemInfo<ExpenseItem>) => (
    <ExpenseCard data={item} onEdit={() => {}} onDelete={() => {}} />
  );

  const filterIsActive = !!filter.dateRange.from || !!filter.dateRange.to;

  return (
    <>
      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? s.columnGap : undefined}
        renderItem={renderExpense}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={s.summaryWrap}>
              <Text style={s.summaryLabel}>Today’s Expense</Text>
              <Text style={s.summaryVal}>₹{totalToday.toLocaleString()}</Text>
            </View>

            <SearchBar
              placeholder="Search expense"
              onSearch={setQuery}
              onFilter={() => setSheetOpen(true)}
              filterActive={filterIsActive}
            />
          </>
        }
        ListEmptyComponent={<Text style={s.emptyText}>No expenses yet</Text>}
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
        resetValue={emptyExpenseFilter}
      />
    </>
  );
}
