// app/protected/advancedBooking/[id].tsx
// Add/Edit/Convert Advanced Booking Screen - Premium design with proper validation
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  I18nManager,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  Button,
  RadioButton,
  Text as PaperText,
  TextInput,
  Portal,
  Dialog,
  Divider,
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useProperty } from "@/src/context/PropertyContext";
import { useGetAllRooms } from "@/src/hooks/room";
import { useGetAllTenants, useInsertTenant, useUpdateTenant } from "@/src/hooks/tenants";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;

const parseISODate = (v: unknown): Date | null => {
  try {
    const s = str(v, "");
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const formatDisplayDate = (d: Date | null): string => {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "Select date";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const addDays = (d: Date, days: number) => {
  const nd = new Date(d.getTime());
  nd.setDate(nd.getDate() + days);
  return nd;
};

const addMonths = (d: Date, months: number) => {
  const nd = new Date(d.getTime());
  const day = nd.getDate();
  nd.setMonth(nd.getMonth() + months);
  if (nd.getDate() < day) {
    nd.setDate(0);
  }
  return nd;
};

const firstOfNextMonth = (base: Date) => {
  const y = base.getFullYear();
  const m = base.getMonth();
  if (m === 11) {
    return new Date(y + 1, 0, 1, 0, 0, 0, 0);
  }
  return new Date(y, m + 1, 1, 0, 0, 0, 0);
};

// Format number to Indian currency format
const formatIndianNumber = (num: string): string => {
  const cleaned = num.replace(/[^0-9]/g, "");
  if (!cleaned) return "";
  const number = parseInt(cleaned, 10);
  if (isNaN(number)) return cleaned;
  return number.toLocaleString("en-IN");
};

const parseFormattedNumber = (formatted: string): string => {
  return formatted.replace(/[^0-9]/g, "");
};

const BED_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MAX_AMOUNT_DIGITS = 9;

type DueType = "Monthly" | "FirstMonth" | "Custom";
type BedDisplayStatus = "Filled" | "AdvBooked" | "UnderNotice" | "Available";

/* ─────────────────────────────────────────────────────────────────────────────
   ROOM & BED HELPERS
───────────────────────────────────────────────────────────────────────────── */

const extractRooms = (resp: unknown): Record<string, unknown>[] => {
  if (!resp) return [];
  const r = resp as Record<string, unknown>;
  if (r && typeof r === "object" && !Array.isArray(r)) {
    if (Array.isArray(r.data)) {
      const first = (r.data as Record<string, unknown>[])[0];
      if (first && Array.isArray(first.rooms)) return first.rooms as Record<string, unknown>[];
      return r.data as Record<string, unknown>[];
    }
    if (Array.isArray(r.rooms)) return r.rooms as Record<string, unknown>[];
  }
  if (Array.isArray(resp)) {
    const first = (resp as Record<string, unknown>[])[0];
    if (first && Array.isArray(first.rooms)) return first.rooms as Record<string, unknown>[];
    return resp as Record<string, unknown>[];
  }
  return [];
};

const extractAdvanceTenants = (resp: unknown): Record<string, unknown>[] => {
  if (!resp) return [];
  const r = resp as Record<string, unknown>;
  if (r && typeof r === "object") {
    // Format: { data: [{ metadata, tenants: [...] }] }
    if (Array.isArray(r.data)) {
      const bucket = (r.data as Record<string, unknown>[])[0];
      if (bucket && Array.isArray(bucket.tenants)) {
        return bucket.tenants as Record<string, unknown>[];
      }
      // Format: { data: [tenant1, tenant2, ...] }
      return r.data as Record<string, unknown>[];
    }
    // Format: { tenants: [...] }
    if (Array.isArray(r.tenants)) return r.tenants as Record<string, unknown>[];
  }
  // Format: [tenant1, tenant2, ...]
  if (Array.isArray(resp)) {
    // Check if it's [{ metadata, tenants }] format
    const first = (resp as Record<string, unknown>[])[0];
    if (first && Array.isArray(first.tenants)) {
      return first.tenants as Record<string, unknown>[];
    }
    return resp as Record<string, unknown>[];
  }
  return [];
};

type DerivedRoomStatus = "Available" | "Partial" | "Filled";

const deriveRoomStatus = (room: Record<string, unknown>): DerivedRoomStatus => {
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

  if (totalBeds <= 0) return "Available";
  if (vacantBeds <= 0) return "Filled";
  if (vacantBeds >= totalBeds) return "Available";
  return "Partial";
};

const bedStatusFromTenantStatuses = (codes: number[]): BedDisplayStatus => {
  if (!codes || codes.length === 0) return "Available";
  if (codes.some((c) => c === 1)) return "Filled";
  if (codes.some((c) => c === 3)) return "AdvBooked";
  if (codes.some((c) => c === 2)) return "UnderNotice";
  return "Available";
};

/* ─────────────────────────────────────────────────────────────────────────────
   LABELED COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const Labeled = React.memo(
  ({
    label,
    children,
    required,
  }: {
    label: string;
    children: React.ReactNode;
    required?: boolean;
  }) => {
    const { colors } = useTheme();
    return (
      <View style={{ marginTop: 8, marginBottom: 10 }}>
        <PaperText
          style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}
          accessible
          accessibilityRole="text"
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </PaperText>
        {children}
      </View>
    );
  }
);
Labeled.displayName = "Labeled";

/* ─────────────────────────────────────────────────────────────────────────────
   SHEET SELECT COMPONENT (Generic Dropdown)
───────────────────────────────────────────────────────────────────────────── */

interface SheetSelectOption {
  id: string;
  label: string;
  sublabel?: string;
  status?: string;
  statusColor?: string;
  disabled?: boolean;
}

interface SheetSelectProps {
  value?: string;
  options: SheetSelectOption[];
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const SheetSelect = React.memo(function SheetSelect({
  value,
  options,
  placeholder,
  onChange,
  disabled,
}: SheetSelectProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.id === value);

  return (
    <>
      <Pressable
        onPress={() => {
          if (disabled) return;
          Haptics.selectionAsync();
          setOpen(true);
        }}
        style={{
          borderWidth: 1,
          borderColor: colors.borderColor,
          borderRadius: radius.lg,
          backgroundColor: disabled ? colors.surface : colors.cardSurface,
          paddingVertical: 14,
          paddingHorizontal: 12,
          opacity: disabled ? 0.6 : 1,
          minHeight: 55,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        accessibilityHint="Opens selection menu"
        accessible
      >
        <View style={{ flex: 1 }}>
          <PaperText
            style={{
              color: selectedOption ? colors.textPrimary : colors.textMuted,
              fontSize: typography.fontSizeMd,
            }}
            numberOfLines={1}
          >
            {selectedOption?.label || placeholder}
          </PaperText>
          {selectedOption?.sublabel && (
            <PaperText
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {selectedOption.sublabel}
            </PaperText>
          )}
        </View>
        <MaterialIcons
          name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
          }}
        >
          <Dialog.Title
            style={{
              color: colors.textPrimary,
              marginBottom: 6,
              fontWeight: "700",
              fontSize: typography.fontSizeMd,
            }}
          >
            {placeholder}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ padding: spacing.sm }}
              keyboardShouldPersistTaps="always"
            >
              {options.length === 0 ? (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 12 }}>
                  No options available.
                </PaperText>
              ) : (
                options.map((opt) => {
                  const isSelected = opt.id === value;
                  const isDisabled = !!opt.disabled;

                  return (
                    <Pressable
                      key={opt.id}
                      disabled={isDisabled}
                      onPress={() => {
                        if (isDisabled) return;
                        Haptics.selectionAsync();
                        onChange(opt.id);
                        setOpen(false);
                      }}
                      style={{
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderColor: hexToRgba(colors.textSecondary, 0.12),
                        minHeight: 52,
                        justifyContent: "center",
                        backgroundColor: isSelected
                          ? hexToRgba(colors.accent, 0.1)
                          : "transparent",
                        borderRadius: isSelected ? 10 : 0,
                        paddingHorizontal: 10,
                        marginBottom: 4,
                        opacity: isDisabled ? 0.4 : 1,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={opt.label}
                      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                      accessible
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <PaperText
                            style={{
                              color: colors.textPrimary,
                              fontWeight: isSelected ? "700" : "500",
                              fontSize: 14,
                            }}
                          >
                            {opt.label}
                          </PaperText>
                          {opt.sublabel && (
                            <PaperText
                              style={{
                                color: colors.textSecondary,
                                fontSize: 12,
                                marginTop: 2,
                              }}
                            >
                              {opt.sublabel}
                            </PaperText>
                          )}
                        </View>
                        {opt.status && (
                          <View
                            style={{
                              backgroundColor: opt.statusColor || colors.textMuted,
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 10,
                                fontWeight: "700",
                              }}
                            >
                              {opt.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)} textColor={colors.accent}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN SCREEN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function AdvancedBookingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();

  // Params
  const params = useLocalSearchParams<{ id: string; mode?: string }>();
  const id = String(params?.id ?? "");
  const mode = String(params?.mode ?? "");

  // Mode detection
  const isAddMode = id === "add";
  const isConvertMode = !isAddMode && mode === "convert";
  const isEditMode = !isAddMode && !isConvertMode;

  // Property context
  const { selectedId, properties } = useProperty();
  const propertyId = selectedId as string | undefined;

  // Profile data
  const profileData = useSelector(
    (state: { profileDetails?: { profileData?: Record<string, unknown> } }) =>
      state?.profileDetails?.profileData
  );
  const ownerId = str(
    (profileData as Record<string, unknown>)?.ownerId ??
      (profileData as Record<string, unknown>)?.userId ??
      (profileData as Record<string, unknown>)?._id ??
      "",
    ""
  );

  // Current property
  const currentProperty = useMemo(
    () => properties.find((p) => p._id === propertyId),
    [properties, propertyId]
  );

  // Fetch rooms
  const {
    data: roomsResp,
    isLoading: roomsLoading,
  } = useGetAllRooms(propertyId as string);

  // Fetch advance booking tenants
  const {
    data: tenantsResp,
    isLoading: tenantsLoading,
  } = useGetAllTenants(propertyId as string, "?status=3,5,6");

  const rooms = useMemo(() => extractRooms(roomsResp), [roomsResp]);
  const allAdvanceTenants = useMemo(
    () => extractAdvanceTenants(tenantsResp),
    [tenantsResp]
  );

  // Find current tenant for edit/convert mode
  const currentTenant = useMemo(() => {
    if (isAddMode || !id) return null;
    const key = String(id);

    // Try direct search in flat array first
    const directMatch = allAdvanceTenants.find(
      (t) => String(t?._id ?? t?.id ?? "") === key
    );
    if (directMatch) return directMatch;

    // Fallback: check if it's nested format [{ tenants: [...] }]
    const firstBucket = allAdvanceTenants[0] as Record<string, unknown> | undefined;
    if (firstBucket && Array.isArray(firstBucket.tenants)) {
      const nestedMatch = (firstBucket.tenants as Record<string, unknown>[]).find(
        (t) => String(t?._id ?? t?.id ?? "") === key
      );
      if (nestedMatch) return nestedMatch;
    }

    return null;
  }, [allAdvanceTenants, id, isAddMode]);

  /* ----------------------------- Form State ----------------------------- */

  const [tenantName, setTenantName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [joiningDate, setJoiningDate] = useState<Date | null>(null);
  const [roomId, setRoomId] = useState("");
  const [bedId, setBedId] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [advRentPaid, setAdvRentPaid] = useState("");
  const [advDepositPaid, setAdvDepositPaid] = useState("");
  const [rentCollected, setRentCollected] = useState("");
  const [depositCollected, setDepositCollected] = useState("");
  const [dueType, setDueType] = useState<DueType>("Monthly");
  const [dueDate, setDueDate] = useState<Date | null>(null);

  // Track initial joining date for edit limits
  const initialJoiningDate = useRef<Date | null>(null);
  // Track which tenant ID was prefilled to avoid duplicate prefills
  const prefilledTenantId = useRef<string | null>(null);
  // Flag to skip reset effect right after prefill
  const justPrefilled = useRef(false);

  // Date picker state
  const [showJoiningDatePicker, setShowJoiningDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [tempJoiningDate, setTempJoiningDate] = useState<Date>(() => new Date());
  const [tempDueDate, setTempDueDate] = useState<Date>(() => new Date());

  // Mutations
  const insertTenant = useInsertTenant(() => {});
  const updateTenant = useUpdateTenant(() => {});

  // Get tenant ID for tracking
  const currentTenantId = useMemo(() => {
    if (!currentTenant) return null;
    return String(currentTenant._id ?? currentTenant.id ?? "");
  }, [currentTenant]);

  /* ----------------------------- Prefill Logic ----------------------------- */

  useEffect(() => {
    // Skip if add mode
    if (isAddMode) return;
    
    // Skip if no tenant data yet
    if (!currentTenant || !currentTenantId) return;
    
    // Skip if already prefilled this tenant
    if (prefilledTenantId.current === currentTenantId) return;

    const ct = currentTenant as Record<string, unknown>;

    // Mark as prefilled for this tenant
    prefilledTenantId.current = currentTenantId;

    // Tenant details
    setTenantName(str(ct.tenantName ?? ct.name, ""));
    setPhone(str(ct.phoneNumber ?? ct.phone, "").replace(/[^\d]/g, "").slice(0, 10));
    setEmail(str(ct.email ?? "", ""));
    setGender(String(ct.gender).toLowerCase() === "female" ? "Female" : "Male");

    // Joining date
    const jDate =
      parseISODate(ct.joiningDate) ??
      parseISODate(ct.joinDate) ??
      parseISODate(ct.joinedOn);
    setJoiningDate(jDate);
    initialJoiningDate.current = jDate;

    // Room ID - handle nested object
    const tenantRoomId = str(
      (ct.roomId as Record<string, unknown>)?._id ??
        ct.roomId ??
        (ct.room as Record<string, unknown>)?._id ??
        (ct.room as Record<string, unknown>)?.id ??
        "",
      ""
    );
    setRoomId(tenantRoomId);

    // Bed - Always bind from API response
    const tenantBed = str(ct.bedNumber ?? ct.bed ?? "", "").toUpperCase();
    
    // CRITICAL: Set flag to prevent reset effect from clearing this bed
    justPrefilled.current = true;
    setBedId(tenantBed);

    // Amounts - handle various property names
    const rentVal = num(ct.rentAmount ?? ct.rent ?? 0);
    const depositVal = num(ct.depositAmount ?? ct.deposit ?? 0);
    const advRentVal = num(ct.advanceRentAmountPaid ?? ct.advRentPaid ?? 0);
    const advDepositVal = num(ct.advanceDepositAmountPaid ?? ct.advDepositPaid ?? 0);
    const rentCollectedVal = num(ct.rentAmountPaid ?? ct.collectedRent ?? 0);
    const depositCollectedVal = num(ct.depositAmountPaid ?? ct.collectedDeposit ?? 0);

    setRentAmount(rentVal > 0 ? formatIndianNumber(String(rentVal)) : "");
    setDepositAmount(depositVal > 0 ? formatIndianNumber(String(depositVal)) : "");
    setAdvRentPaid(advRentVal > 0 ? formatIndianNumber(String(advRentVal)) : "");
    setAdvDepositPaid(advDepositVal > 0 ? formatIndianNumber(String(advDepositVal)) : "");
    setRentCollected(rentCollectedVal > 0 ? formatIndianNumber(String(rentCollectedVal)) : "");
    setDepositCollected(depositCollectedVal > 0 ? formatIndianNumber(String(depositCollectedVal)) : "");

    setDueType("Monthly");
    setDueDate(null);
  }, [isAddMode, currentTenant, currentTenantId]);

  /* ----------------------------- Due Date Auto-compute ----------------------------- */

  useEffect(() => {
    if (!isConvertMode) return;

    const today = startOfDay(new Date());

    if (dueType === "Monthly") {
      if (joiningDate) {
        setDueDate(addMonths(joiningDate, 1));
      } else {
        setDueDate(null);
      }
    } else if (dueType === "FirstMonth") {
      const base = joiningDate ?? today;
      setDueDate(firstOfNextMonth(base));
    } else if (dueType === "Custom") {
      setDueDate((prev) => {
        if (!prev) return today;
        const prevStart = startOfDay(prev);
        if (prevStart.getTime() < today.getTime()) return today;
        return prev;
      });
    }
  }, [dueType, joiningDate, isConvertMode]);

  /* ----------------------------- Room Options ----------------------------- */

  const roomStatusColors = useMemo(
    () => ({
      Available: colors.availableBeds ?? "#22C55E",
      Partial: colors.advBookedBeds ?? "#F59E0B",
      Filled: colors.filledBeds ?? "#EF4444",
    }),
    [colors]
  );

  const roomOptions: SheetSelectOption[] = useMemo(
    () =>
      rooms
        .map((room) => {
          const rid = str(room?._id ?? room?.id ?? "", "");
          const roomNo = str(room?.roomNo ?? room?.roomNumber ?? "", "");
          if (!rid || !roomNo) return null;

          const status = deriveRoomStatus(room);
          const sharing = num(room?.beds, 0);
          const vacant = num(room?.vacantBeds, 0);

          return {
            id: rid,
            label: `Room ${roomNo}`,
            sublabel: `${sharing} beds • ${vacant} vacant`,
            status: status,
            statusColor: roomStatusColors[status],
          } as SheetSelectOption;
        })
        .filter(Boolean) as SheetSelectOption[],
    [rooms, roomStatusColors]
  );

  /* ----------------------------- Selected Room ----------------------------- */

  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r?._id ?? r?.id ?? "") === roomId),
    [rooms, roomId]
  );

  // Auto-bind rent & deposit when room changes
  useEffect(() => {
    if (!selectedRoom || !isAddMode) return;
    const price = num(selectedRoom.bedPrice);
    const deposit = num(selectedRoom.securityDeposit);

    if (price > 0) {
      setRentAmount(formatIndianNumber(String(price)));
    }
    if (deposit > 0) {
      setDepositAmount(formatIndianNumber(String(deposit)));
    }
  }, [selectedRoom, isAddMode]);

  /* ----------------------------- Bed Options ----------------------------- */

  const bedStatusColors = useMemo(
    () => ({
      Filled: colors.filledBeds ?? "#EF4444",
      AdvBooked: colors.advBookedBeds ?? "#F59E0B",
      UnderNotice: colors.underNoticeBeds ?? colors.advBookedBeds ?? "#F59E0B",
      Available: colors.availableBeds ?? "#22C55E",
    }),
    [colors]
  );

  // Get tenant's original room/bed for edit/convert mode (used in multiple places)
  // MUST be defined before bedOptions to prevent "used before declaration" error
  const tenantOriginalRoomId = useMemo(() => {
    if (isAddMode || !currentTenant) return "";
    return str(
      (currentTenant.roomId as Record<string, unknown>)?._id ??
        currentTenant.roomId ??
        "",
      ""
    );
  }, [isAddMode, currentTenant]);

  const tenantOriginalBed = useMemo(() => {
    if (isAddMode || !currentTenant) return "";
    return str(currentTenant.bedNumber ?? "", "").toUpperCase();
  }, [isAddMode, currentTenant]);

  const bedOptions: SheetSelectOption[] = useMemo(() => {
    // If no room selected, no bed options
    if (!roomId) return [];

    // Determine sharing count - prefer from selectedRoom, fallback to tenant's sharingType
    let sharing = selectedRoom ? num(selectedRoom.beds, 0) : 0;
    
    // In edit/convert mode, if room data not loaded yet, use tenant's sharingType as fallback
    if (!sharing && !isAddMode && currentTenant && roomId === tenantOriginalRoomId) {
      sharing = num(currentTenant.sharingType ?? 0);
    }
    
    if (!sharing) return [];

    const letters = BED_LETTERS.slice(0, Math.min(sharing, BED_LETTERS.length)).split("");
    const bpr: Record<string, unknown>[] = selectedRoom && Array.isArray(selectedRoom.bedsPerRoom)
      ? (selectedRoom.bedsPerRoom as Record<string, unknown>[])
      : [];

    // Check if we're on the same room as the tenant's original room
    const isSameRoom = !isAddMode && tenantOriginalRoomId === roomId;

    return letters.map((letter) => {
      const upperLetter = letter.toUpperCase();
      
      // Find bed info from room's bedsPerRoom array (if available)
      const match = bpr.find(
        (b) => str(b?._id ?? b?.bedNumber, "").toUpperCase() === upperLetter
      );
      
      // Get tenant statuses for this bed
      const codes = (
        match && Array.isArray(match?.tenantsPerBed)
          ? (match.tenantsPerBed as { tenantStatus?: number }[])
          : []
      )
        .map((t) => num(t?.tenantStatus))
        .filter((c) => c > 0);

      const status = bedStatusFromTenantStatuses(codes);

      // CRITICAL: In edit/convert mode, the tenant's own bed should ALWAYS be selectable
      // even if it shows as "filled" (because the tenant themselves is filling it)
      const isCurrentTenantBed = isSameRoom && tenantOriginalBed === upperLetter;

      // Disable logic:
      // - In Add mode: only "Available" beds can be selected
      // - In Edit/Convert mode: "Available" beds + the tenant's original bed can be selected
      const disabled = isAddMode
        ? status !== "Available"
        : status !== "Available" && !isCurrentTenantBed;

      return {
        id: letter,
        label: `Bed ${letter}`,
        sublabel: isCurrentTenantBed ? "(Your current bed)" : undefined,
        status: status, // Show original status (Filled, AdvBooked, etc.)
        statusColor: bedStatusColors[status],
        disabled,
      } as SheetSelectOption;
    });
  }, [
    selectedRoom,
    roomId,
    isAddMode,
    bedStatusColors,
    tenantOriginalRoomId,
    tenantOriginalBed,
    colors.accent,
    currentTenant,
  ]);

  // Reset bed when room changes (only if moving to a different room)
  // CRITICAL: Don't reset while rooms are loading to prevent race condition
  useEffect(() => {
    // Skip this effect if we just prefilled (to prevent clearing the prefilled bed)
    if (justPrefilled.current) {
      justPrefilled.current = false;
      return;
    }

    // Don't run reset logic while rooms are loading
    if (roomsLoading) return;

    // In edit/convert mode, never reset if this is the tenant's original room+bed combo
    if (!isAddMode && currentTenant) {
      const ctRoomId = str(
        (currentTenant.roomId as Record<string, unknown>)?._id ??
          currentTenant.roomId ??
          "",
        ""
      );
      const ctBed = str(currentTenant.bedNumber ?? "", "").toUpperCase();
      
      // If current selection matches tenant's original, don't reset
      if (roomId === ctRoomId && bedId.toUpperCase() === ctBed) {
        return;
      }
    }
    
    // If no room selected, clear bed
    if (!roomId) {
      setBedId("");
      return;
    }

    // If room is selected but not found in rooms list
    if (!selectedRoom) {
      // In edit/convert mode, preserve the bed if on tenant's room
      if (!isAddMode && roomId === tenantOriginalRoomId) {
        return;
      }
      // Room not found and not matching tenant's room - clear bed
      setBedId("");
      return;
    }

    // Room is found - validate bed against room's capacity
    const sharing = num(selectedRoom.beds, 0);
    const allowedLetters = BED_LETTERS.slice(0, Math.min(sharing, BED_LETTERS.length))
      .split("")
      .map((c) => c.toUpperCase());

    const upperBed = bedId.toUpperCase();

    // Check if current bed is the tenant's original bed (in edit/convert mode)
    const isOriginalBed =
      !isAddMode && tenantOriginalRoomId === roomId && upperBed === tenantOriginalBed;

    // Reset bed only if:
    // - There's a bed selected
    // - It's not in the allowed letters for this room's capacity
    // - AND it's not the tenant's original bed (which we must preserve)
    if (upperBed && !allowedLetters.includes(upperBed) && !isOriginalBed) {
      setBedId("");
    }
  }, [
    selectedRoom,
    bedId,
    isAddMode,
    roomId,
    roomsLoading,
    tenantOriginalRoomId,
    tenantOriginalBed,
    currentTenant,
  ]);

  /* ----------------------------- Joining Date Limits ----------------------------- */

  const todayStart = useMemo(() => startOfDay(new Date()), []);

  // For all modes (Add, Edit, Convert): joining date must be from tomorrow onwards
  const joiningMinDate = useMemo(() => {
    return addDays(todayStart, 1); // tomorrow
  }, [todayStart]);

  // No max date limit - can select any future date
  const joiningMaxDate = useMemo(() => {
    return undefined;
  }, []);

  /* ----------------------------- Navigation ----------------------------- */

  const navigateBackToTab = useCallback(() => {
    try {
      queryClient.invalidateQueries({ queryKey: ["tenantList"] });
    } catch {
      // Ignore
    }
    if (propertyId) {
      router.replace({
        pathname: `/protected/property/${propertyId}`,
        params: { tab: "Advance Booking", refresh: String(Date.now()) },
      });
    } else {
      router.replace("/protected/(tabs)/Properties");
    }
  }, [queryClient, router, propertyId]);

  const handleBack = useCallback(() => {
    navigateBackToTab();
  }, [navigateBackToTab]);

  // Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  /* ----------------------------- Validation ----------------------------- */

  const validate = useCallback((): string[] => {
    const errs: string[] = [];

    if (!propertyId) {
      errs.push("• Please select a property first.");
    }

    if (!tenantName.trim()) {
      errs.push("• Tenant name is required.");
    } else if (tenantName.trim().length < 2) {
      errs.push("• Tenant name must be at least 2 characters.");
    }

    if (!phone.trim()) {
      errs.push("• Phone number is required.");
    } else if (phone.trim().length !== 10) {
      errs.push("• Phone number must be exactly 10 digits.");
    }

    if (email.trim()) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email.trim())) {
        errs.push("• Please enter a valid email address.");
      }
    }

    if (!joiningDate) {
      errs.push("• Date of joining is required.");
    } else {
      const jdStart = startOfDay(joiningDate);
      const tomorrow = addDays(todayStart, 1);
      // For all modes: joining date must be from tomorrow onwards
      if (jdStart.getTime() < tomorrow.getTime()) {
        errs.push("• Joining date must be from tomorrow onwards.");
      }
    }

    if (!roomId) {
      errs.push("• Please select a room.");
    }
    if (!bedId) {
      errs.push("• Please select a bed.");
    }

    const rentNum = Number(parseFormattedNumber(rentAmount) || 0);
    const depositNum = Number(parseFormattedNumber(depositAmount) || 0);
    const advRentNum = Number(parseFormattedNumber(advRentPaid) || 0);
    const advDepositNum = Number(parseFormattedNumber(advDepositPaid) || 0);

    if (!rentAmount.trim()) {
      errs.push("• Rent amount is required.");
    } else if (rentNum <= 0) {
      errs.push("• Rent amount must be greater than 0.");
    }

    if (!depositAmount.trim()) {
      errs.push("• Deposit amount is required.");
    } else if (depositNum <= 0) {
      errs.push("• Deposit amount must be greater than 0.");
    }

    if (advRentPaid.trim() && advRentNum > rentNum) {
      errs.push("• Paid advance rent cannot exceed rent amount.");
    }

    if (advDepositPaid.trim() && advDepositNum > depositNum) {
      errs.push("• Paid advance deposit cannot exceed deposit amount.");
    }

    if (isConvertMode) {
      if (!advRentPaid.trim()) {
        errs.push("• Paid advance rent is required for conversion.");
      }
      if (!advDepositPaid.trim()) {
        errs.push("• Paid advance deposit is required for conversion.");
      }
      if (!dueType) {
        errs.push("• Please select due type.");
      }
      if (!dueDate) {
        errs.push("• Due date is required.");
      } else {
        const today = startOfDay(new Date());
        if (startOfDay(dueDate).getTime() < today.getTime()) {
          errs.push("• Due date cannot be in the past.");
        }
      }
    }

    return errs;
  }, [
    propertyId,
    tenantName,
    phone,
    email,
    joiningDate,
    roomId,
    bedId,
    rentAmount,
    depositAmount,
    advRentPaid,
    advDepositPaid,
    isAddMode,
    isConvertMode,
    dueType,
    dueDate,
    todayStart,
  ]);

  /* ----------------------------- Submit ----------------------------- */

  const onSubmit = useCallback(() => {
    const errs = validate();
    if (errs.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Validation Errors", errs.join("\n"), [{ text: "OK" }], { cancelable: true });
      return;
    }

    if (!propertyId) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const rentNum = Number(parseFormattedNumber(rentAmount) || 0);
    const depositNum = Number(parseFormattedNumber(depositAmount) || 0);
    const advRentNum = Number(parseFormattedNumber(advRentPaid) || 0);
    const advDepositNum = Number(parseFormattedNumber(advDepositPaid) || 0);
    const rentCollectedNum = Number(parseFormattedNumber(rentCollected) || 0);
    const depositCollectedNum = Number(parseFormattedNumber(depositCollected) || 0);

    const formData = new FormData();

    formData.append("tenantName", tenantName.trim());
    formData.append("phoneNumber", phone.trim());
    if (email.trim()) formData.append("email", email.trim());
    formData.append("gender", gender);

    if (joiningDate) {
      formData.append("joiningDate", joiningDate.toISOString());
    }

    formData.append("roomId", roomId);
    formData.append("roomld", roomId); // Backend typo fallback
    formData.append("bedNumber", bedId.toUpperCase());

    formData.append("rentAmount", String(rentNum));
    formData.append("depositAmount", String(depositNum));
    formData.append("lockingPeriod", "");
    formData.append("noticePeriod", "15");

    if (advRentNum) {
      formData.append("advanceRentAmountPaid", String(advRentNum));
    }
    if (advDepositNum) {
      formData.append("advanceDepositAmountPaid", String(advDepositNum));
    }

    if (ownerId) {
      formData.append("ownerId", ownerId);
      formData.append("ownerld", ownerId);
      formData.append("createdBy", ownerId);
    }

    if (isAddMode) {
      formData.append("status", "3");
      formData.append("dueType", "0");

      insertTenant.mutate(formData, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigateBackToTab();
        },
        onError: (error) => {
          const errMsg =
            (error as { message?: string })?.message ||
            "Could not add booking. Please try again.";
          Alert.alert("Error", errMsg, [{ text: "OK" }]);
        },
      });
    } else {
      const tenantId = str(currentTenant?._id ?? id, "");
      if (!tenantId) {
        Alert.alert("Error", "Unable to identify booking record.", [{ text: "OK" }]);
        return;
      }

      if (isConvertMode) {
        const dueTypeCode = dueType === "FirstMonth" ? 0 : dueType === "Custom" ? 2 : 1;

        formData.append("status", "1");
        formData.append("dueType", String(dueTypeCode));

        if (dueDate) {
          formData.append("dueDate", dueDate.toISOString());
        }

        if (rentCollectedNum) {
          formData.append("rentAmountPaid", String(rentCollectedNum));
        }
        if (depositCollectedNum) {
          formData.append("depositAmountPaid", String(depositCollectedNum));
        }

        const dueRentAmount = Math.max(rentNum - advRentNum - rentCollectedNum, 0);
        const dueDepositAmount = Math.max(depositNum - advDepositNum - depositCollectedNum, 0);

        formData.append("dueRentAmount", String(dueRentAmount));
        formData.append("dueDepositAmount", String(dueDepositAmount));
      } else {
        // Edit mode
        formData.append("status", "3");
        formData.append("dueType", "0");
      }

      updateTenant.mutate(
        { formData, tenantId },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigateBackToTab();
          },
          onError: (error) => {
            const errMsg =
              (error as { message?: string })?.message ||
              "Could not update booking. Please try again.";
            Alert.alert("Error", errMsg, [{ text: "OK" }]);
          },
        }
      );
    }
  }, [
    validate,
    propertyId,
    tenantName,
    phone,
    email,
    gender,
    joiningDate,
    roomId,
    bedId,
    rentAmount,
    depositAmount,
    advRentPaid,
    advDepositPaid,
    rentCollected,
    depositCollected,
    ownerId,
    isAddMode,
    isConvertMode,
    dueType,
    dueDate,
    currentTenant,
    id,
    insertTenant,
    updateTenant,
    navigateBackToTab,
  ]);

  /* ----------------------------- Input Handlers ----------------------------- */

  const onPhoneChange = useCallback((text: string) => {
    const digitsOnly = text.replace(/[^\d]/g, "").slice(0, 10);
    setPhone(digitsOnly);
  }, []);

  const onNameChange = useCallback((text: string) => {
    // Allow only alphabets and spaces
    const filtered = text.replace(/[^a-zA-Z\s]/g, "");
    setTenantName(filtered);
  }, []);

  const onAmountChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) => (text: string) => {
      const digitsOnly = parseFormattedNumber(text).slice(0, MAX_AMOUNT_DIGITS);
      setter(digitsOnly ? formatIndianNumber(digitsOnly) : "");
    },
    []
  );

  /* ----------------------------- Date Picker Handlers ----------------------------- */

  const openJoiningDatePicker = useCallback(() => {
    const validDate =
      joiningDate instanceof Date && !isNaN(joiningDate.getTime()) ? joiningDate : new Date();
    setTempJoiningDate(new Date(validDate.getTime()));
    setShowJoiningDatePicker(true);
  }, [joiningDate]);

  const openDueDatePicker = useCallback(() => {
    const validDate =
      dueDate instanceof Date && !isNaN(dueDate.getTime()) ? dueDate : new Date();
    setTempDueDate(new Date(validDate.getTime()));
    setShowDueDatePicker(true);
  }, [dueDate]);

  const handleJoiningDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowJoiningDatePicker(false);
        if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
          setJoiningDate(startOfDay(selectedDate));
        }
      } else {
        if (selectedDate && !isNaN(selectedDate.getTime())) {
          setTempJoiningDate(new Date(selectedDate.getTime()));
        }
      }
    },
    []
  );

  const handleDueDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowDueDatePicker(false);
        if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
          setDueDate(startOfDay(selectedDate));
        }
      } else {
        if (selectedDate && !isNaN(selectedDate.getTime())) {
          setTempDueDate(new Date(selectedDate.getTime()));
        }
      }
    },
    []
  );

  const confirmIosJoiningDate = useCallback(() => {
    if (tempJoiningDate instanceof Date && !isNaN(tempJoiningDate.getTime())) {
      setJoiningDate(startOfDay(tempJoiningDate));
    }
    setShowJoiningDatePicker(false);
  }, [tempJoiningDate]);

  const confirmIosDueDate = useCallback(() => {
    if (tempDueDate instanceof Date && !isNaN(tempDueDate.getTime())) {
      setDueDate(startOfDay(tempDueDate));
    }
    setShowDueDatePicker(false);
  }, [tempDueDate]);

  /* ----------------------------- Styles ----------------------------- */

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.12),
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        backBtn: {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.full,
        },
        headerTitle: {
          color: colors.textPrimary,
          fontSize: typography.fontSizeLg,
          fontWeight: "700",
          flexShrink: 1,
        },
        headerSubtitle: {
          color: colors.textSecondary,
          fontSize: 13,
          marginTop: 2,
        },
        body: {
          flex: 1,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
        },
        sectionCard: {
          borderWidth: 1,
          borderColor: colors.borderColor,
          borderRadius: radius.xl,
          backgroundColor: colors.cardBackground,
          padding: spacing.md,
          marginBottom: spacing.md,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: Platform.OS === "ios" ? 0.1 : 0.05,
          shadowRadius: Platform.OS === "ios" ? 10 : 6,
          elevation: 4,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontWeight: "700",
          marginBottom: 8,
          fontSize: typography.fontSizeMd,
        },
        input: {
          backgroundColor: colors.cardSurface,
        },
        dateBtn: {
          borderWidth: 1,
          borderColor: colors.borderColor,
          borderRadius: radius.lg,
          backgroundColor: colors.cardSurface,
          paddingVertical: 14,
          paddingHorizontal: 12,
          minHeight: 55,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        genderRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.lg,
        },
        genderChip: {
          flexDirection: "row",
          alignItems: "center",
        },
        row: {
          flexDirection: "row",
          gap: spacing.md,
        },
        col: {
          flex: 1,
        },
        footerRow: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.lg,
          paddingBottom: Platform.OS === "android" ? 72 : 36,
        },
        secondaryBtn: {
          flex: 1,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderColor,
          minHeight: 48,
          justifyContent: "center",
        },
        primaryBtn: {
          flex: 1,
          borderRadius: radius.lg,
          minHeight: 48,
          justifyContent: "center",
        },
        // iOS Date Picker Modal
        datePickerModal: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.4)",
        },
        datePickerContainer: {
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: insets.bottom + 10,
        },
        datePickerHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          borderBottomWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.12),
        },
        datePickerTitle: {
          fontSize: 17,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        datePickerBtn: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
        datePickerBtnText: {
          fontSize: 16,
          fontWeight: "600",
        },
      }),
    [colors, spacing, radius, typography, insets.bottom]
  );

  const headerTitle = isAddMode
    ? "Add Advance Booking"
    : isConvertMode
    ? "Convert to Tenant"
    : "Edit Advance Booking";

  const isSubmitting = insertTenant.isPending || updateTenant.isPending;
  const isLoading = roomsLoading || (tenantsLoading && !isAddMode);

  // Loading state for edit/convert when tenant not yet loaded
  if (!isAddMode && tenantsLoading && !currentTenant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <PaperText style={{ color: colors.textSecondary, marginTop: 12 }}>
            Loading booking details...
          </PaperText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Navigate back to bookings list"
            accessible
            android_ripple={{
              color: hexToRgba(colors.textSecondary, 0.2),
              borderless: true,
            }}
          >
            <MaterialIcons
              name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <PaperText
              style={styles.headerTitle}
              numberOfLines={1}
              accessible
              accessibilityRole="header"
            >
              {headerTitle}
            </PaperText>
            {currentProperty?.propertyName && (
              <PaperText style={styles.headerSubtitle} numberOfLines={1}>
                {currentProperty.propertyName}
              </PaperText>
            )}
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              style={styles.body}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Tenant Details Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Tenant Details
                </Text>

                <Labeled label="Tenant Name" required>
                  <TextInput
                    value={tenantName}
                    onChangeText={onNameChange}
                    placeholder="Enter tenant name"
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, padding: spacing.sm }}
                    accessibilityLabel="Tenant name"
                    accessibilityHint="Enter the tenant's full name"
                  />
                </Labeled>

                <Labeled label="Phone Number" required>
                  <TextInput
                    value={phone}
                    onChangeText={onPhoneChange}
                    placeholder="10 digit number"
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    maxLength={10}
                    left={
                      <TextInput.Affix
                        text="+91"
                        textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                      />
                    }
                    contentStyle={{ minHeight: 48, padding: spacing.sm }}
                    accessibilityLabel="Phone number"
                    accessibilityHint="Enter 10 digit mobile number"
                  />
                </Labeled>

                <Labeled label="Email (optional)">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email address"
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    contentStyle={{ minHeight: 48, padding: spacing.sm }}
                    accessibilityLabel="Email address"
                    accessibilityHint="Enter tenant's email address"
                  />
                </Labeled>

                <Labeled label="Gender" required>
                  <RadioButton.Group
                    onValueChange={(v) => setGender(v === "Female" ? "Female" : "Male")}
                    value={gender}
                  >
                    <View style={styles.genderRow}>
                      <Pressable
                        style={styles.genderChip}
                        onPress={() => setGender("Male")}
                        accessibilityRole="radio"
                        accessibilityLabel="Male"
                        accessibilityState={{ checked: gender === "Male" }}
                      >
                        <RadioButton value="Male" />
                        <Text style={{ color: colors.textPrimary }}>Male</Text>
                      </Pressable>
                      <Pressable
                        style={styles.genderChip}
                        onPress={() => setGender("Female")}
                        accessibilityRole="radio"
                        accessibilityLabel="Female"
                        accessibilityState={{ checked: gender === "Female" }}
                      >
                        <RadioButton value="Female" />
                        <Text style={{ color: colors.textPrimary }}>Female</Text>
                      </Pressable>
                    </View>
                  </RadioButton.Group>
                </Labeled>
              </View>

              {/* Booking Details Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Booking Details
                </Text>

                <Labeled label="Date of Joining" required>
                  <Pressable
                    style={styles.dateBtn}
                    onPress={openJoiningDatePicker}
                    accessibilityRole="button"
                    accessibilityLabel={`Select joining date, current: ${formatDisplayDate(joiningDate)}`}
                    accessible
                  >
                    <MaterialIcons name="event" size={20} color={colors.textSecondary} />
                    <PaperText
                      style={{
                        color: joiningDate ? colors.textPrimary : colors.textMuted,
                        fontSize: typography.fontSizeMd,
                        flex: 1,
                      }}
                    >
                      {formatDisplayDate(joiningDate)}
                    </PaperText>
                    <MaterialIcons
                      name="keyboard-arrow-down"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </Labeled>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Labeled label="Room" required>
                      <SheetSelect
                        value={roomId}
                        placeholder="Select Room"
                        options={roomOptions}
                        onChange={setRoomId}
                        disabled={roomsLoading}
                      />
                    </Labeled>
                  </View>
                  <View style={styles.col}>
                    <Labeled label="Bed" required>
                      <SheetSelect
                        value={bedId}
                        placeholder="Select Bed"
                        options={bedOptions}
                        onChange={setBedId}
                        disabled={!roomId}
                      />
                    </Labeled>
                  </View>
                </View>

                {/* Convert Mode: Due Type & Due Date */}
                {isConvertMode && (
                  <>
                    <Labeled label="Due Type" required>
                      <RadioButton.Group
                        value={dueType}
                        onValueChange={(v) => {
                          const mapped =
                            v === "FirstMonth"
                              ? "FirstMonth"
                              : v === "Custom"
                              ? "Custom"
                              : "Monthly";
                          setDueType(mapped);
                        }}
                      >
                        <View style={styles.genderRow}>
                          <Pressable
                            style={styles.genderChip}
                            onPress={() => setDueType("Monthly")}
                            accessibilityRole="radio"
                          >
                            <RadioButton value="Monthly" />
                            <Text style={{ color: colors.textPrimary }}>Monthly</Text>
                          </Pressable>
                          <Pressable
                            style={styles.genderChip}
                            onPress={() => setDueType("FirstMonth")}
                            accessibilityRole="radio"
                          >
                            <RadioButton value="FirstMonth" />
                            <Text style={{ color: colors.textPrimary }}>1st Month</Text>
                          </Pressable>
                          <Pressable
                            style={styles.genderChip}
                            onPress={() => setDueType("Custom")}
                            accessibilityRole="radio"
                          >
                            <RadioButton value="Custom" />
                            <Text style={{ color: colors.textPrimary }}>Custom</Text>
                          </Pressable>
                        </View>
                      </RadioButton.Group>
                    </Labeled>

                    <Labeled label="Due Date" required>
                      <Pressable
                        style={[styles.dateBtn, dueType !== "Custom" && { opacity: 0.6 }]}
                        onPress={dueType === "Custom" ? openDueDatePicker : undefined}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: dueType !== "Custom" }}
                        accessible
                      >
                        <MaterialIcons name="event" size={20} color={colors.textSecondary} />
                        <PaperText
                          style={{
                            color: dueDate ? colors.textPrimary : colors.textMuted,
                            fontSize: typography.fontSizeMd,
                            flex: 1,
                          }}
                        >
                          {formatDisplayDate(dueDate)}
                        </PaperText>
                        {dueType === "Custom" && (
                          <MaterialIcons
                            name="keyboard-arrow-down"
                            size={20}
                            color={colors.textSecondary}
                          />
                        )}
                      </Pressable>
                    </Labeled>
                  </>
                )}
              </View>

              {/* Financials Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Financials
                </Text>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Labeled label="Rent Amount" required>
                      <TextInput
                        value={rentAmount}
                        onChangeText={onAmountChange(setRentAmount)}
                        placeholder="e.g., 5,000"
                        mode="outlined"
                        theme={{ roundness: radius.lg }}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                        left={
                          <TextInput.Affix
                            text="₹"
                            textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                          />
                        }
                        contentStyle={{ minHeight: 48, padding: spacing.sm }}
                        accessibilityLabel="Rent amount"
                      />
                    </Labeled>
                  </View>
                  <View style={styles.col}>
                    <Labeled label="Deposit Amount" required>
                      <TextInput
                        value={depositAmount}
                        onChangeText={onAmountChange(setDepositAmount)}
                        placeholder="e.g., 10,000"
                        mode="outlined"
                        theme={{ roundness: radius.lg }}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                        left={
                          <TextInput.Affix
                            text="₹"
                            textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                          />
                        }
                        contentStyle={{ minHeight: 48, padding: spacing.sm }}
                        accessibilityLabel="Deposit amount"
                      />
                    </Labeled>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Labeled label={`Paid Adv. Rent${isConvertMode ? " *" : ""}`}>
                      <TextInput
                        value={advRentPaid}
                        onChangeText={onAmountChange(setAdvRentPaid)}
                        placeholder="e.g., 5,000"
                        mode="outlined"
                        theme={{ roundness: radius.lg }}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                        left={
                          <TextInput.Affix
                            text="₹"
                            textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                          />
                        }
                        contentStyle={{ minHeight: 48, padding: spacing.sm }}
                        accessibilityLabel="Paid advance rent"
                      />
                    </Labeled>
                  </View>
                  <View style={styles.col}>
                    <Labeled label={`Paid Adv. Deposit${isConvertMode ? " *" : ""}`}>
                      <TextInput
                        value={advDepositPaid}
                        onChangeText={onAmountChange(setAdvDepositPaid)}
                        placeholder="e.g., 5,000"
                        mode="outlined"
                        theme={{ roundness: radius.lg }}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                        left={
                          <TextInput.Affix
                            text="₹"
                            textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                          />
                        }
                        contentStyle={{ minHeight: 48, padding: spacing.sm }}
                        accessibilityLabel="Paid advance deposit"
                      />
                    </Labeled>
                  </View>
                </View>

                {/* Convert Mode: Collected amounts */}
                {isConvertMode && (
                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Labeled label="Collected Rent">
                        <TextInput
                          value={rentCollected}
                          onChangeText={onAmountChange(setRentCollected)}
                          placeholder="e.g., 5,000"
                          mode="outlined"
                          theme={{ roundness: radius.lg }}
                          outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                          activeOutlineColor={colors.accent}
                          style={styles.input}
                          textColor={colors.textPrimary}
                          placeholderTextColor={colors.textMuted}
                          keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                          left={
                            <TextInput.Affix
                              text="₹"
                              textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                            />
                          }
                          contentStyle={{ minHeight: 48, padding: spacing.sm }}
                          accessibilityLabel="Collected rent"
                        />
                      </Labeled>
                    </View>
                    <View style={styles.col}>
                      <Labeled label="Collected Deposit">
                        <TextInput
                          value={depositCollected}
                          onChangeText={onAmountChange(setDepositCollected)}
                          placeholder="e.g., 5,000"
                          mode="outlined"
                          theme={{ roundness: radius.lg }}
                          outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                          activeOutlineColor={colors.accent}
                          style={styles.input}
                          textColor={colors.textPrimary}
                          placeholderTextColor={colors.textMuted}
                          keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                          left={
                            <TextInput.Affix
                              text="₹"
                              textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                            />
                          }
                          contentStyle={{ minHeight: 48, padding: spacing.sm }}
                          accessibilityLabel="Collected deposit"
                        />
                      </Labeled>
                    </View>
                  </View>
                )}
              </View>

              {/* Loading hint */}
              {roomsLoading && (
                <View style={{ marginTop: spacing.sm, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <PaperText style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>
                    Loading rooms...
                  </PaperText>
                </View>
              )}

              <Divider
                style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }}
              />

              {/* Footer Buttons */}
              <View style={styles.footerRow}>
                <Button
                  mode="outlined"
                  style={styles.secondaryBtn}
                  textColor={colors.textPrimary}
                  onPress={handleBack}
                  disabled={isSubmitting}
                  accessibilityLabel="Cancel and go back"
                  accessibilityHint="Discards changes and returns to bookings list"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  style={styles.primaryBtn}
                  onPress={onSubmit}
                  loading={isSubmitting}
                  disabled={isLoading || isSubmitting}
                  accessibilityLabel={
                    isConvertMode
                      ? "Save and convert"
                      : isAddMode
                      ? "Save booking"
                      : "Save changes"
                  }
                >
                  {isConvertMode ? "Save & Convert" : isAddMode ? "Save Booking" : "Save Changes"}
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>

      {/* Joining Date Picker - Platform specific */}
      {Platform.OS === "android" && showJoiningDatePicker && (
        <DateTimePicker
          value={joiningDate || new Date()}
          mode="date"
          display="default"
          onChange={handleJoiningDateChange}
          minimumDate={joiningMinDate}
          maximumDate={joiningMaxDate}
        />
      )}

      {/* Due Date Picker - Platform specific */}
      {Platform.OS === "android" && showDueDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDueDateChange}
          minimumDate={startOfDay(new Date())}
        />
      )}

      {/* iOS Joining Date Picker Modal */}
      {Platform.OS === "ios" && showJoiningDatePicker && (
        <Modal
          visible={showJoiningDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowJoiningDatePicker(false)}
        >
          <Pressable
            style={styles.datePickerModal}
            onPress={() => setShowJoiningDatePicker(false)}
          >
            <Pressable style={styles.datePickerContainer} onPress={() => {}}>
              <View style={styles.datePickerHeader}>
                <Pressable
                  onPress={() => setShowJoiningDatePicker(false)}
                  style={styles.datePickerBtn}
                >
                  <Text style={[styles.datePickerBtnText, { color: colors.error }]}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>Select Joining Date</Text>
                <Pressable onPress={confirmIosJoiningDate} style={styles.datePickerBtn}>
                  <Text style={[styles.datePickerBtnText, { color: colors.accent }]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={
                  tempJoiningDate instanceof Date && !isNaN(tempJoiningDate.getTime())
                    ? tempJoiningDate
                    : new Date()
                }
                mode="date"
                display="spinner"
                onChange={handleJoiningDateChange}
                style={{ height: 200 }}
                textColor={colors.textPrimary}
                themeVariant="light"
                minimumDate={joiningMinDate}
                maximumDate={joiningMaxDate}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* iOS Due Date Picker Modal */}
      {Platform.OS === "ios" && showDueDatePicker && (
        <Modal
          visible={showDueDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDueDatePicker(false)}
        >
          <Pressable style={styles.datePickerModal} onPress={() => setShowDueDatePicker(false)}>
            <Pressable style={styles.datePickerContainer} onPress={() => {}}>
              <View style={styles.datePickerHeader}>
                <Pressable
                  onPress={() => setShowDueDatePicker(false)}
                  style={styles.datePickerBtn}
                >
                  <Text style={[styles.datePickerBtnText, { color: colors.error }]}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>Select Due Date</Text>
                <Pressable onPress={confirmIosDueDate} style={styles.datePickerBtn}>
                  <Text style={[styles.datePickerBtnText, { color: colors.accent }]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={
                  tempDueDate instanceof Date && !isNaN(tempDueDate.getTime())
                    ? tempDueDate
                    : new Date()
                }
                mode="date"
                display="spinner"
                onChange={handleDueDateChange}
                style={{ height: 200 }}
                textColor={colors.textPrimary}
                themeVariant="light"
                minimumDate={startOfDay(new Date())}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
