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
import { Portal, Dialog, Button } from "react-native-paper";
import { useProperty } from "@/src/context/PropertyContext";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

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
  shortTermBeds?: number;
  expenses?: number;
  dues?: number;
  income?: number;
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
   MAIN PROPERTY CARD - Clean Compact Design
───────────────────────────────────────────────────────────────────────────── */

const PropertyCard = React.memo<PropertyCardProps>(({ data, onPress, onDelete }) => {
  const { colors, radius, spacing } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const { setSelected } = useProperty();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Responsive sizing - wider columns for better visibility (20% larger)
  const numColumns = screenWidth >= 1400 ? 4 : screenWidth >= 1000 ? 3 : screenWidth >= 700 ? 2 : 1;
  const cardMargin = 8;
  const horizontalPadding = spacing.md;
  const cardWidth = numColumns === 1 
    ? screenWidth - horizontalPadding * 2 
    : (screenWidth - horizontalPadding * 2 - cardMargin * (numColumns - 1)) / numColumns;
  
  // Compact mode only for very small screens
  const isCompact = cardWidth < 320;

  // Press handlers
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 10,
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

  // Type configuration - simple label-based
  const typeConfig = useMemo(() => {
    switch (data.tenantType) {
      case "Male":
        return { color: "#3B82F6", icon: "gender-male", label: "Men's" };
      case "Female":
        return { color: "#EC4899", icon: "gender-female", label: "Women's" };
      default:
        return { color: "#8B5CF6", icon: "account-group", label: "Co-living" };
    }
  }, [data.tenantType]);

  // Meal type config
  const mealConfig = useMemo(() => {
    const meal = data.mealType?.toLowerCase();
    if (meal?.includes("non")) return { color: "#EF4444", icon: "food-drumstick", label: "Non-Veg" };
    if (meal?.includes("both")) return { color: "#F59E0B", icon: "food", label: "Both" };
    return { color: "#10B981", icon: "leaf", label: "Veg" };
  }, [data.mealType]);

  // Occupancy percentage
  const occupancy = useMemo(() => {
    const total = data.metadata?.totalBeds || 0;
    const occupied = data.metadata?.occupiedBeds || 0;
    return total > 0 ? Math.round((occupied / total) * 100) : 0;
  }, [data.metadata]);

  const occupancyColor = occupancy >= 80 ? "#10B981" : occupancy >= 50 ? "#3B82F6" : occupancy >= 30 ? "#F59E0B" : "#EF4444";

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: numColumns === 1 ? "100%" : cardWidth,
          marginBottom: cardMargin * 1.5,
        },
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg + 2,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.5),
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
              }
            : { elevation: 4 }),
        },
        header: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: isCompact ? 14 : 16,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.borderColor, 0.3),
        },
        headerLeft: {
          flex: 1,
          marginRight: 10,
        },
        propertyId: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          marginBottom: 3,
          letterSpacing: 0.4,
        },
        propertyName: {
          fontSize: isCompact ? 16 : 18,
          fontWeight: "700",
          color: colors.textPrimary,
          lineHeight: isCompact ? 22 : 24,
        },
        locationRow: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 4,
        },
        locationText: {
          fontSize: 12,
          color: colors.textSecondary,
          marginLeft: 4,
          flexShrink: 1,
        },
        headerRight: {
          alignItems: "flex-end",
        },
        menuBtn: {
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: hexToRgba(colors.textMuted, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        badgesRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 8,
        },
        badge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
        },
        badgeText: {
          fontSize: 10,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.3,
        },
        body: {
          padding: isCompact ? 14 : 16,
        },
        statsRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 14,
        },
        statItem: {
          alignItems: "center",
          flex: 1,
          minWidth: 0,
        },
        statValue: {
          fontSize: isCompact ? 18 : 20,
          fontWeight: "800",
          color: colors.textPrimary,
        },
        statLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          marginTop: 2,
          letterSpacing: 0.3,
        },
        progressSection: {
          marginBottom: 14,
        },
        progressHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        },
        progressLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        progressValue: {
          fontSize: 13,
          fontWeight: "700",
        },
        progressBar: {
          height: 6,
          backgroundColor: hexToRgba(colors.textMuted, 0.1),
          borderRadius: 3,
          overflow: "hidden",
        },
        progressFill: {
          height: "100%",
          borderRadius: 3,
        },
        financialRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        },
        financialItem: {
          flex: 1,
          minWidth: 90,
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 10,
          gap: 8,
        },
        financialValue: {
          fontSize: 13,
          fontWeight: "700",
        },
        financialLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
        },
        menuOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.25)",
          justifyContent: "flex-start",
          alignItems: I18nManager.isRTL ? "flex-start" : "flex-end",
          padding: 8,
          borderRadius: radius.lg,
        },
        menuContainer: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.md,
          overflow: "hidden",
          minWidth: 120,
          borderWidth: 1,
          borderColor: colors.borderColor,
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
              }
            : { elevation: 6 }),
        },
        menuItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
        },
        menuItemText: {
          fontSize: 13,
          fontWeight: "600",
        },
        menuDivider: {
          height: 1,
          backgroundColor: hexToRgba(colors.borderColor, 0.5),
        },
      }),
    [colors, radius, spacing, cardWidth, numColumns, isCompact, occupancyColor]
  );

  // Stats data
  const stats = useMemo(() => [
    { value: data.metadata?.totalBeds || 0, label: "Total" },
    { value: data.metadata?.vacantBeds || 0, label: "Vacant" },
    { value: data.metadata?.occupiedBeds || 0, label: "Filled" },
    { value: data.metadata?.advancedBookings || 0, label: "Booked" },
    { value: data.metadata?.shortTermBeds || 0, label: "Short" },
    { value: data.metadata?.underNotice || 0, label: "Notice" },
  ], [data.metadata]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{ color: hexToRgba(colors.primary, 0.08) }}
          accessibilityRole="button"
          accessibilityLabel={`${data.propertyName} property card`}
          accessibilityHint="Tap to view property details"
          accessible
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {data.propertyId && (
                <Text style={styles.propertyId} numberOfLines={1}>{data.propertyId}</Text>
              )}
              <Text style={styles.propertyName} numberOfLines={2} ellipsizeMode="tail">
                {data.propertyName}
              </Text>
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={13} color={colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                  {data.area}, {data.city}
                </Text>
              </View>
              
              {/* Badges */}
              <View style={styles.badgesRow}>
                <View style={[styles.badge, { backgroundColor: hexToRgba(typeConfig.color, 0.1) }]}>
                  <MaterialCommunityIcons name={typeConfig.icon as never} size={12} color={typeConfig.color} />
                  <Text style={[styles.badgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                </View>
                {data.mealType && (
                  <View style={[styles.badge, { backgroundColor: hexToRgba(mealConfig.color, 0.1) }]}>
                    <MaterialCommunityIcons name={mealConfig.icon as never} size={12} color={mealConfig.color} />
                    <Text style={[styles.badgeText, { color: mealConfig.color }]}>{mealConfig.label}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.headerRight}>
              <Pressable
                onPress={handleMenuOpen}
                style={styles.menuBtn}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Property options"
                accessible
              >
                <MaterialIcons name="more-vert" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Bed Stats Row */}
            <View style={styles.statsRow}>
              {stats.map((stat, idx) => (
                <View key={idx} style={styles.statItem}>
                  <Text 
                    style={styles.statValue} 
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {stat.value}
                  </Text>
                  <Text 
                    style={styles.statLabel} 
                    numberOfLines={1}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Occupancy Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Occupancy</Text>
                <Text style={[styles.progressValue, { color: occupancyColor }]}>{occupancy}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${occupancy}%`, 
                      backgroundColor: occupancyColor 
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Financial Row */}
            <View style={styles.financialRow}>
              <View style={[styles.financialItem, { backgroundColor: hexToRgba("#10B981", 0.08) }]}>
                <MaterialCommunityIcons name="arrow-down-bold" size={14} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text 
                    style={[styles.financialValue, { color: "#10B981" }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    ₹{formatIndianNumber(data.metadata?.income)}
                  </Text>
                  <Text style={styles.financialLabel}>Income</Text>
                </View>
              </View>
              <View style={[styles.financialItem, { backgroundColor: hexToRgba("#EF4444", 0.08) }]}>
                <MaterialCommunityIcons name="arrow-up-bold" size={14} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text 
                    style={[styles.financialValue, { color: "#EF4444" }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    ₹{formatIndianNumber(data.metadata?.expenses)}
                  </Text>
                  <Text style={styles.financialLabel}>Expense</Text>
                </View>
              </View>
              <View style={[styles.financialItem, { backgroundColor: hexToRgba("#F59E0B", 0.08) }]}>
                <MaterialIcons name="warning" size={14} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <Text 
                    style={[styles.financialValue, { color: "#F59E0B" }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    ₹{formatIndianNumber(data.metadata?.dues)}
                  </Text>
                  <Text style={styles.financialLabel}>Dues</Text>
                </View>
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
                <MaterialIcons name="edit" size={16} color={colors.primary} />
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
                <MaterialIcons name="delete" size={16} color={colors.error} />
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
          style={{ backgroundColor: colors.cardBackground, borderRadius: radius.lg }}
        >
          <Dialog.Title style={{ color: colors.textPrimary, fontSize: 18 }}>Delete Property?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.textSecondary, lineHeight: 20, fontSize: 14 }}>
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
