import React, { useState, useMemo } from "react";
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import SearchBar from "@/src/components/SearchBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ExpenseCard, { ExpenseItem } from "./ExpenseCard";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import { ExpenseFilter, emptyExpenseFilter } from "@/src/constants/expenseFilter";

/* ---------- replace with API data later ---------- */
const DUMMY: ExpenseItem[] = [
  {
    id: "EXP00001",
    date: "26/07/2025",
    amount: 25000,
    category: "Groceries",
    description: "Weekly vegetables and fruits",
  },
  {
    id: "EXP00002",
    date: "24/07/2025",
    amount: 1200,
    category: "Transport",
    description: "Cab to airport",
  },
  {
    id: "EXP00003",
    date: "22/07/2025",
    amount: 7800,
    category: "Maintenance",
    description: "AC service and filter replacement",
  },
];

export default function ExpensesTab() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  /* columns: 1 / 2 / 3 depending on width */
  const columns = width >= 1000 ? 3 : width >= 740 ? 2 : 1;

  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<ExpenseFilter>(emptyExpenseFilter);
  const sections: Section[] = [
    {
      key: "dateRange",
      label: "Date Range",
      mode: "date", // built‑in date‑range UI
    },
  ];

  const expenses = useMemo(() => {
    let list = DUMMY;

    /* text search on category / description */
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (e) => e.category.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
    }

    /* date‑range filter */
    const { from, to } = filter.dateRange;
    if (from) list = list?.filter((e) => new Date(e.date) >= from);
    if (to) list = list?.filter((e) => new Date(e.date) <= to);

    return list;
  }, [query, filter]);
  const todayStr = new Date().toLocaleDateString("en-GB"); // e.g. "26/07/2025"
  const totalToday = useMemo(
    () => expenses.filter((e) => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0),
    [expenses, todayStr]
  );
  /* ─────────────── render ─────────────── */
  return (
    <>
      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnGap : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
          rowGap: 14,
        }}
        ListHeaderComponent={
          <>
            {/* total for the current day */}
            <Summary amount={totalToday} />

            {/* search + filter */}
            <SearchBar
              placeholder="Search expense"
              onSearch={setQuery}
              onFilter={() => setSheetOpen(true)}
              filterActive={!!filter.dateRange.from || !!filter.dateRange.to}
            />
          </>
        }
        renderItem={({ item }) => (
          <ExpenseCard
            data={item}
            onEdit={(id) => console.log("edit", id)}
            onDelete={(id) => console.log("delete", id)}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No expenses yet</Text>}
      />
      <FilterSheet
        visible={sheetOpen}
        sections={sections}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        resetValue={emptyExpenseFilter}
      />
    </>
  );
}

const Empty = ({ label }: { label: string }) => (
  <SearchBar placeholder={label} editable={false} style={{ opacity: 0.6, marginBottom: 20 }} />
);
const Summary = ({ amount }: { amount: number }) => (
  <View style={styles.summaryWrap}>
    <Text style={styles.summaryLabel}>Today’s Expense</Text>
    <Text style={styles.summaryVal}>₹{amount.toLocaleString()}</Text>
  </View>
);

const styles = StyleSheet.create({
  columnGap: { gap: 14 },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 16,
    marginTop: 60,
  },
  summaryWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  summaryLabel: { fontSize: 14, fontWeight: "600", color: "#0369A1" },
  summaryVal: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
});
