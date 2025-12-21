import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  I18nManager,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "../theme";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Portal, Dialog, Button } from "react-native-paper";
import { useProperty } from "@/src/context/PropertyContext";

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
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const formatCurrency = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return "₹0";
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num}`;
};

/* ─────────────────────────────────────────────────────────────────────────────
   PROPERTY CARD - Premium Enhanced Design
───────────────────────────────────────────────────────────────────────────── */

const PropertyCard = React.memo<PropertyCardProps>(({ data, onPress, onDelete }) => {
  const { colors, spacing, radius } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const { setSelected } = useProperty();

  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Responsive column calculation - improved breakpoints
  const numColumns = screenWidth >= 1200 ? 3 : screenWidth >= 768 ? 2 : 1;
  const horizontalPadding = spacing.md * 2;
  const gap = spacing.md;
  const cardWidth = numColumns === 1
    ? screenWidth - horizontalPadding
    : (screenWidth - horizontalPadding - gap * (numColumns - 1)) / numColumns;

  // Handlers
  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(false);
    setSelected?.(data._id);
    if (onPress) onPress();
    else router.push(`/protected/property/${data._id}`);
  }, [data._id, onPress, router, setSelected]);

  const handleEdit = useCallback(() => {
    setMenuVisible(false);
    router.push({ pathname: "/protected/property/edit/[id]", params: { id: data._id } });
  }, [data._id, router]);

  const handleDeleteConfirm = useCallback(() => {
    setConfirmDelete(false);
    onDelete?.(data._id);
  }, [data._id, onDelete]);

  // Computed values
  const meta = data.metadata || {};
  const totalBeds = meta.totalBeds || 0;
  const occupiedBeds = meta.occupiedBeds || 0;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Tenant type config
  const tenantTypeConfig = useMemo(() => {
    switch (data.tenantType) {
      case "Male":
        return { label: "Men", icon: "human-male" as const, color: "#3B82F6" };
      case "Female":
        return { label: "Women", icon: "human-female" as const, color: "#EC4899" };
      default:
        return { label: "Co-living", icon: "account-group" as const, color: colors.accent };
    }
  }, [data.tenantType, colors.accent]);

  // Occupancy color based on rate
  const occupancyColor = useMemo(() => {
    if (occupancyRate >= 90) return "#22C55E";
    if (occupancyRate >= 70) return colors.accent;
    if (occupancyRate >= 50) return "#F59E0B";
    return "#EF4444";
  }, [occupancyRate, colors.accent]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: numColumns === 1 ? "100%" : cardWidth,
      marginBottom: spacing.md + 2,
    },
    card: {
      backgroundColor: colors.cardBackground2,
      borderRadius: radius.xxl,
      borderWidth: 1.5,
      borderColor: hexToRgba(colors.borderColor, 0.7),
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        android: { elevation: 2 },
      }),
    },
    pressable: {
      padding: spacing.md - 1,
    },
    
    // Header - Enhanced
    header: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.md + 2,
    },
    headerContent: {
      flex: 1,
      marginRight: I18nManager.isRTL ? 0 : spacing.sm,
      marginLeft: I18nManager.isRTL ? spacing.sm : 0,
    },
    name: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: -0.4,
      lineHeight: 24,
      textAlign: I18nManager.isRTL ? "right" : "left",
    },
    locationRow: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginTop: 5,
    },
    location: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: I18nManager.isRTL ? 0 : 5,
      marginRight: I18nManager.isRTL ? 5 : 0,
      fontWeight: "500",
    },
    tagsRow: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginTop: 10,
      gap: 8,
    },
    typeTag: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: hexToRgba(tenantTypeConfig.color, 0.12),
      borderRadius: 6,
    },
    typeText: {
      fontSize: 11,
      fontWeight: "700",
      color: tenantTypeConfig.color,
    },
    mealTag: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: hexToRgba("#22C55E", 0.12),
      borderRadius: 6,
    },
    mealText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#22C55E",
    },
    menuButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: hexToRgba(colors.textMuted, 0.11),
      alignItems: "center",
      justifyContent: "center",
      minWidth: 34,
      minHeight: 34,
    },

    // Divider - Enhanced
    divider: {
      height: 1,
      backgroundColor: hexToRgba(colors.borderColor, 0.4),
      marginBottom: spacing.md + 2,
    },

    // Stats Grid - Enhanced 2x3
    statsGrid: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      flexWrap: "wrap",
      marginHorizontal: -6,
    },
    statCell: {
      width: "33.33%",
      paddingHorizontal: 4,
      marginBottom: 9,
    },
    statInner: {
      alignItems: "center",
      backgroundColor: colors.surface2,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: hexToRgba(colors.borderColor2, 0.2),
    },
    statValue: {
      fontSize: 19,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textMuted,
      marginTop: 4,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },

    // Occupancy bar - Enhanced
    occupancySection: {
      marginTop: 2,
      backgroundColor: colors.surface2,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: hexToRgba(colors.borderColor, 0.4),
    },
    occupancyHeader: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    occupancyLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    occupancyValue: {
      fontSize: 13,
      fontWeight: "700",
      color: occupancyColor,
    },
    progressTrack: {
      height: 6,
      backgroundColor: hexToRgba(colors.textMuted, 0.12),
      borderRadius: 3,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: occupancyColor,
      borderRadius: 3,
    },

    // Footer with financials - Enhanced
    footer: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      // marginTop: spacing.md,
      paddingTop: spacing.sm,
      // borderTopWidth: 1,
      borderTopColor: hexToRgba(colors.borderColor, 0.4),
    },
    finItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 4,
    },
    finIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    finValue: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    finLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textMuted,
      marginTop: 3,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    finDivider: {
      width: 1,
      backgroundColor: hexToRgba(colors.borderColor, 0.4),
      marginHorizontal: 10,
      marginVertical: 4,
    },

    // Menu dropdown - Enhanced
    menuOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "transparent",
    },
    menuDropdown: {
      position: "absolute",
      top: 48,
      right: I18nManager.isRTL ? undefined : spacing.md,
      left: I18nManager.isRTL ? spacing.md : undefined,
      backgroundColor: colors.cardBackground,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: hexToRgba(colors.borderColor, 0.7),
      minWidth: 140,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        },
        android: { elevation: 12 },
      }),
    },
    menuItem: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
      minHeight: 48,
    },
    menuItemText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textPrimary,
    },
    menuSeparator: {
      height: 1,
      backgroundColor: hexToRgba(colors.borderColor, 0.4),
    },
  }), [colors, spacing, radius, cardWidth, numColumns, tenantTypeConfig, occupancyColor]);

  // Stats data with colors
  const statsData = useMemo(() => [
    { key: "total", label: "Total", value: totalBeds, color: colors.textSecondary },
    { key: "vacant", label: "Vacant", value: meta.vacantBeds || 0, color: "#22C55E" },
    { key: "occupied", label: "Occupied", value: occupiedBeds, color: "#EF4444" },
    { key: "booked", label: "Adv Booked", value: meta.advancedBookings || 0, color: "#ed6c11" },
    { key: "shortTerm", label: "Short", value: meta.shortTermBeds || 0, color: "#e8d500" },
    { key: "notice", label: "Notice", value: meta.underNotice || 0, color: "#6c3fbf" },
  ], [totalBeds, meta, occupiedBeds, colors.primary]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Pressable
          // onPress={handlePress}
          style={styles.pressable}
          android_ripple={{ color: hexToRgba(colors.textMuted, 0.08) }}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${data.propertyName} property in ${data.area}, ${data.city}`}
          accessibilityHint="Double tap to view property details"
        >
          {/* Header - Enhanced */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text 
                style={styles.name} 
                numberOfLines={2}
                accessible
              >
                {data.propertyName}
              </Text>
              <View style={styles.locationRow}>
                <MaterialIcons 
                  name="place" 
                  size={15} 
                  color={colors.textSecondary}
                  accessible={false}
                />
                <Text 
                  style={styles.location} 
                  numberOfLines={1}
                  accessible
                  accessibilityLabel={`Location: ${data.area}, ${data.city}`}
                >
                  {data.area}, {data.city}
                </Text>
              </View>
              <View style={styles.tagsRow}>
                <View 
                  style={styles.typeTag}
                  accessible
                  accessibilityLabel={`Tenant type: ${tenantTypeConfig.label}`}
                >
                  <MaterialCommunityIcons 
                    name={tenantTypeConfig.icon} 
                    size={13} 
                    color={tenantTypeConfig.color} 
                  />
                  <Text style={styles.typeText}>{tenantTypeConfig.label}</Text>
                </View>
                {data.mealType && (
                  <View 
                    style={styles.mealTag}
                    accessible
                    accessibilityLabel={`Meal type: ${data.mealType}`}
                  >
                    <MaterialCommunityIcons 
                      name="silverware-fork-knife" 
                      size={12} 
                      color="#22C55E" 
                    />
                    <Text style={styles.mealText}>{data.mealType}</Text>
                  </View>
                )}
              </View>
            </View>

            <Pressable
              onPress={() => setMenuVisible(true)}
              style={({ pressed }) => [
                styles.menuButton,
                pressed && { opacity: 0.7 }
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible
              accessibilityRole="button"
              accessibilityLabel="More options menu"
              accessibilityHint="Double tap to open property options"
            >
              <MaterialIcons name="more-vert" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* <View style={styles.divider} /> */}

          {/* Stats Grid - Enhanced */}
          <View 
            style={styles.statsGrid}
            accessible={false}
          >
            {statsData.map((stat) => (
              <View key={stat.key} style={styles.statCell}>
                <View 
                  style={styles.statInner}
                  accessible
                  accessibilityLabel={`${stat.label}: ${stat.value}`}
                >
                  <Text style={[styles.statValue, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Occupancy Progress - Enhanced */}
          <View 
            style={styles.occupancySection}
            accessible
            accessibilityLabel={`Occupancy rate: ${occupancyRate} percent`}
          >
            <View style={styles.occupancyHeader}>
              <Text style={styles.occupancyLabel}>Occupancy Rate</Text>
              <Text style={styles.occupancyValue}>{occupancyRate}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(occupancyRate, 100)}%` }
                ]} 
              />
            </View>
          </View>

          {/* Footer - Financials Enhanced */}
          <View 
            style={styles.footer}
            accessible={false}
          >
            <View 
              style={styles.finItem}
              accessible
              accessibilityLabel={`Income: ${formatCurrency(meta.income)}`}
            >
              <View style={[styles.finIconWrap, { backgroundColor: hexToRgba("#22C55E", 0.12) }]}>
                <MaterialCommunityIcons name="arrow-down" size={16} color="#22C55E" />
              </View>
              <Text style={[styles.finValue, { color: "#22C55E" }]}>
                {formatCurrency(meta.income)}
              </Text>
              <Text style={styles.finLabel}>Income</Text>
            </View>
            <View style={styles.finDivider} />
            <View 
              style={styles.finItem}
              accessible
              accessibilityLabel={`Expenses: ${formatCurrency(meta.expenses)}`}
            >
              <View style={[styles.finIconWrap, { backgroundColor: hexToRgba("#EF4444", 0.12) }]}>
                <MaterialCommunityIcons name="arrow-up" size={16} color="#EF4444" />
              </View>
              <Text style={[styles.finValue, { color: "#EF4444" }]}>
                {formatCurrency(meta.expenses)}
              </Text>
              <Text style={styles.finLabel}>Expenses</Text>
            </View>
            <View style={styles.finDivider} />
            <View 
              style={styles.finItem}
              accessible
              accessibilityLabel={`Dues: ${formatCurrency(meta.dues)}`}
            >
              <View style={[styles.finIconWrap, { backgroundColor: hexToRgba("#F59E0B", 0.12) }]}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
              </View>
              <Text style={[styles.finValue, { color: "#F59E0B" }]}>
                {formatCurrency(meta.dues)}
              </Text>
              <Text style={styles.finLabel}>Dues</Text>
            </View>
          </View>
        </Pressable>

        {/* Menu Overlay - Enhanced */}
        {menuVisible && (
          <>
            <Pressable
              style={styles.menuOverlay}
              onPress={() => setMenuVisible(false)}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            />
            <View style={styles.menuDropdown}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: hexToRgba(colors.textMuted, 0.08) }
                ]}
                onPress={handleEdit}
                android_ripple={{ color: hexToRgba(colors.textMuted, 0.1) }}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Edit property"
              >
                <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Edit</Text>
              </Pressable>
              <View style={styles.menuSeparator} />
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: hexToRgba(colors.error, 0.08) }
                ]}
                onPress={() => { setMenuVisible(false); setConfirmDelete(true); }}
                android_ripple={{ color: hexToRgba(colors.error, 0.1) }}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Delete property"
              >
                <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>Delete</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={confirmDelete}
          onDismiss={() => setConfirmDelete(false)}
          style={{ 
            backgroundColor: colors.cardBackground,
            borderRadius: radius.lg,
          }}
        >
          <Dialog.Title 
            style={{ 
              color: colors.textPrimary,
              fontWeight: "600",
            }}
          >
            Delete Property
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ 
              color: colors.textSecondary,
              fontSize: 14,
              lineHeight: 20,
            }}>
              Are you sure you want to delete "{data.propertyName}"? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setConfirmDelete(false)} 
              textColor={colors.textMuted}
              accessibilityRole="button"
              accessibilityLabel="Cancel deletion"
            >
              Cancel
            </Button>
            <Button 
              onPress={handleDeleteConfirm} 
              textColor={colors.error}
              accessibilityRole="button"
              accessibilityLabel="Confirm deletion"
            >
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
