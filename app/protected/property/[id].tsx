// app/protected/property/[id].tsx
// Production-ready property details screen with optimized tab system
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";

import { useProperty } from "@/src/context/PropertyContext";
import { useTheme } from "@/src/theme/ThemeContext";

// Components
import ScrollToTopButton from "@/src/components/ScrollToTopButton";
import TopInfo from "@/src/components/property/TopInfo";
import AnimatedTabBar, { TabConfig } from "@/src/components/property/AnimatedTabBar";
import InfoCard from "@/src/components/property/InfoCard";
import PGLayout from "@/src/components/property/PGLayout";
import RoomsTab from "@/src/components/property/RoomsTab";
import TenantsTab from "@/src/components/property/TenantsTab";
import ExpensesTab from "@/src/components/property/ExpensesTab";
import AdvanceBookingTab from "@/src/components/property/AdvanceBookingTab";
import IntrimTab from "@/src/components/property/IntrimTab";
import DuesTab from "@/src/components/property/DuesTab";
import CollectionsTab from "@/src/components/property/CollectionsTab";
import StaffTab from "@/src/components/property/StaffTab";

// Hooks
import { useGetAllRooms } from "@/src/hooks/room";
import { useGetAllTenants } from "@/src/hooks/tenants";
import { useGetDailyExpensesList } from "@/src/hooks/dailyExpenses";
import { useGetPropertyDetails } from "@/src/hooks/bookingHook";
import { useGetAllEmployees } from "@/src/hooks/employee";
import { useGetAllPropertyPayments } from "@/src/hooks/payments";
import type { Metric } from "@/src/components/StatsGrid";

/* ═══════════════════════════════════════════════════════════════════════════
   TAB CONFIGURATION - Future-proof array-based architecture
   To add a new tab: just add an object to this array
   NOTE: Keys MUST match the tab names used in navigation params across the app
═══════════════════════════════════════════════════════════════════════════ */

const TAB_CONFIG: readonly TabConfig[] = [
  { key: "Property Details", title: "Property Details" },
  { key: "PG Layout", title: "PG Layout" },
  { key: "Advance Booking", title: "Advance Booking" },
  { key: "Interim Bookings", title: "Interim Bookings" },
  { key: "Rooms", title: "Rooms" },
  { key: "Tenants", title: "Tenants" },
  { key: "Expenses", title: "Expenses" },
  { key: "Dues", title: "Dues" },
  { key: "Collections", title: "Collections" },
  { key: "Staff", title: "Staff" },
] as const;

type TabKey = (typeof TAB_CONFIG)[number]["key"];

/* ═══════════════════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
═══════════════════════════════════════════════════════════════════════════ */

interface RoomsMeta {
  totalBeds: number;
  vacantBeds: number;
  occupiedBeds: number;
  advanceBookingBeds: number;
  underNoticeBeds: number;
  roomsTotal: number;
}

interface TenantsMeta {
  totalTenants: number;
  underNoticeTenants: number;
  advancedBookings: number;
  expiredBookings: number;
  cancelledBookings: number;
  totalDues: number;
  appNotDownloaded: number;
}

type BedStatus = "vacant" | "filled" | "notice" | "advance" | "shortTerm";

/** Raw room data from API for modal display */
interface RawRoomData {
  _id: string;
  roomNo: string;
  beds: number;
  bedPrice: number;
  securityDeposit: number;
  facilities: string[];
  occupiedBeds: number;
  vacantBeds: number;
  advancedBookings: number;
  underNoticeBeds: number;
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

interface UILayout {
  floors: Array<{
    name: string;
    floorId: number;
    groups: Array<{
      sharing: number;
      rooms: Array<{
        roomNo: string;
        beds: Array<{ id: string; status: BedStatus }>;
      }>;
    }>;
  }>;
  metrics: Metric[];
  rawRoomsMap: Map<string, RawRoomData>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
═══════════════════════════════════════════════════════════════════════════ */

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;

const str = (v: unknown, fallback = ""): string =>
  v == null ? fallback : String(v);

const inr = (n: unknown): string => {
  const x = typeof n === "number" ? n : Number(n ?? 0) || 0;
  return `₹ ${x.toLocaleString("en-IN")}`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   DATA PARSERS - Robust response normalization
═══════════════════════════════════════════════════════════════════════════ */

const EMPTY_ROOMS_META: RoomsMeta = {
  totalBeds: 0,
  vacantBeds: 0,
  occupiedBeds: 0,
  advanceBookingBeds: 0,
  underNoticeBeds: 0,
  roomsTotal: 0,
};

const EMPTY_TENANTS_META: TenantsMeta = {
  totalTenants: 0,
  underNoticeTenants: 0,
  advancedBookings: 0,
  expiredBookings: 0,
  cancelledBookings: 0,
  totalDues: 0,
  appNotDownloaded: 0,
};

const computeRoomsMetaFromList = (rooms: unknown[]): RoomsMeta => {
  let totalBeds = 0,
    vacantBeds = 0,
    occupiedBeds = 0,
    underNoticeBeds = 0,
    advanceBookingBeds = 0;

  rooms?.forEach?.((r: unknown) => {
    const room = r as Record<string, unknown>;
    const rTotal =
      num(room?.totalBeds) ||
      num(room?.bedsTotal) ||
      num(room?.bedCount) ||
      num(room?.capacity) ||
      num(room?.beds) ||
      0;

    const occ = num(room?.occupiedBeds);
    const und = num(room?.underNotice);
    const adv = num(room?.advancedBookings) || num(room?.advanceBookingBeds);

    const hasVacantField = room?.vacantBeds !== undefined && room?.vacantBeds !== null;
    const rVacant = hasVacantField
      ? num(room?.vacantBeds)
      : Math.max(rTotal - (occ + und + adv), 0);
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

const parseRoomsResponse = (raw: unknown): { rooms: unknown[]; meta: RoomsMeta } => {
  if (!raw) return { rooms: [], meta: EMPTY_ROOMS_META };

  if (Array.isArray(raw)) {
    const first = raw[0] as Record<string, unknown> | undefined;
    if (first && (Array.isArray(first?.rooms) || first?.metadata)) {
      const rooms = Array.isArray(first?.rooms) ? first?.rooms : [];
      const computed = computeRoomsMetaFromList(rooms);
      const md = first?.metadata as Record<string, unknown> | undefined;
      const meta: RoomsMeta = {
        totalBeds: num(md?.totalBeds || md?.bedsTotal) || computed.totalBeds,
        vacantBeds: num(md?.vacantBeds) || computed.vacantBeds,
        occupiedBeds: num(md?.occupiedBeds) || computed.occupiedBeds,
        underNoticeBeds: num(md?.underNoticeBeds || md?.underNotice) || computed.underNoticeBeds,
        advanceBookingBeds:
          num(md?.advanceBookingBeds || md?.advancedBookings) || computed.advanceBookingBeds,
        roomsTotal: num(md?.roomsTotal) || rooms.length,
      };
      return { rooms, meta };
    }
    return { rooms: raw, meta: computeRoomsMetaFromList(raw) };
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const rooms = Array.isArray(obj?.rooms)
      ? obj?.rooms
      : Array.isArray(obj?.data)
      ? obj?.data
      : [];
    const computed = computeRoomsMetaFromList(rooms);
    const md = obj?.metadata as Record<string, unknown> | undefined;
    const meta: RoomsMeta = {
      totalBeds: num(md?.totalBeds || md?.bedsTotal) || computed.totalBeds,
      vacantBeds: num(md?.vacantBeds) || computed.vacantBeds,
      occupiedBeds: num(md?.occupiedBeds) || computed.occupiedBeds,
      underNoticeBeds: num(md?.underNoticeBeds || md?.underNotice) || computed.underNoticeBeds,
      advanceBookingBeds:
        num(md?.advanceBookingBeds || md?.advancedBookings) || computed.advanceBookingBeds,
      roomsTotal: num(md?.roomsTotal) || rooms.length,
    };
    return { rooms, meta };
  }

  return { rooms: [], meta: EMPTY_ROOMS_META };
};

const parseCollectionsResponse = (raw: unknown): { payments: unknown[]; metrics: Metric[] } => {
  try {
    const obj = raw as Record<string, unknown> | undefined;
    const collections = (obj?.data as Record<string, unknown>)?.collections ??
      (obj as Record<string, unknown>)?.collections ??
      {};
    const col = collections as Record<string, unknown>;
    const payments: unknown[] = Array.isArray(col?.payments) ? col.payments : [];

    const totalCollection = Number(col?.totalCollection ?? 0) || 0;
    const rentCollection = Number(col?.rentCollection ?? 0) || 0;
    const currentMonthCollection = Number(col?.currentMonthCollection ?? 0) || 0;
    const otherCollection = Number(col?.otherCollection ?? 0) || 0;

    const metrics: Metric[] = [
      {
        key: "total",
        label: "Total Collection",
        value: inr(totalCollection),
        icon: "cash",
        iconBg: "#DCFCE7",
        iconColor: "#16A34A",
      },
      {
        key: "rent",
        label: "Rent Collection",
        value: inr(rentCollection),
        icon: "home-city",
        iconBg: "#DBEAFE",
      },
      {
        key: "current",
        label: "Current Month",
        value: inr(currentMonthCollection),
        icon: "calendar-month",
        iconBg: "#EDE9FE",
        iconColor: "#6D28D9",
      },
      {
        key: "other",
        label: "Other Collection",
        value: inr(otherCollection),
        icon: "cash-multiple",
        iconBg: "#FEF3C7",
        iconColor: "#B45309",
      },
    ];

    return { payments, metrics };
  } catch {
    return { payments: [], metrics: [] };
  }
};

const parseDuesResponse = (raw: unknown): { payments: unknown[]; metrics: Metric[] } => {
  try {
    const obj = raw as Record<string, unknown> | undefined;
    const dues = (obj?.dues as Record<string, unknown>) ?? {};
    const payments: unknown[] = Array.isArray(dues?.payments) ? dues.payments : [];
    const totalDues = Number(dues?.totalDues ?? 0) || 0;
    const rentDues = Number(dues?.rentDues ?? 0) || 0;
    const currentMonthDues = Number(dues?.currentMonthDues ?? 0) || 0;
    const lateDues = Number(dues?.lateDues ?? 0) || 0;
    const futureDues = Number(dues?.futureDues ?? 0) || 0;

    const metrics: Metric[] = [
      {
        key: "totalDues",
        label: "Total Dues",
        value: inr(totalDues),
        icon: "cash-remove",
        iconBg: "#FEE2E2",
        iconColor: "#B91C1C",
      },
      {
        key: "rentDues",
        label: "Rent Dues",
        value: inr(rentDues),
        icon: "home-city",
        iconBg: "#DBEAFE",
      },
      {
        key: "currentMonthDues",
        label: "Current Month",
        value: inr(currentMonthDues),
        icon: "calendar-month",
        iconBg: "#EDE9FE",
        iconColor: "#6D28D9",
      },
      {
        key: "lateDues",
        label: "Late Dues",
        value: inr(lateDues),
        icon: "cash-clock",
        iconBg: "#FEF3C7",
        iconColor: "#B45309",
      },
      {
        key: "futureDues",
        label: "Future Dues",
        value: inr(futureDues),
        icon: "calendar-arrow-right",
        iconBg: "#DCFCE7",
        iconColor: "#15803D",
      },
    ];

    return { payments, metrics };
  } catch {
    return { payments: [], metrics: [] };
  }
};

const parseTenantsResponse = (raw: unknown): { tenants: unknown[]; meta: TenantsMeta } => {
  if (!raw) return { tenants: [], meta: EMPTY_TENANTS_META };

  const extractMeta = (md: Record<string, unknown> | undefined): TenantsMeta => ({
    totalTenants: num(md?.totalTenants),
    underNoticeTenants: num(md?.underNoticeTenants),
    advancedBookings: num(md?.advancedBookings),
    expiredBookings: num(md?.expiredBookings),
    cancelledBookings: num(md?.cancelledBookings),
    totalDues: num(md?.totalDues),
    appNotDownloaded: num(md?.appNotDownloaded),
  });

  const deduplicateTenants = (tenants: unknown[]): unknown[] => {
    const seen = new Set<string>();
    return tenants.filter((t: unknown) => {
      const tenant = t as Record<string, unknown>;
      const id = String(tenant?._id ?? tenant?.id ?? "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>)?.data)) {
    const bucket = ((raw as Record<string, unknown>)?.data as unknown[])?.[0] as
      | Record<string, unknown>
      | undefined;
    if (bucket && Array.isArray(bucket?.tenants)) {
      const meta = extractMeta(bucket?.metadata as Record<string, unknown>);
      const tenants = deduplicateTenants(bucket.tenants as unknown[]);
      return { tenants, meta: { ...EMPTY_TENANTS_META, ...meta } };
    }
  }

  if (Array.isArray(raw)) {
    const first = raw?.[0] as Record<string, unknown> | undefined;
    if (first && (Array.isArray(first?.tenants) || first?.metadata)) {
      const tenants = Array.isArray(first?.tenants) ? first?.tenants : [];
      const meta = extractMeta(first?.metadata as Record<string, unknown>);
      return { tenants, meta: { ...EMPTY_TENANTS_META, ...meta } };
    }
    return { tenants: raw, meta: EMPTY_TENANTS_META };
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const tenants = Array.isArray(obj?.tenants)
      ? obj?.tenants
      : Array.isArray(obj?.data)
      ? obj?.data
      : [];
    const meta = extractMeta(obj?.metadata as Record<string, unknown>);
    return { tenants, meta: { ...EMPTY_TENANTS_META, ...meta } };
  }

  return { tenants: [], meta: EMPTY_TENANTS_META };
};

const BED_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const bedIndexFromLetter = (letter?: string): number => {
  const idx = BED_LETTERS.indexOf(String(letter ?? "").toUpperCase());
  return idx >= 0 ? idx : -1;
};

const toOrdinal = (n?: number): string => {
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

/**
 * Determine bed status from tenant codes with priority:
 * 1 (active/filled) > 7 (short term) > 3 (advance booking) > 2 (under notice)
 */
const statusFromTenantCodes = (codes: number[]): BedStatus => {
  // Filter out deleted (0), moveout (4), expired (5), cancelled (6) - only consider 1,2,3,7
  const activeCodes = codes.filter((c) => [1, 2, 3, 7].includes(c));
  if (activeCodes.length === 0) return "vacant";
  
  // Priority: 1 (filled) > 7 (shortTerm) > 3 (advance) > 2 (notice)
  if (activeCodes.includes(1)) return "filled";
  if (activeCodes.includes(7)) return "shortTerm";
  if (activeCodes.includes(3)) return "advance";
  if (activeCodes.includes(2)) return "notice";
  return "vacant";
};

const parsePropertyLayout = (raw: unknown): UILayout => {
  try {
    const obj = raw as Record<string, unknown> | undefined;
    const data = obj?.data as unknown;
    const root = Array.isArray(data) ? (data as unknown[])?.[0] : data;
    const rootObj = (root as Record<string, unknown>) ?? {};
    const roomsByFloor: unknown[] = Array.isArray(rootObj?.roomsByFloor)
      ? rootObj.roomsByFloor
      : [];
    const md = (rootObj?.metaData as Record<string, unknown>) ?? {};

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
      {
        key: "shortTerm",
        label: "Short Term",
        value: num(md?.shortTermBookings),
        icon: "bed-clock",
        iconBg: "#FEF3C7",
        iconColor: "#F59E0B",
      },
    ];

    // Build raw rooms map for modal
    const rawRoomsMap = new Map<string, RawRoomData>();

    const floors = roomsByFloor.map((floor: unknown) => {
      const floorObj = floor as Record<string, unknown>;
      const floorId = num(floorObj?._id);
      const floorName = toOrdinal(floorId);
      const rooms: unknown[] = Array.isArray(floorObj?.rooms) ? floorObj.rooms : [];
      const bySharing = new Map<number, { sharing: number; rooms: unknown[] }>();

      rooms.forEach((r: unknown) => {
        const room = r as Record<string, unknown>;
        const sharing = num(room?.beds);
        if (!sharing) return;

        // Store raw room data for modal
        const roomNo = String(room?.roomNo ?? "");
        rawRoomsMap.set(roomNo, {
          _id: String(room?._id ?? ""),
          roomNo,
          beds: sharing,
          bedPrice: num(room?.bedPrice),
          securityDeposit: num(room?.securityDeposit),
          facilities: Array.isArray(room?.facilities) ? room.facilities as string[] : [],
          occupiedBeds: num(room?.occupiedBeds),
          vacantBeds: num(room?.vacantBeds),
          advancedBookings: num(room?.advancedBookings),
          underNoticeBeds: num(room?.underNoticeBeds),
          bedsPerRoom: (Array.isArray(room?.bedsPerRoom) ? room.bedsPerRoom : []).map((b: unknown) => {
            const bed = b as Record<string, unknown>;
            return {
              _id: String(bed?._id ?? ""),
              bedNumber: String(bed?.bedNumber ?? ""),
              tenantsPerBed: (Array.isArray(bed?.tenantsPerBed) ? bed.tenantsPerBed : []).map((t: unknown) => {
                const tenant = t as Record<string, unknown>;
                return {
                  _id: String(tenant?._id ?? ""),
                  tenantName: String(tenant?.tenantName ?? ""),
                  phoneNumber: String(tenant?.phoneNumber ?? ""),
                  tenantStatus: num(tenant?.tenantStatus),
                  bedNumber: String(tenant?.bedNumber ?? ""),
                };
              }),
            };
          }),
        });

        const statuses: BedStatus[] = Array.from({ length: sharing }, () => "vacant");
        const bpr: unknown[] = Array.isArray(room?.bedsPerRoom) ? room.bedsPerRoom : [];
        bpr.forEach((b: unknown) => {
          const bed = b as Record<string, unknown>;
          const idx = bedIndexFromLetter(bed?.bedNumber as string);
          if (idx < 0 || idx >= sharing) return;
          const codes = (Array.isArray(bed?.tenantsPerBed) ? bed.tenantsPerBed : [])
            .map((t: unknown) => num((t as Record<string, unknown>)?.tenantStatus))
            .filter((c: number) => c > 0);
          const st = statusFromTenantCodes(codes);
          statuses[idx] = st;
        });

        const uiRoom = {
          roomNo,
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
          rooms: (g.rooms as Array<{ roomNo: string; beds: Array<{ id: string; status: BedStatus }> }>).sort((a, b) =>
            String(a?.roomNo).localeCompare(String(b?.roomNo), undefined, { numeric: true })
          ),
        }));

      return { name: floorName, floorId, groups };
    });

    return { floors: floors as UILayout["floors"], metrics, rawRoomsMap };
  } catch {
    return { floors: [], metrics: [], rawRoomsMap: new Map() };
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export default function PropertyDetails() {
  const { id, tab = TAB_CONFIG[0].key } = useLocalSearchParams<{ id: string; tab?: TabKey }>();
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { selectedId, properties, loading: propsLoading } = useProperty();
  const { profileData } = useSelector((state: { profileDetails: { profileData: unknown } }) => state.profileDetails) as {
    profileData: Record<string, unknown> | null;
  };

  /* ─────────────────────────────────────────────────────────────────────────
     STYLES
  ───────────────────────────────────────────────────────────────────────── */

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        bodyContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg * 2 },
        topLoading: {
          padding: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        loadingText: {
          color: colors.textPrimary,
          fontWeight: "600",
        },
      }),
    [colors, spacing]
  );

  /* ─────────────────────────────────────────────────────────────────────────
     STATE
  ───────────────────────────────────────────────────────────────────────── */

  const [activeTab, setActiveTab] = useState<TabKey>(tab as TabKey);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Sync activeTab state with URL tab param when navigating back
  useEffect(() => {
    if (tab && tab !== activeTab) {
      // Validate that the tab is a valid tab key
      const isValidTab = TAB_CONFIG.some((t) => t.key === tab);
      if (isValidTab) {
        setActiveTab(tab as TabKey);
      }
    }
  }, [tab]);

  // Scroll refs for each tab
  const scrollRefs = useRef<Record<string, React.RefObject<FlatList | ScrollView | null>>>({
    "Property Details": React.createRef<ScrollView>(),
    "PG Layout": React.createRef<ScrollView>(),
    "Advance Booking": React.createRef<FlatList>(),
    "Interim Bookings": React.createRef<FlatList>(),
    "Rooms": React.createRef<FlatList>(),
    "Tenants": React.createRef<FlatList>(),
    "Expenses": React.createRef<FlatList>(),
    "Dues": React.createRef<FlatList>(),
    "Collections": React.createRef<FlatList>(),
    "Staff": React.createRef<FlatList>(),
  });

  /* ─────────────────────────────────────────────────────────────────────────
     SCROLL HANDLERS
  ───────────────────────────────────────────────────────────────────────── */

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > 200);
  }, []);

  const scrollToTop = useCallback(() => {
    const currentRef = scrollRefs.current[activeTab];
    if (currentRef?.current) {
      if ("scrollToOffset" in currentRef.current) {
        (currentRef.current as FlatList).scrollToOffset({ offset: 0, animated: true });
      } else {
        (currentRef.current as ScrollView).scrollTo({ y: 0, animated: true });
      }
    }
  }, [activeTab]);

  // Reset scroll visibility when tab changes
  useEffect(() => {
    setShowScrollToTop(false);
  }, [activeTab]);

  // Sync with global property selection
  useEffect(() => {
    if (!selectedId) return;
    if (selectedId !== id) {
      router.replace({
        pathname: `/protected/property/${selectedId}`,
        params: { tab: activeTab },
      });
    }
  }, [selectedId, id, router, activeTab]);

  /* ─────────────────────────────────────────────────────────────────────────
     DATA HOOKS - All APIs loaded in parallel at mount
  ───────────────────────────────────────────────────────────────────────── */

  const roomsQuery = useGetAllRooms(id as string);
  const paymentsQuery = useGetAllPropertyPayments(`${id}?status=1`);
  const duesQuery = useGetAllPropertyPayments(`${id}?status=2&tenantStatus=1,2,3`);
  const tenantsActiveQuery = useGetAllTenants(id as string, "?status=1,2");
  const tenantsAdvanceQuery = useGetAllTenants(id as string, "?status=3,5,6");
  const tenantsIntrimQuery = useGetAllTenants(id as string, "?status=7");
  const expensesQuery = useGetDailyExpensesList(id as string);
  const layoutQuery = useGetPropertyDetails(id as string);

  const ownerId = String(profileData?.ownerId || profileData?.userId || profileData?._id || "");
  const employeesQuery = useGetAllEmployees(ownerId);

  /* ─────────────────────────────────────────────────────────────────────────
     PARSED DATA - Uses cached responses, no re-fetching
  ───────────────────────────────────────────────────────────────────────── */

  const { rooms, meta: roomsMeta } = useMemo(
    () => parseRoomsResponse(roomsQuery?.data),
    [roomsQuery?.data]
  );

  const { payments: collectionsData, metrics: collectionsMetrics } = useMemo(
    () => parseCollectionsResponse(paymentsQuery?.data),
    [paymentsQuery?.data]
  );

  const { payments: duesData, metrics: duesMetrics } = useMemo(
    () => parseDuesResponse(duesQuery?.data),
    [duesQuery?.data]
  );

  const { tenants: tenantsActive, meta: tenantsMeta } = useMemo(
    () => parseTenantsResponse(tenantsActiveQuery?.data),
    [tenantsActiveQuery?.data]
  );

  const { tenants: tenantsAdvance } = useMemo(
    () => parseTenantsResponse(tenantsAdvanceQuery?.data),
    [tenantsAdvanceQuery?.data]
  );

  const { tenants: tenantsIntrim } = useMemo(
    () => parseTenantsResponse(tenantsIntrimQuery?.data),
    [tenantsIntrimQuery?.data]
  );

  // Extract raw metadata for interim bookings (includes shortTerm keys)
  const intrimRawMeta = useMemo(() => {
    const raw = tenantsIntrimQuery?.data;
    if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>)?.data)) {
      const bucket = ((raw as Record<string, unknown>)?.data as unknown[])?.[0] as Record<string, unknown> | undefined;
      return (bucket?.metadata as Record<string, unknown>) ?? {};
    }
    if (Array.isArray(raw)) {
      const first = raw?.[0] as Record<string, unknown> | undefined;
      return (first?.metadata as Record<string, unknown>) ?? {};
    }
    return {};
  }, [tenantsIntrimQuery?.data]);

  const expenses = useMemo(
    () => (Array.isArray(expensesQuery?.data) ? expensesQuery?.data : []),
    [expensesQuery?.data]
  );

  const layout = useMemo(() => parsePropertyLayout(layoutQuery?.data), [layoutQuery?.data]);

  const staffList = useMemo(() => {
    const raw = employeesQuery?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).data)) {
      return (raw as Record<string, unknown>).data;
    }
    return [];
  }, [employeesQuery?.data]);

  /* ─────────────────────────────────────────────────────────────────────────
     REFRESH HANDLERS - Per-tab refresh for pull-to-refresh
  ───────────────────────────────────────────────────────────────────────── */

  const refreshHandlers = useMemo(
    (): Record<TabKey, (() => void) | undefined> => ({
      "Property Details": undefined,
      "PG Layout": layoutQuery?.refetch ? () => layoutQuery.refetch() : undefined,
      "Advance Booking": tenantsAdvanceQuery?.refetch ? () => tenantsAdvanceQuery.refetch() : undefined,
      "Interim Bookings": tenantsIntrimQuery?.refetch ? () => tenantsIntrimQuery.refetch() : undefined,
      "Rooms": roomsQuery?.refetch ? () => roomsQuery.refetch() : undefined,
      "Tenants": tenantsActiveQuery?.refetch ? () => tenantsActiveQuery.refetch() : undefined,
      "Expenses": expensesQuery?.refetch ? () => expensesQuery.refetch() : undefined,
      "Dues": duesQuery?.refetch ? () => duesQuery.refetch() : undefined,
      "Collections": paymentsQuery?.refetch ? () => paymentsQuery.refetch() : undefined,
      "Staff": employeesQuery?.refetch ? () => employeesQuery.refetch() : undefined,
    }),
    [
      layoutQuery,
      tenantsAdvanceQuery,
      tenantsIntrimQuery,
      roomsQuery,
      tenantsActiveQuery,
      expensesQuery,
      duesQuery,
      paymentsQuery,
      employeesQuery,
    ]
  );

  const currentRefreshHandler = useCallback(() => {
    const handler = refreshHandlers[activeTab];
    if (handler) handler();
  }, [activeTab, refreshHandlers]);

  const isCurrentTabRefreshing = useMemo(() => {
    const refreshingStates: Record<TabKey, boolean> = {
      "Property Details": false,
      "PG Layout": !!layoutQuery?.isFetching,
      "Advance Booking": !!tenantsAdvanceQuery?.isFetching,
      "Interim Bookings": !!tenantsIntrimQuery?.isFetching,
      "Rooms": !!roomsQuery?.isFetching,
      "Tenants": !!tenantsActiveQuery?.isFetching,
      "Expenses": !!expensesQuery?.isFetching,
      "Dues": !!duesQuery?.isFetching,
      "Collections": !!paymentsQuery?.isFetching,
      "Staff": !!employeesQuery?.isFetching,
    };
    return refreshingStates[activeTab];
  }, [
    activeTab,
    layoutQuery?.isFetching,
    tenantsAdvanceQuery?.isFetching,
    tenantsIntrimQuery?.isFetching,
    roomsQuery?.isFetching,
    tenantsActiveQuery?.isFetching,
    expensesQuery?.isFetching,
    duesQuery?.isFetching,
    paymentsQuery?.isFetching,
    employeesQuery?.isFetching,
  ]);

  /* ─────────────────────────────────────────────────────────────────────────
     PROPERTY INFO
  ───────────────────────────────────────────────────────────────────────── */

  const currentProperty = useMemo(
    () => properties?.find?.((p) => p?._id === id),
    [properties, id]
  );
  const propName = str(currentProperty?.propertyName, "—");
  const propArea = str(currentProperty?.area, "—");
  const propCity = str(currentProperty?.city, "—");

  const propAddress = useMemo(() => {
    const parts = [
      str(currentProperty?.address),
      propArea !== "—" ? propArea : "",
      propCity !== "—" ? propCity : "",
      str(currentProperty?.pincode),
    ].filter(Boolean);
    return parts.join(", ");
  }, [currentProperty, propArea, propCity]);

  /* ─────────────────────────────────────────────────────────────────────────
     TAB CONTENT RENDERER - Instant switching using cached data
  ───────────────────────────────────────────────────────────────────────── */

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "PG Layout":
        return (
          <PGLayout
            floors={layout.floors}
            metrics={layout.metrics}
            rawRoomsMap={layout.rawRoomsMap}
            propertyId={id as string}
            refreshing={!!layoutQuery?.isFetching}
            onRefresh={layoutQuery?.refetch}
          />
        );

      case "Advance Booking":
        return (
          <AdvanceBookingTab
            data={(tenantsAdvance ?? []) as never}
            refreshing={!!tenantsAdvanceQuery?.isFetching}
            onRefresh={tenantsAdvanceQuery?.refetch}
            scrollRef={scrollRefs.current["Advance Booking"] as React.RefObject<FlatList>}
            onScroll={handleScroll}
          />
        );

      case "Interim Bookings":
        return (
          <IntrimTab
            data={(tenantsIntrim ?? []) as Record<string, unknown>[]}
            metadata={intrimRawMeta}
            refreshing={!!tenantsIntrimQuery?.isFetching}
            onRefresh={tenantsIntrimQuery?.refetch}
            propertyId={id as string}
            scrollRef={scrollRefs.current["Interim Bookings"] as React.RefObject<FlatList>}
            onScroll={handleScroll}
          />
        );

      case "Rooms":
        return (
          <RoomsTab
            data={rooms as never}
            meta={roomsMeta}
            refreshing={!!roomsQuery?.isFetching}
            onRefresh={roomsQuery?.refetch}
            scrollRef={scrollRefs.current["Rooms"] as React.RefObject<FlatList>}
            onScroll={handleScroll}
          />
        );

      case "Tenants":
        return (
          <TenantsTab
            data={(tenantsActive ?? []) as never}
            meta={tenantsMeta}
            refreshing={!!tenantsActiveQuery?.isFetching}
            onRefresh={tenantsActiveQuery?.refetch}
            scrollRef={scrollRefs.current["Tenants"] as React.RefObject<FlatList>}
            onScroll={handleScroll}
          />
        );

      case "Expenses":
        return (
          <ExpensesTab
            data={expenses as never}
            refreshing={!!expensesQuery?.isFetching}
            onRefresh={expensesQuery?.refetch}
            propertyId={id as string}
            scrollRef={scrollRefs.current["Expenses"] as React.RefObject<FlatList>}
            onScroll={handleScroll}
          />
        );

      case "Dues":
        return (
          <DuesTab
            data={duesData as never}
            metrics={duesMetrics}
            refreshing={!!duesQuery?.isFetching}
            onRefresh={duesQuery?.refetch}
            propertyId={id as string}
            scrollRef={scrollRefs.current["Dues"] as React.RefObject<FlatList>}
            onScroll={handleScroll}
          />
        );

      case "Collections":
        return (
          <CollectionsTab
            data={collectionsData as never}
            metrics={collectionsMetrics}
            refreshing={!!paymentsQuery?.isFetching}
            onRefresh={paymentsQuery?.refetch}
            propertyName={propName}
            propertyAddress={propAddress}
            scrollRef={scrollRefs.current["Collections"] as React.RefObject<FlatList>}
            onScroll={handleScroll}
          />
        );

      case "Staff":
        return (
          <StaffTab
            data={staffList as never}
            refreshing={!!employeesQuery?.isFetching}
            onRefresh={employeesQuery?.refetch}
            propertyId={id as string}
            scrollRef={scrollRefs.current["Staff"] as React.RefObject<FlatList>}
            onScroll={handleScroll}
          />
        );

      default:
        return (
          <ScrollView
            ref={scrollRefs.current["Property Details"] as React.RefObject<ScrollView>}
            style={{ flex: 1 }}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
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
          </ScrollView>
        );
    }
  }, [
    activeTab,
    layout,
    layoutQuery,
    tenantsAdvance,
    tenantsAdvanceQuery,
    rooms,
    roomsMeta,
    roomsQuery,
    tenantsActive,
    tenantsMeta,
    tenantsActiveQuery,
    expenses,
    expensesQuery,
    duesData,
    duesMetrics,
    duesQuery,
    collectionsData,
    collectionsMetrics,
    paymentsQuery,
    staffList,
    employeesQuery,
    propName,
    propAddress,
    id,
    handleScroll,
    styles.bodyContent,
  ]);

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      {/* Header */}
      {propsLoading && !currentProperty ? (
        <View style={styles.topLoading}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>Loading property…</Text>
        </View>
      ) : (
        <TopInfo name={propName} area={propArea} city={propCity} />
      )}

      {/* Animated Tab Bar */}
      <AnimatedTabBar tabs={TAB_CONFIG} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {renderTabContent}

      {/* Scroll to Top Button with Refresh */}
      {activeTab !== "Property Details" && activeTab !== "PG Layout" && (
        <ScrollToTopButton
          visible={showScrollToTop}
          onPress={scrollToTop}
          onRefresh={currentRefreshHandler}
          isRefreshing={isCurrentTabRefreshing}
        />
      )}
    </SafeAreaView>
  );
}
