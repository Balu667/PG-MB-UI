// /* ------------------------------------------------------------------
//    A richer RoomCard – with subtle scale‑in, haptics, and nicer
//    iconography. 100 % compatible with the previous props.
// ------------------------------------------------------------------- */
// import React, { useState, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Pressable,
//   Animated,
//   LayoutAnimation,
//   Platform,
//   UIManager,
//   useWindowDimensions,
// } from "react-native";
// import * as Haptics from "expo-haptics";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import { Room } from "@/src/constants/mockRooms";

// if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// /* ──────────────────────────────────────────────────────────────── */
// const THEME = {
//   primary: "#256D85",
//   surface: "#FFFFFF",
//   muted: "#6B7280",
//   shadow: "#000000",
//   chip: {
//     Available: "#10B981",
//     Partial: "#F59E0B",
//     Filled: "#EF4444",
//   } as const,
// };

// /* prettier‑ignore */
// const BED_COLORS: Record<keyof Room["bedBreakdown"], string> = {
//   totalBeds: "#3B82F6",
//   vacantBeds: "#10B981",
//   occupiedBeds: "#EF4444",
//   noticeBeds: "#8B5CF6",
//   bookingBeds: "#F97316",
// };

// interface Props {
//   room: Room;
// }

// /* ──────────────────────────────────────────────────────────────── */
// const RoomCard: React.FC<Props> = ({ room }) => {
//   /* responsive width (same formula you used for StatsGrid) */
//   const { width } = useWindowDimensions();
//   const cols = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
//   const gap = 14; // keep in sync with FlatList rowGap / columnGap
//   const side = 32; // ≈ (16px SafeArea left + right)
//   const cardW = (width - side - gap * (cols - 1)) / cols;

//   /* local expanded state */
//   const [open, setOpen] = useState(false);

//   /* small press‑in animation */
//   const scale = useRef(new Animated.Value(1)).current;
//   const handlePress = () => {
//     Haptics.selectionAsync();
//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//     setOpen((p) => !p);

//     /* tactile press‑in/out */
//     Animated.sequence([
//       Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }),
//       Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }),
//     ]).start();
//   };

//   /* badge for “+x” beds after the first two icons */
//   const remainingBeds = room.totalBeds - 2;
//   const moreBadge = remainingBeds > 0 && (
//     <View style={styles.moreBadge}>
//       <Text style={styles.moreBadgeTxt}>+{remainingBeds}</Text>
//     </View>
//   );

//   return (
//     <Animated.View style={[styles.shadowWrap, { width: cardW, transform: [{ scale }] }]}>
//       <Pressable android_ripple={{ color: "#E5F3FF" }} style={styles.card} onPress={handlePress}>
//         {/* line 1 — number & status */}
//         <View style={styles.rowBetween}>
//           <Text style={styles.roomNo}>Room {room.roomNo}</Text>
//           <Text style={[styles.statusChip, { backgroundColor: THEME.chip[room.status] }]}>
//             {room.status}
//           </Text>
//         </View>

//         {/* line 2 — floor & mini bed icons */}
//         <View style={[styles.rowBetween, { marginTop: 6 }]}>
//           <View style={styles.floorWrap}>
//             <MaterialIcons name="stairs" size={16} color={THEME.primary} />
//             <Text style={styles.floorTxt}>{room.floor}</Text>
//           </View>

//           <View style={styles.bedsWrap}>
//             <MaterialCommunityIcons name="bed" size={18} color={THEME.primary} />
//             <MaterialCommunityIcons name="bed" size={18} color={THEME.primary} />
//             {moreBadge}
//           </View>
//         </View>

//         {/* line 3 — deposit */}
//         <Text style={styles.depositTxt}>₹{room.deposit.toLocaleString()} deposit</Text>

//         {/* expandable panel */}
//         {open && (
//           <View style={styles.infoBox}>
//             {Object.entries(room.bedBreakdown).map(([key, val]) => (
//               <InfoRow key={key} label={labelMap[key]} value={val} color={BED_COLORS[key]} />
//             ))}
//           </View>
//         )}
//       </Pressable>
//     </Animated.View>
//   );
// };

// /* ─ helper row inside infoBox ─ */
// const InfoRow = ({ label, value, color }: { label: string; value: number; color: string }) => (
//   <View style={styles.infoRow}>
//     <MaterialCommunityIcons name="bed" size={16} color={color} />
//     <Text style={styles.infoLabel}>{label}</Text>
//     <Text style={styles.infoValue}>{value}</Text>
//   </View>
// );

// /* label mapping once to stay DRY */
// const labelMap: Record<keyof Room["bedBreakdown"], string> = {
//   totalBeds: "Total Beds",
//   vacantBeds: "Vacant Beds",
//   occupiedBeds: "Occupied",
//   noticeBeds: "Notice",
//   bookingBeds: "Adv. Booking",
// };

// /* ───────────────────────── styles ────────────────────────────── */
// const styles = StyleSheet.create({
//   shadowWrap: {
//     borderRadius: 18,
//     shadowColor: THEME.shadow,
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.08,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   card: {
//     backgroundColor: THEME.surface,
//     borderRadius: 18,
//     padding: 16,
//   },

//   /* header rows */
//   rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   roomNo: { fontSize: 18, fontWeight: "700", color: THEME.primary },
//   statusChip: {
//     paddingHorizontal: 10,
//     paddingVertical: 2,
//     color: "#fff",
//     fontSize: 12,
//     borderRadius: 12,
//     overflow: "hidden",
//     textTransform: "uppercase",
//   },

//   floorWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
//   floorTxt: { fontSize: 14, color: THEME.muted },

//   bedsWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
//   moreBadge: {
//     backgroundColor: "#DBEAFE",
//     borderRadius: 8,
//     paddingHorizontal: 4,
//     marginLeft: 2,
//   },
//   moreBadgeTxt: { fontSize: 11, color: THEME.primary, fontWeight: "600" },

//   depositTxt: { marginTop: 8, fontSize: 13, color: THEME.muted },

//   /* expandable box */
//   infoBox: {
//     marginTop: 12,
//     borderTopWidth: StyleSheet.hairlineWidth,
//     borderColor: "#E5E7EB",
//     paddingTop: 10,
//     gap: 6,
//   },
//   infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
//   infoLabel: { flex: 1, fontSize: 14, color: THEME.primary, fontWeight: "600" },
//   infoValue: { fontSize: 14, color: THEME.primary, fontWeight: "600" },
// });
// export default RoomCard;
/* ------------------------------------------------------------------
   Premium RoomCard 2.0 – gradient header, utilisation bar, richer
   iconography, press‑in animation & haptics.
   Replaces: src/components/property/RoomCard.tsx
------------------------------------------------------------------- */
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Room } from "@/src/constants/mockRooms";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* design tokens -------------------------------------------------- */
const C = {
  primary: "#256D85",
  surface: "#FFFFFF",
  muted: "#6B7280",
  chip: { Available: "#10B981", Partial: "#F59E0B", Filled: "#EF4444" } as const,
  shadow: "#000",
};

const BED_COLORS: Record<keyof Room["bedBreakdown"], string> = {
  totalBeds: "#3B82F6",
  vacantBeds: "#10B981",
  occupiedBeds: "#EF4444",
  noticeBeds: "#8B5CF6",
  bookingBeds: "#F97316",
};

/* helpers -------------------------------------------------------- */
const labelMap: Record<keyof Room["bedBreakdown"], string> = {
  totalBeds: "Total Beds",
  vacantBeds: "Vacant",
  occupiedBeds: "Occupied",
  noticeBeds: "Notice",
  bookingBeds: "Adv. Booking",
};

/* component ------------------------------------------------------ */
interface Props {
  room: Room;
}

const RoomCard: React.FC<Props> = ({ room }) => {
  /* responsive width (same formula you used everywhere) */
  const { width } = useWindowDimensions();
  const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  const GAP = 14;
  const SIDE = 32;
  const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

  /* press / expand state */
  const [open, setOpen] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((p) => !p);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 25 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }),
    ]).start();
  };

  /* badge after first 2 beds */
  const extraBeds = room.totalBeds - 2;
  const moreBadge =
    extraBeds > 0 ? (
      <View style={styles.moreBadge}>
        <Text style={styles.moreBadgeTxt}>+{extraBeds}</Text>
      </View>
    ) : null;

  /* utilisation bar width */
  const utilisation = room.totalBeds ? Math.min(room.occupiedBeds / room.totalBeds, 1) : 0;

  return (
    <Animated.View style={[styles.shadowWrap, { width: cardW, transform: [{ scale }] }]}>
      <Pressable style={styles.card} onPress={handlePress} android_ripple={{ color: "#E7F4FF" }}>
        {/* gradient header strip */}
        {/* row 1 • room + status */}
        <View style={styles.rowBetween}>
          <Text style={styles.roomNo}>Room {room.roomNo}</Text>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: C.chip[room.status], shadowColor: C.chip[room.status] },
            ]}
          >
            <Text style={styles.statusTxt}>{room.status}</Text>
          </View>
        </View>

        {/* row 2 • floor + beds mini */}
        <View style={[styles.rowBetween, { marginTop: 6 }]}>
          <View style={styles.floorWrap}>
            <MaterialIcons name="stairs" size={16} color={C.primary} />
            <Text style={styles.floorTxt}>{room.floor}</Text>
          </View>
          <View style={styles.bedsWrap}>
            <MaterialCommunityIcons name="bed" size={18} color={C.primary} />
            <MaterialCommunityIcons name="bed" size={18} color={C.primary} />
            {moreBadge}
          </View>
        </View>

        {/* row 3 • deposit */}
        <Text style={styles.depositTxt}>₹{room.deposit.toLocaleString()} deposit</Text>

        {/* utilisation bar */}
        <View style={styles.utilBarWrap}>
          <View style={[styles.utilBarFill, { width: `${utilisation * 100}%` }]} />
        </View>

        {/* expandable details */}
        {open && (
          <View style={styles.infoBox}>
            {Object.entries(room.bedBreakdown).map(([k, v]) => (
              <InfoRow
                key={k}
                label={labelMap[k as keyof typeof labelMap]}
                value={v}
                color={BED_COLORS[k as keyof typeof BED_COLORS]}
              />
            ))}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

/* ─ sub row ─ */
const InfoRow = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={styles.infoRow}>
    <MaterialCommunityIcons name="bed" size={15} color={color} style={{ width: 22 }} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

/* styles --------------------------------------------------------- */
const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 20,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 5,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
  },
  headerStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  roomNo: { fontSize: 18, fontWeight: "700", color: C.primary },
  statusChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  statusTxt: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },

  floorWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  floorTxt: { fontSize: 14, color: C.muted },

  bedsWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
  moreBadge: {
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  moreBadgeTxt: { fontSize: 11, color: C.primary, fontWeight: "600" },

  depositTxt: { marginTop: 8, fontSize: 13, color: C.muted },

  /* utilisation bar */
  utilBarWrap: {
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  utilBarFill: {
    height: 5,
    backgroundColor: C.primary,
  },

  /* expandable panel */
  infoBox: {
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    paddingTop: 12,
    gap: 8,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoLabel: { flex: 1, fontSize: 14, color: C.muted, fontWeight: "600" },
  infoValue: { fontSize: 14, color: C.primary, fontWeight: "700" },
});

export default RoomCard;
