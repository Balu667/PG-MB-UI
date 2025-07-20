// import React from "react";
// import { View, Text, StyleSheet, Image } from "react-native";
// import Feather from "@expo/vector-icons/Feather";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import { Tenant } from "@/src/constants/mockTenants";

// const TenantCard = ({ tenant }: { tenant: Tenant }) => {
//   return (
//     <View style={styles.card}>
//       <View style={styles.header}>
//         <Image source={{ uri: tenant.imageUri }} style={styles.avatar} />
//         <View style={{ flex: 1 }}>
//           <Text style={styles.name}>{tenant.name}</Text>
//           <Text style={styles.phone}>{tenant.phone}</Text>
//           <Text style={styles.company}>Tectoro Consulting Pvt.Ltd</Text>
//         </View>
//         {tenant.dues > 0 && <Text style={styles.dues}>₹{tenant.dues.toLocaleString()}</Text>}
//       </View>

//       <View style={styles.info}>
//         <Feather name="calendar" size={16} color="#555" />
//         <Text style={styles.joined}>Joined on : {tenant.joinedOn}</Text>
//         <View style={styles.roomBadge}>
//           <Text style={styles.roomTxt}>Room : {tenant.room}</Text>
//         </View>
//       </View>

//       <View style={styles.footer}>
//         <MaterialCommunityIcons name="paperclip" size={16} color="#256D85" />
//         <Text style={styles.aadhaar}>Aadhaar</Text>
//         <View style={[styles.statusBadge, statusStyles[tenant.status]]}>
//           <Text style={styles.statusTxt}>{tenant.status}</Text>
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 16,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     marginBottom: 14,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   avatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     marginRight: 12,
//   },
//   name: { fontSize: 16, fontWeight: "700" },
//   phone: { fontSize: 13, color: "#555" },
//   company: { fontSize: 13, color: "#999" },
//   dues: { fontSize: 16, fontWeight: "700", color: "#EF4444" },
//   info: { flexDirection: "row", alignItems: "center", marginTop: 8 },
//   joined: { marginLeft: 6, color: "#555", flex: 1 },
//   roomBadge: {
//     backgroundColor: "#E5E7EB",
//     borderRadius: 12,
//     paddingHorizontal: 8,
//   },
//   roomTxt: { fontSize: 12, color: "#555" },
//   footer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 10,
//   },
//   aadhaar: { color: "#256D85", marginLeft: 4, flex: 1 },
//   statusBadge: {
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//   },
//   statusTxt: { fontSize: 12, color: "#fff" },
// });

// const statusStyles = StyleSheet.create({
//   Active: { backgroundColor: "#10B981" },
//   Dues: { backgroundColor: "#EF4444" },
//   "Under Notice": { backgroundColor: "#F59E0B" },
// });

// export default TenantCard;
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Colors from "@/src/constants/Colors";

const TenantCard = ({ tenant }) => (
  <View style={styles.card}>
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
  </View>
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
