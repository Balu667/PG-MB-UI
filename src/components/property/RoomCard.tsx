// src/components/property/RoomCard.tsx
import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useProperty } from "@/src/context/PropertyContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const chipTint = (colors: any) => ({
  Available: colors.availableBeds,
  Partial: colors.advBookedBeds,
  Filled: colors.filledBeds,
});

const bedTint = (colors: any) => ({
  totalBeds: colors.primary,
  vacantBeds: colors.availableBeds,
  occupiedBeds: colors.filledBeds,
  noticeBeds: colors.underNoticeBeds,
  bookingBeds: colors.advBookedBeds,
});

const labelMap = {
  totalBeds: "Total Beds",
  vacantBeds: "Vacant",
  occupiedBeds: "Occupied",
  noticeBeds: "Notice",
  bookingBeds: "Adv. Booking",
} as const;

const num = (v: any, fallback = 0) => (typeof v === "number" ? v : Number(v ?? fallback)) || 0;
const str = (v: any, fallback = "") => (v == null ? fallback : String(v));

interface Props {
  room: any;
}

const RoomCard: React.FC<Props> = ({ room }) => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, spacing, radius, shadow } = useTheme();
  const { selectedId } = useProperty();
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
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 25 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }),
    ]).start();
  };

  // ---- Normalized fields ----
  const roomNoRaw = str(room?.roomNo ?? room?.roomNumber ?? room?.name ?? room?.code, "—");
  const roomNo = roomNoRaw.toString().toUpperCase();
  const floor = str(room?.floor ?? room?.floorLabel ?? room?.floorNo, "—");

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

  const usedCount = Math.min(occupiedBeds + underNotice + advanceBookings, totalBeds);
  const derivedStatus =
    totalBeds <= 0
      ? "Available"
      : vacantBeds <= 0
      ? "Filled"
      : vacantBeds >= totalBeds
      ? "Available"
      : "Partial";

  const utilisation = totalBeds ? Math.min(usedCount / totalBeds, 1) : 0;

  const CHIP = useMemo(() => chipTint(colors), [colors]);
  const BED_COLORS = useMemo(() => bedTint(colors), [colors]);

  const extraBeds = Math.max(totalBeds - 2, 0);

  const bedBreakdown = {
    totalBeds,
    vacantBeds,
    occupiedBeds,
    noticeBeds: underNotice,
    bookingBeds: advanceBookings,
  };

  const progressColor =
    derivedStatus === "Filled"
      ? colors.filledBeds
      : derivedStatus === "Partial"
      ? colors.advBookedBeds
      : colors.availableBeds;

  const s = useMemo(
    () =>
      StyleSheet.create({
        shadowWrap: {
          width: cardW,
          borderRadius: radius.xl,
          shadowColor: shadow,
          shadowOffset: { width: 0, height: 7 },
          shadowOpacity: 0.09,
          shadowRadius: 12,
          borderWidth: 1,
          borderColor: colors.borderColor,
        },
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          padding: spacing.md + 2,
          overflow: "hidden",
        },
        rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

        roomLabel: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
        roomNo: { fontSize: 18, fontWeight: "800", color: colors.accent },

        statusChip: (bg: string) => ({
          backgroundColor: bg,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 3,
          shadowColor: bg,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 3,
        }),
        statusTxt: {
          color: colors.white,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
        },

        // New: small Edit icon next to status chip
        headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
        editBtn: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hexToRgba(colors.accent, 0.12),
        },

        floorWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
        floorTxt: { fontSize: 14, color: colors.textSecondary },

        bedsWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
        moreBadge: {
          backgroundColor: hexToRgba(colors.primary, 0.15),
          borderRadius: 8,
          paddingHorizontal: 4,
          marginLeft: 2,
        },
        moreBadgeTxt: { fontSize: 11, color: colors.accent, fontWeight: "600" },

        rentTxt: { marginTop: 6, fontSize: 13, color: colors.textSecondary },
        rentBold: { fontWeight: "700", color: colors.textPrimary },

        depositTxt: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
        depositBold: { fontWeight: "800", color: colors.textPrimary },

        utilBarWrap: {
          height: 6,
          backgroundColor: hexToRgba(colors.textSecondary, 0.25),
          borderRadius: 3,
          marginTop: 10,
          overflow: "hidden",
        },
        utilBarFill: { height: 6 },

        infoBox: {
          marginTop: spacing.md - 2,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: hexToRgba(colors.textSecondary, 0.25),
          paddingTop: spacing.sm,
          gap: 8,
        },
        infoRow: { flexDirection: "row", alignItems: "center" },
        infoLabel: { flex: 1, fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
        infoValue: { fontSize: 14, color: colors.accent, fontWeight: "700" },
      }),
    [colors, spacing, radius, cardW, shadow]
  );

  return (
    <Animated.View style={[s.shadowWrap, { transform: [{ scale }] }]}>
      <Pressable
        style={s.card}
        onPress={handlePress}
        android_ripple={{ color: hexToRgba(colors.primary, 0.07) }}
      >
        {/* header */}
        <View style={s.rowBetween}>
          <Text style={s.roomLabel}>
            Room - <Text style={s.roomNo}>{roomNo}</Text>
          </Text>

          <View style={s.headerRight}>
            <View style={s.statusChip(CHIP[derivedStatus as keyof typeof CHIP] ?? colors.accent)}>
              <Text style={s.statusTxt}>{derivedStatus}</Text>
            </View>

            {/* EDIT */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const rid = String(room?._id ?? room?.id ?? "");
                if (!rid) return;
                // include pid so /rooms/[id] can resolve property even if context is late
                router.push({
                  pathname: `/protected/rooms/${rid}`,
                  params: { pid: String(selectedId || "") },
                });
              }}
              style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.8 }]}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Edit Room ${roomNo}`}
            >
              <MaterialIcons name="edit" size={16} color={colors.accent} />
            </Pressable>
          </View>
        </View>

        {/* row 2 */}
        <View style={[s.rowBetween, { marginTop: 6 }]}>
          <View style={s.floorWrap}>
            <MaterialIcons name="stairs" size={16} color={colors.accent} />
            <Text style={s.floorTxt}>Floor {floor}</Text>
          </View>

          <View style={s.bedsWrap}>
            <MaterialCommunityIcons name="bed" size={18} color={colors.accent} />
            <MaterialCommunityIcons name="bed" size={18} color={colors.accent} />
            {extraBeds > 0 && (
              <View style={s.moreBadge}>
                <Text style={s.moreBadgeTxt}>+{extraBeds}</Text>
              </View>
            )}
          </View>
        </View>

        {!!bedPrice && (
          <Text style={s.rentTxt}>
            <Text style={s.rentBold}>₹{bedPrice.toLocaleString()}</Text> - Rent
          </Text>
        )}

        {!!deposit && (
          <Text style={s.depositTxt}>
            <Text style={s.depositBold}>₹{deposit.toLocaleString()}</Text> - Security Deposit
          </Text>
        )}

        <View style={s.utilBarWrap}>
          <View
            style={[
              s.utilBarFill,
              { width: `${utilisation * 100}%`, backgroundColor: progressColor },
            ]}
          />
        </View>

        {open && (
          <View style={s.infoBox}>
            {Object.entries(bedBreakdown).map(([k, v]) => (
              <View key={k} style={s.infoRow}>
                <MaterialCommunityIcons
                  name="bed"
                  size={15}
                  color={BED_COLORS[k as keyof typeof BED_COLORS]}
                  style={{ width: 22 }}
                />
                <Text style={s.infoLabel}>{labelMap[k as keyof typeof labelMap] ?? k}</Text>
                <Text style={s.infoValue}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default RoomCard;
