// import React, { useState, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Pressable,
//   Animated,
//   Platform,
//   LayoutAnimation,
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

// /* design tokens -------------------------------------------------- */
// const C = {
//   primary: "#256D85",
//   surface: "#FFFFFF",
//   muted: "#6B7280",
//   chip: { Available: "#10B981", Partial: "#F59E0B", Filled: "#EF4444" } as const,
//   shadow: "#000",
// };

// const BED_COLORS: Record<keyof Room["bedBreakdown"], string> = {
//   totalBeds: "#3B82F6",
//   vacantBeds: "#10B981",
//   occupiedBeds: "#EF4444",
//   noticeBeds: "#8B5CF6",
//   bookingBeds: "#F97316",
// };

// /* helpers -------------------------------------------------------- */
// const labelMap: Record<keyof Room["bedBreakdown"], string> = {
//   totalBeds: "Total Beds",
//   vacantBeds: "Vacant",
//   occupiedBeds: "Occupied",
//   noticeBeds: "Notice",
//   bookingBeds: "Adv. Booking",
// };

// /* component ------------------------------------------------------ */
// interface Props {
//   room: Room;
// }

// const RoomCard: React.FC<Props> = ({ room }) => {
//   /* responsive width (same formula you used everywhere) */
//   const { width } = useWindowDimensions();
//   const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
//   const GAP = 14;
//   const SIDE = 32;
//   const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

//   /* press / expand state */
//   const [open, setOpen] = useState(false);
//   const scale = useRef(new Animated.Value(1)).current;

//   const handlePress = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//     setOpen((p) => !p);
//     Animated.sequence([
//       Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 25 }),
//       Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }),
//     ]).start();
//   };

//   /* badge after first 2 beds */
//   const extraBeds = room.totalBeds - 2;
//   const moreBadge =
//     extraBeds > 0 ? (
//       <View style={styles.moreBadge}>
//         <Text style={styles.moreBadgeTxt}>+{extraBeds}</Text>
//       </View>
//     ) : null;

//   /* utilisation bar width */
//   const utilisation = room.totalBeds ? Math.min(room.occupiedBeds / room.totalBeds, 1) : 0;

//   return (
//     <Animated.View style={[styles.shadowWrap, { width: cardW, transform: [{ scale }] }]}>
//       <Pressable style={styles.card} onPress={handlePress} android_ripple={{ color: "#E7F4FF" }}>
//         {/* gradient header strip */}
//         {/* row 1 • room + status */}
//         <View style={styles.rowBetween}>
//           <Text style={styles.roomNo}>Room {room.roomNo}</Text>
//           <View
//             style={[
//               styles.statusChip,
//               { backgroundColor: C.chip[room.status], shadowColor: C.chip[room.status] },
//             ]}
//           >
//             <Text style={styles.statusTxt}>{room.status}</Text>
//           </View>
//         </View>

//         {/* row 2 • floor + beds mini */}
//         <View style={[styles.rowBetween, { marginTop: 6 }]}>
//           <View style={styles.floorWrap}>
//             <MaterialIcons name="stairs" size={16} color={C.primary} />
//             <Text style={styles.floorTxt}>{room.floor}</Text>
//           </View>
//           <View style={styles.bedsWrap}>
//             <MaterialCommunityIcons name="bed" size={18} color={C.primary} />
//             <MaterialCommunityIcons name="bed" size={18} color={C.primary} />
//             {moreBadge}
//           </View>
//         </View>

//         {/* row 3 • deposit */}
//         <Text style={styles.depositTxt}>₹{room.deposit.toLocaleString()} deposit</Text>

//         {/* utilisation bar */}
//         <View style={styles.utilBarWrap}>
//           <View style={[styles.utilBarFill, { width: `${utilisation * 100}%` }]} />
//         </View>

//         {/* expandable details */}
//         {open && (
//           <View style={styles.infoBox}>
//             {Object.entries(room.bedBreakdown).map(([k, v]) => (
//               <InfoRow
//                 key={k}
//                 label={labelMap[k as keyof typeof labelMap]}
//                 value={v}
//                 color={BED_COLORS[k as keyof typeof BED_COLORS]}
//               />
//             ))}
//           </View>
//         )}
//       </Pressable>
//     </Animated.View>
//   );
// };

// /* ─ sub row ─ */
// const InfoRow = ({ label, value, color }: { label: string; value: number; color: string }) => (
//   <View style={styles.infoRow}>
//     <MaterialCommunityIcons name="bed" size={15} color={color} style={{ width: 22 }} />
//     <Text style={styles.infoLabel}>{label}</Text>
//     <Text style={styles.infoValue}>{value}</Text>
//   </View>
// );

// /* styles --------------------------------------------------------- */
// const styles = StyleSheet.create({
//   shadowWrap: {
//     borderRadius: 20,
//     shadowColor: C.shadow,
//     shadowOffset: { width: 0, height: 7 },
//     shadowOpacity: 0.09,
//     shadowRadius: 12,
//     elevation: 5,
//   },
//   card: {
//     backgroundColor: C.surface,
//     borderRadius: 20,
//     padding: 18,
//     overflow: "hidden",
//   },
//   headerStrip: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     height: 6,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },

//   rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

//   roomNo: { fontSize: 18, fontWeight: "700", color: C.primary },
//   statusChip: {
//     borderRadius: 12,
//     paddingHorizontal: 10,
//     paddingVertical: 3,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   statusTxt: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },

//   floorWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
//   floorTxt: { fontSize: 14, color: C.muted },

//   bedsWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
//   moreBadge: {
//     backgroundColor: "#DBEAFE",
//     borderRadius: 8,
//     paddingHorizontal: 4,
//     marginLeft: 2,
//   },
//   moreBadgeTxt: { fontSize: 11, color: C.primary, fontWeight: "600" },

//   depositTxt: { marginTop: 8, fontSize: 13, color: C.muted },

//   /* utilisation bar */
//   utilBarWrap: {
//     height: 5,
//     backgroundColor: "#E5E7EB",
//     borderRadius: 3,
//     marginTop: 10,
//     overflow: "hidden",
//   },
//   utilBarFill: {
//     height: 5,
//     backgroundColor: C.primary,
//   },

//   /* expandable panel */
//   infoBox: {
//     marginTop: 14,
//     borderTopWidth: StyleSheet.hairlineWidth,
//     borderColor: "#E5E7EB",
//     paddingTop: 12,
//     gap: 8,
//   },
//   infoRow: { flexDirection: "row", alignItems: "center" },
//   infoLabel: { flex: 1, fontSize: 14, color: C.muted, fontWeight: "600" },
//   infoValue: { fontSize: 14, color: C.primary, fontWeight: "700" },
// });

// export default RoomCard;
import React, { useState, useRef, useMemo } from "react";
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { Room } from "@/src/constants/mockRooms";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ------------------------------------------------------------------ */
/*  Chip / util-bar colours come from the theme so they adapt          */
/* ------------------------------------------------------------------ */
const chipTint = (colors: any) => ({
  Available: colors.availableBeds,
  Partial: colors.advBookedBeds,
  Filled: colors.filledBeds,
});

const bedTint = (colors: any) => ({
  totalBeds: colors.primary,
  vacantBeds: colors.availableBeds,
  occupiedBeds: colors.filledBeds,
  noticeBeds: colors.underNoticeBeds,
  bookingBeds: colors.advBookedBeds,
});

const labelMap = {
  totalBeds: "Total Beds",
  vacantBeds: "Vacant",
  occupiedBeds: "Occupied",
  noticeBeds: "Notice",
  bookingBeds: "Adv. Booking",
} as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  room: Room;
}

const RoomCard: React.FC<Props> = ({ room }) => {
  const { width } = useWindowDimensions();
  const { colors, spacing, radius, shadow } = useTheme();

  /* responsive cols (same rule used elsewhere) */
  const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  const GAP = spacing.md - 2;
  const SIDE = spacing.md * 2;
  const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

  /* animated press */
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

  /* colour maps (theme-aware) */
  const CHIP = useMemo(() => chipTint(colors), [colors]);
  const BED_COLORS = useMemo(() => bedTint(colors), [colors]);

  /* extra-beds badge (after the first 2 icons) */
  const extraBeds = room.totalBeds - 2;

  /* utilisation bar width */
  const utilisation = room.totalBeds ? Math.min(room.occupiedBeds / room.totalBeds, 1) : 0;

  /* ---------- styles (memoised) ---------- */
  const s = useMemo(
    () =>
      StyleSheet.create({
        shadowWrap: {
          width: cardW,
          borderRadius: radius.xl,
          shadowColor: shadow,
          shadowOffset: { width: 0, height: 7 },
          shadowOpacity: 0.09,
          shadowRadius: 12,
          // elevation: 5,
          borderWidth: 1,
          borderColor: colors.borderColor,
        },
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          padding: spacing.md + 2,
          overflow: "hidden",
        },

        rowBetween: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },

        roomNo: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.accent,
        },

        statusChip: (bg: string) => ({
          backgroundColor: bg,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 3,
          shadowColor: bg,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 3,
        }),
        statusTxt: {
          color: colors.white,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
        },

        floorWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
        floorTxt: { fontSize: 14, color: colors.textSecondary },

        bedsWrap: { flexDirection: "row", alignItems: "center", gap: 2 },

        moreBadge: {
          backgroundColor: hexToRgba(colors.primary, 0.15),
          borderRadius: 8,
          paddingHorizontal: 4,
          marginLeft: 2,
        },
        moreBadgeTxt: {
          fontSize: 11,
          color: colors.accent,
          fontWeight: "600",
        },

        depositTxt: {
          marginTop: 8,
          fontSize: 13,
          color: colors.textSecondary,
        },

        utilBarWrap: {
          height: 5,
          backgroundColor: hexToRgba(colors.textSecondary, 0.25),
          borderRadius: 3,
          marginTop: 10,
          overflow: "hidden",
        },
        utilBarFill: { height: 5, backgroundColor: colors.accent },

        infoBox: {
          marginTop: spacing.md - 2,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: hexToRgba(colors.textSecondary, 0.25),
          paddingTop: spacing.sm,
          gap: 8,
        },

        infoRow: { flexDirection: "row", alignItems: "center" },
        infoLabel: {
          flex: 1,
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: "600",
        },
        infoValue: {
          fontSize: 14,
          color: colors.accent,
          fontWeight: "700",
        },
      }),
    [colors, spacing, radius, cardW, shadow]
  );

  /* ---------- render ---------- */
  return (
    <Animated.View style={[s.shadowWrap, { transform: [{ scale }] }]}>
      <Pressable
        style={s.card}
        onPress={handlePress}
        android_ripple={{ color: hexToRgba(colors.primary, 0.07) }}
      >
        {/* row 1 – room & status */}
        <View style={s.rowBetween}>
          <Text style={s.roomNo}>Room {room.roomNo}</Text>

          <View style={s.statusChip(CHIP[room.status])}>
            <Text style={s.statusTxt}>{room.status}</Text>
          </View>
        </View>

        {/* row 2 – floor & beds mini-icons */}
        <View style={[s.rowBetween, { marginTop: 6 }]}>
          <View style={s.floorWrap}>
            <MaterialIcons name="stairs" size={16} color={colors.accent} />
            <Text style={s.floorTxt}>{room.floor}</Text>
          </View>

          <View style={s.bedsWrap}>
            <MaterialCommunityIcons name="bed" size={18} color={colors.accent} />
            <MaterialCommunityIcons name="bed" size={18} color={colors.accent} />
            {extraBeds > 0 && (
              <View style={s.moreBadge}>
                <Text style={s.moreBadgeTxt}>+{extraBeds}</Text>
              </View>
            )}
          </View>
        </View>

        {/* row 3 – deposit */}
        <Text style={s.depositTxt}>₹{room.deposit.toLocaleString()} deposit</Text>

        {/* utilisation bar */}
        <View style={s.utilBarWrap}>
          <View style={[s.utilBarFill, { width: `${utilisation * 100}%` }]} />
        </View>

        {/* expandable panel */}
        {open && (
          <View style={s.infoBox}>
            {Object.entries(room.bedBreakdown).map(([k, v]) => (
              <View key={k} style={s.infoRow}>
                <MaterialCommunityIcons
                  name="bed"
                  size={15}
                  color={BED_COLORS[k as keyof typeof BED_COLORS]}
                  style={{ width: 22 }}
                />
                <Text style={s.infoLabel}>{labelMap[k as keyof typeof labelMap]}</Text>
                <Text style={s.infoValue}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default RoomCard;
