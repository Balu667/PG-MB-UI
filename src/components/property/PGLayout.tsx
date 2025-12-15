
// src/components/property/PGLayout.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  RefreshControl,
  AccessibilityInfo,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";

import StatsGrid, { Metric } from "@/src/components/StatsGrid";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/** Data contracts (unchanged) */
type BedStatus = "vacant" | "filled" | "notice" | "advance";
type RoomInfo = { roomNo: string; beds: { id: string; status: BedStatus }[] };
type GroupInfo = { sharing: number; rooms: RoomInfo[] };
type FloorInfo = { name: string; groups: GroupInfo[] };

type Props = {
  floors: FloorInfo[];
  metrics: Metric[];
  refreshing: boolean;
  onRefresh: () => void;
};

const num = (v: any, fb = 0) => (typeof v === "number" ? v : Number(v ?? fb)) || 0;

/** Per-room analysis */
function analyzeRoom(beds?: { id: string; status: BedStatus }[]) {
  const total = beds?.length ?? 0;
  let filled = 0,
    notice = 0,
    advance = 0;

  beds?.forEach?.((b) => {
    if (b?.status === "filled") filled += 1;
    else if (b?.status === "notice") notice += 1;
    else if (b?.status === "advance") advance += 1;
  });

  const used = Math.min(filled + notice + advance, total);
  const vacant = Math.max(total - used, 0);

  let badge: "Available" | "Partial" | "Filled" = "Available";
  if (total > 0) {
    if (vacant <= 0) badge = "Filled";
    else if (vacant >= total) badge = "Available";
    else badge = "Partial";
  }

  const a11y = `Room status ${badge}. Total beds ${total}, used ${used}, vacant ${vacant}, advance bookings ${advance}, under notice ${notice}.`;
  return { total, used, vacant, filled, notice, advance, badge, a11y };
}

/** Per-sharing analysis for “% full” pill */
function analyzeSharing(rooms?: RoomInfo[]) {
  let total = 0;
  let used = 0;
  rooms?.forEach?.((r) => {
    const { total: t, used: u } = analyzeRoom(r?.beds);
    total += t;
    used += u;
  });
  const pct = total > 0 ? used / total : 0;
  return { total, used, pct };
}

export default function PGLayout({ floors, metrics, refreshing, onRefresh }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, spacing, radius, typography } = useTheme();

  /** fixed heights keep every floor card equal-height */
  const GROUP_ZONE_H = width >= 1200 ? 230 : width >= 900 ? 220 : width >= 640 ? 210 : 200;
  const ROOM_TILE_H = 58;
  const CARD_GAP = 8;

  const BED_COLOR: Record<BedStatus, string> = {
    vacant: colors.availableBeds,
    filled: colors.filledBeds,
    notice: colors.underNoticeBeds,
    advance: colors.advBookedBeds,
  };
  const STATUS_BG: Record<"Available" | "Partial" | "Filled", string> = {
    Available: colors.availableBeds,
    Partial: colors.advBookedBeds,
    Filled: colors.filledBeds,
  };

  const s = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        body: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.lg * 1.25,
          gap: spacing.sm,
        },

        /** sticky legend wrapper */
        stickyWrap: {
          backgroundColor: colors.background,
          paddingTop: 2,
          paddingBottom: 6,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },

        /* legend chips (compact) */
        legend: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          padding: 8,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
        },
        chip: {
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: colors.surface,
        },
        chipDot: { marginRight: 6 },
        chipTxt: { fontSize: 14, color: colors.textSecondary },

        /* floor card */
        floorCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
          padding: 10,
        },
        floorHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        },
        floorTitle: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
        floorMeta: { fontSize: 11, color: colors.textSecondary },

        /* group scroller zone (equal height) */
        groupsWrap: {
          position: "relative",
        },
        groupsScroller: {
          height: GROUP_ZONE_H,
        },

        /* edge scroll hints */
        edgeHint: {
          position: "absolute",
          top: 8,
          bottom: 8,
          width: 22,
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        },
        leftHint: {
          left: 0,
          backgroundColor: hexToRgba(colors.background, 0.0),
        },
        rightHint: {
          right: 0,
          backgroundColor: hexToRgba(colors.background, 0.0),
        },
        hintIconWrap: {
          backgroundColor: hexToRgba(colors.black, 0.06),
          borderRadius: 999,
          padding: 4,
        },

        /* bottom scroll progress bar */
        scrollTrack: {
          position: "absolute",
          left: 10,
          right: 10,
          bottom: 4,
          height: 3,
          backgroundColor: hexToRgba(colors.textSecondary, 0.12),
          borderRadius: 999,
          overflow: "hidden",
        },
        scrollThumb: {
          position: "absolute",
          top: 0,
          bottom: 0,
          backgroundColor: hexToRgba(colors.accent, 0.55),
          borderRadius: 999,
        },

        /* sharing card */
        sharingCard: {
          width: Math.max(180, width * (width >= 900 ? 0.28 : width >= 640 ? 0.42 : 0.87)),
          flex: 1,
          height: GROUP_ZONE_H - 2,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.12),
          padding: 8,
        },
        sharingCardFull: {
          width: "100%",
        },
        sharingHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        },
        sharingTitle: { fontSize: 12.5, fontWeight: "700", color: colors.accent },
        rightChips: { flexDirection: "row", alignItems: "center", gap: 6 },
        groupCount: {
          fontSize: 10.5,
          fontWeight: "700",
          color: colors.textSecondary,
          backgroundColor: hexToRgba(colors.textSecondary, 0.1),
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 10,
        },

        /* occupancy pill */
        occPill: (fg: string) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: hexToRgba(fg, 0.12),
          borderWidth: 1,
          borderColor: hexToRgba(fg, 0.35),
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 999,
        }),
        occTxt: (fg: string) => ({ fontSize: 10.5, fontWeight: "800", color: fg }),

        /* vertical rooms area */
        roomList: {
          flex: 1,
        },

        /* room mini tile */
        roomTile: {
          height: ROOM_TILE_H,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.12),
          backgroundColor: colors.cardBackground,
          paddingHorizontal: 8,
          paddingVertical: 6,
          marginBottom: 6,
          justifyContent: "space-between",
        },
        roomRowTop: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        roomNo: {
          fontSize: 12.5,
          fontWeight: "800",
          color: colors.textPrimary,
          backgroundColor: hexToRgba(colors.primary, 0.08),
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 6,
        },
        badge: (bg: string) => ({
          backgroundColor: bg,
          paddingHorizontal: 6,
          paddingVertical: 1,
          borderRadius: 10,
        }),
        badgeTxt: { color: colors.white, fontSize: 10, fontWeight: "800" },

        /* micro bed bar */
        bedBar: {
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
          marginTop: 4,
        },
        bedSeg: (bg: string) => ({
          height: 6,
          width: 10,
          borderRadius: 2,
          backgroundColor: bg,
        }),

        /* labeled counts line */
        countsLine: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
        },
        countItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          minWidth: 64,
        },
        dot: (bg: string) => ({
          width: 8,
          height: 8,
          borderRadius: 10,
          backgroundColor: bg,
        }),
        countLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "700" },
        countValue: (fg: string) => ({ fontSize: 13, color: fg, fontWeight: "800" }),

        emptyText: {
          textAlign: "center",
          color: colors.textMuted,
          fontSize: 14,
          marginTop: 8,
        },
      }),
    [colors, spacing, radius, typography, width, GROUP_ZONE_H, ROOM_TILE_H]
  );

  const Legend = () => (
    <View style={s.legend}>
      {[
        { label: "Vacant", color: BED_COLOR.vacant },
        { label: "Filled", color: BED_COLOR.filled },
        { label: "Under Notice", color: BED_COLOR.notice },
        { label: "Adv. Booking", color: BED_COLOR.advance },
      ].map((x) => (
        <View
          key={x.label}
          style={s.chip}
          accessible
          accessibilityRole="text"
          accessibilityLabel={x.label}
        >
          <MaterialCommunityIcons name="circle" size={10} color={x.color} style={s.chipDot} />
          <Text style={s.chipTxt}>{x.label}</Text>
        </View>
      ))}
    </View>
  );

  const occColorFor = (pct: number) => {
    if (pct >= 0.9) return BED_COLOR.filled; // very full
    if (pct >= 0.5) return BED_COLOR.advance; // mid
    return BED_COLOR.vacant; // low
  };

  /** A floor block with its own scroll hint state */
  const FloorBlock = ({ floor }: { floor: FloorInfo }) => {
    const groups = floor?.groups ?? [];
    const isSingleGroup = groups.length === 1;

    // scroll state for hints / progress bar
    const [layoutW, setLayoutW] = useState(0);
    const [contentW, setContentW] = useState(0);
    const [scrollX, setScrollX] = useState(0);

    const canScroll = contentW - layoutW > 1;
    const canLeft = canScroll && scrollX > 2;
    const canRight = canScroll && scrollX < contentW - layoutW - 2;

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollX(e.nativeEvent.contentOffset.x);
    }, []);

    // floor rollup (rooms/beds)
    let roomsCount = 0;
    let bedsCount = 0;
    groups.forEach?.((g) => {
      roomsCount += g?.rooms?.length ?? 0;
      g?.rooms?.forEach?.((r) => (bedsCount += r?.beds?.length ?? 0));
    });

    return (
      <View style={s.floorCard}>
        {/* floor header */}
        <View style={s.floorHeader}>
          <Text style={s.floorTitle}>{floor?.name ?? "Floor"}</Text>
          <Text style={s.floorMeta}>
            Rooms: {roomsCount} • Beds: {bedsCount}
          </Text>
        </View>

        {/* equal-height group zone with hints */}
        <View style={s.groupsWrap} accessible accessibilityLabel="Sharing groups">
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onLayout={(e) => setLayoutW(e.nativeEvent.layout.width)}
            onContentSizeChange={(w) => setContentW(w)}
            contentContainerStyle={{
              // no trailing padding — we’ll set per-card marginRight except last
              paddingRight: 0,
              // no fixed gap here to avoid right-side white space
            }}
            style={s.groupsScroller}
            scrollEnabled={!isSingleGroup}
            accessible
            accessibilityHint="Swipe horizontally to see more sharing types"
          >
            {groups.map((grp, idx) => {
              const { total: grpTotal, used: grpUsed, pct } = analyzeSharing(grp?.rooms);
              const occColor = occColorFor(pct);
              const isLast = idx === groups.length - 1;

              return (
                <View
                  key={`${floor?.name}-${grp?.sharing}`}
                  style={[
                    s.sharingCard,
                    isSingleGroup && s.sharingCardFull,
                    !isLast && { marginRight: CARD_GAP }, // gap between cards only, no trailing gap
                  ]}
                >
                  {/* sharing header */}
                  <View style={s.sharingHeader}>
                    <Text style={s.sharingTitle}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={14}
                        color={colors.accent}
                      />{" "}
                      {num(grp?.sharing)} Sharing
                    </Text>

                    <View style={s.rightChips}>
                      <Text style={s.groupCount}>{grp?.rooms?.length ?? 0} rooms</Text>
                      {/* unique: % full pill */}
                      <View style={s.occPill(occColor)}>
                        <View style={s.dot(occColor)} />
                        <Text style={s.occTxt(occColor)}>{Math.round(pct * 100)}% full</Text>
                      </View>
                    </View>
                  </View>

                  {/* rooms list (scrolls if overflow, card height fixed) */}
                  <ScrollView
                    style={s.roomList}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    {(grp?.rooms ?? []).map((room) => {
                      const { total, used, vacant, advance, notice, badge, a11y } = analyzeRoom(
                        room?.beds
                      );
                      return (
                        <Pressable
                          key={room?.roomNo}
                          onPress={async () => {
                            try {
                              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            } catch {}
                            AccessibilityInfo.announceForAccessibility?.(
                              `Room ${room?.roomNo ?? ""}. ${a11y}`
                            );
                          }}
                          android_ripple={{ color: hexToRgba(colors.textSecondary, 0.12) }}
                          style={s.roomTile}
                          accessible
                          accessibilityRole="button"
                          accessibilityLabel={`Room ${room?.roomNo ?? ""}`}
                          accessibilityHint={a11y}
                        >
                          {/* top row: room + badge */}
                          <View style={s.roomRowTop}>
                            <Text style={s.roomNo}>{room?.roomNo ?? "—"}</Text>
                            <View style={s.badge(STATUS_BG[badge])}>
                              <Text style={s.badgeTxt}>{badge}</Text>
                            </View>
                          </View>

                          {/* micro bed bar */}
                          <View style={s.bedBar}>
                            {(room?.beds ?? []).map((b) => (
                              <View
                                key={b?.id}
                                style={s.bedSeg(BED_COLOR[b?.status ?? "vacant"])}
                              />
                            ))}
                          </View>

                          {/* labeled counts line */}
                          <View style={s.countsLine}>
                            <View style={s.countItem}>
                              <View style={s.dot(BED_COLOR.vacant)} />
                              <Text style={s.countLabel}>Vacant</Text>
                              <Text style={s.countValue(BED_COLOR.vacant)}>{vacant}</Text>
                            </View>
                            <View style={s.countItem}>
                              <View style={s.dot(BED_COLOR.advance)} />
                              <Text style={s.countLabel}>Adv</Text>
                              <Text style={s.countValue(BED_COLOR.advance)}>{advance}</Text>
                            </View>
                            <View style={s.countItem}>
                              <View style={s.dot(BED_COLOR.notice)} />
                              <Text style={s.countLabel}>Notice</Text>
                              <Text style={s.countValue(BED_COLOR.notice)}>{notice}</Text>
                            </View>
                            <View style={s.countItem}>
                              <View style={s.dot(BED_COLOR.filled)} />
                              <Text style={s.countLabel}>Used</Text>
                              <Text style={s.countValue(BED_COLOR.filled)}>
                                {used}/{total}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}
          </ScrollView>

          {/* edge chevrons (hint only, non-interactive) */}
          {canScroll && (
            <>
              {canLeft && (
                <View
                  style={[s.edgeHint, s.leftHint]}
                  pointerEvents="none"
                  accessibilityElementsHidden
                >
                  <View style={s.hintIconWrap}>
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={18}
                      color={hexToRgba(colors.textPrimary, 0.55)}
                    />
                  </View>
                </View>
              )}
              {canRight && (
                <View
                  style={[s.edgeHint, s.rightHint]}
                  pointerEvents="none"
                  accessibilityElementsHidden
                >
                  <View style={s.hintIconWrap}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={hexToRgba(colors.textPrimary, 0.55)}
                    />
                  </View>
                </View>
              )}
            </>
          )}

          {/* bottom scroll progress bar */}
          {canScroll && (
            <View style={s.scrollTrack} pointerEvents="none">
              {/* thumb width = layout/content, left = scrollX/content */}
              <View
                style={[
                  s.scrollThumb,
                  {
                    width: contentW > 0 ? `${(layoutW / contentW) * 100}%` : "0%",
                    left: contentW > 0 ? `${(scrollX / contentW) * 100}%` : "0%",
                  },
                ]}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.body}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[1]} // [0]=Stats, [1]=Legend
      refreshControl={
        <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {/* 0: metrics */}
      <StatsGrid metrics={metrics ?? []} />

      {/* 1: sticky legend */}
      <View style={s.stickyWrap}>
        <Legend />
      </View>

      {(!floors || floors.length === 0) && <Text style={s.emptyText}>No layout data</Text>}

      {(floors ?? []).map((floor) => (
        <FloorBlock key={floor?.name} floor={floor} />
      ))}
    </ScrollView>
  );
}
