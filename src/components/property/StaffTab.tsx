// src/components/property/StaffTab.tsx
import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  useWindowDimensions,
  Platform,
  UIManager,
  LayoutAnimation,
  Linking,
  Alert,
  Animated,
  I18nManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Switch } from "react-native-paper";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import SearchBar from "@/src/components/SearchBar";
import StatsGrid, { type Metric } from "@/src/components/StatsGrid";
import AddButton from "@/src/components/Common/AddButton";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useUpdateEmployee } from "@/src/hooks/employee";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

/** Raw employee from API */
interface RawEmployee {
  _id?: string;
  id?: string;
  status?: number; // 1=Active, 2=Inactive, 0=Deleted
  empName?: string;
  empContactNumber?: string;
  role?: number; // 2=Admin, 3=Partner, others: Staff
  assignedProperties?: string[];
  createdBy?: string;
  ownerId?: string;
  permissions?: unknown[];
  staffStatus?: string;
  __v?: number;
  [key: string]: unknown;
}

/** Normalized card item */
export interface StaffCardItem {
  id: string;
  name: string;
  phone: string;
  role: number;
  roleLabel: string;
  status: number;
  raw: RawEmployee;
}

interface Props {
  /** Employee data array from API */
  data: RawEmployee[];
  /** Pull-to-refresh loading state */
  refreshing: boolean;
  /** Callback to trigger data refresh */
  onRefresh: () => void;
  /** Current property ID for navigation */
  propertyId: string;
  scrollRef?: React.RefObject<FlatList>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

/** Map role number to label */
const getRoleLabel = (role?: number): string => {
  switch (role) {
    case 2:
      return "Admin";
    case 3:
      return "Partner";
    default:
      return "Staff";
  }
};

/** Get role color theme */
const getRoleColors = (
  role: number,
  colors: ReturnType<typeof useTheme>["colors"]
): { bg: string; text: string } => {
  switch (role) {
    case 2: // Admin
      return { bg: hexToRgba("#7C3AED", 0.15), text: "#7C3AED" };
    case 3: // Partner
      return { bg: hexToRgba("#0284C7", 0.15), text: "#0284C7" };
    default: // Staff
      return { bg: hexToRgba(colors.accent, 0.12), text: colors.accent };
  }
};

/** Generate initials from name */
const getInitials = (name?: string): string => {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/** Normalize raw API data to card items */
const normalizeEmployees = (rows: RawEmployee[]): StaffCardItem[] => {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((employee): StaffCardItem | null => {
      const id = String(employee?._id ?? employee?.id ?? "");
      if (!id) return null;

      const role = Number(employee?.role ?? 0);
      const status = Number(employee?.status ?? 0);

      // Skip deleted employees (status = 0)
      if (status === 0) return null;

      return {
        id,
        name: String(employee?.empName ?? "—"),
        phone: String(employee?.empContactNumber ?? "—"),
        role,
        roleLabel: getRoleLabel(role),
        status,
        raw: employee,
      };
    })
    .filter((item): item is StaffCardItem => item !== null);
};

/* ─────────────────────────────────────────────────────────────────────────────
   STAFF CARD COMPONENT - Premium Swiggy/Zomato inspired design
───────────────────────────────────────────────────────────────────────────── */

interface StaffCardProps {
  item: StaffCardItem;
  onToggle: (emp: StaffCardItem, nextStatus: 1 | 2) => void;
  onEdit: (emp: StaffCardItem) => void;
  onDelete: (emp: StaffCardItem) => void;
  onCall: (phone: string) => void;
  disabled: boolean;
  index: number;
}

const StaffCard: React.FC<StaffCardProps> = React.memo(
  ({ item, onToggle, onEdit, onDelete, onCall, disabled, index }) => {
    const { colors, spacing, radius } = useTheme();
    const { width } = useWindowDimensions();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const isActive = item.status === 1;
    const roleColors = getRoleColors(item.role, colors);
    const initials = getInitials(item.name);

    // Responsive sizing
    const isTablet = width >= 768;
    const avatarSize = isTablet ? 52 : 44;

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.985,
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

    // Status colors
    const statusColor = isActive ? "#22C55E" : "#94A3B8";
    const statusBg = isActive ? "#DCFCE7" : "#F1F5F9";
    const statusText = isActive ? "#15803D" : "#64748B";

    const styles = useMemo(
      () =>
        StyleSheet.create({
          cardOuter: {
            borderRadius: radius.lg + 4,
            backgroundColor: colors.cardBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            overflow: "hidden",
          },
          // Left accent bar for status indication (Swiggy style)
          statusBar: {
            position: "absolute",
            [I18nManager.isRTL ? "right" : "left"]: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: statusColor,
          },
          cardInner: {
            paddingLeft: I18nManager.isRTL ? spacing.md : spacing.md + 8,
            paddingRight: I18nManager.isRTL ? spacing.md + 8 : spacing.md,
            paddingVertical: spacing.md,
          },
          // Top row: Avatar + Info + Status chip
          topRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md - 2,
          },
          avatar: {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: roleColors.bg,
            alignItems: "center",
            justifyContent: "center",
          },
          avatarText: {
            fontSize: avatarSize * 0.38,
            fontWeight: "700",
            color: roleColors.text,
            letterSpacing: 0.5,
          },
          infoBlock: {
            flex: 1,
            minWidth: 0,
          },
          nameRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            marginBottom: 2,
          },
          name: {
            fontSize: isTablet ? 16 : 15,
            fontWeight: "700",
            color: colors.textPrimary,
            letterSpacing: 0.1,
            flex: 1,
          },
          roleChip: {
            backgroundColor: roleColors.bg,
            paddingHorizontal: spacing.sm,
            paddingVertical: 3,
            borderRadius: radius.full,
          },
          roleText: {
            fontSize: 10,
            fontWeight: "700",
            color: roleColors.text,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          },
          phoneRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          },
          phone: {
            fontSize: isTablet ? 13 : 12,
            color: colors.textSecondary,
            fontWeight: "500",
          },
          // Status chip (right side)
          statusChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: statusBg,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: 6,
            borderRadius: radius.full,
          },
          statusDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: statusColor,
          },
          statusLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: statusText,
            letterSpacing: 0.2,
          },
          // Divider
          divider: {
            height: 1,
            backgroundColor: hexToRgba(colors.borderColor ?? colors.textMuted, 0.08),
            marginVertical: spacing.sm + 2,
          },
          // Actions row - clean horizontal layout
          actionsRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
          actionGroup: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
          },
          actionBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            paddingHorizontal: spacing.sm + 4,
            paddingVertical: spacing.sm,
            borderRadius: radius.md + 2,
            backgroundColor: hexToRgba(colors.accent, 0.08),
            minHeight: 36,
          },
          actionBtnPressed: {
            backgroundColor: hexToRgba(colors.accent, 0.15),
            transform: [{ scale: 0.97 }],
          },
          actionIcon: {
            // Icon styling handled by component
          },
          actionText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.accent,
            letterSpacing: 0.1,
          },
          // Call button - special highlight
          callBtn: {
            backgroundColor: hexToRgba("#22C55E", 0.1),
          },
          callBtnPressed: {
            backgroundColor: hexToRgba("#22C55E", 0.2),
          },
          callText: {
            color: "#16A34A",
          },
          // Delete button - subtle danger
          deleteBtn: {
            backgroundColor: hexToRgba(colors.error, 0.08),
          },
          deleteBtnPressed: {
            backgroundColor: hexToRgba(colors.error, 0.15),
          },
          deleteText: {
            color: colors.error,
          },
          // Toggle section
          toggleSection: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            backgroundColor: hexToRgba(colors.surface, 0.6),
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: hexToRgba(colors.borderColor ?? colors.textMuted, 0.1),
          },
          toggleLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
          },
        }),
      [
        colors,
        spacing,
        radius,
        isActive,
        roleColors,
        avatarSize,
        isTablet,
        statusColor,
        statusBg,
        statusText,
      ]
    );

    const handleToggle = useCallback(() => {
      Haptics.selectionAsync();
      const nextStatus: 1 | 2 = isActive ? 2 : 1;
      onToggle(item, nextStatus);
    }, [isActive, item, onToggle]);

    const handleCall = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCall(item.phone);
    }, [item.phone, onCall]);

    const handleEdit = useCallback(() => {
      Haptics.selectionAsync();
      onEdit(item);
    }, [item, onEdit]);

    const handleDelete = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDelete(item);
    }, [item, onDelete]);

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Staff member ${item.name}, ${item.roleLabel}, ${isActive ? "Active" : "Inactive"}`}
          accessibilityHint="Double tap to see options"
        >
          <View style={styles.cardOuter}>
            {/* Status indicator bar (left edge) */}
            <View style={styles.statusBar} />

            <View style={styles.cardInner}>
              {/* Top Row: Avatar + Info + Status */}
              <View style={styles.topRow}>
                {/* Avatar with initials */}
                <View
                  style={styles.avatar}
                  accessible
                  accessibilityLabel={`Avatar for ${item.name}`}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                {/* Name, Role & Phone */}
                <View style={styles.infoBlock}>
                  <View style={styles.nameRow}>
                    <Text
                      style={styles.name}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      accessible
                      accessibilityLabel={`Name: ${item.name}`}
                    >
                      {item.name}
                    </Text>
                    <View style={styles.roleChip}>
                      <Text style={styles.roleText}>{item.roleLabel}</Text>
                    </View>
                  </View>
                  <View style={styles.phoneRow}>
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={styles.phone}
                      numberOfLines={1}
                      accessible
                      accessibilityLabel={`Phone: ${item.phone}`}
                    >
                      {item.phone}
                    </Text>
                  </View>
                </View>

                {/* Status Chip */}
                <View style={styles.statusChip}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusLabel}>
                    {isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Actions Row */}
              <View style={styles.actionsRow}>
                {/* Left: Action buttons */}
                <View style={styles.actionGroup}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.callBtn,
                      pressed && styles.callBtnPressed,
                    ]}
                    onPress={handleCall}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${item.name}`}
                    accessibilityHint="Opens phone dialer"
                  >
                    <MaterialCommunityIcons
                      name="phone"
                      size={14}
                      color="#16A34A"
                    />
                    <Text style={[styles.actionText, styles.callText]}>
                      Call
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      pressed && styles.actionBtnPressed,
                    ]}
                    onPress={handleEdit}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                    accessibilityHint="Opens edit form"
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={14}
                      color={colors.accent}
                    />
                    <Text style={styles.actionText}>Edit</Text>
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
                    accessibilityLabel={`Delete ${item.name}`}
                    accessibilityHint="Shows delete confirmation"
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={14}
                      color={colors.error}
                    />
                    <Text style={[styles.actionText, styles.deleteText]}>
                      Delete
                    </Text>
                  </Pressable>
                </View>

                {/* Right: Toggle */}
                <View style={styles.toggleSection}>
                  {/* <Text style={styles.toggleLabel}>Status</Text> */}
                  <Switch
                    value={isActive}
                    onValueChange={handleToggle}
                    color={colors.accent}
                    disabled={disabled}
                    accessible
                    accessibilityRole="switch"
                    accessibilityLabel={`Toggle ${item.name} status`}
                    accessibilityState={{ checked: isActive }}
                  />
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

StaffCard.displayName = "StaffCard";

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE COMPONENT - Premium design
───────────────────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  searchQuery: string;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ searchQuery }) => {
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
          backgroundColor: hexToRgba(colors.accent, 0.06),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        },
        iconInner: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: hexToRgba(colors.accent, 0.12),
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
          backgroundColor: hexToRgba(colors.accent, 0.08),
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
        },
        ctaText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.accent,
        },
      }),
    [colors, spacing, radius]
  );

  const isFiltered = searchQuery.trim().length > 0;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={
        isFiltered ? "No staff matching your search" : "No staff members yet"
      }
    >
      <View style={styles.iconOuter}>
        <View style={styles.iconInner}>
          <MaterialCommunityIcons
            name={isFiltered ? "account-search-outline" : "account-group-outline"}
            size={36}
            color={colors.accent}
          />
        </View>
      </View>
      <Text style={styles.title}>
        {isFiltered ? "No Results Found" : "No Staff Members Yet"}
      </Text>
      <Text style={styles.subtitle}>
        {isFiltered
          ? "We couldn't find anyone matching your search. Try different keywords."
          : "Your team directory is empty. Add staff members to manage access and roles."}
      </Text>
      {!isFiltered && (
        <View style={styles.ctaHint}>
          <MaterialCommunityIcons
            name="plus-circle"
            size={16}
            color={colors.accent}
          />
          <Text style={styles.ctaText}>Tap + to add staff</Text>
        </View>
      )}
    </View>
  );
});

EmptyState.displayName = "EmptyState";

/* ─────────────────────────────────────────────────────────────────────────────
   HEADER COMPONENT - Premium design with clean sections
───────────────────────────────────────────────────────────────────────────── */

interface HeaderProps {
  metrics: Metric[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ListHeader: React.FC<HeaderProps> = React.memo(
  ({ metrics, searchQuery, onSearchChange }) => {
    const { colors, spacing, radius } = useTheme();
    const { width } = useWindowDimensions();

    const isTablet = width >= 768;

    const styles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            paddingBottom: spacing.md,
          },
          sectionHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: spacing.md,
            marginBottom: spacing.sm,
            paddingHorizontal: spacing.xs,
          },
          sectionTitleRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          },
          sectionIcon: {
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: hexToRgba(colors.accent, 0.1),
            alignItems: "center",
            justifyContent: "center",
          },
          sectionTitle: {
            fontSize: isTablet ? 18 : 16,
            fontWeight: "700",
            color: colors.textPrimary,
            letterSpacing: 0.2,
          },
          searchContainer: {
            backgroundColor: colors.cardBackground,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            borderRadius: radius.lg + 2,
            borderWidth: 1,
            borderColor: hexToRgba(colors.borderColor ?? colors.textMuted, 0.1),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
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
        {/* Stats Grid */}
        <StatsGrid metrics={metrics} minVisible={2} />

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons
                name="account-group"
                size={18}
                color={colors.accent}
              />
            </View>
            <Text
              style={styles.sectionTitle}
              accessible
              accessibilityRole="header"
            >
              Staff Directory
            </Text>
          </View>
        </View>

        {/* Search Section */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchLabel}>Find Staff Member</Text>
          <SearchBar
            placeholder="Search by name, phone, or role..."
            onSearch={onSearchChange}
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

const StaffTab: React.FC<Props> = ({ data, refreshing, onRefresh, propertyId, scrollRef, onScroll }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Responsive columns
  const columns = useMemo(() => {
    if (width >= 1200) return 3;
    if (width >= 768) return 2;
    return 1;
  }, [width]);

  // Normalize data
  const normalizedData = useMemo(() => normalizeEmployees(data), [data]);

  // Calculate metrics
  const metrics: Metric[] = useMemo(() => {
    const total = normalizedData.length;
    let active = 0;
    let inactive = 0;
    let admins = 0;
    let partners = 0;

    for (const employee of normalizedData) {
      if (employee.status === 1) active++;
      if (employee.status === 2) inactive++;
      if (employee.role === 2) admins++;
      if (employee.role === 3) partners++;
    }

    return [
      {
        key: "total",
        label: "Total Staff",
        value: total,
        icon: "account-group",
        iconBg: "#DBEAFE",
        iconColor: "#3B82F6",
      },
      {
        key: "active",
        label: "Active",
        value: active,
        icon: "check-circle",
        iconBg: "#D1FAE5",
        iconColor: "#10B981",
      },
      {
        key: "inactive",
        label: "Inactive",
        value: inactive,
        icon: "close-circle",
        iconBg: "#FEE2E2",
        iconColor: "#EF4444",
      },
      {
        key: "admins",
        label: "Admins",
        value: admins,
        icon: "shield-account",
        iconBg: "#EDE9FE",
        iconColor: "#7C3AED",
      },
      {
        key: "partners",
        label: "Partners",
        value: partners,
        icon: "handshake",
        iconBg: "#E0F2FE",
        iconColor: "#0284C7",
      },
    ];
  }, [normalizedData]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return normalizedData;

    return normalizedData.filter(
      (employee) =>
        employee.name.toLowerCase().includes(query) ||
        employee.phone.toLowerCase().includes(query) ||
        employee.roleLabel.toLowerCase().includes(query)
    );
  }, [normalizedData, searchQuery]);

  // Mutation hook
  const updateEmployee = useUpdateEmployee(() => {
    setPendingId(null);
    onRefresh();
  });

  // Handlers
  const handleToggle = useCallback(
    (employee: StaffCardItem, nextStatus: 1 | 2) => {
      if (!employee?.raw) return;

      setPendingId(employee.id);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const payload = {
        ...employee.raw,
        _id: employee.id,
        status: nextStatus,
        staffRole: employee.roleLabel,
        staffStatus: nextStatus === 1 ? "Active" : "Inactive",
      };

      updateEmployee.mutate(
        { data: payload, employeeId: employee.id },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          onError: () => {
            setPendingId(null);
            Alert.alert(
              "Update Failed",
              "Could not update staff status. Please check your connection and try again.",
              [{ text: "OK", style: "default" }]
            );
          },
        }
      );
    },
    [updateEmployee]
  );

  const handleEdit = useCallback(
    (employee: StaffCardItem) => {
      router.push({
        pathname: `/protected/employees/${propertyId}`,
        params: { employeeId: employee.id },
      });
    },
    [propertyId]
  );

  const handleDelete = useCallback(
    (employee: StaffCardItem) => {
      Alert.alert(
        "Delete Staff Member",
        `Are you sure you want to delete ${employee.name}? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              setPendingId(employee.id);
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

              const payload = {
                ...employee.raw,
                _id: employee.id,
                status: 0, // Soft delete
                staffRole: employee.roleLabel,
                staffStatus: employee.raw?.staffStatus ?? "Active",
              };

              updateEmployee.mutate(
                { data: payload, employeeId: employee.id },
                {
                  onSuccess: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  },
                  onError: () => {
                    setPendingId(null);
                    Alert.alert(
                      "Delete Failed",
                      "Could not delete staff member. Please try again.",
                      [{ text: "OK", style: "default" }]
                    );
                  },
                }
              );
            },
          },
        ],
        { cancelable: true }
      );
    },
    [updateEmployee]
  );

  const handleCall = useCallback((phone: string) => {
    if (!phone || phone === "—") {
      Alert.alert("No Phone Number", "This staff member has no phone number on file.");
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Error", "Could not open phone dialer.");
    });
  }, []);

  const handleAddStaff = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/protected/employees/${propertyId}`);
  }, [propertyId]);

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        listContent: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.lg * 3,
          gap: spacing.md,
        },
        columnGap: {
          gap: spacing.md,
        },
      }),
    [spacing, insets.bottom]
  );

  // Render item
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<StaffCardItem>) => (
      <View style={{ flex: 1 / columns }}>
        <StaffCard
          item={item}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCall={handleCall}
          disabled={pendingId === item.id}
          index={index}
        />
      </View>
    ),
    [columns, handleToggle, handleEdit, handleDelete, handleCall, pendingId]
  );

  const keyExtractor = useCallback((item: StaffCardItem) => item.id, []);

  const ListHeaderMemo = useMemo(
    () => (
      <ListHeader
        metrics={metrics}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    ),
    [metrics, searchQuery]
  );

  const ListEmptyMemo = useMemo(
    () => <EmptyState searchQuery={searchQuery} />,
    [searchQuery]
  );

  return (
    <>
      <FlatList
        ref={scrollRef}
        data={filteredData}
        keyExtractor={keyExtractor}
        numColumns={columns}
        key={`staff-list-${columns}`} // Force re-render when columns change
        columnWrapperStyle={columns > 1 ? styles.columnGap : undefined}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderMemo}
        ListEmptyComponent={ListEmptyMemo}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        getItemLayout={undefined} // Let FlatList calculate dynamically
        accessibilityLabel="Staff members list"
        accessibilityRole="list"
      />

      {/* Floating Add Button */}
      <AddButton onPress={handleAddStaff} />
    </>
  );
};

export default StaffTab;
