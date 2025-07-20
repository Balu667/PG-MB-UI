import React from "react";
import { View, FlatList, Text, StyleSheet, useWindowDimensions } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Colors from "@/src/constants/Colors";

const stats = [
  { key: "rooms", label: "Total Rooms", value: 0, icon: "office-building", bg: "#BFDBFE" },
  { key: "beds", label: "Total Beds", value: 0, icon: "bed", bg: "#BFDBFE" },
  { key: "vacant", label: "Vacant Beds", value: 0, icon: "bed", bg: "#BBF7D0" },
  { key: "notice", label: "Under Notice", value: 0, icon: "bed", bg: "#DDD6FE" },
];

export default function StatsGrid() {
  const { width } = useWindowDimensions();
  const COLS = width >= 1000 ? 4 : width >= 740 ? 3 : 2;
  const GAP = 14,
    side = 32;
  const cardW = (width - side - GAP * (COLS - 1)) / COLS;

  return (
    <FlatList
      data={stats}
      keyExtractor={(it) => it.key}
      numColumns={COLS}
      scrollEnabled={false}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ rowGap: GAP, marginTop: 15 }}
      renderItem={({ item }) => (
        <View style={[styles.card, { width: cardW }]}>
          <View style={[styles.bubble, { backgroundColor: item.bg }]}>
            <MaterialCommunityIcons name={item.icon as any} size={18} color={Colors.primary} />
          </View>

          <Text style={styles.val}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  val: { fontSize: 28, fontWeight: "700", color: "#111827", marginTop: 6 },
  label: { fontSize: 14, color: "#4B5563", marginTop: 2, lineHeight: 18 },
});
