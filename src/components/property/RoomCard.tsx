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

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* colour helpers */
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
  room: any; // API-driven
}

const RoomCard: React.FC<Props> = ({ room }) => {
  const { width } = useWindowDimensions();
  const { colors, spacing, radius, shadow } = useTheme();

  /* responsive cols */
  const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  const GAP = spacing.md - 2;
  const SIDE = spacing.md * 2;
  const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

  /* animated press */
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

  /* normalize API fields safely */
  const roomNo = str(room?.roomNo ?? room?.roomNumber ?? room?.name ?? room?.code, "—");
  const floor = str(room?.floor ?? room?.floorLabel ?? room?.floorNo, "—");
  const totalBeds =
    num(room?.totalBeds) || num(room?.bedsTotal) || num(room?.bedCount) || num(room?.capacity) || 0;
  const vacantBeds = num(room?.vacantBeds) || num(room?.availableBeds) || 0;
  const occupiedBeds =
    num(room?.occupiedBeds) || num(room?.filledBeds) || Math.max(totalBeds - vacantBeds, 0);
  const noticeBeds = num(room?.noticeBeds) || num(room?.underNotice) || 0;
  const bookingBeds = num(room?.bookingBeds) || num(room?.advancedBookings) || 0;
  const status = str(
    room?.status ??
      (totalBeds === 0
        ? "Available"
        : occupiedBeds >= totalBeds
        ? "Filled"
        : vacantBeds >= totalBeds
        ? "Available"
        : "Partial"),
    "Available"
  );
  const deposit = num(room?.deposit ?? room?.securityDeposit ?? 0);

  const CHIP = useMemo(() => chipTint(colors), [colors]);
  const BED_COLORS = useMemo(() => bedTint(colors), [colors]);

  const extraBeds = Math.max(totalBeds - 2, 0);
  const utilisation = totalBeds ? Math.min(occupiedBeds / totalBeds, 1) : 0;

  const bedBreakdown = {
    totalBeds,
    vacantBeds,
    occupiedBeds,
    noticeBeds,
    bookingBeds,
  };

  /* styles */
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

        rowBetween: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },

        roomNo: { fontSize: 18, fontWeight: "700", color: colors.accent },

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

        floorWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
        floorTxt: { fontSize: 14, color: colors.textSecondary },

        bedsWrap: { flexDirection: "row", alignItems: "center", gap: 2 },

        moreBadge: {
          backgroundColor: hexToRgba(colors.primary, 0.15),
          borderRadius: 8,
          paddingHorizontal: 4,
          marginLeft: 2,
        },
        moreBadgeTxt: { fontSize: 11, color: colors.accent, fontWeight: "600" },

        depositTxt: { marginTop: 8, fontSize: 13, color: colors.textSecondary },

        utilBarWrap: {
          height: 5,
          backgroundColor: hexToRgba(colors.textSecondary, 0.25),
          borderRadius: 3,
          marginTop: 10,
          overflow: "hidden",
        },
        utilBarFill: { height: 5, backgroundColor: colors.accent },

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
        {/* row 1 – room & status */}
        <View style={s.rowBetween}>
          <Text style={s.roomNo}>Room {roomNo}</Text>

          <View style={s.statusChip(CHIP[status as keyof typeof CHIP] ?? colors.accent)}>
            <Text style={s.statusTxt}>{status}</Text>
          </View>
        </View>

        {/* row 2 – floor & beds mini-icons */}
        <View style={[s.rowBetween, { marginTop: 6 }]}>
          <View style={s.floorWrap}>
            <MaterialIcons name="stairs" size={16} color={colors.accent} />
            <Text style={s.floorTxt}>{floor}</Text>
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

        {/* row 3 – deposit */}
        <Text style={s.depositTxt}>₹{deposit.toLocaleString()} deposit</Text>

        {/* utilisation bar */}
        <View style={s.utilBarWrap}>
          <View style={[s.utilBarFill, { width: `${utilisation * 100}%` }]} />
        </View>

        {/* expandable panel */}
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
