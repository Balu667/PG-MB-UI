import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import Colors from "@/src/constants/Colors";

const TenantCard = ({ tenant, onPress }: { tenant: Tenant; onPress?: () => void }) => (
  <Pressable onPress={onPress} android_ripple={{ color: "#E2E8F0" }} style={styles.card}>
    <View style={styles.topRow}>
      <Image source={{ uri: tenant.imageUri }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{tenant.name}</Text>
        <Text style={styles.phone}>{tenant.phone}</Text>
      </View>
      <View style={styles.rentInfo}>
        <Text style={styles.rent}>₹{tenant.rent.toLocaleString()}</Text>
        {tenant.dues > 0 && <Text style={styles.dues}>Due: ₹{tenant.dues.toLocaleString()}</Text>}
      </View>
    </View>
    <View style={styles.bottomRow}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Room: {tenant.room}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{tenant.sharing} Sharing</Text>
      </View>
      <View style={[styles.statusBadge, styles[tenant.status.replace(" ", "")]]}>
        <Text style={styles.statusText}>{tenant.status}</Text>
      </View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    marginBottom: 14,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  info: { marginLeft: 10, flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: Colors.textAccent },
  phone: { fontSize: 13, color: "#888" },
  rentInfo: { alignItems: "flex-end" },
  rent: { fontSize: 16, fontWeight: "700", color: Colors.textAccent },
  dues: { fontSize: 13, color: "#EF4444" },
  bottomRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  badge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, color: "#555" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  Active: { backgroundColor: "#10B981" },
  Dues: { backgroundColor: "#EF4444" },
  UnderNotice: { backgroundColor: "#F59E0B" },
  statusText: { color: "#FFF", fontSize: 12 },
});

export default TenantCard;
