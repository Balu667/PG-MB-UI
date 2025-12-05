// src/components/property/CollectionsTab.tsx
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
  I18nManager,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import StatsGrid, { Metric } from "@/src/components/StatsGrid";
import {
  generatePaymentReceipt,
  createReceiptDataFromCollection,
} from "@/src/utils/receiptGenerator";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

interface TenantDetails {
  _id?: string;
  name?: string;
  email?: string | null;
  phoneNumber?: string;
  roomNumber?: string;
  sharingType?: number;
}

interface Collection {
  _id?: string;
  id?: string;
  tenantDetails?: TenantDetails;
  paymentDate?: string;
  dueDate?: string;
  paymentCategory?: string;
  totalAmount?: number;
  amount?: number;
  paymentMode?: string;
  status?: number;
  paymentStatus?: number;
  description?: string;
}

interface Props {
  data: Collection[];
  metrics?: Metric[];
  refreshing: boolean;
  onRefresh: () => void;
  /** Property name for receipt generation */
  propertyName?: string;
}

interface DateFilter {
  from?: Date;
  to?: Date;
}

interface FilterShape {
  paymentDate?: DateFilter;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const str = (v: unknown, fallback = ""): string =>
  v == null ? fallback : String(v);

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;

const toDate = (s?: unknown): Date | null => {
  if (!s) return null;
  const d = new Date(s as string);
  return isNaN(d.getTime()) ? null : d;
};

const inr = (n: unknown): string => `₹${num(n).toLocaleString("en-IN")}`;

const fmtDate = (iso?: string): string => {
  const d = toDate(iso);
  return d
    ? d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
};

const monthOf = (iso?: string): string => {
  const d = toDate(iso);
  return d
    ? d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "—";
};

const withinRange = (dtISO?: string, range?: DateFilter): boolean => {
  if (!range || (!range.from && !range.to)) return true;
  const d = toDate(dtISO);
  if (!d) return false;
  const t = d.getTime();

  if (range.from) {
    const fromStart = new Date(
      range.from.getFullYear(),
      range.from.getMonth(),
      range.from.getDate(),
      0,
      0,
      0,
      0
    ).getTime();
    if (t < fromStart) return false;
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
  const parts = str(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "PG";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const sections: Section[] = [
  { key: "paymentDate", label: "Payment Date", mode: "date" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY BADGE COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface CategoryBadgeProps {
  category: string;
  dueMonth?: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = React.memo(
  ({ category, dueMonth }) => {
    const { colors, spacing, radius } = useTheme();

    const catLower = str(category).toLowerCase();

    const getStyles = useCallback(() => {
      if (catLower.includes("rent")) {
        return {
          bg: hexToRgba("#10B981", 0.12),
          border: hexToRgba("#10B981", 0.25),
          text: "#059669",
          icon: "cash" as const,
        };
      }
      if (catLower.includes("deposit") || catLower.includes("security")) {
        return {
          bg: hexToRgba("#6366F1", 0.12),
          border: hexToRgba("#6366F1", 0.25),
          text: "#4F46E5",
          icon: "shield-check" as const,
        };
      }
      if (catLower.includes("water")) {
        return {
          bg: hexToRgba("#06B6D4", 0.12),
          border: hexToRgba("#06B6D4", 0.25),
          text: "#0891B2",
          icon: "water" as const,
        };
      }
      if (catLower.includes("internet") || catLower.includes("wifi")) {
        return {
          bg: hexToRgba("#8B5CF6", 0.12),
          border: hexToRgba("#8B5CF6", 0.25),
          text: "#7C3AED",
          icon: "wifi" as const,
        };
      }
      if (catLower.includes("electricity") || catLower.includes("power")) {
        return {
          bg: hexToRgba("#F59E0B", 0.12),
          border: hexToRgba("#F59E0B", 0.25),
          text: "#D97706",
          icon: "lightning-bolt" as const,
        };
      }
      return {
        bg: hexToRgba(colors.accent, 0.1),
        border: hexToRgba(colors.accent, 0.2),
        text: colors.accent,
        icon: "tag" as const,
      };
    }, [catLower, colors.accent]);

    const catStyles = getStyles();
    const displayText =
      dueMonth && dueMonth !== "—" ? `${category} (${dueMonth})` : category;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 5,
          borderRadius: radius.full,
          backgroundColor: catStyles.bg,
          borderWidth: 1,
          borderColor: catStyles.border,
        }}
        accessible
        accessibilityLabel={`Payment category: ${displayText}`}
      >
        <MaterialCommunityIcons
          name={catStyles.icon}
          size={13}
          color={catStyles.text}
        />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: catStyles.text,
            textTransform: "capitalize",
          }}
        >
          {displayText}
        </Text>
      </View>
    );
  }
);

CategoryBadge.displayName = "CategoryBadge";

/* ─────────────────────────────────────────────────────────────────────────────
   PAYMENT MODE BADGE COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface PaymentModeBadgeProps {
  mode: string;
}

const PaymentModeBadge: React.FC<PaymentModeBadgeProps> = React.memo(
  ({ mode }) => {
    const { colors, spacing, radius } = useTheme();
    const modeLower = str(mode).toLowerCase();

    const getIcon = (): keyof typeof MaterialCommunityIcons.glyphMap => {
      if (modeLower.includes("cash")) return "cash";
      if (modeLower.includes("upi")) return "cellphone";
      if (modeLower.includes("card") || modeLower.includes("credit"))
        return "credit-card";
      if (modeLower.includes("bank") || modeLower.includes("transfer"))
        return "bank-transfer";
      if (modeLower.includes("cheque") || modeLower.includes("check"))
        return "checkbook";
      return "wallet";
    };

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 5,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.12),
        }}
        accessible
        accessibilityLabel={`Payment mode: ${mode}`}
      >
        <MaterialCommunityIcons
          name={getIcon()}
          size={13}
          color={colors.textSecondary}
        />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: colors.textPrimary,
            textTransform: "capitalize",
          }}
        >
          {mode}
        </Text>
      </View>
    );
  }
);

PaymentModeBadge.displayName = "PaymentModeBadge";

/* ─────────────────────────────────────────────────────────────────────────────
   COLLECTION CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface CollectionCardProps {
  item: Collection;
  onDownload: (item: Collection) => void;
  index: number;
  isDownloading?: boolean;
}

const CollectionCard: React.FC<CollectionCardProps> = React.memo(
  ({ item, onDownload, index, isDownloading = false }) => {
    const { colors, spacing, radius, typography } = useTheme();
    const { width } = useWindowDimensions();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const isTablet = width >= 768;

    // Extract data
    const tenantName = str(item?.tenantDetails?.name, "—");
    const roomNumber = str(item?.tenantDetails?.roomNumber, "—");
    const phoneNumber = str(item?.tenantDetails?.phoneNumber, "—");
    const paymentDate = fmtDate(item?.paymentDate);
    const category = str(item?.paymentCategory, "Other");
    const dueMonth = monthOf(item?.dueDate);
    const paidAmount = num(item?.amount);
    const totalAmount = num(item?.totalAmount);
    const paymentMode = str(item?.paymentMode, "Cash");
    const initials = getInitials(tenantName);

    // Calculate if fully paid
    const isFullyPaid = paidAmount >= totalAmount;
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }, [scaleAnim]);

    const handleDownload = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDownload(item);
    }, [item, onDownload]);

    const styles = useMemo(
      () =>
        StyleSheet.create({
          cardWrapper: {
            marginBottom: spacing.md,
          },
          card: {
            borderRadius: radius.xl + 2,
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: colors.borderColor,
            shadowColor: colors.shadow ?? "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 5,
            overflow: "hidden",
          },
          statusBar: {
            height: 4,
            backgroundColor: isFullyPaid
              ? "#10B981"
              : hexToRgba("#F59E0B", 0.8),
          },
          cardContent: {
            padding: spacing.md,
          },
          headerRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: spacing.sm + 2,
          },
          leftSection: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm + 2,
            flex: 1,
          },
          avatar: {
            width: isTablet ? 52 : 46,
            height: isTablet ? 52 : 46,
            borderRadius: isTablet ? 26 : 23,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: hexToRgba(colors.accent, 0.12),
            borderWidth: 2,
            borderColor: hexToRgba(colors.accent, 0.2),
          },
          avatarText: {
            fontSize: isTablet ? 18 : 16,
            fontWeight: "800",
            color: colors.accent,
          },
          tenantInfo: {
            flex: 1,
          },
          tenantName: {
            fontSize: isTablet ? 17 : 15,
            fontWeight: "700",
            color: colors.textPrimary,
            marginBottom: 2,
          },
          roomInfo: {
            fontSize: 13,
            color: colors.textSecondary,
            fontWeight: "500",
          },
          amountSection: {
            alignItems: I18nManager.isRTL ? "flex-start" : "flex-end",
          },
          paidAmount: {
            fontSize: isTablet ? 22 : 20,
            fontWeight: "800",
            color: "#10B981",
          },
          paidLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textMuted,
            marginTop: 2,
          },
          badgesRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
            marginBottom: spacing.sm + 2,
          },
          dateChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: 5,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: hexToRgba(colors.textSecondary, 0.12),
          },
          dateText: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textPrimary,
          },
          divider: {
            height: 1,
            backgroundColor: hexToRgba(colors.textSecondary, 0.08),
            marginVertical: spacing.sm,
          },
          detailsGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.md,
          },
          detailItem: {
            minWidth: 100,
          },
          detailLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textMuted,
            marginBottom: 2,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          },
          detailValue: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.textPrimary,
          },
          footerRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: spacing.sm + 2,
          },
          statusBadge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: spacing.sm + 4,
            paddingVertical: 6,
            borderRadius: radius.full,
            backgroundColor: isFullyPaid
              ? hexToRgba("#10B981", 0.1)
              : hexToRgba("#F59E0B", 0.1),
          },
          statusText: {
            fontSize: 12,
            fontWeight: "700",
            color: isFullyPaid ? "#059669" : "#D97706",
          },
          downloadBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: hexToRgba(colors.accent, 0.2),
            minHeight: 44,
          },
          downloadBtnPressed: {
            backgroundColor: hexToRgba(colors.accent, 0.08),
          },
          downloadText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.accent,
          },
        }),
      [colors, spacing, radius, typography, isTablet, isFullyPaid]
    );

    return (
      <Animated.View
        style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Collection from ${tenantName}, ${inr(paidAmount)} paid on ${paymentDate}`}
          accessibilityHint="Shows collection details"
        >
          <View style={styles.card}>
            {/* Status bar at top */}
            <View style={styles.statusBar} />

            <View style={styles.cardContent}>
              {/* Header: Avatar, Name, Amount */}
              <View style={styles.headerRow}>
                <View style={styles.leftSection}>
                  <View
                    style={styles.avatar}
                    accessible
                    accessibilityLabel={`Avatar for ${tenantName}`}
                  >
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.tenantInfo}>
                    <Text
                      style={styles.tenantName}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {tenantName}
                    </Text>
                    <Text style={styles.roomInfo}>
                      Room {roomNumber} • {phoneNumber}
                    </Text>
                  </View>
                </View>
                <View style={styles.amountSection}>
                  <Text style={styles.paidAmount}>{inr(paidAmount)}</Text>
                  <Text style={styles.paidLabel}>PAID</Text>
                </View>
              </View>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <View style={styles.dateChip}>
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={13}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.dateText}>{paymentDate}</Text>
                </View>
                <CategoryBadge category={category} dueMonth={dueMonth} />
                <PaymentModeBadge mode={paymentMode} />
              </View>

              <View style={styles.divider} />

              {/* Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Amount</Text>
                  <Text style={styles.detailValue}>{inr(totalAmount)}</Text>
                </View>
                {!isFullyPaid && remainingAmount > 0 && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Remaining</Text>
                    <Text style={[styles.detailValue, { color: "#F59E0B" }]}>
                      {inr(remainingAmount)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Footer: Status + Download */}
              <View style={styles.footerRow}>
                <View style={styles.statusBadge}>
                  <MaterialCommunityIcons
                    name={isFullyPaid ? "check-circle" : "clock-outline"}
                    size={14}
                    color={isFullyPaid ? "#059669" : "#D97706"}
                  />
                  <Text style={styles.statusText}>
                    {isFullyPaid ? "Fully Paid" : "Partial Payment"}
                  </Text>
                </View>

                <Pressable
                  onPress={handleDownload}
                  disabled={isDownloading}
                  style={({ pressed }) => [
                    styles.downloadBtn,
                    pressed && !isDownloading && styles.downloadBtnPressed,
                    isDownloading && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isDownloading ? "Generating receipt" : "Download receipt"}
                  accessibilityHint="Downloads the payment receipt as PDF"
                  accessibilityState={{ disabled: isDownloading }}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <MaterialCommunityIcons
                      name="download"
                      size={16}
                      color={colors.accent}
                    />
                  )}
                  <Text style={styles.downloadText}>
                    {isDownloading ? "Loading..." : "Receipt"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

CollectionCard.displayName = "CollectionCard";

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  searchQuery: string;
  hasFilter: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({ searchQuery, hasFilter }) => {
    const { colors, spacing } = useTheme();

    const isFiltered = searchQuery.trim().length > 0 || hasFilter;

    const styles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.xl * 2,
            paddingHorizontal: spacing.lg,
          },
          iconContainer: {
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: hexToRgba(colors.accent, 0.1),
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.lg,
          },
          title: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.textPrimary,
            marginBottom: spacing.sm,
            textAlign: "center",
          },
          subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 20,
            maxWidth: 280,
          },
        }),
      [colors, spacing]
    );

    return (
      <View
        style={styles.container}
        accessible
        accessibilityLabel={
          isFiltered
            ? "No collections matching your search or filter"
            : "No collections recorded yet"
        }
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={isFiltered ? "file-search-outline" : "cash-register"}
            size={42}
            color={colors.accent}
          />
        </View>
        <Text style={styles.title}>
          {isFiltered ? "No Results Found" : "No Collections Yet"}
        </Text>
        <Text style={styles.subtitle}>
          {isFiltered
            ? "Try adjusting your search terms or clearing the filters to see more results."
            : "Collections will appear here once tenants make payments."}
        </Text>
      </View>
    );
  }
);

EmptyState.displayName = "EmptyState";

/* ─────────────────────────────────────────────────────────────────────────────
   LIST HEADER COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface ListHeaderProps {
  metrics: Metric[];
  query: string;
  onSearch: (q: string) => void;
  onFilterOpen: () => void;
  filterActive: boolean;
  totalResults: number;
}

const ListHeader: React.FC<ListHeaderProps> = React.memo(
  ({ metrics, query, onSearch, onFilterOpen, filterActive, totalResults }) => {
    const { colors, spacing, radius, typography } = useTheme();
    const { width } = useWindowDimensions();

    const isTablet = width >= 768;

    const styles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
            gap: spacing.md,
          },
          sectionHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: spacing.xs,
            marginTop: spacing.sm,
          },
          sectionTitle: {
            fontSize: isTablet ? 18 : 16,
            fontWeight: "700",
            color: colors.textPrimary,
          },
          resultsBadge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: 4,
            borderRadius: radius.full,
            backgroundColor: hexToRgba(colors.accent, 0.1),
          },
          resultsText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.accent,
          },
          searchContainer: {
            backgroundColor: hexToRgba(colors.accent, 0.04),
            paddingVertical: spacing.sm + 2,
            paddingHorizontal: spacing.sm,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: hexToRgba(colors.accent, 0.08),
          },
        }),
      [colors, spacing, radius, typography, isTablet]
    );

    return (
      <View style={styles.container}>
        {/* Stats Grid */}
        {Array.isArray(metrics) && metrics.length > 0 && (
          <StatsGrid
            metrics={metrics}
            minVisible={width >= 900 ? 4 : width >= 740 ? 3 : 2}
            cardHeight={94}
          />
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text
            style={styles.sectionTitle}
            accessible
            accessibilityRole="header"
          >
            Payment History
          </Text>
          {totalResults > 0 && (
            <View style={styles.resultsBadge}>
              <MaterialCommunityIcons
                name="receipt"
                size={14}
                color={colors.accent}
              />
              <Text style={styles.resultsText}>
                {totalResults} {totalResults === 1 ? "record" : "records"}
              </Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search by tenant name..."
            onSearch={onSearch}
            onFilter={onFilterOpen}
            filterActive={filterActive}
          />
        </View>
      </View>
    );
  }
);

ListHeader.displayName = "ListHeader";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const CollectionsTab: React.FC<Props> = ({
  data,
  metrics = [],
  refreshing,
  onRefresh,
  propertyName = "PGMS",
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  // State
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<FilterShape>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter logic
  const filtered = useMemo(() => {
    let result = Array.isArray(data) ? [...data] : [];

    // Text search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((c) => {
        const name = str(c?.tenantDetails?.name).toLowerCase();
        const phone = str(c?.tenantDetails?.phoneNumber).toLowerCase();
        const room = str(c?.tenantDetails?.roomNumber).toLowerCase();
        return name.includes(q) || phone.includes(q) || room.includes(q);
      });
    }

    // Date range filter
    const range = filter?.paymentDate;
    if (range?.from || range?.to) {
      result = result.filter((c) => withinRange(c?.paymentDate, range));
    }

    // Status filter (only show status = 1)
    result = result.filter((c) => c?.status == null || Number(c.status) === 1);

    // Sort by payment date (most recent first)
    result.sort((a, b) => {
      const dateA = toDate(a?.paymentDate)?.getTime() ?? 0;
      const dateB = toDate(b?.paymentDate)?.getTime() ?? 0;
      return dateB - dateA;
    });

    return result;
  }, [data, query, filter]);

  const filterActive = !!filter?.paymentDate?.from || !!filter?.paymentDate?.to;

  // Handlers
  const handleDownload = useCallback(
    async (item: Collection) => {
      const itemId = String(item?._id ?? item?.id ?? "");

      // Prevent multiple simultaneous downloads
      if (downloadingId) {
        return;
      }

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setDownloadingId(itemId);

        // Create receipt data from collection item
        const receiptData = createReceiptDataFromCollection(item, propertyName);

        // Generate and share the receipt PDF
        const result = await generatePaymentReceipt(receiptData, {
          fileName: `Payment_Receipt_${itemId}`,
          shareAfterGenerate: true,
        });

        if (!result.success) {
          Alert.alert(
            "Download Failed",
            result.error || "Failed to generate receipt. Please try again.",
            [{ text: "OK" }]
          );
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        Alert.alert(
          "Error",
          "An unexpected error occurred. Please try again.",
          [{ text: "OK" }]
        );
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadingId, propertyName]
  );

  const handleFilterOpen = useCallback(() => {
    Haptics.selectionAsync();
    setSheetOpen(true);
  }, []);

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        listContent: {
          paddingHorizontal: spacing.md,
          paddingBottom: insets.bottom + spacing.lg * 2,
        },
      }),
    [spacing, insets.bottom]
  );

  // Render
  const renderItem = useCallback(
    ({ item, index }: { item: Collection; index: number }) => {
      const itemId = String(item?._id ?? item?.id ?? "");
      const isDownloading = downloadingId === itemId;
      return (
        <CollectionCard
          item={item}
          onDownload={handleDownload}
          index={index}
          isDownloading={isDownloading}
        />
      );
    },
    [handleDownload, downloadingId]
  );

  const keyExtractor = useCallback(
    (item: Collection, index: number) => String(item?._id ?? item?.id ?? index),
    []
  );

  const ListHeaderMemo = useMemo(
    () => (
      <ListHeader
        metrics={metrics}
        query={query}
        onSearch={setQuery}
        onFilterOpen={handleFilterOpen}
        filterActive={filterActive}
        totalResults={filtered.length}
      />
    ),
    [metrics, query, handleFilterOpen, filterActive, filtered.length]
  );

  const ListEmptyMemo = useMemo(
    () => <EmptyState searchQuery={query} hasFilter={filterActive} />,
    [query, filterActive]
  );

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeaderMemo}
        ListEmptyComponent={ListEmptyMemo}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        accessibilityLabel="Collections list"
        accessibilityRole="list"
      />

      <FilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={sections}
        resetValue={{}}
      />
    </>
  );
};

export default CollectionsTab;
