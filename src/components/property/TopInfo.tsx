import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Colors from "@/src/constants/Colors";

interface Props {
  name: string;
  area: string;
  city: string;
}

export default function TopInfo({ name, area, city }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.pgName} numberOfLines={1}>
        {name}
      </Text>

      <View style={styles.row}>
        <MaterialIcons name="location-on" size={18} color={Colors.primary} />
        <Text style={styles.loc} numberOfLines={1}>
          {area}, {city}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 30,
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  pgName: { fontSize: 24, fontWeight: "700", color: Colors.textMain },
  row: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  loc: { color: Colors.textMuted, fontSize: 14 },
});
