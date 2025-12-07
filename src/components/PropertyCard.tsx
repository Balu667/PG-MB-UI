import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  useWindowDimensions,
  I18nManager,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "../theme";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Portal, Dialog, Button } from "react-native-paper";
import { useProperty } from "@/src/context/PropertyContext";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

// Format number to Indian currency format: 34567 => 34,567
const formatIndianNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  const str = Math.abs(Math.round(num)).toString();
  let result = "";
  const len = str.length;
  
  if (len <= 3) return num < 0 ? `-${str}` : str;
  
  result = str.slice(-3);
  let remaining = str.slice(0, -3);
  
  while (remaining.length > 2) {
    result = remaining.slice(-2) + "," + result;
    remaining = remaining.slice(0, -2);
  }
  
  if (remaining.length > 0) {
    result = remaining + "," + result;
  }
  
  return num < 0 ? `-${result}` : result;
};

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

interface PropertyMetadata {
  totalRooms?: number;
  totalBeds?: number;
  vacantBeds?: number;
  occupiedBeds?: number;
  advancedBookings?: number;
  underNotice?: number;
  expenses?: number;
  dues?: number;
  income?: number;
  complaints?: number;
}

interface PropertyData {
  _id?: string;
  propertyId?: string;
  propertyName: string;
  tenantType?: "Male" | "Female" | "Co-living";
  mealType?: "Veg" | "Non-veg" | "Both" | "Non-Veg";
  doorNo?: string;
  streetName?: string;
  area: string;
  city: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  noticePeriod?: string;
  facilities?: string[];
  metadata?: PropertyMetadata;
}

interface PropertyCardProps {
  data: PropertyData;
  onPress?: () => void;
  onDelete?: (id?: string) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT ITEM COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface StatItemProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  isCompact: boolean;
}

const StatItem = React.memo<StatItemProps>(({ icon, label, value, color, isCompact }) => {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        statStyles.container,
        {
          backgroundColor: hexToRgba(color, 0.08),
          borderRadius: radius.md,
          paddingVertical: isCompact ? 10 : 12,
          paddingHorizontal: isCompact ? 8 : 10,
        },
      ]}
      accessibilityLabel={`${label}: ${value}`}
      accessible
    >
      <View style={[statStyles.iconContainer, { backgroundColor: hexToRgba(color, 0.15) }]}>
        <MaterialCommunityIcons name={icon as never} size={isCompact ? 16 : 18} color={color} />
      </View>
      <Text style={[statStyles.value, { color: colors.textPrimary, fontSize: isCompact ? 16 : 18 }]}>
        {value}
      </Text>
      <Text
        style={[statStyles.label, { color: colors.textMuted, fontSize: isCompact ? 10 : 11 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

StatItem.displayName = "StatItem";

const statStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 65,
    flex: 1,
    gap: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: {
    fontWeight: "800",
  },
  label: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   OCCUPANCY BADGE COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface OccupancyBadgeProps {
  occupied: number;
  total: number;
  isCompact: boolean;
}

const OccupancyBadge = React.memo<OccupancyBadgeProps>(({ occupied, total, isCompact }) => {
  const { colors, radius } = useTheme();
  const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

  let statusColor = "#10B981";
  let statusLabel = "Excellent";
  
  if (percentage >= 85) {
    statusColor = "#10B981";
    statusLabel = "Excellent";
  } else if (percentage >= 60) {
    statusColor = "#3B82F6";
    statusLabel = "Good";
  } else if (percentage >= 40) {
    statusColor = "#F59E0B";
    statusLabel = "Average";
  } else {
    statusColor = "#EF4444";
    statusLabel = "Low";
  }

  return (
    <View
      style={[
        occupancyStyles.container,
        {
          backgroundColor: hexToRgba(statusColor, 0.1),
          borderColor: hexToRgba(statusColor, 0.3),
          borderRadius: radius.full,
          paddingVertical: isCompact ? 6 : 8,
          paddingHorizontal: isCompact ? 12 : 14,
        },
      ]}
    >
      <View style={[occupancyStyles.dot, { backgroundColor: statusColor }]} />
      <Text style={[occupancyStyles.percentage, { color: statusColor, fontSize: isCompact ? 16 : 18 }]}>
        {percentage}%
      </Text>
      <Text style={[occupancyStyles.label, { color: colors.textMuted, fontSize: isCompact ? 10 : 11 }]}>
        {statusLabel}
      </Text>
    </View>
  );
});

OccupancyBadge.displayName = "OccupancyBadge";

const occupancyStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  percentage: {
    fontWeight: "800",
  },
  label: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PROPERTY CARD
───────────────────────────────────────────────────────────────────────────── */

const PropertyCard = React.memo<PropertyCardProps>(({ data, onPress, onDelete }) => {
  const { colors, radius, spacing } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const { setSelected } = useProperty();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Responsive sizing
  const numColumns = screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : screenWidth >= 600 ? 2 : 1;
  const cardMargin = 8;
  const cardWidth = (screenWidth - spacing.md * 2 - cardMargin * (numColumns - 1)) / numColumns;
  const isCompact = cardWidth < 320;

  // Press handlers
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(false);
    setConfirmDelete(false);
    setSelected?.(data._id);
    if (onPress) {
      onPress();
    } else {
      router.push(`/protected/property/${data._id}`);
    }
  }, [data._id, onPress, router, setSelected]);

  const handleMenuOpen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const handleEdit = useCallback(() => {
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/protected/property/edit/[id]",
      params: { id: data._id },
    });
  }, [data._id, router]);

  const handleDeletePress = useCallback(() => {
    setMenuVisible(false);
    setConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setConfirmDelete(false);
    if (onDelete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDelete(data._id);
    }
  }, [data._id, onDelete]);

  // Type badge colors and gradients
  const typeConfig = useMemo(() => {
    switch (data.tenantType) {
      case "Male":
        return {
          color: "#3B82F6",
          gradient: ["#3B82F6", "#2563EB"] as const,
          icon: "gender-male",
          label: "Men's",
        };
      case "Female":
        return {
          color: "#EC4899",
          gradient: ["#EC4899", "#DB2777"] as const,
          icon: "gender-female",
          label: "Women's",
        };
      default:
        return {
          color: "#8B5CF6",
          gradient: ["#8B5CF6", "#7C3AED"] as const,
          icon: "account-group",
          label: "Co-living",
        };
    }
  }, [data.tenantType]);

  // Meal type config
  const mealConfig = useMemo(() => {
    const meal = data.mealType?.toLowerCase();
    if (meal?.includes("non")) return { color: "#EF4444", icon: "food-drumstick", label: "Non-Veg" };
    if (meal?.includes("both")) return { color: "#F59E0B", icon: "food", label: "Both" };
    return { color: "#10B981", icon: "leaf", label: "Veg" };
  }, [data.mealType]);

  // Stats configuration
  const stats = useMemo(
    () => [
      { icon: "bed", label: "Total", value: data.metadata?.totalBeds || 0, color: "#6366F1" },
      {
        icon: "bed-empty",
        label: "Vacant",
        value: data.metadata?.vacantBeds || 0,
        color: "#10B981",
      },
      {
        icon: "account-check",
        label: "Filled",
        value: data.metadata?.occupiedBeds || 0,
        color: "#F59E0B",
      },
      {
        icon: "calendar-clock",
        label: "Booked",
        value: data.metadata?.advancedBookings || 0,
        color: "#8B5CF6",
      },
      {
        icon: "bell-ring",
        label: "Notice",
        value: data.metadata?.underNotice || 0,
        color: "#EF4444",
      },
    ],
    [data.metadata]
  );

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: numColumns === 1 ? "100%" : cardWidth,
          marginBottom: cardMargin,
        },
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.5),
          // Shadow
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              }
            : { elevation: 5 }),
        },
        headerGradient: {
          paddingHorizontal: isCompact ? 14 : 16,
          paddingTop: isCompact ? 14 : 16,
          paddingBottom: isCompact ? 12 : 14,
        },
        headerTopRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        },
        headerLeft: {
          flex: 1,
          marginRight: 10,
        },
        propertyIdBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: "rgba(255,255,255,0.2)",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: radius.md,
          alignSelf: "flex-start",
          marginBottom: 8,
        },
        propertyIdText: {
          fontSize: 10,
          fontWeight: "700",
          color: "#FFFFFF",
          letterSpacing: 0.5,
        },
        propertyName: {
          fontSize: isCompact ? 17 : 19,
          fontWeight: "800",
          color: "#FFFFFF",
          marginBottom: 4,
        },
        locationRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        locationText: {
          fontSize: isCompact ? 12 : 13,
          color: "rgba(255,255,255,0.9)",
        },
        headerRight: {
          alignItems: "flex-end",
          gap: 6,
        },
        typeBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          backgroundColor: "rgba(255,255,255,0.25)",
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: radius.full,
        },
        typeBadgeText: {
          fontSize: 11,
          fontWeight: "700",
          color: "#FFFFFF",
        },
        menuButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "rgba(255,255,255,0.2)",
          alignItems: "center",
          justifyContent: "center",
        },
        content: {
          padding: isCompact ? 14 : 16,
        },
        infoRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        },
        mealBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          backgroundColor: hexToRgba(mealConfig.color, 0.1),
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: radius.full,
        },
        mealText: {
          fontSize: 11,
          fontWeight: "700",
          color: mealConfig.color,
        },
        occupancyContainer: {
          marginBottom: 14,
        },
        statsGrid: {
          flexDirection: "row",
          gap: isCompact ? 6 : 8,
          marginBottom: 14,
        },
        divider: {
          height: 1,
          backgroundColor: hexToRgba(colors.borderColor, 0.5),
          marginBottom: 14,
        },
        financialRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 8,
        },
        financialItem: {
          flex: 1,
          alignItems: "center",
          paddingVertical: 10,
          borderRadius: radius.md,
        },
        financialIcon: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 6,
        },
        financialValue: {
          fontSize: isCompact ? 14 : 15,
          fontWeight: "800",
          marginBottom: 3,
        },
        financialLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        // Menu styles
        menuOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "flex-start",
          alignItems: I18nManager.isRTL ? "flex-start" : "flex-end",
          padding: 12,
          borderRadius: radius.xl,
        },
        menuContainer: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          overflow: "hidden",
          minWidth: 140,
          borderWidth: 1,
          borderColor: colors.borderColor,
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
              }
            : { elevation: 8 }),
        },
        menuItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 14,
        },
        menuItemText: {
          fontSize: 14,
          fontWeight: "600",
        },
        menuDivider: {
          height: 1,
          backgroundColor: hexToRgba(colors.borderColor, 0.5),
        },
      }),
    [colors, radius, spacing, cardWidth, numColumns, isCompact, mealConfig]
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{ color: hexToRgba(colors.primary, 0.1) }}
          accessibilityRole="button"
          accessibilityLabel={`${data.propertyName} property card`}
          accessibilityHint="Tap to view property details"
          accessible
        >
          {/* Gradient Header */}
          <LinearGradient
            colors={typeConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeft}>
                {/* Property ID Badge */}
                {data.propertyId && (
                  <View style={styles.propertyIdBadge}>
                    <MaterialCommunityIcons name="identifier" size={12} color="#FFFFFF" />
                    <Text style={styles.propertyIdText}>{data.propertyId}</Text>
                  </View>
                )}
                
                {/* Property Name */}
                <Text style={styles.propertyName} numberOfLines={2}>
                  {data.propertyName}
                </Text>
                
                {/* Location */}
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {data.area}, {data.city}
                  </Text>
                </View>
              </View>

              <View style={styles.headerRight}>
                {/* Type Badge */}
                <View style={styles.typeBadge}>
                  <MaterialCommunityIcons
                    name={typeConfig.icon as never}
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.typeBadgeText}>{typeConfig.label}</Text>
                </View>

                {/* Menu Button */}
                <Pressable
                  onPress={handleMenuOpen}
                  style={styles.menuButton}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Property options menu"
                  accessible
                >
                  <MaterialIcons name="more-vert" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </LinearGradient>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Meal Type & Occupancy Row */}
            <View style={styles.infoRow}>
              {/* Meal Badge */}
              {data.mealType && (
                <View style={styles.mealBadge}>
                  <MaterialCommunityIcons
                    name={mealConfig.icon as never}
                    size={14}
                    color={mealConfig.color}
                  />
                  <Text style={styles.mealText}>{mealConfig.label}</Text>
                </View>
              )}

              {/* Occupancy Badge */}
              <OccupancyBadge
                occupied={data.metadata?.occupiedBeds || 0}
                total={data.metadata?.totalBeds || 0}
                isCompact={isCompact}
              />
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {stats.map((stat, idx) => (
                <StatItem
                  key={idx}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  color={stat.color}
                  isCompact={isCompact}
                />
              ))}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Financial Row */}
            <View style={styles.financialRow}>
              {/* Income */}
              <View style={[styles.financialItem, { backgroundColor: hexToRgba("#10B981", 0.08) }]}>
                <View style={[styles.financialIcon, { backgroundColor: hexToRgba("#10B981", 0.15) }]}>
                  <MaterialCommunityIcons name="arrow-down-bold" size={16} color="#10B981" />
                </View>
                <Text style={[styles.financialValue, { color: "#10B981" }]}>
                  ₹{formatIndianNumber(data.metadata?.income)}
                </Text>
                <Text style={styles.financialLabel}>Income</Text>
              </View>

              {/* Expenses */}
              <View style={[styles.financialItem, { backgroundColor: hexToRgba("#EF4444", 0.08) }]}>
                <View style={[styles.financialIcon, { backgroundColor: hexToRgba("#EF4444", 0.15) }]}>
                  <MaterialCommunityIcons name="arrow-up-bold" size={16} color="#EF4444" />
                </View>
                <Text style={[styles.financialValue, { color: "#EF4444" }]}>
                  ₹{formatIndianNumber(data.metadata?.expenses)}
                </Text>
                <Text style={styles.financialLabel}>Expenses</Text>
              </View>

              {/* Dues */}
              <View style={[styles.financialItem, { backgroundColor: hexToRgba("#F59E0B", 0.08) }]}>
                <View style={[styles.financialIcon, { backgroundColor: hexToRgba("#F59E0B", 0.15) }]}>
                  <MaterialIcons name="warning" size={16} color="#F59E0B" />
                </View>
                <Text style={[styles.financialValue, { color: "#F59E0B" }]}>
                  ₹{formatIndianNumber(data.metadata?.dues)}
                </Text>
                <Text style={styles.financialLabel}>Dues</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Menu Overlay */}
        {menuVisible && (
          <Pressable style={styles.menuOverlay} onPress={handleMenuClose}>
            <View style={styles.menuContainer}>
              <Pressable
                style={styles.menuItem}
                onPress={handleEdit}
                android_ripple={{ color: hexToRgba(colors.primary, 0.1) }}
                accessibilityRole="menuitem"
                accessibilityLabel="Edit property"
                accessible
              >
                <MaterialIcons name="edit" size={18} color={colors.primary} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Edit</Text>
              </Pressable>
              <View style={styles.menuDivider} />
              <Pressable
                style={styles.menuItem}
                onPress={handleDeletePress}
                android_ripple={{ color: hexToRgba(colors.error, 0.1) }}
                accessibilityRole="menuitem"
                accessibilityLabel="Delete property"
                accessible
              >
                <MaterialIcons name="delete" size={18} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      </Animated.View>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={confirmDelete}
          onDismiss={() => setConfirmDelete(false)}
          style={{ backgroundColor: colors.cardBackground, borderRadius: radius.xl }}
        >
          <Dialog.Title style={{ color: colors.textPrimary }}>Delete Property?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
              Are you sure you want to delete "{data.propertyName}"? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDelete(false)} textColor={colors.textMuted}>
              Cancel
            </Button>
            <Button onPress={handleConfirmDelete} textColor={colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
});

PropertyCard.displayName = "PropertyCard";

export default PropertyCard;
