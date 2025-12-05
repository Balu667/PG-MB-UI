// src/components/property/DuesTab.tsx
// Premium Dues Tab - Rich, user-friendly design inspired by Swiggy/Zomato
import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  RefreshControl,
  Pressable,
  Platform,
  Animated,
  useWindowDimensions,
  ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import StatsGrid, { Metric } from "@/src/components/StatsGrid";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & HELPERS
───────────────────────────────────────────────────────────────────────────── */

type DateRange = { from?: Date; to?: Date };

interface DueItem {
  _id: string;
  status: number;
  tenantId: string;
  amount: number;
  totalAmount: number;
  dueDate: string;
  paymentCategory: string;
  paymentMode: string;
  description?: string;
  tenantDetails?: {
    _id: string;
    name: string;
    email?: string | null;
    phoneNumber: string;
    roomNumber: string;
    sharingType: number;
  };
}

interface Props {
  data: DueItem[];
  metrics?: Metric[];
  refreshing: boolean;
  onRefresh: () => void;
}

const str = (v: unknown, fallback = ""): string =>
  v == null ? fallback : String(v);

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;

const toDate = (s?: unknown): Date | null => {
  if (!s) return null;
  const d = new Date(String(s));
  return isNaN(d.getTime()) ? null : d;
};

const formatCurrency = (amount: number): string =>
  `₹${amount.toLocaleString("en-IN")}`;

const formatDate = (iso?: string): string => {
  const d = toDate(iso);
  return d
    ? d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
};

const formatShortDate = (iso?: string): string => {
  const d = toDate(iso);
  return d
    ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    : "—";
};

const getMonthYear = (iso?: string): string => {
  const d = toDate(iso);
  return d
    ? d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "—";
};

// Get due urgency: overdue, due-soon (within 7 days), upcoming
type DueUrgency = "overdue" | "due-soon" | "upcoming" | "future";

const getDueUrgency = (dueDateIso?: string): DueUrgency => {
  const dueDate = toDate(dueDateIso);
  if (!dueDate) return "upcoming";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  );

  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "due-soon";
  if (diffDays <= 30) return "upcoming";
  return "future";
};

const getDaysOverdue = (dueDateIso?: string): number => {
  const dueDate = toDate(dueDateIso);
  if (!dueDate) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  );

  return Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
};

const withinRange = (dtISO?: string, range?: DateRange): boolean => {
  if (!range || (!range.from && !range.to)) return true;
  const d = toDate(dtISO);
  if (!d) return false;
  const t = d.getTime();

  if (range.from) {
    const from0 = new Date(
      range.from.getFullYear(),
      range.from.getMonth(),
      range.from.getDate(),
      0,
      0,
      0,
      0
    ).getTime();
    if (t < from0) return false;
  }

  if (range.to) {
    const toEnd = new Date(
      range.to.getFullYear(),
      range.to.getMonth(),
      range.to.getDate(),
      23,
      59,
      59,
      999
    ).getTime();
    if (t > toEnd) return false;
  }

  return true;
};

const getInitials = (name?: string): string => {
  return str(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w?.[0]?.toUpperCase() || "")
    .join("") || "PG";
};

const getCategoryIcon = (
  category?: string
): keyof typeof MaterialCommunityIcons.glyphMap => {
  const cat = str(category).toLowerCase();
  if (cat.includes("rent")) return "home-city";
  if (cat.includes("security") || cat.includes("deposit")) return "shield-check";
  if (cat.includes("maintenance")) return "wrench";
  if (cat.includes("electricity")) return "lightning-bolt";
  if (cat.includes("water")) return "water";
  return "cash";
};

const getCategoryColor = (category?: string): string => {
  const cat = str(category).toLowerCase();
  if (cat.includes("rent")) return "#0EA5E9"; // Sky blue
  if (cat.includes("security") || cat.includes("deposit")) return "#8B5CF6"; // Purple
  if (cat.includes("maintenance")) return "#F59E0B"; // Amber
  if (cat.includes("electricity")) return "#EAB308"; // Yellow
  if (cat.includes("water")) return "#06B6D4"; // Cyan
  return "#6B7280"; // Gray
};

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER SECTIONS
───────────────────────────────────────────────────────────────────────────── */

const sections: Section[] = [
  {
    key: "dueDate",
    label: "Due Date",
    mode: "date",
    dateConfig: { allowFuture: true, fromLabel: "From Date", toLabel: "To Date" },
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   STATS CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface StatsCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  highlight,
}) => {
  const { colors, spacing, radius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          backgroundColor: highlight
            ? hexToRgba(iconColor, 0.08)
            : colors.cardBackground,
          borderRadius: radius.lg + 2,
          padding: spacing.md,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: Platform.OS === "ios" ? 0.1 : 0.06,
          shadowRadius: Platform.OS === "ios" ? 10 : 6,
          elevation: 4,
          borderWidth: highlight ? 1.5 : 1,
          borderColor: highlight
            ? hexToRgba(iconColor, 0.3)
            : Platform.OS === "ios"
            ? hexToRgba(colors.textMuted, 0.12)
            : hexToRgba(colors.textMuted, 0.08),
        },
        iconWrap: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.sm,
        },
        label: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
        },
        value: {
          fontSize: 16,
          fontWeight: "800",
          color: highlight ? iconColor : colors.textPrimary,
          letterSpacing: 0.2,
        },
      }),
    [colors, spacing, radius, iconBg, iconColor, highlight]
  );

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   DUE CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface DueCardProps {
  item: DueItem;
  onPayNow: (item: DueItem) => void;
  onEdit: (item: DueItem) => void;
  cardWidth: number;
}

const DueCard: React.FC<DueCardProps> = ({
  item,
  onPayNow,
  onEdit,
  cardWidth,
}) => {
  const { colors, spacing, radius, typography } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const tenant = item.tenantDetails;
  const name = str(tenant?.name, "Unknown");
  const room = str(tenant?.roomNumber, "—");
  const phone = str(tenant?.phoneNumber, "—");
  const amount = num(item?.amount);
  const totalAmount = num(item?.totalAmount);
  const category = str(item?.paymentCategory, "Payment");
  const dueDate = item?.dueDate;
  const urgency = getDueUrgency(dueDate);
  const daysOverdue = getDaysOverdue(dueDate);

  // Urgency colors
  const urgencyConfig = useMemo(() => {
    switch (urgency) {
      case "overdue":
        return {
          barColor: "#DC2626",
          badgeBg: "#FEE2E2",
          badgeText: "#991B1B",
          label: daysOverdue === 1 ? "1 day overdue" : `${daysOverdue} days overdue`,
          icon: "alert-circle" as const,
        };
      case "due-soon":
        return {
          barColor: "#F59E0B",
          badgeBg: "#FEF3C7",
          badgeText: "#92400E",
          label: "Due soon",
          icon: "clock-alert-outline" as const,
        };
      case "upcoming":
        return {
          barColor: "#0EA5E9",
          badgeBg: "#E0F2FE",
          badgeText: "#0369A1",
          label: "Upcoming",
          icon: "calendar-clock" as const,
        };
      default:
        return {
          barColor: "#10B981",
          badgeBg: "#D1FAE5",
          badgeText: "#065F46",
          label: "Future",
          icon: "calendar-month" as const,
        };
    }
  }, [urgency, daysOverdue]);

  const categoryColor = getCategoryColor(category);
  const categoryIcon = getCategoryIcon(category);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardOuter: {
          width: cardWidth,
          borderRadius: radius.xl,
          backgroundColor: colors.cardBackground,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: Platform.OS === "ios" ? 0.12 : 0.08,
          shadowRadius: Platform.OS === "ios" ? 14 : 10,
          elevation: 5,
          borderWidth: Platform.OS === "ios" ? 1 : 0,
          borderColor: hexToRgba(colors.textMuted, 0.1),
        },
        cardWrapper: {
          overflow: "hidden",
          borderRadius: radius.xl,
        },
        // Urgency bar at top
        urgencyBar: {
          height: 4,
          backgroundColor: urgencyConfig.barColor,
        },
        cardContent: {
          padding: spacing.md,
        },
        // Header row: Avatar + Info + Amount
        headerRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          marginBottom: spacing.sm + 2,
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.sm + 2,
        },
        avatarText: {
          fontSize: 16,
          fontWeight: "800",
          color: colors.accent,
        },
        infoWrap: {
          flex: 1,
        },
        nameRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        },
        name: {
          fontSize: typography.fontSizeMd,
          fontWeight: "700",
          color: colors.textPrimary,
          flex: 1,
        },
        roomBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: radius.full,
        },
        roomText: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.accent,
        },
        phone: {
          fontSize: 13,
          color: colors.textSecondary,
          fontWeight: "500",
        },
        amountWrap: {
          alignItems: "flex-end",
        },
        amountLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 2,
        },
        amount: {
          fontSize: 20,
          fontWeight: "800",
          color: urgency === "overdue" ? "#DC2626" : colors.textPrimary,
        },
        // Divider
        divider: {
          height: 1,
          backgroundColor: hexToRgba(colors.textMuted, 0.1),
          marginVertical: spacing.sm,
        },
        // Info chips row
        chipsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: spacing.sm,
        },
        chip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textMuted, 0.12),
        },
        categoryChip: {
          backgroundColor: hexToRgba(categoryColor, 0.1),
          borderColor: hexToRgba(categoryColor, 0.25),
        },
        chipText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        categoryChipText: {
          color: categoryColor,
        },
        // Urgency badge
        urgencyBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: radius.full,
          backgroundColor: urgencyConfig.badgeBg,
        },
        urgencyText: {
          fontSize: 12,
          fontWeight: "700",
          color: urgencyConfig.badgeText,
        },
        // Details grid
        detailsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: spacing.xs,
        },
        detailItem: {
          width: "50%",
          paddingVertical: 4,
        },
        detailLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 2,
        },
        detailValue: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        // Actions
        actionsRow: {
          flexDirection: "row",
          gap: 10,
          marginTop: spacing.sm + 2,
        },
        payBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 12,
          borderRadius: radius.lg,
          backgroundColor: "#16A34A",
        },
        payBtnPressed: {
          backgroundColor: "#15803D",
        },
        payBtnText: {
          fontSize: 14,
          fontWeight: "700",
          color: "#FFFFFF",
        },
        editBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderColor,
        },
        editBtnPressed: {
          backgroundColor: hexToRgba(colors.textMuted, 0.1),
        },
        editBtnText: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.textPrimary,
        },
      }),
    [
      colors,
      spacing,
      radius,
      typography,
      cardWidth,
      urgencyConfig,
      categoryColor,
      urgency,
    ]
  );

  return (
    <Animated.View style={[styles.cardOuter, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Due from ${name}, Room ${room}, Amount ${formatCurrency(amount)}`}
      >
        <View style={styles.cardWrapper}>
          {/* Urgency bar */}
          <View style={styles.urgencyBar} />

          <View style={styles.cardContent}>
            {/* Header: Avatar + Info + Amount */}
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              </View>

              <View style={styles.infoWrap}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <View style={styles.roomBadge}>
                    <MaterialCommunityIcons
                      name="door"
                      size={12}
                      color={colors.accent}
                    />
                    <Text style={styles.roomText}>{room}</Text>
                  </View>
                </View>
                <Text style={styles.phone}>📞 {phone}</Text>
              </View>

              <View style={styles.amountWrap}>
                <Text style={styles.amountLabel}>Due</Text>
                <Text style={styles.amount}>{formatCurrency(amount)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Chips row */}
            <View style={styles.chipsRow}>
              {/* Category chip */}
              <View style={[styles.chip, styles.categoryChip]}>
                <MaterialCommunityIcons
                  name={categoryIcon}
                  size={14}
                  color={categoryColor}
                />
                <Text style={[styles.chipText, styles.categoryChipText]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </View>

              {/* Due date chip */}
              <View style={styles.chip}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.chipText}>{formatShortDate(dueDate)}</Text>
              </View>

              {/* Urgency badge */}
              <View style={styles.urgencyBadge}>
                <MaterialCommunityIcons
                  name={urgencyConfig.icon}
                  size={14}
                  color={urgencyConfig.badgeText}
                />
                <Text style={styles.urgencyText}>{urgencyConfig.label}</Text>
              </View>
            </View>

            {/* Details grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Total Amount</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Due Month</Text>
                <Text style={styles.detailValue}>{getMonthYear(dueDate)}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.payBtn,
                  pressed && styles.payBtnPressed,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onPayNow(item);
                }}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Pay now"
                accessibilityHint={`Pay ${formatCurrency(amount)} for ${name}`}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.payBtnText}>Pay Now</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.editBtn,
                  pressed && styles.editBtnPressed,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onEdit(item);
                }}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Edit"
                accessibilityHint={`Edit due for ${name}`}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={16}
                  color={colors.textPrimary}
                />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  hasFilter: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasFilter }) => {
  const { colors, spacing, radius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: spacing.xl * 2.5,
          paddingHorizontal: spacing.xl,
        },
        iconOuter: {
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: hexToRgba("#10B981", 0.08),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        },
        iconInner: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: hexToRgba("#10B981", 0.15),
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          fontSize: 20,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.sm,
          textAlign: "center",
          letterSpacing: 0.2,
        },
        subtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
          maxWidth: 280,
        },
        ctaHint: {
          marginTop: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          backgroundColor: hexToRgba("#10B981", 0.1),
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
        },
        ctaText: {
          fontSize: 13,
          fontWeight: "600",
          color: "#059669",
        },
      }),
    [colors, spacing, radius]
  );

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={hasFilter ? "No dues match your filter" : "No pending dues"}
    >
      <View style={styles.iconOuter}>
        <View style={styles.iconInner}>
          <MaterialCommunityIcons
            name={hasFilter ? "file-search-outline" : "check-circle"}
            size={36}
            color="#10B981"
          />
        </View>
      </View>
      <Text style={styles.title}>
        {hasFilter ? "No Results Found" : "All Caught Up! 🎉"}
      </Text>
      <Text style={styles.subtitle}>
        {hasFilter
          ? "Try adjusting your filters or search terms to find what you're looking for."
          : "Great news! There are no pending dues at the moment. All payments are up to date."}
      </Text>
      {!hasFilter && (
        <View style={styles.ctaHint}>
          <MaterialCommunityIcons name="party-popper" size={16} color="#059669" />
          <Text style={styles.ctaText}>No action needed</Text>
        </View>
      )}
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   LIST HEADER
───────────────────────────────────────────────────────────────────────────── */

interface ListHeaderProps {
  metrics: Metric[];
  totalDues: number;
  overdueCount: number;
  dueCount: number;
  query: string;
  onQueryChange: (q: string) => void;
  onFilterPress: () => void;
  filterActive: boolean;
}

const ListHeader: React.FC<ListHeaderProps> = ({
  metrics,
  totalDues,
  overdueCount,
  dueCount,
  query,
  onQueryChange,
  onFilterPress,
  filterActive,
}) => {
  const { colors, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingBottom: spacing.md,
        },
        // Quick stats row
        quickStatsRow: {
          flexDirection: "row",
          gap: spacing.sm + 2,
          marginBottom: spacing.md,
        },
        // Section header
        sectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        },
        sectionTitleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        },
        sectionIcon: {
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: hexToRgba("#DC2626", 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        sectionTitle: {
          fontSize: isTablet ? 18 : 16,
          fontWeight: "700",
          color: colors.textPrimary,
          letterSpacing: 0.2,
        },
        badges: {
          flexDirection: "row",
          gap: spacing.xs,
        },
        badge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.full,
        },
        overdueBadge: {
          backgroundColor: "#FEE2E2",
        },
        totalBadge: {
          backgroundColor: hexToRgba(colors.accent, 0.1),
        },
        badgeText: {
          fontSize: 11,
          fontWeight: "700",
        },
        overdueText: {
          color: "#991B1B",
        },
        totalText: {
          color: colors.accent,
        },
        // Search container
        searchContainer: {
          backgroundColor: colors.cardBackground,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radius.lg + 2,
          borderWidth: 1,
          borderColor: Platform.OS === "ios"
            ? hexToRgba(colors.textMuted, 0.15)
            : hexToRgba(colors.textMuted, 0.1),
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: Platform.OS === "ios" ? 0.1 : 0.05,
          shadowRadius: Platform.OS === "ios" ? 8 : 4,
          elevation: 3,
        },
        searchLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
          marginBottom: spacing.xs + 2,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        },
      }),
    [colors, spacing, radius, isTablet]
  );

  return (
    <View style={styles.container}>
      {/* Quick Stats */}
      {/* <View style={styles.quickStatsRow}>
        <StatsCard
          icon="cash-remove"
          label="Total Dues"
          value={formatCurrency(totalDues)}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          highlight
        />
        <StatsCard
          icon="alert-circle"
          label="Overdue"
          value={String(overdueCount)}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
      </View> */}

      {/* Metrics grid */}
      {Array.isArray(metrics) && metrics.length > 0 && (
        <StatsGrid
          metrics={metrics}
          minVisible={width >= 900 ? 4 : width >= 740 ? 3 : 2}
          cardHeight={88}
        />
      )}

      {/* Section header */}
      <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIcon}>
            <MaterialCommunityIcons name="cash-clock" size={18} color="#DC2626" />
          </View>
          <Text style={styles.sectionTitle}>Pending Dues</Text>
        </View>
        <View style={styles.badges}>
          {overdueCount > 0 && (
            <View style={[styles.badge, styles.overdueBadge]}>
              <Text style={[styles.badgeText, styles.overdueText]}>
                {overdueCount} overdue
              </Text>
            </View>
          )}
          <View style={[styles.badge, styles.totalBadge]}>
            <Text style={[styles.badgeText, styles.totalText]}>
              {dueCount} total
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search Dues</Text>
        <SearchBar
          placeholder="Search by name, room or phone..."
          onSearch={onQueryChange}
          onFilter={onFilterPress}
          filterActive={filterActive}
        />
      </View>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function DuesTab({
  data,
  metrics = [],
  refreshing,
  onRefresh,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();

  // Responsive columns
  const columns = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  const cardPadding = spacing.md;
  const cardGap = spacing.md;
  const cardWidth =
    columns > 1
      ? (width - cardPadding * 2 - cardGap * (columns - 1)) / columns
      : width - cardPadding * 2;

  // State
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<{ dueDate?: DateRange }>({});

  // Filter & search
  const filtered = useMemo(() => {
    let out: DueItem[] = Array.isArray(data) ? data : [];

    // Only show dues (status === 2)
    out = out.filter((p) => num(p?.status) === 2);

    // Search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((p) => {
        const name = str(p?.tenantDetails?.name).toLowerCase();
        const room = str(p?.tenantDetails?.roomNumber).toLowerCase();
        const phone = str(p?.tenantDetails?.phoneNumber).toLowerCase();
        return name.includes(q) || room.includes(q) || phone.includes(q);
      });
    }

    // Date range filter
    const range = filter?.dueDate;
    if (range?.from || range?.to) {
      out = out.filter((p) => withinRange(p?.dueDate, range));
    }

    // Sort: overdue first, then by due date
    out.sort((a, b) => {
      const urgencyOrder = { overdue: 0, "due-soon": 1, upcoming: 2, future: 3 };
      const aUrgency = urgencyOrder[getDueUrgency(a.dueDate)];
      const bUrgency = urgencyOrder[getDueUrgency(b.dueDate)];
      if (aUrgency !== bUrgency) return aUrgency - bUrgency;

      // Within same urgency, sort by date (earliest first)
      const aDate = toDate(a.dueDate)?.getTime() || 0;
      const bDate = toDate(b.dueDate)?.getTime() || 0;
      return aDate - bDate;
    });

    return out;
  }, [data, query, filter]);

  // Stats
  const totalDues = useMemo(
    () => filtered.reduce((sum, item) => sum + num(item?.amount), 0),
    [filtered]
  );

  const overdueCount = useMemo(
    () => filtered.filter((item) => getDueUrgency(item.dueDate) === "overdue").length,
    [filtered]
  );

  const filterActive = !!filter?.dueDate?.from || !!filter?.dueDate?.to || !!query.trim();

  // Handlers
  const onPayNow = useCallback((item: DueItem) => {
    Haptics.selectionAsync();
    // TODO: Integrate payment flow
  }, []);

  const onEdit = useCallback((item: DueItem) => {
    Haptics.selectionAsync();
    // TODO: Navigate to edit screen
  }, []);

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        columnGap: {
          gap: cardGap,
        },
        listContent: {
          paddingHorizontal: cardPadding,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.lg * 3,
          gap: spacing.md,
        },
      }),
    [cardPadding, cardGap, spacing, insets.bottom]
  );

  // Render item
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DueItem>) => (
      <DueCard
        item={item}
        onPayNow={onPayNow}
        onEdit={onEdit}
        cardWidth={cardWidth}
      />
    ),
    [onPayNow, onEdit, cardWidth]
  );

  const keyExtractor = useCallback(
    (item: DueItem, index: number) => String(item?._id || index),
    []
  );

  // List header
  const ListHeaderMemo = useMemo(
    () => (
      <ListHeader
        metrics={metrics}
        totalDues={totalDues}
        overdueCount={overdueCount}
        dueCount={filtered.length}
        query={query}
        onQueryChange={setQuery}
        onFilterPress={() => setSheetOpen(true)}
        filterActive={filterActive}
      />
    ),
    [metrics, totalDues, overdueCount, filtered.length, query, filterActive]
  );

  // Empty state
  const ListEmptyMemo = useMemo(
    () => <EmptyState hasFilter={filterActive} />,
    [filterActive]
  );

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        numColumns={columns}
        key={`dues-list-${columns}`}
        columnWrapperStyle={columns > 1 ? styles.columnGap : undefined}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderMemo}
        ListEmptyComponent={ListEmptyMemo}
        refreshControl={
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        accessibilityLabel="Dues list"
        accessibilityRole="list"
      />

      {/* Filter Sheet */}
      <FilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={sections}
        resetValue={{}}
        title="Filter Dues"
      />
    </>
  );
}
