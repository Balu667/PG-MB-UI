// app/protected/property/[id].tsx
import React, { useMemo, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useProperty } from "@/src/context/PropertyContext";

import TopInfo from "@/src/components/property/TopInfo";
import SegmentBar from "@/src/components/property/SegmentBar";
import InfoCard from "@/src/components/property/InfoCard";
import PGLayout from "@/src/components/property/PGLayout";
import RoomsTab from "@/src/components/property/RoomsTab";
import TenantsTab from "@/src/components/property/TenantsTab";
import ExpensesTab from "@/src/components/property/ExpensesTab";
import AdvanceBookingTab from "@/src/components/property/AdvanceBookingTab";
import DuesTab from "@/src/components/property/DuesTab";
import CollectionsTab from "@/src/components/property/CollectionsTab";
// ⬇️ NEW
import StaffTab from "@/src/components/property/StaffTab";

import { useTheme } from "@/src/theme/ThemeContext";
import { useGetAllRooms } from "@/src/hooks/room";
import { useGetAllTenants } from "@/src/hooks/tenants";
import { useGetDailyExpensesList } from "@/src/hooks/dailyExpenses";
import { useGetPropertyDetails } from "@/src/hooks/bookingHook";
import { useGetAllEmployees } from "@/src/hooks/employee"; // ⬅️ your employees hook

import type { Metric } from "@/src/components/StatsGrid";
// ⬇️ NEW
import { useSelector } from "react-redux";

/* ---------------------------------- tabs ---------------------------------- */
const TABS = [
  "Property Details",
  "PG Layout",
  "Advance Booking",
  "Rooms",
  "Tenants",
  "Expenses",
  "Dues",
  "Collections",
  "Staff",
] as const;
type TabKey = (typeof TABS)[number];

/* ----------------------------- local helpers ------------------------------ */
type RoomsMeta = {
  totalBeds: number;
  vacantBeds: number;
  occupiedBeds: number;
  advanceBookingBeds: number;
  underNoticeBeds: number;
  roomsTotal: number;
};

type TenantsMeta = {
  totalTenants: number;
  underNoticeTenants: number;
  advancedBookings: number;
  expiredBookings: number;
  cancelledBookings: number;
  totalDues: number;
  appNotDownloaded: number;
};

const num = (v: any, fallback = 0) => (typeof v === "number" ? v : Number(v ?? fallback)) || 0;
const str = (v: any, fallback = "") => (v == null ? fallback : String(v));

/* ---------- Rooms parsing ---------- */
const computeRoomsMetaFromList = (rooms: any[]): RoomsMeta => {
  let totalBeds = 0,
    vacantBeds = 0,
    occupiedBeds = 0,
    underNoticeBeds = 0,
    advanceBookingBeds = 0;

  rooms?.forEach?.((r) => {
    const rTotal =
      num(r?.totalBeds) ||
      num(r?.bedsTotal) ||
      num(r?.bedCount) ||
      num(r?.capacity) ||
      num(r?.beds) ||
      0;

    const occ = num(r?.occupiedBeds);
    const und = num(r?.underNotice);
    const adv = num(r?.advancedBookings) || num(r?.advanceBookingBeds);

    const hasVacantField = r?.vacantBeds !== undefined && r?.vacantBeds !== null;
    const rVacant = hasVacantField ? num(r?.vacantBeds) : Math.max(rTotal - (occ + und + adv), 0);
    const rOccupied = occ || Math.max(rTotal - rVacant, 0);

    totalBeds += rTotal;
    vacantBeds += rVacant;
    occupiedBeds += rOccupied;
    underNoticeBeds += und;
    advanceBookingBeds += adv;
  });

  return {
    totalBeds,
    vacantBeds,
    occupiedBeds,
    underNoticeBeds,
    advanceBookingBeds,
    roomsTotal: rooms?.length || 0,
  };
};

const parseRoomsResponse = (raw: any): { rooms: any[]; meta: RoomsMeta } => {
  if (!raw) return { rooms: [], meta: computeRoomsMetaFromList([]) };

  if (Array.isArray(raw)) {
    const first = raw[0];
    if (first && (Array.isArray(first?.rooms) || first?.metadata)) {
      const rooms = Array.isArray(first?.rooms) ? first?.rooms : [];
      const computed = computeRoomsMetaFromList(rooms);
      const meta: RoomsMeta = {
        totalBeds:
          num(first?.metadata?.totalBeds || first?.metadata?.bedsTotal) || computed.totalBeds,
        vacantBeds: num(first?.metadata?.vacantBeds) || computed.vacantBeds,
        occupiedBeds: num(first?.metadata?.occupiedBeds) || computed.occupiedBeds,
        underNoticeBeds:
          num(first?.metadata?.underNoticeBeds || first?.metadata?.underNotice) ||
          computed.underNoticeBeds,
        advanceBookingBeds:
          num(first?.metadata?.advanceBookingBeds || first?.metadata?.advancedBookings) ||
          computed.advanceBookingBeds,
        roomsTotal: num(first?.metadata?.roomsTotal) || rooms.length,
      };
      return { rooms, meta };
    }
    const rooms = raw;
    return { rooms, meta: computeRoomsMetaFromList(rooms) };
  }

  if (raw && typeof raw === "object") {
    const rooms = Array.isArray(raw?.rooms)
      ? raw?.rooms
      : Array.isArray(raw?.data)
      ? raw?.data
      : [];
    const computed = computeRoomsMetaFromList(rooms);
    const meta: RoomsMeta = {
      totalBeds: num(raw?.metadata?.totalBeds || raw?.metadata?.bedsTotal) || computed.totalBeds,
      vacantBeds: num(raw?.metadata?.vacantBeds) || computed.vacantBeds,
      occupiedBeds: num(raw?.metadata?.occupiedBeds) || computed.occupiedBeds,
      underNoticeBeds:
        num(raw?.metadata?.underNoticeBeds || raw?.metadata?.underNotice) ||
        computed.underNoticeBeds,
      advanceBookingBeds:
        num(raw?.metadata?.advanceBookingBeds || raw?.metadata?.advancedBookings) ||
        computed.advanceBookingBeds,
      roomsTotal: num(raw?.metadata?.roomsTotal) || rooms.length,
    };
    return { rooms, meta };
  }

  return { rooms: [], meta: computeRoomsMetaFromList([]) };
};

/** Robust tenants parser (shared) */
const parseTenantsResponse = (raw: any): { tenants: any[]; meta: TenantsMeta } => {
  const emptyMeta: TenantsMeta = {
    totalTenants: 0,
    underNoticeTenants: 0,
    advancedBookings: 0,
    expiredBookings: 0,
    cancelledBookings: 0,
    totalDues: 0,
    appNotDownloaded: 0,
  };

  if (!raw) return { tenants: [], meta: emptyMeta };

  if (raw && typeof raw === "object" && Array.isArray(raw?.data)) {
    const bucket = raw?.data?.[0];
    if (bucket && Array.isArray(bucket?.tenants)) {
      const meta = {
        totalTenants: num(bucket?.metadata?.totalTenants),
        underNoticeTenants: num(bucket?.metadata?.underNoticeTenants),
        advancedBookings: num(bucket?.metadata?.advancedBookings),
        expiredBookings: num(bucket?.metadata?.expiredBookings),
        cancelledBookings: num(bucket?.metadata?.cancelledBookings),
        totalDues: num(bucket?.metadata?.totalDues),
        appNotDownloaded: num(bucket?.metadata?.appNotDownloaded),
      };
      const seen = new Set<string>();
      const tenants = bucket.tenants.filter((t: any) => {
        const id = String(t?._id ?? t?.id ?? "");
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      return { tenants, meta: { ...emptyMeta, ...meta } };
    }
  }

  if (Array.isArray(raw)) {
    const first = raw?.[0];
    if (first && (Array.isArray(first?.tenants) || first?.metadata)) {
      const tenants = Array.isArray(first?.tenants) ? first?.tenants : [];
      const meta: TenantsMeta = {
        totalTenants: num(first?.metadata?.totalTenants),
        underNoticeTenants: num(first?.metadata?.underNoticeTenants),
        advancedBookings: num(first?.metadata?.advancedBookings),
        expiredBookings: num(first?.metadata?.expiredBookings),
        cancelledBookings: num(first?.metadata?.cancelledBookings),
        totalDues: num(first?.metadata?.totalDues),
        appNotDownloaded: num(first?.metadata?.appNotDownloaded),
      };
      return { tenants, meta: { ...emptyMeta, ...meta } };
    }
    return { tenants: raw, meta: emptyMeta };
  }

  if (raw && typeof raw === "object") {
    const tenants = Array.isArray(raw?.tenants)
      ? raw?.tenants
      : Array.isArray(raw?.data)
      ? raw?.data
      : [];
    const meta: TenantsMeta = {
      totalTenants: num(raw?.metadata?.totalTenants),
      underNoticeTenants: num(raw?.metadata?.underNoticeTenants),
      advancedBookings: num(raw?.metadata?.advancedBookings),
      expiredBookings: num(raw?.metadata?.expiredBookings),
      cancelledBookings: num(raw?.metadata?.cancelledBookings),
      totalDues: num(raw?.metadata?.totalDues),
      appNotDownloaded: num(raw?.metadata?.appNotDownloaded),
    };
    return { tenants, meta: { ...emptyMeta, ...meta } };
  }

  return { tenants: [], meta: emptyMeta };
};

/* ------------------------ PGLayout normalization ------------------------- */
type BedStatus = "vacant" | "filled" | "notice" | "advance";
type UILayout = {
  floors: Array<{
    name: string;
    groups: Array<{
      sharing: number;
      rooms: Array<{
        roomNo: string;
        beds: Array<{ id: string; status: BedStatus }>;
      }>;
    }>;
  }>;
  metrics: Metric[];
};

const BED_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const bedIndexFromLetter = (letter?: string) => {
  const idx = BED_LETTERS.indexOf(String(letter ?? "").toUpperCase());
  return idx >= 0 ? idx : -1;
};
const toOrdinal = (n?: number) => {
  const x = Number(n ?? 0);
  if (!x) return "Floor";
  const mod10 = x % 10,
    mod100 = x % 100;
  const suffix =
    mod10 === 1 && mod100 !== 11
      ? "st"
      : mod10 === 2 && mod100 !== 12
      ? "nd"
      : mod10 === 3 && mod100 !== 13
      ? "rd"
      : "th";
  return `${x}${suffix} Floor`;
};

const statusFromTenantCodes = (codes: number[]): BedStatus => {
  if (codes.some((c) => c === 2)) return "notice";
  if (codes.some((c) => c === 3)) return "advance";
  if (codes.some((c) => c === 1)) return "filled";
  return "vacant";
};

const parsePropertyLayout = (raw: any): UILayout => {
  try {
    const root = Array.isArray(raw?.data) ? raw?.data?.[0] : raw?.data;
    const roomsByFloor: any[] = Array.isArray(root?.roomsByFloor) ? root.roomsByFloor : [];
    const md = root?.metaData ?? {};

    const metrics: Metric[] = [
      {
        key: "rooms",
        label: "Total Rooms",
        value: num(md?.totalRooms),
        icon: "office-building",
        iconBg: "#DBEAFE",
      },
      {
        key: "beds",
        label: "Total Beds",
        value: num(md?.totalBeds),
        icon: "bed",
        iconBg: "#DBEAFE",
      },
      {
        key: "vacant",
        label: "Vacant Beds",
        value: num(md?.vacantBeds),
        icon: "bed",
        iconBg: "#BBF7D0",
        iconColor: "#059669",
      },
      {
        key: "occ",
        label: "Occupied",
        value: num(md?.occupiedBeds),
        icon: "bed",
        iconBg: "#FECACA",
        iconColor: "#B91C1C",
      },
    ];

    const floors = roomsByFloor.map((floor) => {
      const floorName = toOrdinal(num(floor?._id));
      const rooms: any[] = Array.isArray(floor?.rooms) ? floor.rooms : [];
      const bySharing = new Map<number, { sharing: number; rooms: any[] }>();

      rooms.forEach((r) => {
        const sharing = num(r?.beds);
        if (!sharing) return;

        const statuses: BedStatus[] = Array.from({ length: sharing }, () => "vacant");
        const bpr: any[] = Array.isArray(r?.bedsPerRoom) ? r.bedsPerRoom : [];
        bpr.forEach((b) => {
          const idx = bedIndexFromLetter(b?.bedNumber);
          if (idx < 0 || idx >= sharing) return;
          const codes = (Array.isArray(b?.tenantsPerBed) ? b.tenantsPerBed : [])
            .map((t) => num(t?.tenantStatus))
            .filter((c) => c > 0);
          const st = statusFromTenantCodes(codes);
          statuses[idx] = st;
        });

        const uiRoom = {
          roomNo: String(r?.roomNo ?? ""),
          beds: statuses.map((s, i) => ({ id: BED_LETTERS[i] ?? String(i + 1), status: s })),
        };

        const g = bySharing.get(sharing) ?? { sharing, rooms: [] };
        g.rooms.push(uiRoom);
        bySharing.set(sharing, g);
      });

      const groups = Array.from(bySharing.values())
        .sort((a, b) => a.sharing - b.sharing)
        .map((g) => ({
          sharing: g.sharing,
          rooms: g.rooms.sort((a, b) =>
            String(a?.roomNo).localeCompare(String(b?.roomNo), undefined, { numeric: true })
          ),
        }));

      return { name: floorName, groups };
    });

    return { floors, metrics };
  } catch {
    return { floors: [], metrics: [] };
  }
};

/* -------------------------------- component ------------------------------- */
export default function PropertyDetails() {
  const { id, tab = TABS[0] } = useLocalSearchParams<{ id: string; tab?: TabKey }>();
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { selectedId, properties, loading: propsLoading } = useProperty();
  // ⬇️ NEW: read owner info to fetch employees
  const { profileData } = useSelector((state: any) => state.profileDetails);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        bodyContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg * 2 },
        placeholder: {
          textAlign: "center",
          marginTop: 60,
          color: colors.textMuted,
          fontSize: typography.fontSizeMd,
        },
        topLoading: { padding: spacing.md, flexDirection: "row", alignItems: "center", gap: 10 },
      }),
    [colors, spacing, typography]
  );

  const [activeTab, setActiveTab] = useState<TabKey>(tab as TabKey);

  useEffect(() => {
    if (!selectedId) return;
    if (selectedId !== id) {
      router.replace({
        pathname: `/protected/property/${selectedId}`,
        params: { tab: activeTab },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ------------------------ data hooks ------------------------ */
  const roomsQuery = useGetAllRooms(id as string);
  const { rooms, meta: roomsMeta } = useMemo(
    () => parseRoomsResponse(roomsQuery?.data),
    [roomsQuery?.data]
  );

  const tenantsActiveQuery = useGetAllTenants(id as string, "?status=1,2");
  const tenantsAdvanceQuery = useGetAllTenants(id as string, "?status=3,5,6");

  const { tenants: tenantsActive, meta: tenantsMeta } = useMemo(
    () => parseTenantsResponse(tenantsActiveQuery?.data),
    [tenantsActiveQuery?.data]
  );

  const { tenants: tenantsAdvance } = useMemo(
    () => parseTenantsResponse(tenantsAdvanceQuery?.data),
    [tenantsAdvanceQuery?.data]
  );

  const expensesQuery = useGetDailyExpensesList(id as string);
  const expenses = useMemo(
    () => (Array.isArray(expensesQuery?.data) ? expensesQuery?.data : []),
    [expensesQuery?.data]
  );

  const layoutQuery = useGetPropertyDetails(id as string);
  const layout = useMemo(() => parsePropertyLayout(layoutQuery?.data), [layoutQuery?.data]);

  // ⬇️ NEW: employees list (owner-scoped), then filter to this property
  const ownerId =
    String(profileData?.ownerId || profileData?.userId || profileData?._id || "") || "";
  const employeesQuery = useGetAllEmployees(ownerId);

  const staffForProperty = useMemo(() => {
    const rows = Array.isArray(employeesQuery?.data)
      ? employeesQuery?.data
      : Array.isArray(employeesQuery?.data?.data)
      ? employeesQuery?.data?.data
      : [];
    if (!id) return rows;
    // show employees assigned to this property id (fallback to all if field missing)
    return rows.filter((e: any) => {
      const props = Array.isArray(e?.assignedProperties) ? e.assignedProperties : [];
      return !props.length || props.some((p) => String(p) === String(id));
    });
  }, [employeesQuery?.data, id]);

  // Dues should consider both active & advance lists (dedupe by _id/id)
  const dueTenants = useMemo(() => {
    const all = [...(tenantsActive ?? []), ...(tenantsAdvance ?? [])];
    const seen = new Set<string>();
    return all.filter((t: any) => {
      const key = String(t?._id ?? t?.id ?? "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return num(t?.due) > 0;
    });
  }, [tenantsActive, tenantsAdvance]);

  /* --------------------------- header info ----------------------------- */
  const currentProperty = useMemo(() => properties?.find?.((p) => p?._id === id), [properties, id]);
  const propName = str(currentProperty?.propertyName, "—");
  const propArea = str(currentProperty?.area, "—");
  const propCity = str(currentProperty?.city, "—");

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      {propsLoading && !currentProperty ? (
        <View style={styles.topLoading}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Loading property…</Text>
        </View>
      ) : (
        <TopInfo name={propName} area={propArea} city={propCity} />
      )}

      <SegmentBar tabs={TABS} value={activeTab} onChange={(t) => setActiveTab(t as TabKey)} />

      {activeTab === "PG Layout" ? (
        <PGLayout
          floors={layout.floors}
          metrics={layout.metrics}
          refreshing={!!layoutQuery?.isFetching}
          onRefresh={layoutQuery?.refetch}
        />
      ) : activeTab === "Advance Booking" ? (
        <AdvanceBookingTab
          data={tenantsAdvance ?? []}
          refreshing={!!tenantsAdvanceQuery?.isFetching}
          onRefresh={tenantsAdvanceQuery?.refetch}
        />
      ) : activeTab === "Rooms" ? (
        <RoomsTab
          data={rooms}
          meta={roomsMeta}
          refreshing={!!roomsQuery?.isFetching}
          onRefresh={roomsQuery?.refetch}
        />
      ) : activeTab === "Tenants" ? (
        <TenantsTab
          data={tenantsActive ?? []}
          meta={tenantsMeta}
          refreshing={!!tenantsActiveQuery?.isFetching}
          onRefresh={tenantsActiveQuery?.refetch}
        />
      ) : activeTab === "Expenses" ? (
        <ExpensesTab
          data={expenses}
          refreshing={!!expensesQuery?.isFetching}
          onRefresh={expensesQuery?.refetch}
          propertyId={id as string}
        />
      ) : activeTab === "Dues" ? (
        <DuesTab
          data={dueTenants}
          refreshing={!!tenantsActiveQuery?.isFetching || !!tenantsAdvanceQuery?.isFetching}
          onRefresh={() => {
            tenantsActiveQuery?.refetch?.();
            tenantsAdvanceQuery?.refetch?.();
          }}
        />
      ) : activeTab === "Collections" ? (
        <CollectionsTab data={[]} refreshing={false} onRefresh={() => {}} />
      ) : activeTab === "Staff" ? (
        <StaffTab
          data={staffForProperty}
          refreshing={!!employeesQuery?.isFetching}
          onRefresh={employeesQuery?.refetch}
          propertyId={id as string}
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "Property Details" && (
            <InfoCard
              title="Total Beds"
              value={roomsMeta.totalBeds}
              sub={{
                Vacant: roomsMeta.vacantBeds,
                Filled: roomsMeta.occupiedBeds,
                Booking: roomsMeta.advanceBookingBeds,
                Notice: roomsMeta.underNoticeBeds,
              }}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
