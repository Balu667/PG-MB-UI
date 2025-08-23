// /* ------------------------------------------------------------------
//  * ExpenseCard – compact + expandable description
//  * ----------------------------------------------------------------- */
// import React, { useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Pressable,
//   Animated,
//   useWindowDimensions,
//   Platform,
//   LayoutAnimation,
//   UIManager,
// } from "react-native";
// import Feather from "@expo/vector-icons/Feather";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import * as Haptics from "expo-haptics";
// import Colors from "@/src/constants/Colors";

// /* ---------- enable smooth height animation on Android ---------- */
// if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// /* ---------- types ---------- */
// export interface ExpenseItem {
//   id: string;
//   date: string /* "DD/MM/YYYY" */;
//   amount: number /* 25000        */;
//   category: string /* "Groceries"  */;
//   description: string /* long text…   */;
// }

// /* ---------- palette ---------- */
// const BG = "#FFFFFF";
// const SHADOW = "#000";
// const EDIT_BG = "#E0F2FE";
// const DEL_BG = "#FEE2E2";

// /* ---------- component ---------- */
// const ExpenseCard: React.FC<{
//   data: ExpenseItem;
//   onEdit?: (id: string) => void;
//   onDelete?: (id: string) => void;
// }> = ({ data, onEdit, onDelete }) => {
//   const { width } = useWindowDimensions();

//   /* ───── responsive width (same formula you like) ───── */
//   const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
//   const GAP = 14;
//   const SIDE = 32;
//   const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

//   /* ───── description toggle ───── */
//   const [open, setOpen] = useState(false);
//   const toggleDesc = () => {
//     if (Platform.OS !== "web") Haptics.selectionAsync();
//     /* nice height animation without external libs */
//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//     setOpen((p) => !p);
//   };

//   /* small helper for money format */
//   const money = `₹${data.amount.toLocaleString()}`;

//   return (
//     <Animated.View style={[styles.shadow, { width: cardW }]}>
//       {/* whole card gets a gentle bounce when tapped */}
//       <Pressable style={styles.card} android_ripple={{ color: "#EFF8FF" }}>
//         {/* ─────────── Header row ─────────── */}
//         <View style={styles.header}>
//           {/* emoji or fallback */}
//           <View style={styles.emojiWrap}>
//             <Text style={styles.emojiText}>{emojiMap[data.category.toLowerCase()] ?? "💸"}</Text>
//           </View>

//           {/* id + date */}
//           <View style={{ flex: 1 }}>
//             <Text style={styles.billNo} numberOfLines={1}>
//               {data.id}
//             </Text>
//             <Text style={styles.dateText}>{data.date}</Text>
//           </View>

//           {/* amount pill */}
//           <View style={styles.amountPill}>
//             <Text style={styles.amountText}>{money}</Text>
//           </View>
//         </View>

//         {/* ─────────── Toggle row ─────────── */}

//         {/* ─────────── Description (collapsible) ─────────── */}
//         {open && (
//           <View style={styles.descWrap}>
//             <Text style={styles.descText}>{data.description}</Text>
//           </View>
//         )}

//         {/* ─────────── Footer actions ─────────── */}
//         <View style={styles.footer}>
//           {/* toggle pill (left / takes remaining space) */}
//           <Pressable
//             onPress={toggleDesc}
//             android_ripple={{ color: "#E2E8F0" }}
//             style={styles.descToggle}
//             accessibilityLabel={open ? "Hide description" : "View description"}
//           >
//             <MaterialIcons
//               name={open ? "expand-less" : "expand-more"}
//               size={18}
//               color="#64748B"
//               style={{ marginRight: 6 }}
//             />
//             <Text style={styles.toggleText}>{open ? "Hide description" : "View description"}</Text>
//           </Pressable>

//           {/* edit / delete buttons */}
//           <View style={styles.actions}>
//             <Pressable
//               accessibilityLabel="Edit expense"
//               android_ripple={{ color: "#BAE6FD", borderless: true }}
//               style={({ pressed }) => [
//                 styles.actionBtn,
//                 styles.editBtn,
//                 pressed && styles.btnPressed,
//               ]}
//               onPress={() => onEdit?.(data.id)}
//             >
//               <Feather name="edit-3" size={18} color="#0369A1" />
//             </Pressable>

//             <Pressable
//               accessibilityLabel="Delete expense"
//               android_ripple={{ color: "#FECACA", borderless: true }}
//               style={({ pressed }) => [
//                 styles.actionBtn,
//                 styles.delBtn,
//                 pressed && styles.btnPressed,
//               ]}
//               onPress={() => onDelete?.(data.id)}
//             >
//               <Feather name="trash-2" size={18} color="#B91C1C" />
//             </Pressable>
//           </View>
//         </View>
//       </Pressable>
//     </Animated.View>
//   );
// };

// /* ---------- tiny emoji dictionary ---------- */
// const emojiMap: Record<string, string> = {
//   groceries: "🛒",
//   transport: "🚕",
//   maintenance: "🛠️",
//   food: "🍽️",
//   rent: "🏠",
// };

// /* ---------- styles ---------- */
// const styles = StyleSheet.create({
//   /* shadow wrapper */
//   shadow: {
//     borderRadius: 20,
//     backgroundColor: SHADOW, // for Android elevation
//     shadowColor: SHADOW,
//     shadowOffset: { width: 0, height: 7 },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 6,
//   },

//   /* card */
//   card: {
//     borderRadius: 20,
//     overflow: "hidden",
//     backgroundColor: BG,
//   },

//   /* header */
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     gap: 12,
//   },
//   emojiWrap: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "#F1F5F9",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   emojiText: { fontSize: 22 },
//   billNo: { fontWeight: "700", color: Colors.textAccent, marginBottom: 2 },
//   dateText: { fontSize: 12, color: Colors.textMuted },

//   amountPill: {
//     backgroundColor: "#E2F0FF",
//     paddingHorizontal: 14,
//     paddingVertical: 6,
//     borderRadius: 16,
//   },
//   amountText: { fontWeight: "700", color: "#0F172A", fontSize: 15 },

//   /* description toggle pill */
//   descToggle: {
//     flexDirection: "row",
//     alignItems: "center",
//     alignSelf: "flex-start",
//     backgroundColor: "#F8FAFC",
//     marginHorizontal: 16,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 14,
//   },
//   toggleText: { fontSize: 13, color: "#475569", fontWeight: "600" },

//   /* expanded description */
//   descWrap: {
//     marginTop: 8,
//     marginHorizontal: 16,
//     marginBottom: 12,
//     backgroundColor: "#F1F5F9",
//     borderRadius: 14,
//     padding: 12,
//   },
//   descText: {
//     color: Colors.textMuted,
//     fontSize: 13,
//     lineHeight: 18,
//     fontWeight: "500",
//   },

//   /* footer */
//   footer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 14,
//     paddingTop: 4,
//     paddingBottom: 12,
//   },

//   /* NEW: container for edit+delete buttons */
//   actions: { flexDirection: "row", gap: 12 },

//   /* ↓  REPLACE the old descToggle (it had margins for the full‑width row)  */
//   descToggle: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F8FAFC",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 14,
//   },

//   /* adjust toggle text if desired (kept same) */
//   toggleText: { fontSize: 13, color: "#475569", fontWeight: "600" },
//   actionBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: SHADOW,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   editBtn: { backgroundColor: EDIT_BG },
//   delBtn: { backgroundColor: DEL_BG },
//   btnPressed: { opacity: 0.75 },
// });

// export default ExpenseCard;
/* ------------------------------------------------------------------
   ExpenseCard – compact, tappable summary ▸ expandable description
------------------------------------------------------------------- */
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

import { ExpenseItem } from "./ExpenseCard"; // re-use existing type
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ---------- enable Android layout animation ---------- */
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ---------- emoji helper ---------- */
const emojiMap: Record<string, string> = {
  groceries: "🛒",
  transport: "🚕",
  maintenance: "🛠️",
  food: "🍽️",
  rent: "🏠",
};

/* ------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------- */
interface Props {
  data: ExpenseItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ExpenseCard: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const { width } = useWindowDimensions();
  const { colors, spacing, radius, shadow } = useTheme();

  /* responsive width (same formula used across the app) */
  const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  const GAP = spacing.md - 2;
  const SIDE = spacing.md * 2;
  const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

  /* description toggle */
  const [open, setOpen] = useState(false);
  const toggleDesc = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((p) => !p);
  };

  /* themed styles */
  const s = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          width: cardW,
          borderRadius: radius.xl,
          backgroundColor: colors.cardBackground,
          shadowColor: shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 6,
          borderWidth: 1,
          borderColor: colors.borderColor,
        },

        /* header */
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        },
        emojiWrap: {
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        emojiTxt: { fontSize: 22 },

        billId: { fontWeight: "700", color: colors.textPrimary, marginBottom: 2 },
        dateTxt: { fontSize: 12, color: colors.textSecondary },

        amountPill: {
          backgroundColor: hexToRgba(colors.accent, 0.12),
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 6,
          borderRadius: radius.full,
        },
        amtTxt: { fontWeight: "700", color: colors.textPrimary, fontSize: 15 },

        /* description */
        descWrap: {
          marginHorizontal: spacing.md,
          marginBottom: spacing.sm,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.sm + 2,
        },
        descTxt: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },

        /* footer */
        footer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          paddingTop: 6,
        },
        toggle: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.sm,
          paddingVertical: 8,
          borderRadius: radius.lg,
        },
        toggleTxt: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },

        actions: { flexDirection: "row", gap: 12 },
        btn: {
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          // elevation: 4,
        },
        editBtn: { backgroundColor: hexToRgba(colors.accent, 0.12) },
        delBtn: { backgroundColor: hexToRgba(colors.error, 0.12) },
      }),
    [colors, spacing, radius, cardW, shadow]
  );

  /* money helper */
  const money = `₹${data.amount.toLocaleString()}`;

  /* render */
  return (
    <View style={s.outer}>
      {/* wrapper for ripple - keeping fixed border radius */}
      <Pressable android_ripple={{ color: hexToRgba(colors.primary, 0.06) }}>
        {/* ---------- header ---------- */}
        <View style={s.header}>
          <View style={s.emojiWrap}>
            <Text style={s.emojiTxt}>{emojiMap[data.category.toLowerCase()] ?? "💸"}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={s.billId} numberOfLines={1}>
              {data.id}
            </Text>
            <Text style={s.dateTxt}>{data.date}</Text>
          </View>

          <View style={s.amountPill}>
            <Text style={s.amtTxt}>{money}</Text>
          </View>
        </View>

        {/* ---------- description ---------- */}
        {open && (
          <View style={s.descWrap}>
            <Text style={s.descTxt}>{data.description}</Text>
          </View>
        )}

        {/* ---------- footer ---------- */}
        <View style={s.footer}>
          <Pressable
            style={s.toggle}
            onPress={toggleDesc}
            android_ripple={{ color: hexToRgba(colors.textSecondary, 0.12) }}
          >
            <MaterialIcons
              name={open ? "expand-less" : "expand-more"}
              size={18}
              color={colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={s.toggleTxt}>{open ? "Hide description" : "View description"}</Text>
          </Pressable>

          <View style={s.actions}>
            <Pressable
              style={({ pressed }) => [s.btn, s.editBtn, pressed && { opacity: 0.75 }]}
              android_ripple={{ color: hexToRgba(colors.accent, 0.2), borderless: true }}
              accessibilityLabel="Edit expense"
              onPress={() => onEdit?.(data.id)}
            >
              <Feather name="edit-3" size={18} color={colors.accent} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [s.btn, s.delBtn, pressed && { opacity: 0.75 }]}
              android_ripple={{ color: hexToRgba(colors.error, 0.25), borderless: true }}
              accessibilityLabel="Delete expense"
              onPress={() => onDelete?.(data.id)}
            >
              <Feather name="trash-2" size={18} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default ExpenseCard;
