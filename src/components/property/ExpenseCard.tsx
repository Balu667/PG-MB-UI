// src/components/property/ExpenseCard.tsx
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

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const emojiMap: Record<string, string> = {
  groceries: "🛒",
  transport: "🚕",
  maintenance: "🛠️",
  food: "🍽️",
  rent: "🏠",
  "building rent": "🏠",
};

export type ExpenseItem = {
  id: string;
  date: string; // dd/MM/yyyy display
  amount: number;
  category: string;
  description: string;
};

interface Props {
  data: ExpenseItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ExpenseCard: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const { width } = useWindowDimensions();
  const { colors, spacing, radius, shadow } = useTheme();

  const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  const GAP = spacing.md - 2;
  const SIDE = spacing.md * 2;
  const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

  const [open, setOpen] = useState(false);
  const toggleDesc = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((p) => !p);
  };

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
        descWrap: {
          marginHorizontal: spacing.md,
          marginBottom: spacing.sm,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.sm + 2,
        },
        descTxt: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
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
        },
        editBtn: { backgroundColor: hexToRgba(colors.accent, 0.12) },
        delBtn: { backgroundColor: hexToRgba(colors.error, 0.12) },
      }),
    [colors, spacing, radius, cardW, shadow]
  );

  const money = `₹${data.amount.toLocaleString()}`;

  return (
    <View style={s.outer}>
      <Pressable android_ripple={{ color: hexToRgba(colors.primary, 0.06) }}>
        <View style={s.header}>
          <View style={s.emojiWrap}>
            <Text style={s.emojiTxt}>{emojiMap[data.category.toLowerCase()] ?? "💸"}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={s.billId} numberOfLines={1}>
              {data.category}
            </Text>
            <Text style={s.dateTxt}>{data.date}</Text>
          </View>

          <View style={s.amountPill}>
            <Text style={s.amtTxt}>{money}</Text>
          </View>
        </View>

        {open && (
          <View style={s.descWrap}>
            <Text style={s.descTxt}>{data.description || "—"}</Text>
          </View>
        )}

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
