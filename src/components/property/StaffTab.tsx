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
   STAFF CARD COMPONENT
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
    const avatarSize = isTablet ? 56 : 48;
    const nameFontSize = isTablet ? 17 : 15;
    const phoneFontSize = isTablet ? 14 : 12;

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

    const styles = useMemo(
      () =>
        StyleSheet.create({
          cardContainer: {
            borderRadius: radius.xl,
            backgroundColor: colors.cardBackground,
            borderWidth: 1,
            borderColor: isActive
              ? hexToRgba(colors.accent, 0.2)
              : hexToRgba(colors.textMuted, 0.15),
            shadowColor: colors.shadow ?? "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
            overflow: "hidden",
          },
          gradientTop: {
            height: 4,
            backgroundColor: isActive
              ? hexToRgba(colors.accent, 0.6)
              : hexToRgba(colors.textMuted, 0.3),
          },
          contentRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            padding: spacing.md,
            gap: spacing.md,
          },
          avatar: {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: hexToRgba(colors.accent, 0.12),
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: isActive
              ? hexToRgba(colors.accent, 0.3)
              : hexToRgba(colors.textMuted, 0.2),
          },
          avatarText: {
            fontSize: avatarSize * 0.4,
            fontWeight: "700",
            color: colors.accent,
          },
          infoSection: {
            flex: 1,
            minWidth: 0,
          },
          nameRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: 4,
          },
          name: {
            fontSize: nameFontSize,
            fontWeight: "700",
            color: colors.textPrimary,
            flex: 1,
          },
          statusDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isActive ? "#10B981" : "#EF4444",
          },
          phone: {
            fontSize: phoneFontSize,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
          },
          roleBadge: {
            alignSelf: I18nManager.isRTL ? "flex-end" : "flex-start",
            backgroundColor: roleColors.bg,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: 5,
            borderRadius: radius.full,
            marginBottom: spacing.sm,
          },
          roleText: {
            fontSize: 11,
            fontWeight: "700",
            color: roleColors.text,
            letterSpacing: 0.3,
            textTransform: "uppercase",
          },
          actionsRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
          },
          actionBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: 8,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: hexToRgba(colors.textSecondary, 0.1),
            minWidth: 44,
            minHeight: 44,
            justifyContent: "center",
          },
          actionBtnPressed: {
            backgroundColor: hexToRgba(colors.accent, 0.08),
          },
          actionText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.link,
          },
          deleteText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.error,
          },
          toggleSection: {
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 4,
          },
          toggleLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: isActive ? colors.success ?? "#10B981" : colors.textMuted,
            marginTop: 4,
            textAlign: "center",
          },
        }),
      [
        colors,
        spacing,
        radius,
        isActive,
        roleColors,
        avatarSize,
        nameFontSize,
        phoneFontSize,
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
          <View style={styles.cardContainer}>
            {/* Premium gradient accent at top */}
            <View style={styles.gradientTop} />

            <View style={styles.contentRow}>
              {/* Avatar */}
              <View
                style={styles.avatar}
                accessible
                accessibilityLabel={`Avatar for ${item.name}`}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              {/* Info Section */}
              <View style={styles.infoSection}>
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
                  <View
                    style={styles.statusDot}
                    accessible
                    accessibilityLabel={isActive ? "Active status" : "Inactive status"}
                  />
                </View>

                <Text
                  style={styles.phone}
                  numberOfLines={1}
                  accessible
                  accessibilityLabel={`Phone: ${item.phone}`}
                >
                  {item.phone}
                </Text>

                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{item.roleLabel}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      pressed && styles.actionBtnPressed,
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
                      color={colors.link}
                    />
                    <Text style={styles.actionText}>Call</Text>
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
                      name="pencil"
                      size={14}
                      color={colors.link}
                    />
                    <Text style={styles.actionText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      pressed && styles.actionBtnPressed,
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
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>

              {/* Toggle Section */}
              <View style={styles.toggleSection}>
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
                <Text style={styles.toggleLabel}>
                  {isActive ? "Active" : "Inactive"}
                </Text>
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
   EMPTY STATE COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  searchQuery: string;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ searchQuery }) => {
  const { colors, spacing } = useTheme();

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
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        },
        title: {
          fontSize: 18,
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
        },
      }),
    [colors, spacing]
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
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={isFiltered ? "magnify-close" : "account-group-outline"}
          size={40}
          color={colors.accent}
        />
      </View>
      <Text style={styles.title}>
        {isFiltered ? "No Results Found" : "No Staff Members"}
      </Text>
      <Text style={styles.subtitle}>
        {isFiltered
          ? "Try adjusting your search terms or clear the filter."
          : "Add your first staff member by tapping the + button below."}
      </Text>
    </View>
  );
});

EmptyState.displayName = "EmptyState";

/* ─────────────────────────────────────────────────────────────────────────────
   HEADER COMPONENT
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
            paddingBottom: spacing.sm,
          },
          sectionTitle: {
            fontSize: isTablet ? 18 : 16,
            fontWeight: "700",
            color: colors.textPrimary,
            marginHorizontal: spacing.sm,
            marginTop: spacing.sm,
            marginBottom: spacing.sm,
          },
          searchContainer: {
            backgroundColor: hexToRgba(colors.accent, 0.06),
            // marginHorizontal: spacing.md,
            paddingVertical: spacing.sm + 4,
            paddingHorizontal: spacing.md,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: hexToRgba(colors.accent, 0.1),
          },
          searchLabel: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.accent,
            marginBottom: spacing.xs,
            letterSpacing: 0.2,
          },
        }),
      [colors, spacing, radius, isTablet]
    );

    return (
      <View style={styles.container}>
        {/* Stats Grid */}
        <StatsGrid metrics={metrics} minVisible={2} />

        {/* Search Section */}
        <Text
          style={styles.sectionTitle}
          accessible
          accessibilityRole="header"
        >
          Staff Directory
        </Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchLabel}>Search Staff</Text>
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

const StaffTab: React.FC<Props> = ({ data, refreshing, onRefresh, propertyId }) => {
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
