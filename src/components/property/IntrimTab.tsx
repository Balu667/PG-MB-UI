// src/components/property/IntrimTab.tsx
// Premium Interim Booking Tab - Short-term bookings between tenant stays
import React, { useMemo, useState, useCallback, RefObject } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Text,
  RefreshControl,
  Platform,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Linking,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import SearchBar from "@/src/components/SearchBar";
import AddButton from "@/src/components/Common/AddButton";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import StatsGrid from "@/src/components/StatsGrid";
import type { Metric } from "@/src/components/StatsGrid";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const str = (v: unknown, f = "") => (v == null ? f : String(v));
const num = (v: unknown, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || f;
const getName = (t: Record<string, unknown>) => str(t?.tenantName ?? t?.name ?? "", "");
const getPhone = (t: Record<string, unknown>) => str(t?.phoneNumber ?? t?.phone ?? "", "");
const getRoom = (t: Record<string, unknown>) => str(t?.roomNumber ?? t?.room ?? "", "");
const getBed = (t: Record<string, unknown>) => str(t?.bedNumber ?? t?.bed ?? "", "");

// Convert UTC date to Indian Time (IST = UTC + 5:30)
const toIST = (utcDate: Date): Date => {
  const utcTime = utcDate.getTime();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  return new Date(utcTime + istOffset);
};

// Parse date from API (UTC) and convert to IST for display
const parseISTDate = (v: unknown): Date | null => {
  try {
    const s = str(v, "");
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return toIST(d);
  } catch {
    return null;
  }
};

// Parse date without IST conversion (for comparison)
const parseDate = (v: unknown): Date | null => {
  try {
    const s = str(v, "");
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const endOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const formatDisplayDate = (d: Date | null): string => {
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// Get booking status based on dates
type BookingStatus = "active" | "upcoming" | "expired" | "cancelled";

const getBookingStatus = (
  joiningDate: Date | null,
  moveOutDate: Date | null
): BookingStatus => {
  const now = new Date();
  const today = startOfDayLocal(now);

  if (!joiningDate || !moveOutDate) return "upcoming";

  const joinDay = startOfDayLocal(joiningDate);
  const moveDay = startOfDayLocal(moveOutDate);

  if (today < joinDay) return "upcoming";
  if (today > moveDay) return "expired";
  return "active";
};

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER TYPES & SECTIONS
───────────────────────────────────────────────────────────────────────────── */

type DateRange = { from?: Date; to?: Date };

interface IntrimFilter {
  status: string[];
  joiningDate: DateRange;
  bookingDate: DateRange;
}

const emptyFilter: IntrimFilter = {
  status: [],
  joiningDate: {},
  bookingDate: {},
};

const filterSections: Section[] = [
  {
    key: "status",
    label: "Status",
    mode: "checkbox",
    options: [
      { label: "Active", value: "active" },
      { label: "Cancelled", value: "cancelled" },
      { label: "Expired", value: "expired" },
    ],
  },
  {
    key: "joiningDate",
    label: "From-To (Joining Date)",
    mode: "date",
    dateConfig: { allowFuture: true, fromLabel: "From", toLabel: "To" },
  },
  {
    key: "bookingDate",
    label: "From-To (Booking Date)",
    mode: "date",
    dateConfig: { allowFuture: false, fromLabel: "From", toLabel: "To" },
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   INTRIM BOOKING CARD
───────────────────────────────────────────────────────────────────────────── */

interface IntrimCardProps {
  item: Record<string, unknown>;
  cardWidth: number;
  onEdit: (item: Record<string, unknown>) => void;
  onCancel: (item: Record<string, unknown>) => void;
}

const IntrimCard = React.memo(function IntrimCard({
  item,
  cardWidth,
  onEdit,
  onCancel,
}: IntrimCardProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [showActions, setShowActions] = useState(false);

  const name = getName(item);
  const phone = getPhone(item);
  const room = getRoom(item);
  const bed = getBed(item);
  const advancePaid = num(item?.advanceRentAmountPaid);
  const joiningDate = parseISTDate(item?.joiningDate);
  const moveOutDate = parseISTDate(item?.moveOutDate);
  const bookingDate = parseISTDate(item?.bookingDate);
  const status = getBookingStatus(joiningDate, moveOutDate);

  // Status config
  const statusConfig = useMemo(() => {
    switch (status) {
      case "active":
        return { label: "Active", color: "#10B981", bgColor: "#D1FAE5", icon: "clock-check" };
      case "upcoming":
        return { label: "Upcoming", color: "#3B82F6", bgColor: "#DBEAFE", icon: "calendar-clock" };
      case "expired":
        return { label: "Expired", color: "#6B7280", bgColor: "#F3F4F6", icon: "clock-alert-outline" };
      default:
        return { label: "Cancelled", color: "#EF4444", bgColor: "#FEE2E2", icon: "close-circle" };
    }
  }, [status]);

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

  const handlePhonePress = useCallback(() => {
    if (phone && phone !== "—") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const phoneUrl = `tel:${phone.replace(/[^0-9+]/g, "")}`;
      Linking.canOpenURL(phoneUrl).then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert("Error", "Phone dialer is not available on this device.");
        }
      });
    }
  }, [phone]);

  const toggleActions = useCallback(() => {
    Haptics.selectionAsync();
    setShowActions((prev) => !prev);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: cardWidth,
          borderRadius: radius.xl,
          backgroundColor: colors.cardBackground2,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: Platform.OS === "ios" ? 0.12 : 0.08,
          shadowRadius: Platform.OS === "ios" ? 12 : 8,
          elevation: 5,
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.9),
          overflow: "hidden",
        },
        statusBar: {
          height: 4,
          backgroundColor: statusConfig.color,
        },
        content: {
          padding: spacing.md,
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        },
        nameSection: {
          flex: 1,
        },
        name: {
          fontSize: typography.fontSizeMd,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: 4,
        },
        phoneRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        phoneBtn: {
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#10B981",
          alignItems: "center",
          justifyContent: "center",
        },
        phoneText: {
          fontSize: 13,
          color: colors.accent,
          fontWeight: "600",
        },
        statusBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: statusConfig.bgColor,
        },
        statusText: {
          fontSize: 11,
          fontWeight: "700",
          color: statusConfig.color,
        },
        divider: {
          height: 1,
          backgroundColor: hexToRgba(colors.borderColor, 0.5),
          marginVertical: spacing.sm,
        },
        detailsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
        },
        detailItem: {
          width: "50%",
          paddingVertical: 4,
        },
        detailLabel: {
          fontSize: 10,
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
        dateRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: spacing.sm,
          backgroundColor: hexToRgba(colors.accent, 0.06),
          padding: spacing.sm,
          borderRadius: radius.md,
        },
        dateItem: {
          alignItems: "center",
        },
        dateLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          marginBottom: 2,
        },
        dateValue: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        dateArrow: {
          paddingHorizontal: 8,
        },
        menuBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: hexToRgba(colors.textMuted, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        actionsRow: {
          flexDirection: "row",
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        actionBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 10,
          borderRadius: radius.md,
          borderWidth: 1,
        },
        editBtn: {
          backgroundColor: hexToRgba(colors.accent, 0.1),
          borderColor: hexToRgba(colors.accent, 0.3),
        },
        cancelBtn: {
          backgroundColor: hexToRgba("#EF4444", 0.1),
          borderColor: hexToRgba("#EF4444", 0.3),
        },
        actionText: {
          fontSize: 13,
          fontWeight: "600",
        },
      }),
    [colors, spacing, radius, typography, cardWidth, statusConfig]
  );

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Interim booking for ${name}`}
      >
        {/* Status Bar */}
        <View style={styles.statusBar} />

        <View style={styles.content}>
          {/* Header: Name, Phone, Status, Menu */}
          <View style={styles.headerRow}>
            <View style={styles.nameSection}>
              <Text style={styles.name} numberOfLines={1}>
                {name || "Unknown"}
              </Text>
              <Pressable style={styles.phoneRow} onPress={handlePhonePress}>
                <View style={styles.phoneBtn}>
                  <MaterialCommunityIcons name="phone" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.phoneText}>{phone || "—"}</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.statusBadge}>
                <MaterialCommunityIcons
                  name={statusConfig.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={12}
                  color={statusConfig.color}
                />
                <Text style={styles.statusText}>{statusConfig.label}</Text>
              </View>
              <Pressable style={styles.menuBtn} onPress={toggleActions}>
                <MaterialCommunityIcons
                  name={showActions ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Room</Text>
              <Text style={styles.detailValue}>{room || "—"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bed</Text>
              <Text style={styles.detailValue}>{bed || "—"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Advance Paid</Text>
              <Text style={[styles.detailValue, { color: "#10B981" }]}>
                {formatCurrency(advancePaid)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Booked On</Text>
              <Text style={styles.detailValue}>{formatDisplayDate(bookingDate)}</Text>
            </View>
          </View>

          {/* Date Range Row */}
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>{formatDisplayDate(joiningDate)}</Text>
            </View>
            <View style={styles.dateArrow}>
              <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textMuted} />
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>{formatDisplayDate(moveOutDate)}</Text>
            </View>
          </View>

          {/* Actions Row */}
          {showActions && (
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onEdit(item);
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit booking"
              >
                <MaterialCommunityIcons name="pencil" size={14} color={colors.accent} />
                <Text style={[styles.actionText, { color: colors.accent }]}>Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCancel(item);
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel booking"
              >
                <MaterialCommunityIcons name="close-circle-outline" size={14} color="#EF4444" />
                <Text style={[styles.actionText, { color: "#EF4444" }]}>Cancel Booking</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  hasFilter: boolean;
}

const EmptyState = React.memo(function EmptyState({ hasFilter }: EmptyStateProps) {
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
          backgroundColor: hexToRgba("#0EA5E9", 0.08),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        },
        iconInner: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: hexToRgba("#0EA5E9", 0.15),
          alignItems: "center",
          justifyContent: "center",
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
          lineHeight: 22,
          maxWidth: 280,
        },
        ctaHint: {
          marginTop: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          backgroundColor: hexToRgba("#0EA5E9", 0.1),
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
        },
        ctaText: {
          fontSize: 13,
          fontWeight: "600",
          color: "#0284C7",
        },
      }),
    [colors, spacing, radius]
  );

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={hasFilter ? "No interim bookings match your filter" : "No interim bookings"}
    >
      <View style={styles.iconOuter}>
        <View style={styles.iconInner}>
          <MaterialCommunityIcons
            name={hasFilter ? "file-search-outline" : "calendar-clock"}
            size={36}
            color="#0EA5E9"
          />
        </View>
      </View>
      <Text style={styles.title}>
        {hasFilter ? "No Results Found" : "No Interim Bookings"}
      </Text>
      <Text style={styles.subtitle}>
        {hasFilter
          ? "Try adjusting your filters or search terms to find what you're looking for."
          : "Short-term bookings will appear here when beds are temporarily available between tenant stays."}
      </Text>
      {!hasFilter && (
        <View style={styles.ctaHint}>
          <MaterialCommunityIcons name="plus-circle-outline" size={16} color="#0284C7" />
          <Text style={styles.ctaText}>Tap + to add interim booking</Text>
        </View>
      )}
    </View>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   LIST HEADER
───────────────────────────────────────────────────────────────────────────── */

interface ListHeaderProps {
  metrics: Metric[];
  query: string;
  onQueryChange: (q: string) => void;
  onFilterPress: () => void;
  filterActive: boolean;
  resultCount: number;
}

const ListHeader = React.memo(function ListHeader({
  metrics,
  query,
  onQueryChange,
  onFilterPress,
  filterActive,
  resultCount,
}: ListHeaderProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const { width } = useWindowDimensions();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          // paddingBottom: spacing.md,
        },
        sectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          // marginTop: spacing.md,
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
          borderRadius: 150,
          backgroundColor: hexToRgba("#0EA5E9", 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        sectionTitle: {
          fontSize: typography.fontSizeMd,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        badge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: hexToRgba(colors.accent, 0.1),
        },
        badgeText: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.accent,
        },
        searchContainer: {
          backgroundColor: colors.cardBackground,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.9),
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.04,
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
    [colors, spacing, radius, typography]
  );

  return (
    <View style={styles.container}>
      {/* Metrics */}
      {metrics.length > 0 && (
        <StatsGrid
          metrics={metrics}
          minVisible={3}
          cardHeight={72}
        />
      )}

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIcon}>
            <MaterialCommunityIcons name="calendar-clock" size={18} color="#0EA5E9" />
          </View>
          <Text style={styles.sectionTitle}>Interim Bookings</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{resultCount} bookings</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search Bookings</Text>
        <SearchBar
          placeholder="Search by name, phone or room..."
          onSearch={onQueryChange}
          onFilter={onFilterPress}
          filterActive={filterActive}
        />
      </View>
    </View>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface IntrimTabProps {
  data: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  refreshing: boolean;
  onRefresh: () => void;
  propertyId: string;
  scrollRef?: RefObject<FlatList>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export default function IntrimTab({
  data,
  metadata,
  refreshing,
  onRefresh,
  propertyId,
  scrollRef,
  onScroll,
}: IntrimTabProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();

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
  const [filter, setFilter] = useState<IntrimFilter>(emptyFilter);

  // Metrics for stats grid
  const metrics: Metric[] = useMemo(() => {
    const totalShortTerm = num(metadata?.totalShortTermBookings);
    const activeShortTerm = num(metadata?.totalShortTermActive);
    const upcomingShortTerm = num(metadata?.totalShortTermUpcoming);

    return [
      {
        key: "total",
        label: "Total Interim Bookings",
        value: String(totalShortTerm),
        icon: "calendar-multiple" as keyof typeof MaterialCommunityIcons.glyphMap,
        iconBg: "#DBEAFE",
        iconColor: "#2563EB",
      },
      {
        key: "active",
        label: "Active Bookings",
        value: String(activeShortTerm),
        icon: "clock-check" as keyof typeof MaterialCommunityIcons.glyphMap,
        iconBg: "#D1FAE5",
        iconColor: "#059669",
      },
      {
        key: "upcoming",
        label: "Upcoming Bookings",
        value: String(upcomingShortTerm),
        icon: "calendar-clock" as keyof typeof MaterialCommunityIcons.glyphMap,
        iconBg: "#FEF3C7",
        iconColor: "#D97706",
      },
    ];
  }, [metadata]);

  // Filter data
  const filtered = useMemo(() => {
    let result = Array.isArray(data) ? [...data] : [];

    // Only show status 7 (interim bookings)
    result = result.filter((t) => num(t?.status) === 7);

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter((t) => {
        const name = getName(t).toLowerCase();
        const phone = getPhone(t).toLowerCase();
        const room = getRoom(t).toLowerCase();
        return name.includes(q) || phone.includes(q) || room.includes(q);
      });
    }

    // Status filter (based on date calculation)
    if (filter.status.length > 0) {
      result = result.filter((t) => {
        const joiningDate = parseISTDate(t?.joiningDate);
        const moveOutDate = parseISTDate(t?.moveOutDate);
        const status = getBookingStatus(joiningDate, moveOutDate);
        return filter.status.includes(status);
      });
    }

    // Joining date range filter (with IST conversion)
    if (filter.joiningDate?.from || filter.joiningDate?.to) {
      result = result.filter((t) => {
        const joinDate = parseDate(t?.joiningDate);
        if (!joinDate) return false;
        const joinIST = toIST(joinDate);

        if (filter.joiningDate?.from) {
          const from = startOfDayLocal(filter.joiningDate.from);
          if (joinIST < from) return false;
        }
        if (filter.joiningDate?.to) {
          const to = endOfDayLocal(filter.joiningDate.to);
          if (joinIST > to) return false;
        }
        return true;
      });
    }

    // Booking date range filter (with IST conversion)
    if (filter.bookingDate?.from || filter.bookingDate?.to) {
      result = result.filter((t) => {
        const bookDate = parseDate(t?.bookingDate);
        if (!bookDate) return false;
        const bookIST = toIST(bookDate);

        if (filter.bookingDate?.from) {
          const from = startOfDayLocal(filter.bookingDate.from);
          if (bookIST < from) return false;
        }
        if (filter.bookingDate?.to) {
          const to = endOfDayLocal(filter.bookingDate.to);
          if (bookIST > to) return false;
        }
        return true;
      });
    }

    // Sort by booking date (newest first)
    result.sort((a, b) => {
      const aDate = parseDate(a?.bookingDate)?.getTime() || 0;
      const bDate = parseDate(b?.bookingDate)?.getTime() || 0;
      return bDate - aDate;
    });

    return result;
  }, [data, query, filter]);

  const filterActive =
    query.trim() !== "" ||
    filter.status.length > 0 ||
    !!filter.joiningDate?.from ||
    !!filter.joiningDate?.to ||
    !!filter.bookingDate?.from ||
    !!filter.bookingDate?.to;

  // Handlers
  const handleEdit = useCallback(
    (item: Record<string, unknown>) => {
      const bookingId = str(item?._id, "");
      if (bookingId) {
        router.push({
          pathname: `/protected/intrim/${propertyId}`,
          params: { bookingId, mode: "edit" },
        });
      }
    },
    [router, propertyId]
  );

  const handleCancel = useCallback(
    (item: Record<string, unknown>) => {
      Alert.alert(
        "Cancel Booking",
        `Are you sure you want to cancel this interim booking for ${getName(item)}?`,
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: () => {
              // TODO: Implement cancel API call
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    },
    []
  );

  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: `/protected/intrim/${propertyId}`,
      params: { mode: "add" },
    });
  }, [router, propertyId]);

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

  // Render
  const renderItem = useCallback(
    ({ item }: { item: Record<string, unknown> }) => (
      <IntrimCard
        item={item}
        cardWidth={cardWidth}
        onEdit={handleEdit}
        onCancel={handleCancel}
      />
    ),
    [cardWidth, handleEdit, handleCancel]
  );

  const keyExtractor = useCallback(
    (item: Record<string, unknown>, index: number) =>
      str(item?._id, String(index)),
    []
  );

  const ListHeaderMemo = useMemo(
    () => (
      <ListHeader
        metrics={metrics}
        query={query}
        onQueryChange={setQuery}
        onFilterPress={() => setSheetOpen(true)}
        filterActive={filterActive}
        resultCount={filtered.length}
      />
    ),
    [metrics, query, filterActive, filtered.length]
  );

  const ListEmptyMemo = useMemo(
    () => <EmptyState hasFilter={filterActive} />,
    [filterActive]
  );

  return (
    <>
      <FlatList
        ref={scrollRef}
        data={filtered}
        keyExtractor={keyExtractor}
        numColumns={columns}
        key={`intrim-list-${columns}`}
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
        onScroll={onScroll}
        scrollEventThrottle={16}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        accessibilityLabel="Interim bookings list"
        accessibilityRole="list"
      />

      {/* Filter Sheet */}
      <FilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={filterSections}
        resetValue={emptyFilter}
        title="Filter Interim Bookings"
      />

      {/* Add Button */}
      <AddButton onPress={handleAdd} />
    </>
  );
}

