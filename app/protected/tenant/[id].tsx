// app/protected/tenant/[id].tsx
// Add/Edit Tenant Screen - Premium design with proper validation and bed binding
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
import {
  useGetAllTenantDetails,
  useInsertTenant,
  useUpdateTenant,
} from "@/src/hooks/tenants";

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

const formatDateYMD = (d: Date): string => {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

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

export default function TenantAddEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();

  // Params
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAddMode = String(id) === "add";

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

  // Fetch tenant details for edit mode
  const {
    data: tenantResp,
    isLoading: tenantLoading,
  } = useGetAllTenantDetails(!isAddMode ? (id as string) : "");

  const rooms = useMemo(() => extractRooms(roomsResp), [roomsResp]);

  // Unwrap tenant data
  const unwrapTenant = (resp: unknown) => {
    if (!resp) return null;
    const r = resp as Record<string, unknown>;
    const base =
      r?.data && typeof r.data === "object" && !Array.isArray(r.data)
        ? (r.data as Record<string, unknown>)
        : r;
    if (base?.tenant && typeof base.tenant === "object") return base.tenant as Record<string, unknown>;
    return base;
  };

  const currentTenant = useMemo(
    () => (!isAddMode ? unwrapTenant(tenantResp) : null),
    [isAddMode, tenantResp]
  );

  // Get tenant ID for tracking
  const currentTenantId = useMemo(() => {
    if (!currentTenant) return null;
    return String((currentTenant as Record<string, unknown>)?._id ?? (currentTenant as Record<string, unknown>)?.id ?? "");
  }, [currentTenant]);

  /* ----------------------------- Form State ----------------------------- */

  const [tenantName, setTenantName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [joiningDate, setJoiningDate] = useState<Date | null>(null);
  const [roomId, setRoomId] = useState("");
  const [bedId, setBedId] = useState("");
  const [dueType, setDueType] = useState<DueType>("Monthly");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [dueDepositAmount, setDueDepositAmount] = useState("");
  const [rentCollected, setRentCollected] = useState("");
  const [depositCollected, setDepositCollected] = useState("");

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

  /* ----------------------------- Prefill Logic ----------------------------- */

  useEffect(() => {
    // Skip if add mode
    if (isAddMode) {
      // Reset form for add mode
      setTenantName("");
      setPhone("");
      setEmail("");
      setGender("Male");
      setJoiningDate(null);
      setRoomId("");
      setBedId("");
      setDueType("Monthly");
      setDueDate(null);
      setRentAmount("");
      setDepositAmount("");
      setDueDepositAmount("");
      setRentCollected("");
      setDepositCollected("");
      prefilledTenantId.current = null;
      return;
    }

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

    // Amounts - bind from tenant data
    const rentVal = num(ct.rentAmount ?? ct.rent ?? 0);
    const depositVal = num(ct.depositAmount ?? ct.deposit ?? 0);

    setRentAmount(rentVal > 0 ? formatIndianNumber(String(rentVal)) : "");
    setDepositAmount(depositVal > 0 ? formatIndianNumber(String(depositVal)) : "");

    // Due type from tenant
    const dtCode = num(ct.dueType);
    if (dtCode === 0) setDueType("FirstMonth");
    else if (dtCode === 2) setDueType("Custom");
    else setDueType("Monthly");

    // Due date from tenant
    const dd =
      parseISODate(ct.dueDate) ??
      parseISODate(ct.nextDueDate) ??
      parseISODate(ct.nextDueOn);
    setDueDate(dd);
  }, [isAddMode, currentTenant, currentTenantId]);

  /* ----------------------------- Due Date Auto-compute ----------------------------- */

  const todayStart = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    const today = todayStart;

    if (!dueType) {
      setDueDate(null);
      return;
    }

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
  }, [dueType, joiningDate, todayStart]);

  /* ----------------------------- Due Deposit Auto-calc (Add only) ----------------------------- */

  useEffect(() => {
    if (!isAddMode) return;
    const dep = Number(parseFormattedNumber(depositAmount) || 0);
    if (!dep) {
      setDueDepositAmount("");
      return;
    }
    setDueDepositAmount(formatIndianNumber(String(dep)));
  }, [depositAmount, isAddMode]);

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

  // Track if user manually changed rent/deposit (to prevent auto-override)
  const userChangedRent = useRef(false);
  const userChangedDeposit = useRef(false);

  // Auto-bind rent & deposit when room changes
  useEffect(() => {
    if (!selectedRoom) return;
    
    const price = num(selectedRoom.bedPrice);
    const deposit = num(selectedRoom.securityDeposit);

    // In add mode: always auto-fill when room changes (unless user manually changed)
    // In edit mode: only auto-fill if values are empty
    if (isAddMode) {
      if (!userChangedRent.current && price > 0) {
        setRentAmount(formatIndianNumber(String(price)));
      }
      if (!userChangedDeposit.current && deposit > 0) {
        setDepositAmount(formatIndianNumber(String(deposit)));
      }
    } else {
      // Edit mode: only auto-fill if empty
      if (!rentAmount && price > 0) {
        setRentAmount(formatIndianNumber(String(price)));
      }
      if (!depositAmount && deposit > 0) {
        setDepositAmount(formatIndianNumber(String(deposit)));
      }
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

  // Get tenant's original room/bed for edit mode
  const tenantOriginalRoomId = useMemo(() => {
    if (isAddMode || !currentTenant) return "";
    const ct = currentTenant as Record<string, unknown>;
    return str(
      (ct.roomId as Record<string, unknown>)?._id ??
        ct.roomId ??
        "",
      ""
    );
  }, [isAddMode, currentTenant]);

  const tenantOriginalBed = useMemo(() => {
    if (isAddMode || !currentTenant) return "";
    const ct = currentTenant as Record<string, unknown>;
    return str(ct.bedNumber ?? "", "").toUpperCase();
  }, [isAddMode, currentTenant]);

  const bedOptions: SheetSelectOption[] = useMemo(() => {
    // If no room selected, no bed options
    if (!roomId) return [];

    // Determine sharing count - prefer from selectedRoom, fallback to tenant's sharingType
    let sharing = selectedRoom ? num(selectedRoom.beds, 0) : 0;

    // In edit mode, if room data not loaded yet, use tenant's sharingType as fallback
    if (!sharing && !isAddMode && currentTenant && roomId === tenantOriginalRoomId) {
      sharing = num((currentTenant as Record<string, unknown>).sharingType ?? 0);
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

      // CRITICAL: In edit mode, the tenant's own bed should ALWAYS be selectable
      const isCurrentTenantBed = isSameRoom && tenantOriginalBed === upperLetter;

      // Disable logic:
      // - In Add mode: only "Available" beds can be selected
      // - In Edit mode: "Available" beds + the tenant's original bed can be selected
      const disabled = isAddMode
        ? status !== "Available"
        : status !== "Available" && !isCurrentTenantBed;

      return {
        id: letter,
        label: `Bed ${letter}`,
        sublabel: isCurrentTenantBed ? "(Your current bed)" : undefined,
        status: status,
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
    currentTenant,
  ]);

  // Track previous roomId to detect room changes
  const previousRoomId = useRef<string>("");

  // Reset bed when room changes (clear bed if room changed to a different one)
  useEffect(() => {
    // Skip this effect if we just prefilled (to prevent clearing the prefilled bed)
    if (justPrefilled.current) {
      justPrefilled.current = false;
      previousRoomId.current = roomId;
      return;
    }

    // Don't run reset logic while rooms are loading
    if (roomsLoading) return;

    // Detect if room actually changed (not just initial load)
    const roomChanged = previousRoomId.current !== "" && previousRoomId.current !== roomId;

    // If room changed, clear bed (unless it's the tenant's original room in edit mode)
    if (roomChanged) {
      // In edit mode, only clear if moving away from tenant's original room
      if (!isAddMode && currentTenant && previousRoomId.current === tenantOriginalRoomId) {
        // Moving away from original room - clear bed
        setBedId("");
        previousRoomId.current = roomId;
        return;
      }
      // In add mode or moving to a different room - always clear bed
      if (isAddMode || previousRoomId.current !== tenantOriginalRoomId) {
        setBedId("");
        previousRoomId.current = roomId;
        return;
      }
    }

    // Update previous roomId
    previousRoomId.current = roomId;

    // If no room selected, clear bed
    if (!roomId) {
      setBedId("");
      return;
    }

    // If room is selected but not found in rooms list
    if (!selectedRoom) {
      // In edit mode, preserve the bed if on tenant's room
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

    // Check if current bed is the tenant's original bed (in edit mode)
    const isOriginalBed =
      !isAddMode && tenantOriginalRoomId === roomId && upperBed === tenantOriginalBed;

    // Reset bed only if:
    // - There's a bed selected
    // - It's not in the allowed letters for this room's capacity
    // - AND it's not the tenant's original bed
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

  // Date of Joining: Allow from today to 1 month back only
  const minJoiningDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxJoiningDate = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d; // Today is the max date (no future dates)
  }, []);

  /* ----------------------------- Due Days Help Text ----------------------------- */

  const dueDaysHelpText = useMemo(() => {
    if (!joiningDate || !dueDate) return "";
    
    const join = startOfDay(joiningDate);
    const due = startOfDay(dueDate);
    const diffMs = due.getTime() - join.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) return "";
    
    // Calculate days for all due types
    if (dueType === "Monthly") {
      // Monthly: typically 30 days, but show actual calculated days
      return `Due rent amount is calculated for Monthly (${diffDays} day${Math.abs(diffDays) === 1 ? "" : "s"})`;
    } else if (dueType === "FirstMonth") {
      // FirstMonth: from joining date to first of next month
      return `Due rent amount is calculated for ${diffDays} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
    } else if (dueType === "Custom") {
      // Custom: show the custom range
      return `Due rent amount is calculated for ${diffDays} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
    }
    
    return "";
  }, [dueType, joiningDate, dueDate]);

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
        params: { tab: "Tenants", refresh: String(Date.now()) },
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
    }

    if (!roomId) {
      errs.push("• Please select a room.");
    }
    if (!bedId) {
      errs.push("• Please select a bed.");
    }

    if (!dueType) {
      errs.push("• Please select due type.");
    }
    if (!dueDate) {
      errs.push("• Due date is required.");
    } else {
      if (startOfDay(dueDate).getTime() < todayStart.getTime()) {
        errs.push("• Due date cannot be in the past.");
      }
    }

    const rentNum = Number(parseFormattedNumber(rentAmount) || 0);
    const depositNum = Number(parseFormattedNumber(depositAmount) || 0);

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

    if (isAddMode) {
      const collectedRentNum = Number(parseFormattedNumber(rentCollected) || 0);
      const collectedDepositNum = Number(parseFormattedNumber(depositCollected) || 0);

      // Collected rent and deposit are now optional - only validate if provided
      if (rentCollected.trim() && collectedRentNum < 0) {
        errs.push("• Collected rent amount cannot be negative.");
      }

      if (depositCollected.trim() && collectedDepositNum < 0) {
        errs.push("• Collected deposit amount cannot be negative.");
      }

      if (rentCollected.trim() && collectedRentNum > rentNum) {
        errs.push("• Collected rent cannot exceed rent amount.");
      }
      if (depositCollected.trim() && collectedDepositNum > depositNum) {
        errs.push("• Collected deposit cannot exceed deposit amount.");
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
    dueType,
    dueDate,
    rentAmount,
    depositAmount,
    rentCollected,
    depositCollected,
    isAddMode,
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
    const collectedRentNum = Number(parseFormattedNumber(rentCollected) || 0);
    const collectedDepositNum = Number(parseFormattedNumber(depositCollected) || 0);

    const dueTypeCode = dueType === "FirstMonth" ? 0 : dueType === "Custom" ? 2 : 1;

    const formData = new FormData();

    formData.append("tenantName", tenantName.trim());
    formData.append("phoneNumber", phone.trim());
    if (email.trim()) formData.append("email", email.trim());
    formData.append("gender", gender);

    if (joiningDate) {
      formData.append("joiningDate", formatDateYMD(joiningDate));
    }

    formData.append("roomId", roomId);
    formData.append("roomld", roomId); // Backend typo fallback
    formData.append("bedNumber", bedId.toUpperCase());

    formData.append("rentAmount", String(rentNum));
    formData.append("depositAmount", String(depositNum));

    formData.append("dueType", String(dueTypeCode));
    if (dueDate) {
      formData.append("dueDate", dueDate.toUTCString());
    }

    if (ownerId) {
      formData.append("ownerId", ownerId);
      formData.append("ownerld", ownerId);
      formData.append("createdBy", ownerId);
    }

    formData.append("lockingPeriod", "");
    formData.append(
      "noticePeriod",
      str((currentProperty as Record<string, unknown>)?.noticePeriod ?? 15, "15")
    );

    if (isAddMode) {
      formData.append("status", "1");
      formData.append("rentAmountPaid", String(collectedRentNum));
      formData.append("depositAmountPaid", String(collectedDepositNum));
      formData.append("advanceRentAmountPaid", "0");
      formData.append("advanceDepositAmountPaid", "0");
      formData.append("dueRentAmount", String(rentNum));
      formData.append("dueDepositAmount", String(depositNum));

      insertTenant.mutate(formData, {
        onSuccess: (data) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Redirect to the new tenant profile view
          const newTenantId = str(data?.data?._id || data?._id || "", "");
          if (newTenantId) {
            router.replace({
              pathname: `/protected/tenant/view/${newTenantId}`,
            });
          } else {
            // Fallback to navigating back to the Tenants tab
            navigateBackToTab();
          }
        },
        onError: (error) => {
          const errMsg =
            (error as { message?: string })?.message ||
            "Could not add tenant. Please try again.";
          Alert.alert("Error", errMsg, [{ text: "OK" }]);
        },
      });
    } else {
      const tenantId = str((currentTenant as Record<string, unknown>)?._id ?? id, "");
      if (!tenantId) {
        Alert.alert("Error", "Unable to identify tenant record.", [{ text: "OK" }]);
        return;
      }

      formData.append("status", "1");
      formData.append("advanceRentAmountPaid", "0");
      formData.append("advanceDepositAmountPaid", "0");
      formData.append("dueRentAmount", String(rentNum));
      formData.append("dueDepositAmount", String(depositNum));

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
              "Could not update tenant. Please try again.";
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
    dueType,
    dueDate,
    rentAmount,
    depositAmount,
    rentCollected,
    depositCollected,
    ownerId,
    currentProperty,
    isAddMode,
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
    setTenantName(text);
  }, []);

  const onAmountChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>, isRent: boolean) => (text: string) => {
      const digitsOnly = parseFormattedNumber(text).slice(0, MAX_AMOUNT_DIGITS);
      setter(digitsOnly ? formatIndianNumber(digitsOnly) : "");
      // Mark as user-changed to prevent auto-override
      if (isRent) {
        userChangedRent.current = true;
      } else {
        userChangedDeposit.current = true;
      }
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
        disabledDateBtn: {
          opacity: 0.6,
          backgroundColor: colors.surface,
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
        helpText: {
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 4,
          fontStyle: "italic",
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

  const headerTitle = isAddMode ? "Add Tenant" : "Edit Tenant";
  const isSubmitting = insertTenant.isPending || updateTenant.isPending;
  const isLoading = roomsLoading || (tenantLoading && !isAddMode);

  // Show payment fields only in add mode when room and amounts are set
  const showPaymentFields =
    isAddMode && !!roomId && !!rentAmount.trim() && !!depositAmount.trim();

  // Loading state for edit when tenant not yet loaded
  if (!isAddMode && tenantLoading && !currentTenant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <PaperText style={{ color: colors.textSecondary, marginTop: 12 }}>
            Loading tenant details...
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
            accessibilityHint="Navigate back to tenants list"
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
                    style={[styles.dateBtn, dueType !== "Custom" && styles.disabledDateBtn]}
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
                {!!dueDaysHelpText && (
                  <Text style={styles.helpText} accessible accessibilityRole="text">
                    {dueDaysHelpText}
                  </Text>
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
                        onChangeText={onAmountChange(setRentAmount, true)}
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
                        onChangeText={onAmountChange(setDepositAmount, false)}
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
              </View>

              {/* Payment Collection Section (Add Mode Only) */}
              {showPaymentFields && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                    Payment Collection
                  </Text>

                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Labeled label="Collected Rent">
                        <TextInput
                          value={rentCollected}
                          onChangeText={onAmountChange(setRentCollected, false)}
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
                          onChangeText={onAmountChange(setDepositCollected, false)}
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

                  <Labeled label="Due Deposit Amount">
                    <TextInput
                      value={dueDepositAmount}
                      editable={false}
                      mode="outlined"
                      theme={{ roundness: radius.lg }}
                      outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                      style={[styles.input, { backgroundColor: colors.surface }]}
                      textColor={colors.textPrimary}
                      left={
                        <TextInput.Affix
                          text="₹"
                          textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                        />
                      }
                      contentStyle={{ minHeight: 48, padding: spacing.sm }}
                      accessibilityLabel="Due deposit amount"
                    />
                  </Labeled>
                </View>
              )}

              {/* Loading hint for rooms */}
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
                  accessibilityHint="Discards changes and returns to tenants list"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  style={styles.primaryBtn}
                  onPress={onSubmit}
                  loading={isSubmitting}
                  disabled={isLoading || isSubmitting}
                  accessibilityLabel={isAddMode ? "Save tenant" : "Save changes"}
                >
                  {isAddMode ? "Save Tenant" : "Save Changes"}
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
          minimumDate={minJoiningDate}
          maximumDate={maxJoiningDate}
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
                minimumDate={minJoiningDate}
                maximumDate={maxJoiningDate}
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
