// src/components/property/RoomsTab.tsx
import React, { useState, useMemo } from "react";
import {
  FlatList,
  useWindowDimensions,
  StyleSheet,
  Text,
  ListRenderItemInfo,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import StatsGrid, { Metric } from "@/src/components/StatsGrid";
import SearchBar from "@/src/components/SearchBar";
import FilterSheet, { Section } from "@/src/components/FilterSheet";
import RoomCard from "./RoomCard";

import { RoomFilter, emptyFilter } from "@/src/constants/roomFilter";
import { useGetAllRooms } from "@/src/hooks/room";
import { useTheme } from "@/src/theme/ThemeContext";

/* ------------------------------------------------------------------ */
/*  Filter schema (kept; options mapped against API values defensively) */
/* ------------------------------------------------------------------ */
const roomSections: Section[] = [
  {
    key: "status",
    label: "Room Status",
    mode: "checkbox",
    options: ["Available", "Partial", "Filled"].map((s) => ({ label: s, value: s })),
  },
  {
    key: "sharing",
    label: "Sharing",
    mode: "checkbox",
    options: Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1} Sharing`, value: i + 1 })),
  },
  {
    key: "floor",
    label: "Floor",
    mode: "checkbox",
    options: ["GF", ...Array.from({ length: 10 }, (_, i) => `${i + 1}F`)].map((f) => ({
      label: f === "GF" ? "Ground Floor" : `${f.replace("F", "")} Floor`,
      value: f,
    })),
  },
  {
    key: "facilities",
    label: "Facilities",
    mode: "checkbox",
    options: ["AC", "Geyser", "WM", "WiFi", "TV", "Furnished"].map((f) => ({
      label: f,
      value: f,
    })),
  },
];

/* ---------------- helpers to read API fields safely ---------------- */
const pick = <T,>(v: T | undefined | null, fallback: T): T => (v == null ? fallback : v);
const num = (v: any, fallback = 0) => (typeof v === "number" ? v : Number(v ?? fallback)) || 0;
const str = (v: any, fallback = "") => (v == null ? fallback : String(v));

/* everything below stays UI-only; no mock data used */
export default function RoomsTab() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();

  /* -------------- API -------------- */
  const { data: remoteRooms = [], isLoading, isRefetching, error } = useGetAllRooms(id as string);

  /* -------------- local state -------------- */
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<RoomFilter>(emptyFilter);

  /* -------------- responsive cols -------------- */
  const cols = useMemo(() => (width >= 1000 ? 3 : width >= 740 ? 2 : 1), [width]);

  /* -------------- derive metrics from API -------------- */
  const metrics: Metric[] = useMemo(() => {
    const totalRooms = Array.isArray(remoteRooms) ? remoteRooms.length : 0;

    const totals = (remoteRooms as any[]).reduce(
      (acc, r) => {
        const totalBeds =
          num(r?.totalBeds) || num(r?.bedsTotal) || num(r?.bedCount) || num(r?.capacity) || 0;

        const vacantBeds = num(r?.vacantBeds) || num(r?.availableBeds) || 0;
        const occupiedBeds =
          num(r?.occupiedBeds) || num(r?.filledBeds) || Math.max(totalBeds - vacantBeds, 0);
        const underNotice = num(r?.noticeBeds) || num(r?.underNotice) || 0;

        acc.totalBeds += totalBeds;
        acc.vacantBeds += vacantBeds;
        acc.occupiedBeds += occupiedBeds;
        acc.notice += underNotice;
        return acc;
      },
      { totalBeds: 0, vacantBeds: 0, occupiedBeds: 0, notice: 0 }
    );

    return [
      {
        key: "rooms",
        label: "Total Rooms",
        value: totalRooms,
        icon: "office-building",
        iconBg: "#DBEAFE",
      },
      { key: "beds", label: "Total Beds", value: totals.totalBeds, icon: "bed", iconBg: "#DBEAFE" },
      {
        key: "vacant",
        label: "Vacant Beds",
        value: totals.vacantBeds,
        icon: "bed",
        iconBg: "#BBF7D0",
        iconColor: "#059669",
      },
      {
        key: "notice",
        label: "Under Notice",
        value: totals.notice,
        icon: "bed",
        iconBg: "#DDD6FE",
        iconColor: "#7C3AED",
      },
    ];
  }, [remoteRooms]);

  /* -------------- search + filter (defensive) -------------- */
  const rooms = useMemo(() => {
    const source: any[] = Array.isArray(remoteRooms) ? remoteRooms : [];

    const getRoomNo = (r: any) => str(r?.roomNo ?? r?.roomNumber ?? r?.name ?? r?.code, "");
    const getFloor = (r: any) => str(r?.floor ?? r?.floorLabel ?? r?.floorNo, "");
    const getStatus = (r: any) => str(r?.status, "");
    const getSharing = (r: any) =>
      num(r?.sharing ?? r?.sharingCount ?? r?.capacityPerRoom ?? r?.occupancyPerRoom ?? 0);
    const getFacilities = (r: any) => (Array.isArray(r?.facilities) ? r.facilities : []);

    const q = query.trim().toLowerCase();

    const byQ = q
      ? source.filter(
          (r) => getRoomNo(r).toLowerCase().includes(q) || getFloor(r).toLowerCase().includes(q)
        )
      : source;

    const byStatus = filter.status.length
      ? byQ.filter((r) => filter.status.includes(getStatus(r)))
      : byQ;

    const bySharing = filter.sharing.length
      ? byStatus.filter((r) => filter.sharing.includes(getSharing(r)))
      : byStatus;

    const byFloor = filter.floor.length
      ? bySharing.filter((r) => filter.floor.includes(getFloor(r)))
      : bySharing;

    const byFacilities = filter.facilities.length
      ? byFloor.filter((r) => {
          const facs = getFacilities(r);
          return filter.facilities.every((f) => facs.includes(f));
        })
      : byFloor;

    return byFacilities;
  }, [query, filter, remoteRooms]);

  /* -------------- styles -------------- */
  const s = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        columnGap: { gap: spacing.md - 2 },
        listContent: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.lg * 2,
          rowGap: spacing.md - 2,
        },
        errorWrap: { padding: spacing.md },
        emptyWrap: { padding: spacing.md },
        emptyTxt: { color: colors.textSecondary },
      }),
    [colors, spacing, insets.bottom]
  );

  /* -------------- loading -------------- */
  if (isLoading || isRefetching) {
    return (
      <SafeAreaView style={s.safeArea} edges={["left", "right"]}>
        <Text style={{ color: colors.textPrimary, padding: spacing.md }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  /* -------------- error -------------- */
  if (error) {
    return (
      <SafeAreaView style={s.safeArea} edges={["left", "right"]}>
        <View style={s.errorWrap}>
          <Text style={{ color: colors.error }}>Couldn’t load rooms. Please try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* -------------- render -------------- */
  const renderRoom = ({ item }: ListRenderItemInfo<any>) => <RoomCard room={item} />;

  return (
    <>
      <FlatList
        data={rooms}
        keyExtractor={(r: any, index) =>
          String(r?._id ?? r?.id ?? r?.roomNo ?? r?.roomNumber ?? index)
        }
        renderItem={renderRoom}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? s.columnGap : undefined}
        ListHeaderComponent={
          <View>
            <StatsGrid metrics={metrics} />
            <SearchBar
              placeholder="Search by room / floor"
              onSearch={setQuery}
              onFilter={() => setSheetOpen(true)}
              filterActive={Object.values(filter).some((a) => a.length)}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyTxt}>No rooms found.</Text>
          </View>
        }
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        windowSize={10}
      />

      {/* filter bottom-sheet */}
      <FilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
        sections={roomSections}
        resetValue={emptyFilter}
      />
    </>
  );
}
