// src/components/property/TenantCard.tsx
// Premium Tenant Card Design
import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, Pressable, Platform, Animated, I18nManager, Linking, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Portal, Dialog, Button } from "react-native-paper";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import Constants from "expo-constants";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const num = (v: any, fallback = 0) => (typeof v === "number" ? v : Number(v ?? fallback)) || 0;
const str = (v: any, fallback = "") => (v == null ? fallback : String(v));

// Format number to Indian currency format
const formatIndianNumber = (num: number): string => {
  if (isNaN(num)) return "0";
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

// Get initials from name
const getInitials = (name?: string): string => {
  if (!name) return "T";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Status mapping
const statusFromCode = (code: any): string => {
  switch (num(code)) {
    case 1:
      return "Active";
    case 2:
      return "Under Notice";
    case 3:
      return "Adv Booking";
    case 5:
      return "Expired Booking";
    case 6:
      return "Canceled Booking";
    default:
      return "";
  }
};

// Status color mapping
const getStatusColor = (status: string, colors: any): string => {
  switch (status) {
    case "Active":
      return "#10B981";
    case "Under Notice":
      return "#F59E0B";
    case "Adv Booking":
      return "#8B5CF6";
    case "Expired Booking":
    case "Canceled Booking":
      return "#EF4444";
    default:
      return colors.accent;
  }
};

// File URL helpers
const FILE_BASES = [
  (process.env.FILE_URL || "").trim(),
  ((Constants as any)?.expoConfig?.extra?.fileUrl || "").trim(),
  (process.env.EXPO_PUBLIC_IMAGE_BASE_URL || "").trim(),
  (process.env.EXPO_PUBLIC_FILE_BASE_URL || "").trim(),
]
  .filter(Boolean)
  .map((b) => String(b).replace(/\/+$/, ""));

const toAbsoluteFileUrl = (p?: string): string => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return FILE_BASES.length ? `${FILE_BASES[0]}/${p.replace(/^\/+/, "")}` : p;
};

/* ─────────────────────────────────────────────────────────────────────────────
   TENANT CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface Props {
  tenant: any;
  onDelete?: (id: string) => void;
}

const TenantCard: React.FC<Props> = ({ tenant, onDelete }) => {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Extract tenant data
  const id = str(tenant?._id ?? tenant?.id, "");
  const name = str(tenant?.tenantName ?? tenant?.name, "—");
  const phone = str(tenant?.phoneNumber ?? tenant?.phone, "—");
  const room = str(tenant?.roomNumber ?? tenant?.room, "—");
  const bed = str(tenant?.bedNumber ?? tenant?.bedNo ?? "", "");
  const rent = num(tenant?.rentAmount ?? tenant?.rent, 0);
  const dues = num(tenant?.due ?? tenant?.dues, 0);
  const sharing = num(tenant?.sharingType ?? tenant?.sharing ?? 0);
  const statusCode = num(tenant?.status);
  const statusLabel = statusFromCode(statusCode);
  const statusColor = getStatusColor(statusLabel, colors);
  const gender = str(tenant?.gender, "").toLowerCase();
  const downloaded = num(tenant?.downloaded) === 1;

  // Profile image
  const profileImage = useMemo(() => {
    const arr = Array.isArray(tenant?.profilePic) ? tenant.profilePic : [];
    const fp = arr[0]?.filePath ? String(arr[0]?.filePath) : null;
    return fp ? toAbsoluteFileUrl(fp) : null;
  }, [tenant?.profilePic]);

  // Menu handlers
  const handleMenuOpen = () => {
    Haptics.selectionAsync();
    setMenuVisible(true);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/protected/tenant/[id]", params: { id } });
  };

  const handleView = () => {
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/protected/tenant/view/[id]",
      params: { id },
    });
  };

  const handleSendEkyc = () => {
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement Send E-KYC functionality
    // For now, just show a placeholder
    console.log("Send E-KYC for tenant:", id);
  };

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        phoneRowInner: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        card: {
          backgroundColor: colors.cardBackground2,
          borderRadius: radius.xl,
          overflow: "visible",
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.9),
          position: "relative",
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              }
            : { elevation: 4 }),
        },
        statusBar: {
          height: 4,
          width: "100%",
        },
        content: {
          padding: spacing.md,
        },
        topRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          marginBottom: spacing.sm,
        },
        avatarContainer: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: hexToRgba(colors.primary, 0.1),
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.sm,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: hexToRgba(statusColor, 0.3),
        },
        avatar: {
          width: "100%",
          height: "100%",
        },
        avatarPlaceholder: {
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hexToRgba(colors.primary, 0.15),
        },
        avatarText: {
          fontSize: 20,
          fontWeight: "800",
          color: colors.primary,
        },
        infoSection: {
          flex: 1,
        },
        nameRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        },
        name: {
          fontSize: typography.fontSizeLg,
          fontWeight: "700",
          color: colors.textPrimary,
          flex: 1,
        },
        menuButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: hexToRgba(colors.textMuted, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        // Menu styles
        menuOverlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "flex-start",
          alignItems: I18nManager.isRTL ? "flex-start" : "flex-end",
          padding: 12,
          borderRadius: radius.xl,
          zIndex: 1000,
        },
        menuContainer: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          overflow: "hidden",
          minWidth: 160,
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
        phoneRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          marginBottom: spacing.xs,
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
          fontSize: typography.fontSizeSm,
          color: colors.accent,
          fontWeight: "600",
        },
        statusChip: {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.full,
          marginTop: 2,
        },
        statusDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        statusText: {
          fontSize: 11,
          fontWeight: "700",
          color: "#FFFFFF",
        },
        divider: {
          height: 1,
          backgroundColor: hexToRgba(colors.borderColor, 0.5),
          marginVertical: spacing.sm,
        },
        detailsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        detailBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: hexToRgba(colors.borderColor, 0.5),
          paddingHorizontal: 8,
          paddingVertical: 5,
          borderRadius: radius.md,
        },
        detailIcon: {
          fontSize: 14,
        },
        detailText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        financialRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: spacing.xs,
        },
        financialItem: {
          alignItems: "flex-start",
        },
        financialLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 2,
        },
        financialValue: {
          fontSize: 16,
          fontWeight: "800",
          color: colors.textPrimary,
        },
        duesValue: {
          fontSize: 16,
          fontWeight: "800",
          color: "#EF4444",
        },
        appBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: downloaded
            ? hexToRgba("#10B981", 0.1)
            : hexToRgba("#F59E0B", 0.1),
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: radius.md,
          alignSelf: "flex-start",
          marginTop: spacing.xs,
        },
        appBadgeText: {
          fontSize: 10,
          fontWeight: "700",
          color: downloaded ? "#10B981" : "#F59E0B",
        },
      }),
    [colors, spacing, radius, typography, statusColor, downloaded]
  );

  return (
    <>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Status Bar */}
        <View style={[styles.statusBar, { backgroundColor: statusColor, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl }]} />

        <View style={styles.content}>
          {/* Top Row: Avatar + Info + Menu */}
          <View style={styles.topRow}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getInitials(name)}</Text>
                </View>
              )}
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <Pressable
                  onPress={handleMenuOpen}
                  style={styles.menuButton}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="More options"
                  accessible
                >
                  <MaterialIcons name="more-vert" size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Phone Row with Call Button */}
              <View style={styles.phoneRow}>
                <View style={styles.phoneRowInner}>

                <Pressable
                  style={styles.phoneBtn}
                  onPress={() => {
                    if (phone && phone !== "—") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL(`tel:${phone}`).catch(() => {
                        Alert.alert("Error", "Could not open phone dialer.");
                      });
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${phone}`}
                  accessibilityHint="Opens phone dialer"
                >
                  <MaterialIcons name="phone" size={14} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.phoneText} numberOfLines={1}>
                  {phone}
                </Text>
                </View>
              {/* Status Chip */}
              {statusLabel && (
                <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
                  <View style={[styles.statusDot, { backgroundColor: "#FFFFFF" }]} />
                  <Text style={styles.statusText}>{statusLabel}</Text>
                </View>
              )}
              </View>

            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
              {room !== "—" && (
                <View style={styles.detailBadge}>
                  <MaterialCommunityIcons
                    name="door"
                    size={14}
                    color={colors.textMuted}
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText}>Room {room}</Text>
                </View>
              )}
              {bed && (
                <View style={styles.detailBadge}>
                  <MaterialCommunityIcons
                    name="bed"
                    size={14}
                    color={colors.textMuted}
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText}>Bed {bed}</Text>
                </View>
              )}
              {sharing > 0 && (
                <View style={styles.detailBadge}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={14}
                    color={colors.textMuted}
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText}>{sharing} Sharing</Text>
                </View>
              )}
              {gender && (
                <View style={styles.detailBadge}>
                  <MaterialCommunityIcons
                    name={gender === "female" ? "gender-female" : "gender-male"}
                    size={14}
                    color={colors.textMuted}
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText}>{gender === "female" ? "Female" : "Male"}</Text>
                </View>
              )}
          </View>

          {/* Financial Row */}
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Rent</Text>
              <Text style={styles.financialValue}>₹{formatIndianNumber(rent)}</Text>
            </View>
            {dues > 0 && (
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Due</Text>
                <Text style={styles.duesValue}>₹{formatIndianNumber(dues)}</Text>
              </View>
            )}
          </View>

          {/* App Download Badge */}
          <View style={styles.appBadge}>
            <MaterialCommunityIcons
              name={downloaded ? "check-circle" : "download-off"}
              size={12}
              color={downloaded ? "#10B981" : "#F59E0B"}
            />
            <Text style={styles.appBadgeText}>
              {downloaded ? "App Downloaded" : "App Not Downloaded"}
            </Text>
          </View>
        </View>

        {/* Menu Overlay */}
        {menuVisible && (
          <Pressable style={styles.menuOverlay} onPress={handleMenuClose}>
            <View style={styles.menuContainer}>
              <Pressable
                style={styles.menuItem}
                onPress={handleEdit}
                android_ripple={{ color: hexToRgba(colors.primary, 0.1) }}
                accessibilityRole="menuitem"
                accessibilityLabel="Edit tenant"
                accessible
              >
                <MaterialIcons name="edit" size={18} color={colors.primary} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Edit</Text>
              </Pressable>
              <View style={styles.menuDivider} />
              <Pressable
                style={styles.menuItem}
                onPress={handleView}
                android_ripple={{ color: hexToRgba(colors.primary, 0.1) }}
                accessibilityRole="menuitem"
                accessibilityLabel="View tenant details"
                accessible
              >
                <MaterialIcons name="visibility" size={18} color={colors.primary} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>View</Text>
              </Pressable>
              <View style={styles.menuDivider} />
              <Pressable
                style={styles.menuItem}
                onPress={handleSendEkyc}
                android_ripple={{ color: hexToRgba(colors.primary, 0.1) }}
                accessibilityRole="menuitem"
                accessibilityLabel="Send E-KYC"
                accessible
              >
                <MaterialCommunityIcons name="send" size={18} color={colors.primary} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Send E-KYC</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      </Animated.View>
    </>
  );
};

export default TenantCard;
