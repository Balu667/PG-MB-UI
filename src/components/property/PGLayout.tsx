
// src/components/property/PGLayout.tsx
import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  RefreshControl,
  AccessibilityInfo,
  Modal,
  Linking,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import StatsGrid, { Metric } from "@/src/components/StatsGrid";
import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section, CheckboxOption } from "@/src/components/FilterSheet";
import AddButton, { SpeedDialOption } from "@/src/components/Common/AddButton";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/** Data contracts */
type BedStatus = "vacant" | "filled" | "notice" | "advance" | "shortTerm";
type RoomInfo = { roomNo: string; beds: { id: string; status: BedStatus }[] };
type GroupInfo = { sharing: number; rooms: RoomInfo[] };
type FloorInfo = { name: string; floorId?: number; groups: GroupInfo[] };

/** Raw room data from API */
interface RawRoomData {
  _id: string;
  roomNo: string;
  floor?: number;
  beds: number;
  bedPrice: number;
  securityDeposit: number;
  facilities: string[];
  occupiedBeds: number;
  vacantBeds: number;
  advancedBookings: number;
  underNoticeBeds: number;
  shortTermBeds?: number;
  bedsPerRoom: Array<{
    _id: string;
    bedNumber: string;
    tenantsPerBed: Array<{
      _id: string;
      tenantName: string;
      phoneNumber: string;
      tenantStatus: number;
      bedNumber: string;
    }>;
  }>;
}

type Props = {
  floors: FloorInfo[];
  metrics: Metric[];
  rawRoomsMap?: Map<string, RawRoomData>;
  propertyId?: string;
  refreshing: boolean;
  onRefresh: () => void;
};

const num = (v: unknown, fb = 0) => (typeof v === "number" ? v : Number(v ?? fb)) || 0;

/** Filter state type */
type FilterState = {
  sharing: number[];
};

const INITIAL_FILTER: FilterState = {
  sharing: [],
};

/** Tenant status label mapping */
const getTenantStatusLabel = (status: number): { label: string; color: string } => {
  switch (status) {
    case 1:
      return { label: "Active", color: "#c80b0b" };
    case 2:
      return { label: "Under Notice", color: "#6c3fc0" };
    case 3:
      return { label: "Advance Booking", color: "#ed6d10" };
    case 7:
      return { label: "Short Term", color: "#F59E0B" };
    default:
      return { label: "Unknown", color: "#6C757D" };
  }
};

/** Facility label mapping */
const getFacilityLabel = (facility: string): string => {
  const map: Record<string, string> = {
    wifi: "Wi-Fi",
    ac: "AC",
    tv: "TV",
    hotWater: "Hot Water",
    washingMachine: "Washing Machine",
    table: "Table",
    gym: "Gym",
    parking: "Parking",
    cctv: "CCTV",
    security: "Security",
    cleaning: "Cleaning",
    food: "Food",
  };
  return map[facility] || facility.charAt(0).toUpperCase() + facility.slice(1);
};

export default function PGLayout({
  floors,
  metrics,
  rawRoomsMap,
  propertyId,
  refreshing,
  onRefresh,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const contentScrollRef = useRef<ScrollView>(null);

  /** State */
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER);
  const [selectedRoom, setSelectedRoom] = useState<RawRoomData | null>(null);
  const [roomModalVisible, setRoomModalVisible] = useState(false);

  /** Bed colors with shortTerm */
  const BED_COLOR: Record<BedStatus, string> = {
    vacant: colors.availableBeds,
    filled: colors.filledBeds,
    notice: colors.underNoticeBeds,
    advance: colors.advBookedBeds,
    shortTerm: colors.shortTermBeds ?? "#F59E0B",
  };

  /** Get all unique sharing types across all floors for filter options */
  const sharingOptions = useMemo((): CheckboxOption[] => {
    const sharingSet = new Set<number>();
    floors?.forEach((floor) => {
      floor?.groups?.forEach((group) => {
        if (group?.sharing) sharingSet.add(group.sharing);
      });
    });
    return Array.from(sharingSet)
      .sort((a, b) => a - b)
      .map((s) => ({
        label: `${s} Sharing`,
        value: s,
      }));
  }, [floors]);

  /** Filter sections for FilterSheet */
  const filterSections: Section[] = useMemo(
    () => [
      {
        key: "sharing",
        label: "Sharing Type",
        mode: "checkbox",
        options: sharingOptions,
      },
    ],
    [sharingOptions]
  );

  /** Get current floor data */
  const currentFloor = useMemo(() => {
    if (!floors || floors.length === 0) return null;
    const idx = Math.min(selectedFloorIndex, floors.length - 1);
    return floors[idx] ?? null;
  }, [floors, selectedFloorIndex]);

  /** Filter and search rooms within current floor */
  const filteredGroups = useMemo(() => {
    if (!currentFloor?.groups) return [];

    let groups = currentFloor.groups;

    // Apply sharing filter
    if (filters.sharing.length > 0) {
      groups = groups.filter((g) => filters.sharing.includes(g.sharing));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      groups = groups
        .map((g) => ({
          ...g,
          rooms: g.rooms?.filter((r) =>
            String(r?.roomNo ?? "").toLowerCase().includes(query)
          ),
        }))
        .filter((g) => g.rooms && g.rooms.length > 0);
    }

    return groups;
  }, [currentFloor, filters, searchQuery]);

  /** Check if any filter is active */
  const isFilterActive = useMemo(() => filters.sharing.length > 0, [filters]);

  /** Handle floor tab selection */
  const handleFloorSelect = useCallback((index: number) => {
    Haptics.selectionAsync();
    setSelectedFloorIndex(index);
  }, []);

  /** Handle room info press */
  const handleRoomInfo = useCallback(
    (roomNo: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const rawRoom = rawRoomsMap?.get(roomNo);
      if (rawRoom) {
        setSelectedRoom(rawRoom);
        setRoomModalVisible(true);
      }
    },
    [rawRoomsMap]
  );

  /** Handle add tenant from FAB */
  const handleAddTenant = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/protected/tenant/add");
  }, [router]);

  /** Handle modal actions */
  const handleAddTenantFromModal = useCallback(() => {
    if (!selectedRoom) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoomModalVisible(false);
    router.push({
      pathname: "/protected/tenant/add",
      params: {
        prefillRoom: selectedRoom.roomNo,
        prefillRent: String(selectedRoom.bedPrice),
        prefillDeposit: String(selectedRoom.securityDeposit),
      },
    });
  }, [router, selectedRoom]);

  const handleShortStayBook = useCallback(() => {
    if (!selectedRoom) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoomModalVisible(false);
    router.push("/protected/intrim/add");
  }, [router, selectedRoom]);

  const handleAdvanceBook = useCallback(() => {
    if (!selectedRoom) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoomModalVisible(false);
    router.push({
      pathname: "/protected/advancedBooking/add",
      params: {
        prefillRoom: selectedRoom.roomNo,
        prefillRent: String(selectedRoom.bedPrice),
        prefillDeposit: String(selectedRoom.securityDeposit),
      },
    });
  }, [router, selectedRoom]);

  /** Responsive bed size - Increased by 20% */
  const bedSize = useMemo(() => {
    const baseSize = Math.max(44, (width - spacing.md * 2 - spacing.sm * 2 - 8 * 5) / 6);
    return Math.min(baseSize * 1.2, 67) * 0.74; // 20% increase, max 67
  }, [width, spacing]);

  /** Styles */
  const s = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },

        /** Stats section */
        statsSection: {
          paddingTop: spacing.sm,
          paddingBottom: spacing.xs,
        },

        /** Legend section */
        legendSection: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.background,
        },
        legend: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          padding: 10,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.1),
        },
        chip: {
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 14,
          paddingHorizontal: 10,
          paddingVertical: 5,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.06),
        },
        chipIcon: { marginRight: 6 },
        chipTxt: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
        },

        /** Search section */
        searchSection: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xs,
          backgroundColor: colors.background,
        },

        /** Sticky floor tabs - absolutely positioned */
        stickyFloorTabs: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          elevation: 10,
          backgroundColor: colors.background,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },

        /** Floor tabs - sticky */
        floorTabsWrapper: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textSecondary, 0.08),
        },
        floorTabsContainer: {
          paddingVertical: spacing.sm,
        },
        floorTabsScroll: {
          paddingHorizontal: spacing.md,
        },
        floorTab: {
          paddingHorizontal: spacing.md + 2,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          marginRight: spacing.sm,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: hexToRgba(colors.textSecondary, 0.08),
          minWidth: 80,
          alignItems: "center",
        },
        floorTabActive: {
          backgroundColor: hexToRgba(colors.accent, 0.12),
          borderColor: colors.accent,
        },
        floorTabText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        floorTabTextActive: {
          color: colors.accent,
          fontWeight: "700",
        },
        floorTabMeta: {
          fontSize: 10,
          fontWeight: "500",
          color: colors.textMuted,
          marginTop: 2,
        },
        floorTabMetaActive: {
          color: colors.accent,
        },

        /** Content area */
        contentArea: {
          paddingHorizontal: spacing.md,
          paddingBottom: insets.bottom + 100,
        },

        /** Sharing section - improved visual grouping */
        sharingSection: {
          marginTop: spacing.md,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.08),
          overflow: "hidden",
        },
        sharingSectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.md,
          backgroundColor: hexToRgba(colors.accent, 0.08),
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textSecondary, 0.08),
        },
        sharingSectionTitle: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        sharingSectionIcon: {
          width: 30,
          height: 30,
          borderRadius: 8,
          backgroundColor: hexToRgba(colors.accent, 0.15),
          alignItems: "center",
          justifyContent: "center",
        },
        sharingSectionText: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.accent,
        },
        sharingSectionMeta: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
          backgroundColor: hexToRgba(colors.textSecondary, 0.08),
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 10,
        },
        roomsContainer: {
          padding: spacing.sm,
        },

        /** Room item - improved */
        roomItem: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.06),
          marginBottom: spacing.sm,
          overflow: "hidden",
        },
        roomHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: hexToRgba(colors.textSecondary, 0.08),
        },
        roomNumberBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        roomNumberIcon: {
          width: 28,
          height: 28,
          borderRadius: 7,
          backgroundColor: hexToRgba(colors.primary, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        roomNumber: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        roomActions: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        roomStats: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        roomStatChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 8,
        },
        roomStatText: {
          fontSize: 11,
          fontWeight: "700",
        },
        infoBtn: {
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },

        /** Beds grid - Reduced padding by 20% */
        bedsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          padding: spacing.sm * 0.8,
          gap: 8,
        },
        bedItem: {
          alignItems: "center",
          justifyContent: "center",
          width: bedSize,
          height: bedSize,
          borderRadius: radius.md,
          borderWidth: 1,
        },
        bedLabel: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 2,
        },

        /** Empty states */
        emptyText: {
          textAlign: "center",
          color: colors.textMuted,
          fontSize: 14,
          marginTop: spacing.lg,
          marginBottom: spacing.md,
        },
        emptyContainer: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: spacing.xl * 2,
        },
        emptyIcon: {
          marginBottom: spacing.md,
          opacity: 0.5,
        },

        /** Room Modal - Clean Modern Design */
        modalOverlay: {
          flex: 1,
          backgroundColor: hexToRgba("#000000", 0.5),
          justifyContent: "flex-end",
        },
        modalSheet: {
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "85%",
          minHeight: 500,
          display: "flex",
          flexDirection: "column",
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
            },
            android: {
              elevation: 16,
            },
          }),
        },
        modalBody: {
          flex: 1,
          flexGrow: 1,
          flexShrink: 1,
        },
        modalHandle: {
          alignItems: "center",
          paddingTop: 10,
          paddingBottom: 6,
        },
        modalHandleBar: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: hexToRgba(colors.textMuted, 0.3),
        },
        modalHeader: {
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textSecondary, 0.08),
        },
        modalHeaderTop: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        modalTitleWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          flex: 1,
        },
        modalRoomIcon: {
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        modalTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.textPrimary,
          letterSpacing: -0.2,
        },
        modalSubtitle: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
          marginTop: 1,
        },
        modalCloseBtn: {
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: hexToRgba(colors.textMuted, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        modalQuickStats: {
          flexDirection: "row",
          marginTop: 12,
          gap: 6,
        },
        quickStatItem: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 10,
          padding: 10,
          alignItems: "center",
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.06),
        },
        quickStatValue: {
          fontSize: 16,
          fontWeight: "700",
          letterSpacing: -0.2,
        },
        quickStatLabel: {
          fontSize: 9,
          fontWeight: "600",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.2,
          marginTop: 2,
        },
        modalContent: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 80,
        },
        modalScrollContent: {
          flexGrow: 1,
        },
        modalSection: {
          marginBottom: 16,
        },
        modalSectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        },
        modalSectionIcon: {
          width: 24,
          height: 24,
          borderRadius: 6,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        modalSectionTitle: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textPrimary,
          letterSpacing: -0.1,
        },
        modalInfoCard: {
          backgroundColor: colors.surface,
          borderRadius: 10,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.06),
        },
        modalInfoRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: hexToRgba(colors.textSecondary, 0.08),
        },
        modalInfoRowLast: {
          borderBottomWidth: 0,
        },
        modalInfoLabel: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        modalInfoValue: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        bedStatsGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
        },
        bedStatCard: {
          flex: 1,
          minWidth: "30%",
          backgroundColor: colors.surface,
          borderRadius: 10,
          padding: 10,
          alignItems: "center",
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.06),
        },
        bedStatIcon: {
          marginBottom: 4,
        },
        bedStatValue: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        bedStatLabel: {
          fontSize: 9,
          fontWeight: "600",
          color: colors.textSecondary,
          textTransform: "uppercase",
          marginTop: 2,
        },
        facilitiesWrap: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
        },
        facilityChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: hexToRgba(colors.accent, 0.08),
          borderRadius: 8,
        },
        facilityText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.accent,
        },
        tenantCard: {
          backgroundColor: colors.surface,
          borderRadius: 10,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.06),
        },
        tenantRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        tenantAvatar: {
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        },
        tenantInfo: {
          flex: 1,
        },
        tenantName: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        tenantPhone: {
          fontSize: 11,
          color: colors.textSecondary,
          marginTop: 1,
        },
        tenantMeta: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 3,
        },
        tenantBed: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          backgroundColor: hexToRgba(colors.textMuted, 0.1),
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
        },
        statusBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
        },
        statusText: {
          fontSize: 10,
          fontWeight: "600",
        },
        modalFooter: {
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom + 12, 20),
          borderTopWidth: 1,
          borderTopColor: hexToRgba(colors.textSecondary, 0.08),
          backgroundColor: colors.cardBackground,
          flexShrink: 0,
        },
        modalBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingVertical: 12,
          borderRadius: 10,
        },
        modalBtnPrimary: {
          backgroundColor: colors.accent,
          ...Platform.select({
            ios: {
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        modalBtnSecondary: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.1),
        },
        modalBtnText: {
          fontSize: 12,
          fontWeight: "600",
        },
        modalBtnTextPrimary: {
          color: "#FFFFFF",
        },
        modalBtnTextSecondary: {
          color: colors.textPrimary,
        },
        noTenantsText: {
          fontSize: 12,
          color: colors.textMuted,
          textAlign: "center",
          paddingVertical: 24,
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.06),
        },
      }),
    [colors, spacing, radius, width, insets, bedSize]
  );

  /** Legend component */
  const Legend = useCallback(
    () => (
      <View style={s.legend} accessible accessibilityRole="list">
        {[
          { label: "Vacant", color: BED_COLOR.vacant },
          { label: "Filled", color: BED_COLOR.filled },
          { label: "Notice", color: BED_COLOR.notice },
          { label: "Advance", color: BED_COLOR.advance },
          { label: "Short Term", color: BED_COLOR.shortTerm },
        ].map((x) => (
          <View
            key={x.label}
            style={s.chip}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${x.label} bed indicator`}
          >
            <MaterialCommunityIcons
              name="bed"
              size={14}
              color={x.color}
              style={s.chipIcon}
            />
            <Text style={s.chipTxt}>{x.label}</Text>
          </View>
        ))}
      </View>
    ),
    [s, BED_COLOR]
  );

  /** Floor tabs component */
  const FloorTabs = useCallback(() => {
    if (!floors || floors.length === 0) return null;

    return (
      <View style={s.floorTabsWrapper} pointerEvents="box-none">
        <View style={s.floorTabsContainer} pointerEvents="box-none">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.floorTabsScroll}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            scrollEnabled
          >
            {floors.map((floor, index) => {
              const isActive = index === selectedFloorIndex;
              const roomCount =
                floor?.groups?.reduce(
                  (acc, g) => acc + (g?.rooms?.length ?? 0),
                  0
                ) ?? 0;

              return (
                <Pressable
                  key={floor?.name ?? index}
                  style={({ pressed }) => [
                    s.floorTab, 
                    isActive && s.floorTabActive,
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => handleFloorSelect(index)}
                  accessible
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${floor?.name ?? "Floor"}, ${roomCount} rooms`}
                  accessibilityHint="Tap to view this floor"
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text
                    style={[s.floorTabText, isActive && s.floorTabTextActive]}
                  >
                    {floor?.name ?? `Floor ${index + 1}`}
                  </Text>
                  <Text
                    style={[s.floorTabMeta, isActive && s.floorTabMetaActive]}
                  >
                    {roomCount} Rooms
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  }, [floors, selectedFloorIndex, s, handleFloorSelect]);

  /** Analyze room stats */
  const analyzeRoom = useCallback(
    (beds?: { id: string; status: BedStatus }[]) => {
      const total = beds?.length ?? 0;
      let vacant = 0,
        filled = 0,
        notice = 0,
        advance = 0,
        shortTerm = 0;

      beds?.forEach((b) => {
        switch (b?.status) {
          case "vacant":
            vacant += 1;
            break;
          case "filled":
            filled += 1;
            break;
          case "notice":
            notice += 1;
            break;
          case "advance":
            advance += 1;
            break;
          case "shortTerm":
            shortTerm += 1;
            break;
        }
      });

      return { total, vacant, filled, notice, advance, shortTerm };
    },
    []
  );

  /** Room component */
  const RoomItem = useCallback(
    ({ room }: { room: RoomInfo }) => {
      const stats = analyzeRoom(room?.beds);

      return (
        <View style={s.roomItem}>
          {/* Room Header */}
          <View style={s.roomHeader}>
            <View style={s.roomNumberBadge}>
              <View style={s.roomNumberIcon}>
                <MaterialCommunityIcons
                  name="door"
                  size={14}
                  color={colors.primary}
                />
              </View>
              <Text style={s.roomNumber}>Room {room?.roomNo ?? "—"}</Text>
            </View>
            <View style={s.roomActions}>
              <View style={s.roomStats}>
                {stats.vacant > 0 && (
                  <View
                    style={[
                      s.roomStatChip,
                      { backgroundColor: hexToRgba(BED_COLOR.vacant, 0.12) },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="bed"
                      size={12}
                      color={BED_COLOR.vacant}
                    />
                    <Text style={[s.roomStatText, { color: BED_COLOR.vacant }]}>
                      {stats.vacant}
                    </Text>
                  </View>
                )}
                {stats.filled > 0 && (
                  <View
                    style={[
                      s.roomStatChip,
                      { backgroundColor: hexToRgba(BED_COLOR.filled, 0.12) },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="bed"
                      size={12}
                      color={BED_COLOR.filled}
                    />
                    <Text style={[s.roomStatText, { color: BED_COLOR.filled }]}>
                      {stats.filled}
                    </Text>
                  </View>
                )}
              </View>
              {/* Info Button */}
              <Pressable
                style={s.infoBtn}
                onPress={() => handleRoomInfo(room?.roomNo)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`View details for Room ${room?.roomNo}`}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color={colors.accent}
                />
              </Pressable>
            </View>
          </View>

          {/* Beds Grid */}
          <View style={s.bedsGrid}>
            {(room?.beds ?? []).map((bed) => {
              const bedColor = BED_COLOR[bed?.status ?? "vacant"];
              return (
                <View
                  key={bed?.id}
                  style={[
                    s.bedItem,
                    {
                      backgroundColor: hexToRgba(bedColor, 0.12),
                      borderColor: hexToRgba(bedColor, 0.4),
                    },
                  ]}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`Bed ${bed?.id}, ${bed?.status ?? "vacant"}`}
                >
                  <MaterialCommunityIcons name="bed" size={22} color={bedColor} />
                  <Text style={[s.bedLabel, { color: bedColor }]}>{bed?.id}</Text>
                </View>
              );
            })}
          </View>
        </View>
      );
    },
    [s, colors, BED_COLOR, analyzeRoom, handleRoomInfo]
  );

  /** Sharing section component */
  const SharingSection = useCallback(
    ({ group }: { group: GroupInfo }) => {
      const roomCount = group?.rooms?.length ?? 0;
      const totalBeds =
        group?.rooms?.reduce((acc, r) => acc + (r?.beds?.length ?? 0), 0) ?? 0;

      return (
        <View style={s.sharingSection}>
          {/* Section Header */}
          <View style={s.sharingSectionHeader}>
            <View style={s.sharingSectionTitle}>
              <View style={s.sharingSectionIcon}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={16}
                  color={colors.accent}
                />
              </View>
              <Text style={s.sharingSectionText}>
                {num(group?.sharing)} Sharing
              </Text>
            </View>
            <Text style={s.sharingSectionMeta}>
              {roomCount} Rooms • {totalBeds} Beds
            </Text>
          </View>

          {/* Rooms List */}
          <View style={s.roomsContainer}>
            {(group?.rooms ?? []).map((room) => (
              <RoomItem key={room?.roomNo} room={room} />
            ))}
          </View>
        </View>
      );
    },
    [s, colors, RoomItem]
  );

  /** Empty state component */
  const EmptyState = useCallback(
    () => (
      <View style={s.emptyContainer}>
        <MaterialCommunityIcons
          name="bed-empty"
          size={56}
          color={colors.textMuted}
          style={s.emptyIcon}
        />
        <Text style={s.emptyText}>
          {searchQuery.trim() || isFilterActive
            ? "No rooms match your search or filters"
            : "No layout data available"}
        </Text>
      </View>
    ),
    [s, colors, searchQuery, isFilterActive]
  );

  /** Calculate short term beds from raw data */
  const getShortTermBeds = useCallback((room: RawRoomData): number => {
    let count = 0;
    room.bedsPerRoom.forEach((bed) => {
      bed.tenantsPerBed.forEach((tenant) => {
        if (tenant.tenantStatus === 7) count++;
      });
    });
    return count;
  }, []);

  /** Facility icon mapping */
  const getFacilityIcon = useCallback((facility: string): string => {
    const map: Record<string, string> = {
      wifi: "wifi",
      ac: "snowflake",
      tv: "television",
      hotWater: "water-boiler",
      washingMachine: "washing-machine",
      table: "desk",
      gym: "dumbbell",
      parking: "car",
      cctv: "cctv",
      security: "shield-check",
      cleaning: "broom",
      food: "food",
      fridge: "fridge",
    };
    return map[facility] || "checkbox-marked-circle";
  }, []);

  /** Room Info Modal - Premium Design */
  const RoomInfoModal = useCallback(() => {
    if (!selectedRoom) return null;

    const shortTermBeds = getShortTermBeds(selectedRoom);
    const activeTenants = selectedRoom.bedsPerRoom
      .flatMap((bed) =>
        bed.tenantsPerBed
          .filter((t) => [1, 2, 3, 7].includes(t.tenantStatus))
          .map((t) => ({ ...t, bedNumber: bed._id || bed.bedNumber }))
      )
      .sort((a, b) => (a.bedNumber || "").localeCompare(b.bedNumber || ""));

    const bedStats = [
      { key: "total", label: "Total", value: selectedRoom.beds, color: colors.primary },
      { key: "vacant", label: "Vacant", value: selectedRoom.vacantBeds, color: BED_COLOR.vacant },
      { key: "filled", label: "Filled", value: selectedRoom.occupiedBeds, color: BED_COLOR.filled },
      { key: "advance", label: "Advance", value: selectedRoom.advancedBookings, color: BED_COLOR.advance },
      { key: "notice", label: "Notice", value: selectedRoom.underNoticeBeds, color: BED_COLOR.notice },
      { key: "short", label: "Short", value: shortTermBeds, color: BED_COLOR.shortTerm },
    ];

    return (
      <Modal
        visible={roomModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoomModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          {/* Background overlay - tap to dismiss */}
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setRoomModalVisible(false)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
          />
          
          {/* Modal Sheet - does not dismiss on tap */}
          <View style={s.modalSheet}>
            {/* Handle */}
            <View style={s.modalHandle}>
              <View style={s.modalHandleBar} />
            </View>

            {/* Header - Premium Design - Fixed at top */}
            <View style={s.modalHeader}>
              <View style={s.modalHeaderTop}>
                <View style={s.modalTitleWrap}>
                  <View style={s.modalRoomIcon}>
                    <MaterialCommunityIcons
                      name="door"
                      size={24}
                      color={colors.accent}
                    />
                  </View>
                  <View>
                    <Text style={s.modalTitle}>Room {selectedRoom.roomNo}</Text>
                    <Text style={s.modalSubtitle}>
                      {selectedRoom.beds} Sharing • Floor {num(selectedRoom.floor ?? 0)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [s.modalCloseBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setRoomModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                  hitSlop={8}
                >
                  <MaterialIcons name="close" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Quick Stats */}
              <View style={s.modalQuickStats}>
                <View style={s.quickStatItem}>
                  <Text style={[s.quickStatValue, { color: colors.accent }]}>
                    ₹{selectedRoom.bedPrice.toLocaleString("en-IN")}
                  </Text>
                  <Text style={s.quickStatLabel}>Rent/Bed</Text>
                </View>
                <View style={s.quickStatItem}>
                  <Text style={[s.quickStatValue, { color: colors.textPrimary }]}>
                    ₹{selectedRoom.securityDeposit.toLocaleString("en-IN")}
                  </Text>
                  <Text style={s.quickStatLabel}>Deposit</Text>
                </View>
                <View style={s.quickStatItem}>
                  <Text style={[s.quickStatValue, { color: BED_COLOR.vacant }]}>
                    {selectedRoom.vacantBeds}/{selectedRoom.beds}
                  </Text>
                  <Text style={s.quickStatLabel}>Available</Text>
                </View>
              </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={s.modalBody}
              contentContainerStyle={s.modalContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              overScrollMode="always"
            >
              {/* Bed Statistics - Visual Grid */}
              <View style={s.modalSection}>
                <View style={s.modalSectionHeader}>
                  <View style={s.modalSectionIcon}>
                    <MaterialCommunityIcons name="bed" size={14} color={colors.accent} />
                  </View>
                  <Text style={s.modalSectionTitle}>Bed Status Overview</Text>
                </View>
                <View style={s.bedStatsGrid}>
                  {bedStats.map((stat) => {
                    const bedIconName = 
                      stat.key === "vacant" ? "bed-empty" :
                      stat.key === "filled" ? "bed" :
                      stat.key === "advance" ? "bed-outline" :
                      stat.key === "notice" ? "bed-clock" :
                      stat.key === "short" ? "bed-clock" :
                      "bed";
                    return (
                      <View key={stat.key} style={s.bedStatCard}>
                        <View style={s.bedStatIcon}>
                          <MaterialCommunityIcons
                            name={bedIconName as keyof typeof MaterialCommunityIcons.glyphMap}
                            size={18}
                            color={stat.color}
                          />
                        </View>
                        <Text style={s.bedStatValue}>{stat.value}</Text>
                        <Text style={s.bedStatLabel}>{stat.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Facilities */}
              {selectedRoom.facilities && selectedRoom.facilities.length > 0 && (
                <View style={s.modalSection}>
                  <View style={s.modalSectionHeader}>
                    <View style={s.modalSectionIcon}>
                      <MaterialCommunityIcons name="star" size={14} color={colors.accent} />
                    </View>
                    <Text style={s.modalSectionTitle}>Amenities</Text>
                  </View>
                  <View style={s.facilitiesWrap}>
                    {selectedRoom.facilities.map((f) => (
                      <View key={f} style={s.facilityChip}>
                        <MaterialCommunityIcons
                          name={getFacilityIcon(f) as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={14}
                          color={colors.accent}
                        />
                        <Text style={s.facilityText}>{getFacilityLabel(f)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tenants */}
              <View style={s.modalSection}>
                <View style={s.modalSectionHeader}>
                  <View style={s.modalSectionIcon}>
                    <MaterialCommunityIcons name="account-group" size={14} color={colors.accent} />
                  </View>
                  <Text style={s.modalSectionTitle}>
                    Tenants ({activeTenants.length})
                  </Text>
                </View>
                {activeTenants.length === 0 ? (
                  <Text style={s.noTenantsText}>
                    No tenants currently in this room
                  </Text>
                ) : (
                  activeTenants.map((tenant, index) => {
                    const statusInfo = getTenantStatusLabel(tenant.tenantStatus);
                    return (
                      <View key={`${tenant._id}-${index}`} style={s.tenantCard}>
                        <View style={s.tenantRow}>
                          <View style={s.tenantAvatar}>
                            <MaterialCommunityIcons
                              name="account"
                              size={22}
                              color={colors.accent}
                            />
                          </View>
                          <View style={s.tenantInfo}>
                            <Text style={s.tenantName}>
                              {tenant.tenantName || "Unknown Tenant"}
                            </Text>
                            <Text style={s.tenantPhone}>
                              {tenant.phoneNumber || "No phone"}
                            </Text>
                            <View style={s.tenantMeta}>
                              <Text style={s.tenantBed}>Bed {tenant.bedNumber}</Text>
                              <View
                                style={[
                                  s.statusBadge,
                                  { backgroundColor: hexToRgba(statusInfo.color, 0.12) },
                                ]}
                              >
                                <Text style={[s.statusText, { color: statusInfo.color }]}>
                                  {statusInfo.label}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
              
              {/* Bottom spacer for scroll content - extra space to ensure visibility */}
              <View style={{ height: 40 }} />
            </ScrollView>

            {/* Footer Actions - Fixed at bottom */}
            <View style={s.modalFooter}>
              <Pressable
                style={({ pressed }) => [
                  s.modalBtn, 
                  s.modalBtnSecondary,
                  pressed && { opacity: 0.8 }
                ]}
                onPress={handleShortStayBook}
                accessibilityRole="button"
                accessibilityLabel="Short Stay Book"
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={colors.textPrimary}
                />
                <Text style={[s.modalBtnText, s.modalBtnTextSecondary]}>
                  Short Stay
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  s.modalBtn, 
                  s.modalBtnSecondary,
                  pressed && { opacity: 0.8 }
                ]}
                onPress={handleAdvanceBook}
                accessibilityRole="button"
                accessibilityLabel="Advance Book"
              >
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={16}
                  color={colors.textPrimary}
                />
                <Text style={[s.modalBtnText, s.modalBtnTextSecondary]}>
                  Advance
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  s.modalBtn, 
                  s.modalBtnPrimary,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                ]}
                onPress={handleAddTenantFromModal}
                accessibilityRole="button"
                accessibilityLabel="Add Tenant"
              >
                <MaterialIcons name="person-add" size={16} color="#FFFFFF" />
                <Text style={[s.modalBtnText, s.modalBtnTextPrimary]}>
                  Add Tenant
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }, [
    roomModalVisible,
    selectedRoom,
    s,
    colors,
    BED_COLOR,
    handleAddTenantFromModal,
    handleShortStayBook,
    handleAdvanceBook,
    getShortTermBeds,
    getFacilityIcon,
  ]);

  /** Sticky header state */
  const [headerSticky, setHeaderSticky] = useState(false);
  const headerOffset = useRef(0);

  /** Handle scroll to determine sticky state */
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = event.nativeEvent.contentOffset.y;
    // Make floor tabs sticky after scrolling past stats, legend, and search
    const stickyThreshold = headerOffset.current || 280;
    setHeaderSticky(y >= stickyThreshold);
  }, []);

  return (
    <View style={s.root}>
      {/* Sticky Floor Tabs - rendered outside ScrollView when sticky */}
      {headerSticky && floors && floors.length > 0 && (
        <View style={s.stickyFloorTabs}>
          <FloorTabs />
        </View>
      )}

      <ScrollView
        ref={contentScrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {/* 0: Stats Grid */}
        <View style={s.statsSection}>
          <StatsGrid metrics={metrics ?? []} cardHeight={70} minVisible={3} />
        </View>

        {/* 1: Legend */}
        <View style={s.legendSection}>
          <Legend />
        </View>

        {/* 2: Search Bar */}
        <View 
          style={s.searchSection}
          onLayout={(e) => {
            headerOffset.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
          }}
        >
          <SearchBar
            placeholder="Search room number..."
            onSearch={setSearchQuery}
            onFilter={() => setFilterVisible(true)}
            filterActive={isFilterActive}
          />
        </View>

        {/* 3: Floor Tabs - rendered inline when not sticky */}
        {!headerSticky && <FloorTabs />}
        
        {/* Placeholder when sticky to prevent content jump */}
        {headerSticky && floors && floors.length > 0 && (
          <View style={{ height: 70 }} />
        )}

        {/* 4: Content Area */}
        <View style={s.contentArea}>
          {!floors || floors.length === 0 ? (
            <EmptyState />
          ) : filteredGroups.length === 0 ? (
            <EmptyState />
          ) : (
            filteredGroups.map((group) => (
              <SharingSection
                key={`${currentFloor?.name}-${group?.sharing}`}
                group={group}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Filter Sheet */}
      <FilterSheet
        visible={filterVisible}
        value={filters}
        onChange={setFilters}
        onClose={() => setFilterVisible(false)}
        sections={filterSections}
        resetValue={INITIAL_FILTER}
        title="Filter Rooms"
      />

      {/* Room Info Modal */}
      <RoomInfoModal />

      {/* Add Button with Speed Dial */}
      <AddButton
        speedDialOptions={[
          {
            label: "Add Tenant",
            icon: "person-add",
            iconFamily: "material",
            onPress: handleAddTenant,
            color: colors.accent,
          },
          {
            label: "Advance Booking",
            icon: "calendar-clock",
            iconFamily: "materialCommunity",
            onPress: () => router.push("/protected/advancedBooking/add"),
            color: "#F59E0B",
          },
          {
            label: "Short Term",
            icon: "clock-outline",
            iconFamily: "materialCommunity",
            onPress: () => router.push("/protected/intrim/add"),
            color: "#10B981",
          },
        ]}
        accessibilityLabel="Open quick actions"
        accessibilityHint="Shows options to add tenant, advance booking, or short term booking"
      />
    </View>
  );
}
