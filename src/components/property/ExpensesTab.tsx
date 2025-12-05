// src/components/property/ExpensesTab.tsx
// Premium Expenses Tab - Modern design with rich UI elements
import React, { useState, useMemo, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ListRenderItemInfo,
  RefreshControl,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";

import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import ExpenseCard from "./ExpenseCard";
import AddButton from "@/src/components/Common/AddButton";

import { ExpenseFilter, emptyExpenseFilter } from "@/src/constants/expenseFilter";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

import { Portal, Dialog, Button } from "react-native-paper";
import { useUpdateDailyExpenses } from "@/src/hooks/dailyExpenses";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

export type ExpenseItem = {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  _dateObj: Date;
};

type Props = {
  data: any[];
  refreshing: boolean;
  onRefresh: () => void;
  propertyId: string;
};

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER SECTIONS CONFIG
───────────────────────────────────────────────────────────────────────────── */

const sections: Section[] = [
  {
    key: "dateRange",
    label: "Date Range",
    mode: "date",
    dateConfig: {
      allowFuture: false,
      fromLabel: "From Date",
      toLabel: "To Date",
    },
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPER FUNCTIONS
───────────────────────────────────────────────────────────────────────────── */

const toDDMMYYYY = (d: Date): string =>
  d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const startOfDayLocal = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const endOfDayLocal = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const normalizeRange = (from?: Date, to?: Date) => {
  if (from && to && to.getTime() < from.getTime()) {
    return { from: to, to: from };
  }
  return { from, to };
};

const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

/* ─────────────────────────────────────────────────────────────────────────────
   STATS CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface StatsCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}) => {
  const { colors, spacing, radius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg + 2,
          padding: spacing.md,
          // iOS shadow - more prominent
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: Platform.OS === "ios" ? 0.12 : 0.06,
          shadowRadius: Platform.OS === "ios" ? 12 : 8,
          elevation: 4,
          // Border for iOS definition
          borderWidth: 1,
          borderColor: Platform.OS === "ios" 
            ? hexToRgba(colors.textMuted, 0.12) 
            : hexToRgba(colors.textMuted, 0.08),
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.sm,
        },
        label: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
        },
        value: {
          fontSize: 18,
          fontWeight: "800",
          color: colors.textPrimary,
          letterSpacing: 0.3,
        },
      }),
    [colors, spacing, radius, iconBg]
  );

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  hasFilter: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasFilter }) => {
  const { colors, spacing, radius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: spacing.xl * 2.5,
          paddingHorizontal: spacing.xl,
        },
        iconOuter: {
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: hexToRgba(colors.accent, 0.06),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        },
        iconInner: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.sm,
          textAlign: "center",
          letterSpacing: 0.2,
        },
        subtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
          maxWidth: 280,
        },
        ctaHint: {
          marginTop: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          backgroundColor: hexToRgba(colors.accent, 0.08),
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
        },
        ctaText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.accent,
        },
      }),
    [colors, spacing, radius]
  );

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={
        hasFilter ? "No expenses match your filter" : "No expenses recorded"
      }
    >
      <View style={styles.iconOuter}>
        <View style={styles.iconInner}>
          <MaterialCommunityIcons
            name={hasFilter ? "file-search-outline" : "receipt"}
            size={36}
            color={colors.accent}
          />
        </View>
      </View>
      <Text style={styles.title}>
        {hasFilter ? "No Results Found" : "No Expenses Yet"}
      </Text>
      <Text style={styles.subtitle}>
        {hasFilter
          ? "Try adjusting your filters or search terms to find what you're looking for."
          : "Track your property expenses by adding your first expense record."}
      </Text>
      {!hasFilter && (
        <View style={styles.ctaHint}>
          <MaterialCommunityIcons
            name="plus-circle"
            size={16}
            color={colors.accent}
          />
          <Text style={styles.ctaText}>Tap + to add expense</Text>
        </View>
      )}
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   LIST HEADER COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface ListHeaderProps {
  totalExpenses: number;
  expenseCount: number;
  thisMonthExpenses: number;
  query: string;
  onQueryChange: (q: string) => void;
  onFilterPress: () => void;
  filterActive: boolean;
}

const ListHeader: React.FC<ListHeaderProps> = ({
  totalExpenses,
  expenseCount,
  thisMonthExpenses,
  query,
  onQueryChange,
  onFilterPress,
  filterActive,
}) => {
  const { colors, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingBottom: spacing.md,
        },
        statsRow: {
          flexDirection: "row",
          gap: spacing.sm + 2,
          marginBottom: spacing.md,
        },
        sectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        },
        sectionTitleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        },
        sectionIcon: {
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        sectionTitle: {
          fontSize: isTablet ? 18 : 16,
          fontWeight: "700",
          color: colors.textPrimary,
          letterSpacing: 0.2,
        },
        countBadge: {
          backgroundColor: hexToRgba(colors.accent, 0.1),
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.full,
        },
        countText: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.accent,
        },
        searchContainer: {
          backgroundColor: colors.cardBackground,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radius.lg + 2,
          borderWidth: 1,
          borderColor: Platform.OS === "ios"
            ? hexToRgba(colors.textMuted, 0.15)
            : hexToRgba(colors.textMuted, 0.1),
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: Platform.OS === "ios" ? 0.1 : 0.05,
          shadowRadius: Platform.OS === "ios" ? 8 : 4,
          elevation: 3,
        },
        searchLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
          marginBottom: spacing.xs + 2,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        },
      }),
    [colors, spacing, radius, isTablet]
  );

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatsCard
          icon="cash-multiple"
          label="Total Spent"
          value={formatCurrency(totalExpenses)}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
        />
        <StatsCard
          icon="calendar-month"
          label="This Month"
          value={formatCurrency(thisMonthExpenses)}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIcon}>
            <MaterialCommunityIcons
              name="receipt"
              size={18}
              color={colors.accent}
            />
          </View>
          <Text style={styles.sectionTitle}>Expense History</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{expenseCount} records</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search Expenses</Text>
        <SearchBar
          placeholder="Search by category or description..."
          onSearch={onQueryChange}
          onFilter={onFilterPress}
          filterActive={filterActive}
        />
      </View>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function ExpensesTab({
  data,
  refreshing,
  onRefresh,
  propertyId,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();

  // Responsive columns
  const columns = width >= 1000 ? 3 : width >= 740 ? 2 : 1;

  // Parse raw data to expense items
  const baseList: ExpenseItem[] = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .map((e): ExpenseItem | null => {
        const statusNum = Number(e?.status ?? 0);
        // Only show active expenses (status === 1)
        if (statusNum !== 1) return null;

        const dateIso = e?.date as string | undefined;
        const dateObj = dateIso ? new Date(dateIso) : null;
        if (!dateObj || isNaN(dateObj.getTime())) return null;

        return {
          id: String(e?._id ?? e?.id ?? ""),
          date: toDDMMYYYY(dateObj),
          amount: Number(e?.amount ?? 0) || 0,
          category: String(e?.category ?? "Other"),
          description: String(e?.description ?? ""),
          _dateObj: dateObj,
        };
      })
      .filter((item): item is ExpenseItem => item !== null)
      .sort((a, b) => b._dateObj.getTime() - a._dateObj.getTime()); // Sort by date desc
  }, [data]);

  // State
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<ExpenseFilter>(emptyExpenseFilter);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Delete mutation
  const updateExpense = useUpdateDailyExpenses(() => {
    setConfirmOpen(false);
    setDeleteId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onRefresh();
  });

  // Handlers
  const askDelete = useCallback((id: string) => {
    setDeleteId(id);
    setConfirmOpen(true);
    Haptics.selectionAsync();
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteId) return;

    const fd = new FormData();
    fd.append("status", "0");

    updateExpense.mutate(
      { formData: fd, expenseId: deleteId },
      {
        onError: () => {
          setConfirmOpen(false);
          setDeleteId(null);
        },
      }
    );
  }, [deleteId, updateExpense]);

  const handleAddExpense = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/protected/expenses/${propertyId}`);
  }, [propertyId]);

  const handleEditExpense = useCallback(
    (expId: string) => {
      router.push(`/protected/expenses/${propertyId}?expenseId=${expId}`);
    },
    [propertyId]
  );

  // Filtered expenses
  const expenses = useMemo(() => {
    let list = baseList;

    // Search filter
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.category?.toLowerCase?.().includes(q) ||
          e.description?.toLowerCase?.().includes(q)
      );
    }

    // Date range filter
    const { from, to } = normalizeRange(
      filter?.dateRange?.from,
      filter?.dateRange?.to
    );
    const F = from ? startOfDayLocal(from) : undefined;
    const T = to ? endOfDayLocal(to) : undefined;

    if (F || T) {
      list = list.filter((e) => {
        const d = e?._dateObj;
        if (!(d instanceof Date) || isNaN(d.getTime())) return false;
        if (F && d < F) return false;
        if (T && d > T) return false;
        return true;
      });
    }

    return list;
  }, [query, filter, baseList]);

  // Calculate totals
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter((e) => {
        const d = e._dateObj;
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const filterIsActive =
    !!filter?.dateRange?.from || !!filter?.dateRange?.to || !!query.trim();

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        columnGap: {
          gap: spacing.md,
        },
        listContent: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.lg * 3,
          gap: spacing.md,
        },
        dialogStyle: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
        },
        dialogTitle: {
          color: colors.textPrimary,
          fontWeight: "700",
        },
        dialogText: {
          color: colors.textSecondary,
          lineHeight: 22,
        },
      }),
    [colors, spacing, radius, insets.bottom]
  );

  // Render item
  const renderExpense = useCallback(
    ({ item }: ListRenderItemInfo<ExpenseItem>) => (
      <ExpenseCard
        data={item}
        onEdit={handleEditExpense}
        onDelete={askDelete}
      />
    ),
    [handleEditExpense, askDelete]
  );

  const keyExtractor = useCallback((item: ExpenseItem) => item.id, []);

  // List header
  const ListHeaderMemo = useMemo(
    () => (
      <ListHeader
        totalExpenses={totalExpenses}
        expenseCount={expenses.length}
        thisMonthExpenses={thisMonthExpenses}
        query={query}
        onQueryChange={setQuery}
        onFilterPress={() => setSheetOpen(true)}
        filterActive={filterIsActive}
      />
    ),
    [totalExpenses, expenses.length, thisMonthExpenses, query, filterIsActive]
  );

  // Empty state
  const ListEmptyMemo = useMemo(
    () => <EmptyState hasFilter={filterIsActive} />,
    [filterIsActive]
  );

  return (
    <>
      <FlatList
        data={expenses}
        keyExtractor={keyExtractor}
        numColumns={columns}
        key={`expenses-list-${columns}`}
        columnWrapperStyle={columns > 1 ? styles.columnGap : undefined}
        renderItem={renderExpense}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderMemo}
        ListEmptyComponent={ListEmptyMemo}
        refreshControl={
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        accessibilityLabel="Expenses list"
        accessibilityRole="list"
      />

      {/* FAB */}
      <AddButton onPress={handleAddExpense} />

      {/* Filter Sheet */}
      <FilterSheet<ExpenseFilter>
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={sections}
        resetValue={emptyExpenseFilter}
        title="Filter Expenses"
      />

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={confirmOpen}
          onDismiss={() => setConfirmOpen(false)}
          style={styles.dialogStyle}
        >
          <Dialog.Title style={styles.dialogTitle}>Delete Expense?</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              This expense will be permanently removed from your records. This
              action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setConfirmOpen(false)}
              textColor={colors.textSecondary}
            >
              Cancel
            </Button>
            <Button
              onPress={handleConfirmDelete}
              textColor={colors.error}
              loading={updateExpense.isPending}
              disabled={updateExpense.isPending}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
