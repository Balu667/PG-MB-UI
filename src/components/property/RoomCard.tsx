// src/components/property/RoomCard.tsx
// Premium Room Card - Rich, user-friendly design
import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  LayoutAnimation,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useProperty } from "@/src/context/PropertyContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

// Note: LayoutAnimation works without setLayoutAnimationEnabledExperimental in modern React Native
// Removed to avoid "no-op in New Architecture" warning

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const num = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;
const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v));

type DerivedStatus = "Available" | "Partial" | "Filled";

const formatCurrency = (amount: number): string =>
  `₹${amount.toLocaleString("en-IN")}`;

const getFloorLabel = (floor: number | string): string => {
  const f = num(floor, NaN);
  if (Number.isNaN(f)) return "—";
  if (f === 0) return "Ground";
  if (f === 1) return "1st";
  if (f === 2) return "2nd";
  if (f === 3) return "3rd";
  return `${f}th`;
};

// Facility icons and labels
const FACILITY_MAP: Record<string, { icon: string; label: string }> = {
  washingMachine: { icon: "washing-machine", label: "Washing" },
  wifi: { icon: "wifi", label: "WiFi" },
  hotWater: { icon: "water-boiler", label: "Hot Water" },
  table: { icon: "desk", label: "Table" },
  tv: { icon: "television", label: "TV" },
  ac: { icon: "air-conditioner", label: "AC" },
  fridge: { icon: "fridge", label: "Fridge" },
  gym: { icon: "dumbbell", label: "Gym" },
};

interface Props {
  room: Record<string, unknown>;
}

const RoomCard: React.FC<Props> = ({ room }) => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, spacing, radius } = useTheme();
  const { selectedId } = useProperty();

  // Responsive columns
  const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  const GAP = spacing.md - 2;
  const SIDE = spacing.md * 2;
  const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

  const [open, setOpen] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((p) => !p);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 25 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }),
    ]).start();
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const rid = String(room?._id ?? room?.id ?? "");
    if (!rid) return;
    router.push({
      pathname: `/protected/rooms/${rid}`,
      params: { pid: String(selectedId || "") },
    });
  };

  // ---- Normalized fields ----
  const roomNoRaw = str(room?.roomNo ?? room?.roomNumber ?? room?.name ?? room?.code, "—");
  const roomNo = roomNoRaw.toString().toUpperCase();
  const floor = num(room?.floor, 0);
  const floorLabel = getFloorLabel(floor);

  const totalBeds =
    num(room?.totalBeds) ||
    num(room?.bedsTotal) ||
    num(room?.bedCount) ||
    num(room?.capacity) ||
    num(room?.beds) ||
    0;

  const occupiedBeds = num(room?.occupiedBeds);
  const underNotice = num(room?.underNotice);
  const advanceBookings = num(room?.advancedBookings) || num(room?.advanceBookingBeds);
  const hasVacantField = room?.vacantBeds !== undefined && room?.vacantBeds !== null;
  const vacantBeds = hasVacantField
    ? num(room?.vacantBeds)
    : Math.max(totalBeds - (occupiedBeds + underNotice + advanceBookings), 0);

  const bedPrice = num(room?.bedPrice ?? room?.rentAmount ?? 0);
  const deposit = num(room?.securityDeposit ?? room?.deposit ?? 0);

  const facilities: string[] = Array.isArray(room?.facilities) ? (room.facilities as string[]) : [];
  const roomTypes: string[] = Array.isArray(room?.roomType) ? (room.roomType as string[]) : [];
  const remarks = str(room?.remarks ?? "");
  const electricityIncluded = str(room?.electricityBillInclude ?? "yes").toLowerCase() === "yes";

  // Status calculation
  const derivedStatus: DerivedStatus =
    totalBeds <= 0
      ? "Available"
      : vacantBeds <= 0
      ? "Filled"
      : vacantBeds >= totalBeds
      ? "Available"
      : "Partial";

  // Colors based on status
  const statusConfig = useMemo(() => {
    switch (derivedStatus) {
      case "Available":
        return { bg: "#10B981", label: "Available", icon: "check-circle" as const };
      case "Filled":
        return { bg: "#EF4444", label: "Filled", icon: "close-circle" as const };
      case "Partial":
        return { bg: "#F59E0B", label: "Partial", icon: "progress-check" as const };
      default:
        return { bg: colors.textMuted, label: "Unknown", icon: "help-circle" as const };
    }
  }, [derivedStatus, colors.textMuted]);

  // Bed breakdown
  const bedBreakdown = [
    { key: "vacant", label: "Vacant", value: vacantBeds, color: "#10B981", icon: "bed-empty" },
    { key: "occupied", label: "Occupied", value: occupiedBeds, color: "#EF4444", icon: "bed" },
    { key: "notice", label: "Notice", value: underNotice, color: "#8B5CF6", icon: "bell-ring" },
    { key: "booked", label: "Booked", value: advanceBookings, color: "#F59E0B", icon: "calendar-check" },
  ];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardOuter: {
          width: cardW,
          borderRadius: radius.xl,
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: Platform.OS === "ios"
            ? hexToRgba(colors.textMuted, 0.15)
            : hexToRgba(colors.textMuted, 0.1),
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: Platform.OS === "ios" ? 0.15 : 0.08,
          shadowRadius: Platform.OS === "ios" ? 14 : 10,
          elevation: 5,
          overflow: "hidden",
        },
        statusBar: {
          height: 5,
          backgroundColor: statusConfig.bg,
        },
        cardContent: {
          padding: spacing.md,
        },
        // Header row
        headerRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        },
        roomBadge: {
          backgroundColor: hexToRgba(colors.accent, 0.12),
          paddingHorizontal: spacing.sm + 4,
          paddingVertical: spacing.xs + 2,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: hexToRgba(colors.accent, 0.2),
        },
        roomLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textSecondary,
          marginBottom: 2,
          letterSpacing: 0.5,
        },
        roomNo: {
          fontSize: 20,
          fontWeight: "800",
          color: colors.accent,
          letterSpacing: -0.5,
        },
        headerRight: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        statusChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: hexToRgba(statusConfig.bg, 0.15),
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: hexToRgba(statusConfig.bg, 0.3),
        },
        statusText: {
          fontSize: 11,
          fontWeight: "700",
          color: statusConfig.bg,
          textTransform: "uppercase",
        },
        editBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: hexToRgba(colors.accent, 0.2),
        },
        // Info grid
        infoGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        infoItem: {
          flex: 1,
          minWidth: "45%",
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.sm,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textMuted, 0.08),
        },
        infoLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
        },
        infoValue: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        infoValueAccent: {
          color: colors.accent,
        },
        // Beds section
        bedsSection: {
          marginBottom: spacing.md,
        },
        bedsSectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        },
        bedsSectionTitle: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        bedsTotalBadge: {
          backgroundColor: hexToRgba(colors.primary, 0.1),
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.full,
        },
        bedsTotalText: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.primary,
        },
        bedsGrid: {
          flexDirection: "row",
          gap: 6,
        },
        bedItem: {
          flex: 1,
          alignItems: "center",
          padding: spacing.xs + 2,
          borderRadius: radius.sm,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textMuted, 0.08),
        },
        bedDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          marginBottom: 4,
        },
        bedValue: {
          fontSize: 14,
          fontWeight: "800",
          color: colors.textPrimary,
        },
        bedLabel: {
          fontSize: 9,
          fontWeight: "600",
          color: colors.textSecondary,
          marginTop: 2,
        },
        // Divider
        divider: {
          height: 1,
          backgroundColor: hexToRgba(colors.textMuted, 0.1),
          marginVertical: spacing.sm,
        },
        // Expandable content
        expandContent: {
          marginTop: spacing.sm,
        },
        sectionTitle: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: spacing.xs,
        },
        facilitiesRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: spacing.sm,
        },
        facilityChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: hexToRgba(colors.accent, 0.08),
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: hexToRgba(colors.accent, 0.15),
        },
        facilityText: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.accent,
        },
        roomTypeRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: spacing.sm,
        },
        roomTypeChip: {
          backgroundColor: hexToRgba(colors.textSecondary, 0.1),
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: radius.md,
        },
        roomTypeText: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        remarksBox: {
          backgroundColor: hexToRgba(colors.textMuted, 0.06),
          padding: spacing.sm,
          borderRadius: radius.md,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
        },
        remarksText: {
          fontSize: 12,
          color: colors.textSecondary,
          fontStyle: "italic",
        },
        electricityRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: spacing.sm,
        },
        electricityText: {
          fontSize: 11,
          fontWeight: "600",
          color: electricityIncluded ? "#10B981" : "#EF4444",
        },
        // Footer
        footerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: spacing.xs,
        },
        expandHint: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        expandHintText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
        },
      }),
    [colors, spacing, radius, cardW, statusConfig, electricityIncluded]
  );

  return (
    <Animated.View style={[styles.cardOuter, { transform: [{ scale }] }]}>
      {/* Status bar at top */}
      <View style={styles.statusBar} />

      <Pressable
        onPress={handlePress}
        android_ripple={{ color: hexToRgba(colors.primary, 0.07) }}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Room ${roomNo}, ${derivedStatus}, ${vacantBeds} vacant beds out of ${totalBeds}`}
        accessibilityHint="Tap to expand details"
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.roomBadge}>
              <Text style={styles.roomLabel}>ROOM NO.</Text>
              <Text style={styles.roomNo}>{roomNo}</Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.statusChip}>
                <MaterialCommunityIcons
                  name={statusConfig.icon}
                  size={12}
                  color={statusConfig.bg}
                />
                <Text style={styles.statusText}>{statusConfig.label}</Text>
              </View>

              <Pressable
                onPress={handleEdit}
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Edit Room ${roomNo}`}
              >
                <MaterialIcons name="edit" size={16} color={colors.accent} />
              </Pressable>
            </View>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Floor</Text>
              <Text style={styles.infoValue}>{floorLabel}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sharing</Text>
              <Text style={styles.infoValue}>{totalBeds} Bed{totalBeds > 1 ? "s" : ""}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rent/Bed</Text>
              <Text style={[styles.infoValue, styles.infoValueAccent]}>
                {formatCurrency(bedPrice)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Deposit</Text>
              <Text style={styles.infoValue}>{formatCurrency(deposit)}</Text>
            </View>
          </View>

          {/* Beds Section */}
          <View style={styles.bedsSection}>
            <View style={styles.bedsSectionHeader}>
              <Text style={styles.bedsSectionTitle}>Bed Status</Text>
              <View style={styles.bedsTotalBadge}>
                <Text style={styles.bedsTotalText}>{totalBeds} Total</Text>
              </View>
            </View>
            <View style={styles.bedsGrid}>
              {bedBreakdown.map((bed) => (
                <View key={bed.key} style={styles.bedItem}>
                  <View style={[styles.bedDot, { backgroundColor: bed.color }]} />
                  <Text style={styles.bedValue}>{bed.value}</Text>
                  <Text style={styles.bedLabel}>{bed.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Expandable Content */}
          {open && (
            <View style={styles.expandContent}>
              <View style={styles.divider} />

              {/* Facilities */}
              {facilities.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Facilities</Text>
                  <View style={styles.facilitiesRow}>
                    {facilities.map((f) => {
                      const fac = FACILITY_MAP[f] || { icon: "checkbox-marked-circle", label: f };
                      return (
                        <View key={f} style={styles.facilityChip}>
                          <MaterialCommunityIcons
                            name={fac.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                            size={12}
                            color={colors.accent}
                          />
                          <Text style={styles.facilityText}>{fac.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Room Types */}
              {roomTypes.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Room Type</Text>
                  <View style={styles.roomTypeRow}>
                    {roomTypes.map((rt) => (
                      <View key={rt} style={styles.roomTypeChip}>
                        <Text style={styles.roomTypeText}>{rt}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Remarks */}
              {remarks.trim() && (
                <>
                  <Text style={styles.sectionTitle}>Remarks</Text>
                  <View style={styles.remarksBox}>
                    <Text style={styles.remarksText}>{remarks}</Text>
                  </View>
                </>
              )}

              {/* Electricity */}
              <View style={styles.electricityRow}>
                <MaterialCommunityIcons
                  name={electricityIncluded ? "check-circle" : "close-circle"}
                  size={14}
                  color={electricityIncluded ? "#10B981" : "#EF4444"}
                />
                <Text style={styles.electricityText}>
                  Electricity {electricityIncluded ? "Included" : "Not Included"}
                </Text>
              </View>
            </View>
          )}

          {/* Footer hint */}
          <View style={styles.footerRow}>
            <View style={styles.expandHint}>
              <MaterialIcons
                name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={18}
                color={colors.textMuted}
              />
              <Text style={styles.expandHintText}>
                {open ? "Tap to collapse" : "Tap for details"}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default RoomCard;
