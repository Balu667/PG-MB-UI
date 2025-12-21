// src/components/property/ExpenseCard.tsx
// Premium Expense Card - Modern, clean design inspired by top fintech apps
import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  I18nManager,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY CONFIG - Icons and colors for each expense category
───────────────────────────────────────────────────────────────────────────── */

type CategoryConfig = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
};

const getCategoryConfig = (category: string): CategoryConfig => {
  const normalized = category?.toLowerCase?.() ?? "";

  if (normalized.includes("rent") || normalized.includes("రెంట్")) {
    return { icon: "home-city", color: "#7C3AED", bgColor: "#EDE9FE" };
  }
  if (normalized.includes("salar")) {
    return { icon: "account-cash", color: "#0284C7", bgColor: "#E0F2FE" };
  }
  if (normalized.includes("grocer")) {
    return { icon: "cart", color: "#059669", bgColor: "#D1FAE5" };
  }
  if (normalized.includes("maintenance") || normalized.includes("repair")) {
    return { icon: "wrench", color: "#EA580C", bgColor: "#FFEDD5" };
  }
  if (normalized.includes("electric") || normalized.includes("power")) {
    return { icon: "lightning-bolt", color: "#EAB308", bgColor: "#FEF9C3" };
  }
  if (normalized.includes("water")) {
    return { icon: "water", color: "#0EA5E9", bgColor: "#E0F2FE" };
  }
  if (normalized.includes("transport") || normalized.includes("travel")) {
    return { icon: "car", color: "#6366F1", bgColor: "#E0E7FF" };
  }
  if (normalized.includes("food") || normalized.includes("meal")) {
    return { icon: "food", color: "#F43F5E", bgColor: "#FFE4E6" };
  }
  if (normalized.includes("internet") || normalized.includes("wifi")) {
    return { icon: "wifi", color: "#8B5CF6", bgColor: "#EDE9FE" };
  }
  if (normalized.includes("gas") || normalized.includes("fuel")) {
    return { icon: "gas-station", color: "#DC2626", bgColor: "#FEE2E2" };
  }

  // Default
  return { icon: "cash", color: "#64748B", bgColor: "#F1F5F9" };
};

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

export type ExpenseItem = {
  id: string;
  date: string; // dd/MM/yyyy for display
  amount: number;
  category: string;
  description: string;
  _dateObj?: Date;
};

interface Props {
  data: ExpenseItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   EXPENSE CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const ExpenseCard: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const { width } = useWindowDimensions();
  const { colors, spacing, radius } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Responsive columns
  const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  const GAP = spacing.md;
  const SIDE = spacing.md * 2;
  const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

  const [expanded, setExpanded] = useState(false);
  const categoryConfig = getCategoryConfig(data.category);

  // Animation handlers
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 400,
      friction: 12,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 400,
      friction: 12,
    }).start();
  }, [scaleAnim]);

  const toggleExpand = useCallback(() => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit?.(data.id);
  }, [data.id, onEdit]);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.(data.id);
  }, [data.id, onDelete]);

  // Format amount
  const formattedAmount = useMemo(() => {
    return `₹${data.amount.toLocaleString("en-IN")}`;
  }, [data.amount]);

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardOuter: {
          width: cardW,
          borderRadius: radius.xl,
          backgroundColor: colors.cardBackground2,
          // iOS shadow - more prominent
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: Platform.OS === "ios" ? 0.15 : 0.1,
          shadowRadius: Platform.OS === "ios" ? 16 : 12,
          // Android elevation
          elevation: 6,
          // Border for extra definition on iOS
          borderWidth: Platform.OS === "ios" ? 1 : 0,
          borderColor: hexToRgba(colors.borderColor, 0.9),
        },
        // Wrapper to prevent overflow clipping shadows on iOS
        cardWrapper: {
          overflow: "hidden",
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.7),
        },
        // Top accent bar
        accentBar: {
          height: 5,
          backgroundColor: categoryConfig.color,
        },
        // Main content
        content: {
          padding: spacing.md,
        },
        // Top row: Icon + Info + Amount
        topRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing.md - 2,
        },
        // Category icon
        iconContainer: {
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: categoryConfig.bgColor,
          alignItems: "center",
          justifyContent: "center",
        },
        // Info block
        infoBlock: {
          flex: 1,
          minWidth: 0,
        },
        categoryText: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: 4,
          letterSpacing: 0.2,
        },
        dateRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        dateText: {
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: "500",
        },
        // Amount section
        amountContainer: {
          alignItems: "flex-end",
        },
        amountText: {
          fontSize: 16,
          fontWeight: "800",
          color: colors.textPrimary,
          letterSpacing: 0.3,
        },
        amountLabel: {
          fontSize: 10,
          color: colors.textMuted,
          fontWeight: "600",
          textTransform: "uppercase",
          marginTop: 2,
          letterSpacing: 0.5,
        },
        // Description section (expandable)
        descriptionSection: {
          marginTop: spacing.sm + 2,
          backgroundColor: hexToRgba(colors.surface2, 0.7),
          borderRadius: radius.lg,
          padding: spacing.sm + 2,
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.9),
        },
        descriptionLabel: {
          fontSize: 10,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
        },
        descriptionText: {
          fontSize: 13,
          color: colors.textSecondary,
          lineHeight: 19,
        },
        // Divider
        divider: {
          height: 1,
          backgroundColor: hexToRgba(colors.textMuted, 0.08),
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        },
        // Actions row
        actionsRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        // Expand toggle
        expandToggle: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.xs,
        },
        expandText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        // Action buttons
        actionsGroup: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs + 2,
        },
        actionBtn: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        },
        editBtn: {
          backgroundColor: hexToRgba(colors.accent, 0.1),
        },
        editBtnPressed: {
          backgroundColor: hexToRgba(colors.accent, 0.2),
        },
        deleteBtn: {
          backgroundColor: hexToRgba(colors.error, 0.1),
        },
        deleteBtnPressed: {
          backgroundColor: hexToRgba(colors.error, 0.2),
        },
      }),
    [cardW, colors, spacing, radius, categoryConfig]
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={toggleExpand}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Expense: ${data.category}, ${formattedAmount}, ${data.date}`}
        accessibilityHint="Tap to expand details"
      >
        <View style={styles.cardOuter}>
          <View style={styles.cardWrapper}>
            {/* Accent bar */}
            <View style={styles.accentBar} />

          <View style={styles.content}>
            {/* Top row */}
            <View style={styles.topRow}>
              {/* Category Icon */}
              <View
                style={styles.iconContainer}
                accessible
                accessibilityLabel={`Category: ${data.category}`}
              >
                <MaterialCommunityIcons
                  name={categoryConfig.icon}
                  size={24}
                  color={categoryConfig.color}
                />
              </View>

              {/* Info */}
              <View style={styles.infoBlock}>
                <Text
                  style={styles.categoryText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {data.category}
                </Text>
                <View style={styles.dateRow}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.dateText}>{data.date}</Text>
                </View>
              </View>

              {/* Amount */}
              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>{formattedAmount}</Text>
                <Text style={styles.amountLabel}>Spent</Text>
              </View>
            </View>

            {/* Expanded Description */}
            {expanded && data.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>
                  {data.description || "No description provided"}
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              {/* Expand Toggle */}
              <Pressable
                style={styles.expandToggle}
                onPress={toggleExpand}
                accessible
                accessibilityRole="button"
                accessibilityLabel={expanded ? "Hide details" : "Show details"}
              >
                <MaterialCommunityIcons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.expandText}>
                  {expanded ? "Less" : "Details"}
                </Text>
              </Pressable>

              {/* Action Buttons */}
              <View style={styles.actionsGroup}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.editBtn,
                    pressed && styles.editBtnPressed,
                  ]}
                  onPress={handleEdit}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Edit expense"
                  accessibilityHint="Opens edit form"
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={18}
                    color={colors.accent}
                  />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.deleteBtn,
                    pressed && styles.deleteBtnPressed,
                  ]}
                  onPress={handleDelete}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Delete expense"
                  accessibilityHint="Shows delete confirmation"
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={colors.error}
                  />
                </Pressable>
              </View>
            </View>
          </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default ExpenseCard;
