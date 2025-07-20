import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/src/constants/Colors";

interface Props {
  title: string;
  value: number | string;
  sub: Record<string, number | string>;
}

export default function InfoCard({ title, value, sub }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>

      <View style={styles.subRow}>
        {Object.entries(sub).map(([k, v]) => (
          <View key={k} style={styles.subItem}>
            <Text style={styles.subKey}>{k}</Text>
            <Text style={styles.subVal}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 6,
    gap: 12,
  },
  title: { fontSize: 16, color: Colors.textMuted, fontWeight: "600" },
  value: { fontSize: 30, fontWeight: "700", color: Colors.primary },
  subRow: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  subItem: { minWidth: 60 },
  subKey: { color: Colors.textMuted, fontSize: 13 },
  subVal: { fontWeight: "600", color: Colors.primary },
});
