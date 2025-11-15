// src/components/property/StaffTab.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  useWindowDimensions,
  Platform,
  UIManager,
  LayoutAnimation,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Switch } from "react-native-paper";
import * as Haptics from "expo-haptics";

import SearchBar from "@/src/components/SearchBar";
import StatsGrid, { type Metric } from "@/src/components/StatsGrid";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useUpdateEmployee } from "@/src/hooks/employee";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Raw row exactly as API returns. */
type RawEmployee = {
  _id?: string;
  id?: string;
  status?: number; // 1=Active, 2=Inactive
  empName?: string;
  empContactNumber?: string;
  role?: number; // 2=Admin, 3=Partner, others: Staff
  assignedProperties?: string[];
  createdBy?: string;
  ownerId?: string;
  permissions?: any[];
  __v?: number;
  [k: string]: any;
};

export type StaffCardItem = {
  id: string;
  name: string;
  phone: string;
  role: number;
  roleLabel: string;
  status: number;
  raw: RawEmployee;
};

type Props = {
  /** Already filtered to this property in parent (keep as-is). */
  data: RawEmployee[];
  refreshing: boolean;
  onRefresh: () => void; // programmatic refetch
};

const roleLabel = (r?: number) => {
  if (r === 2) return "Admin";
  if (r === 3) return "Partner";
  return "Staff";
};

const toInitials = (name?: string) => {
  if (!name) return "S";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/** ✅ Include status 1 & 2 — do not filter them out */
const normalize = (rows: RawEmployee[]): StaffCardItem[] =>
  (rows || [])
    .map((e) => {
      const id = String(e?._id ?? e?.id ?? "");
      if (!id) return null;
      const r = Number(e?.role ?? 0);
      const st = Number(e?.status ?? 0);
      return {
        id,
        name: String(e?.empName ?? "—"),
        phone: String(e?.empContactNumber ?? "—"),
        role: r,
        roleLabel: roleLabel(r),
        status: st,
        raw: e,
      } as StaffCardItem;
    })
    .filter(Boolean) as StaffCardItem[];

const StaffCard = ({
  item,
  onToggle,
  disabled,
}: {
  item: StaffCardItem;
  onToggle: (emp: StaffCardItem, next: 1 | 2) => void;
  disabled: boolean;
}) => {
  const { colors, spacing, radius, shadow } = useTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          borderRadius: radius.xl,
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.borderColor,
          shadowColor: shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 6,
          overflow: "hidden",
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          gap: spacing.md,
        },
        avatar: {
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
        },
        avatarTxt: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
        main: { flex: 1, minWidth: 160 },
        name: { color: colors.textPrimary, fontWeight: "700", fontSize: 16, marginBottom: 2 },
        phone: { color: colors.textSecondary, fontSize: 13 },
        rolePill: {
          marginTop: 6,
          alignSelf: "flex-start",
          backgroundColor: hexToRgba(colors.accent, 0.12),
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 4,
          borderRadius: radius.full,
        },
        roleTxt: { color: colors.accent, fontSize: 12, fontWeight: "700" },
        right: { alignItems: "flex-end", justifyContent: "center" },
        statusTxt: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
        actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: 6 },
        actionBtn: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 8,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.12),
        },
        actionTxt: { fontSize: 12, fontWeight: "600", color: colors.link },
      }),
    [colors, spacing, radius, shadow]
  );

  const initials = toInitials(item.name);
  const isOn = item.status === 1;

  const onCall = useCallback(() => {
    if (!item.phone || item.phone === "—") return;
    Linking.openURL(`tel:${item.phone}`).catch(() => {});
  }, [item.phone]);

  return (
    <View style={s.outer}>
      <View style={s.row}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{initials}</Text>
        </View>

        <View style={s.main}>
          <Text style={s.name} numberOfLines={1} accessibilityLabel={`Employee ${item.name}`}>
            {item.name}
          </Text>
          <Text style={s.phone} numberOfLines={1}>
            {item.phone}
          </Text>
          <View style={s.rolePill}>
            <Text style={s.roleTxt}>{item.roleLabel}</Text>
          </View>

          <View style={s.actionsRow}>
            <Pressable style={s.actionBtn} onPress={onCall} accessibilityLabel="Call employee">
              <Text style={s.actionTxt}>Call</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.right}>
          <Switch
            value={isOn}
            onValueChange={() => {
              Haptics.selectionAsync();
              const next: 1 | 2 = isOn ? 2 : 1;
              onToggle(item, next);
            }}
            color={colors.accent}
            disabled={disabled}
          />
          <Text style={s.statusTxt}>{isOn ? "Active" : "Inactive"}</Text>
        </View>
      </View>
    </View>
  );
};

export default function StaffTab({ data, refreshing, onRefresh }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();

  const columns = width >= 1000 ? 3 : width >= 740 ? 2 : 1;

  /** Include all rows; DO NOT drop status === 2 */
  const base: StaffCardItem[] = useMemo(() => normalize(Array.isArray(data) ? data : []), [data]);

  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  /** ---------- STATS (Metrics) ---------- */
  const metrics: Metric[] = useMemo(() => {
    const total = base.length;
    let active = 0,
      inactive = 0,
      admins = 0,
      partners = 0;

    for (const r of base) {
      if (r.status === 1) active++;
      if (r.status === 2) inactive++;
      if (r.role === 2) admins++;
      if (r.role === 3) partners++;
    }

    return [
      {
        key: "total",
        label: "Total Staff",
        value: total,
        icon: "account-group",
        iconBg: "#DBEAFE",
      },
      {
        key: "active",
        label: "Active",
        value: active,
        icon: "toggle-switch",
        iconBg: "#BBF7D0",
        iconColor: "#059669",
      },
      {
        key: "inactive",
        label: "Inactive",
        value: inactive,
        icon: "toggle-switch-off",
        iconBg: "#FECACA",
        iconColor: "#B91C1C",
      },
      {
        key: "admins",
        label: "Admins",
        value: admins,
        icon: "account-tie",
        iconBg: "#DDD6FE",
        iconColor: "#7C3AED",
      },
      {
        key: "partners",
        label: "Partners",
        value: partners,
        icon: "handshake",
        iconBg: "#E0F2FE",
        iconColor: "#0284C7",
      },
    ];
  }, [base]);

  /** Mutation: update employee status and refresh list on success */
  const updateEmployee = useUpdateEmployee(() => {
    setPendingId(null);
    onRefresh(); // programmatic refetch like pull-to-refresh
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return base;
    const q = query.trim().toLowerCase();
    return base.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.roleLabel.toLowerCase().includes(q)
    );
  }, [base, query]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        columnGap: { gap: spacing.md - 2 },
        listContent: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.lg * 2,
          rowGap: spacing.md - 2,
        },
        emptyText: {
          textAlign: "center",
          color: colors.textMuted,
          fontSize: 16,
          marginTop: 60,
        },
        searchWrap: {
          backgroundColor: hexToRgba(colors.accent, 0.08),
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.md,
          borderRadius: radius.lg,
          marginBottom: spacing.md - 2,
        },
        searchTitle: { fontSize: 14, fontWeight: "600", color: colors.accent, marginBottom: 6 },
      }),
    [colors, spacing, radius, insets.bottom]
  );

  const handleToggle = useCallback(
    (emp: StaffCardItem, nextStatus: 1 | 2) => {
      if (!emp?.raw) return;

      setPendingId(emp.id);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      // Payload per your requirement:
      const payload = {
        ...emp.raw,
        _id: emp.id,
        status: nextStatus,
        staffRole: emp.roleLabel,
        staffStatus: nextStatus === 1 ? "Active" : "Inactive",
      };

      updateEmployee.mutate(
        { data: payload, employeeId: emp.id },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          onError: () => {
            setPendingId(null);
            Alert.alert("Update failed", "Could not update staff status. Please try again.");
          },
        }
      );
    },
    [updateEmployee]
  );

  const renderItem = ({ item }: ListRenderItemInfo<StaffCardItem>) => (
    <StaffCard item={item} onToggle={handleToggle} disabled={pendingId === item.id} />
  );

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? s.columnGap : undefined}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* 🔹 New: Staff metrics */}
            <StatsGrid metrics={metrics} />

            {/* Existing search (no filters for staff) */}
            <View style={s.searchWrap}>
              <Text style={s.searchTitle}>Search Staff</Text>
              <SearchBar placeholder="Search by name, phone, role" onSearch={setQuery} />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={s.emptyText}>No staff found</Text>}
        refreshControl={
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        removeClippedSubviews
        initialNumToRender={10}
        windowSize={10}
      />
    </>
  );
}
