// app/protected/advancedBooking/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Button,
  RadioButton,
  Text as PaperText,
  TextInput,
  Portal,
  Dialog,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useProperty } from "@/src/context/PropertyContext";
import { useGetAllRooms } from "@/src/hooks/room";
import { useGetAllTenants, useInsertTenant, useUpdateTenant } from "@/src/hooks/tenants";

/* ----------------------------- helpers ----------------------------- */

const str = (v: any, fallback = "") => (v == null ? fallback : String(v));
const num = (v: any, fallback = 0) =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;

const parseISODate = (v: any): Date | null => {
  try {
    const s = str(v, "");
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const formatDisplayDate = (d: Date | null) => {
  if (!d) return "Select date";
  try {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const addDays = (d: Date, days: number) => {
  const nd = new Date(d.getTime());
  nd.setDate(nd.getDate() + days);
  return nd;
};

const addMonths = (d: Date, months: number) => {
  const nd = new Date(d.getTime());
  const day = nd.getDate();
  nd.setMonth(nd.getMonth() + months);
  // If we overflowed month (e.g., 31st), clamp to last day of new month
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

const unwrapPayload = (resp: any): any => {
  if (!resp) return {};
  if (resp.data && typeof resp.data === "object" && !Array.isArray(resp.data)) {
    return resp.data;
  }
  return resp;
};

const isErrorPayload = (payload: any): boolean => {
  if (!payload || typeof payload !== "object") return false;
  if (payload.success === false) return true;
  if (typeof payload.statusCode === "number" && payload.statusCode >= 400) return true;
  return false;
};

const getPayloadMessage = (
  payload: any,
  fallback = "Something went wrong. Please try again."
): string => {
  if (!payload || typeof payload !== "object") return fallback;

  const nested = payload.data && typeof payload.data === "object" ? payload.data : null;

  const msg = payload.errorMessage || payload.message || nested?.errorMessage || nested?.message;

  if (typeof msg === "string" && msg.trim().length > 0) return msg.trim();
  return fallback;
};

const getErrorMessageFromError = (
  err: any,
  fallback = "Something went wrong. Please try again."
): string => {
  if (!err) return fallback;
  const data = err?.response?.data ?? err?.data ?? err;
  if (data && typeof data === "object") {
    return getPayloadMessage(data, fallback);
  }
  if (typeof data === "string" && data.trim().length > 0) return data.trim();
  if (typeof err?.message === "string" && err.message.trim().length > 0) {
    return err.message.trim();
  }
  return fallback;
};

/* ------------------- digits & currency formatting ------------------ */

const MAX_AMOUNT_DIGITS = 9;

const onlyDigitsMax = (value: string, max: number) => value.replace(/[^\d]/g, "").slice(0, max);

/** Format a numeric string as Indian currency with commas, but keep it as plain text (no ₹). */
const formatAmountInput = (value: string): string => {
  const digits = onlyDigitsMax(value, MAX_AMOUNT_DIGITS);
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-IN");
};

/** Parse formatted text like "5,000" to a number (5000). */
const parseAmount = (value: string): number => {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
};

/** Extract rooms array from useGetAllRooms response (same logic as in Rooms Add/Edit) */
const extractRooms = (resp: any): any[] => {
  if (!resp) return [];
  if (resp && typeof resp === "object" && !Array.isArray(resp)) {
    if (Array.isArray(resp.data)) {
      const first = resp.data[0];
      if (first && Array.isArray(first.rooms)) return first.rooms;
      return resp.data;
    }
    if (Array.isArray(resp.rooms)) return resp.rooms;
  }
  if (Array.isArray(resp)) {
    const first = resp[0];
    if (first && Array.isArray(first.rooms)) return first.rooms;
    return resp;
  }
  return [];
};

/** Extract advance-booking tenants from useGetAllTenants response */
const extractAdvanceTenants = (resp: any): any[] => {
  if (!resp) return [];
  if (resp && typeof resp === "object") {
    if (Array.isArray(resp.data)) {
      const bucket = resp.data[0];
      if (bucket && Array.isArray(bucket.tenants)) return bucket.tenants;
    }
    if (Array.isArray(resp.tenants)) return resp.tenants;
  }
  if (Array.isArray(resp)) return resp;
  return [];
};

/* ---------------- room status (same idea as RoomsTab) --------------- */

type DerivedStatus = "Available" | "Partial" | "Filled";

const deriveRoomStatus = (room: any): DerivedStatus => {
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

const BED_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type DueType = "Monthly" | "FirstMonth" | "Custom";

/* ---------------- Bed display status (per bed) ---------------- */

type BedDisplayStatus = "Filled" | "AdvBooked" | "UnderNotice" | "Available";

const bedStatusFromTenantStatuses = (codes: number[]): BedDisplayStatus => {
  if (!codes || codes.length === 0) return "Available";
  // Follow your priority mapping: 1 → Filled, 3 → AdvBooked, 2 → UnderNotice, else Available
  if (codes.some((c) => c === 1)) return "Filled";
  if (codes.some((c) => c === 3)) return "AdvBooked";
  if (codes.some((c) => c === 2)) return "UnderNotice";
  return "Available";
};

interface DateFieldProps {
  label: string;
  value: Date | null;
  placeholder?: string;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

/* ------------------------ Small shared UI pieces ------------------------ */
/** Premium modal-style date picker */
const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  placeholder = "Select date",
  onChange,
  minimumDate,
  maximumDate,
  disabled,
}) => {
  const { colors, radius, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  useEffect(() => {
    if (!open && value) {
      setDraft(value);
    }
  }, [value, open]);

  const handleOpen = () => {
    if (disabled) return;
    Haptics.selectionAsync();
    setDraft(value ?? new Date());
    setOpen(true);
  };

  const handleDone = () => {
    setOpen(false);
    if (draft) {
      Haptics.selectionAsync();
      onChange(draft);
    }
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          color: colors.textSecondary,
          fontWeight: "600",
          marginBottom: 6,
          fontSize: typography.fontSizeSm,
        }}
      >
        {label}
      </Text>
      <Pressable
        disabled={disabled}
        onPress={handleOpen}
        style={{
          borderWidth: 1,
          borderColor: colors.borderColor,
          borderRadius: radius.lg,
          backgroundColor: disabled ? colors.surface : colors.cardSurface,
          paddingVertical: 12,
          paddingHorizontal: 12,
          minHeight: 48,
          justifyContent: "center",
          opacity: disabled ? 0.7 : 1,
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialIcons
            name="event"
            size={18}
            color={disabled ? colors.textMuted : colors.textSecondary}
          />
          <PaperText
            style={{
              color: value ? colors.textPrimary : colors.textMuted,
              fontSize: typography.fontSizeSm,
            }}
          >
            {value ? formatDisplayDate(value) : placeholder}
          </PaperText>
        </View>
      </Pressable>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{ backgroundColor: colors.cardBackground }}
        >
          <Dialog.Title style={{ color: colors.textPrimary }}>{label}</Dialog.Title>
          <Dialog.Content>
            <DateTimePicker
              value={draft ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_, d) => {
                if (d) setDraft(d);
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)} textColor={colors.textPrimary}>
              Cancel
            </Button>
            <Button onPress={handleDone} textColor={colors.accent}>
              Done
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

interface RoomOption {
  id: string;
  roomNo: string;
  status: DerivedStatus;
}

interface RoomSelectProps {
  label: string;
  value?: string; // roomId
  onChange: (id: string) => void;
  rooms: RoomOption[];
}

/** Premium bottom-sheet “dropdown” for Room */
const RoomSelect: React.FC<RoomSelectProps> = ({ label, value, onChange, rooms }) => {
  const { colors, radius, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);

  const statusColor = useMemo(
    () => ({
      Available: colors.availableBeds,
      Partial: colors.advBookedBeds,
      Filled: colors.filledBeds,
    }),
    [colors]
  );

  const selectedRoom = rooms.find((r) => r.id === value);

  return (
    <>
      <View style={{ marginBottom: spacing.md }}>
        <Text
          style={{
            color: colors.textSecondary,
            fontWeight: "600",
            marginBottom: 6,
            fontSize: typography.fontSizeSm,
          }}
        >
          {label}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setOpen(true);
          }}
          style={{
            borderWidth: 1,
            borderColor: colors.borderColor,
            borderRadius: radius.lg,
            backgroundColor: colors.cardSurface,
            paddingVertical: 12,
            paddingHorizontal: 12,
            minHeight: 48,
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <PaperText
              style={{
                color: selectedRoom ? colors.textPrimary : colors.textMuted,
                fontSize: typography.fontSizeSm,
              }}
              numberOfLines={1}
            >
              {selectedRoom ? `Room - ${selectedRoom.roomNo}` : "Select room"}
            </PaperText>
            <MaterialIcons
              name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>
      </View>

      {open && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: "flex-end",
            backgroundColor: hexToRgba(colors.backDrop ?? "#000000", 0.35),
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close room selection"
          />
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: spacing.sm }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: hexToRgba(colors.textSecondary, 0.25),
                }}
              />
            </View>
            <PaperText
              style={{
                color: colors.textPrimary,
                fontSize: typography.fontSizeMd,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              Select room
            </PaperText>
            <ScrollView
              style={{ maxHeight: 380 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.md }}
            >
              {rooms.length === 0 ? (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 8 }}>
                  No rooms available.
                </PaperText>
              ) : (
                rooms.map((r) => {
                  const selected = r.id === value;
                  const bg = selected ? hexToRgba(colors.accent, 0.14) : "transparent";
                  const border = selected ? colors.accent : "transparent";
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onChange(r.id);
                        setOpen(false);
                      }}
                      style={{
                        paddingVertical: 14,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderColor: hexToRgba(colors.textSecondary, 0.16),
                        backgroundColor: bg,
                        borderWidth: selected ? 1 : 0,
                        borderRadius: 10,
                        marginBottom: 6,
                        paddingHorizontal: 8,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <PaperText
                          style={{
                            color: colors.textPrimary,
                            fontSize: typography.fontSizeSm,
                          }}
                        >
                          Room - {r.roomNo}
                        </PaperText>
                        <View
                          style={{
                            backgroundColor:
                              statusColor[r.status] ?? hexToRgba(colors.textSecondary, 0.2),
                            borderRadius: 999,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.white,
                              fontSize: 11,
                              fontWeight: "700",
                              textTransform: "uppercase",
                            }}
                          >
                            {r.status}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Button onPress={() => setOpen(false)} textColor={colors.accent}>
              Close
            </Button>
          </View>
        </View>
      )}
    </>
  );
};

interface BedOption {
  value: string;
  status: BedDisplayStatus;
  disabled?: boolean;
}

interface BedSelectProps {
  label: string;
  value?: string;
  options: BedOption[];
  onChange: (v: string) => void;
  disabled?: boolean;
}

/** Premium bottom-sheet “dropdown” for Bed */
const BedSelect: React.FC<BedSelectProps> = ({ label, value, options, onChange, disabled }) => {
  const { colors, radius, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);
  const bedStatusColors = useMemo(
    () => ({
      Filled: colors.filledBeds,
      AdvBooked: colors.advBookedBeds,
      UnderNotice: colors.underNoticeBeds ?? colors.advBookedBeds,
      Available: colors.availableBeds ?? colors.success,
    }),
    [colors]
  );

  return (
    <>
      <View style={{ marginBottom: spacing.md }}>
        <Text
          style={{
            color: colors.textSecondary,
            fontWeight: "600",
            marginBottom: 6,
            fontSize: typography.fontSizeSm,
          }}
        >
          {label}
        </Text>
        <Pressable
          disabled={disabled}
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
            paddingVertical: 12,
            paddingHorizontal: 12,
            minHeight: 48,
            justifyContent: "center",
            opacity: disabled ? 0.7 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <PaperText
              style={{
                color: selectedOption ? colors.textPrimary : colors.textMuted,
                fontSize: typography.fontSizeSm,
              }}
            >
              {selectedOption
                ? `Bed ${selectedOption.value} (${selectedOption.status})`
                : value
                ? `Bed ${String(value).toUpperCase()}`
                : "Select bed"}
            </PaperText>
            <MaterialIcons
              name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>
      </View>

      {open && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: "flex-end",
            backgroundColor: hexToRgba(colors.backDrop ?? "#000000", 0.35),
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close bed selection"
          />
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: spacing.sm }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: hexToRgba(colors.textSecondary, 0.25),
                }}
              />
            </View>
            <PaperText
              style={{
                color: colors.textPrimary,
                fontSize: typography.fontSizeMd,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              Select bed
            </PaperText>
            <ScrollView
              style={{ maxHeight: 280 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.md }}
            >
              {options.length === 0 ? (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 8 }}>
                  No beds defined for this room.
                </PaperText>
              ) : (
                options.map((opt) => {
                  const isSelected = opt.value === value;
                  const isDisabled = !!opt.disabled;

                  return (
                    <Pressable
                      key={opt.value}
                      disabled={isDisabled}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderColor: hexToRgba(colors.textSecondary, 0.14),
                        opacity: isDisabled ? 0.4 : 1,
                        backgroundColor: isSelected
                          ? hexToRgba(colors.accent, 0.14)
                          : "transparent",
                        borderRadius: isSelected ? 10 : 0,
                        marginBottom: 4,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <PaperText
                          style={{
                            color: colors.textPrimary,
                            fontSize: typography.fontSizeSm,
                            fontWeight: isSelected ? "700" : "500",
                          }}
                        >
                          Bed {opt.value}
                        </PaperText>
                        <View
                          style={{
                            backgroundColor:
                              bedStatusColors[opt.status] ?? hexToRgba(colors.textSecondary, 0.2),
                            borderRadius: 999,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.white,
                              fontSize: 11,
                              fontWeight: "700",
                            }}
                          >
                            {opt.status}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Button onPress={() => setOpen(false)} textColor={colors.accent}>
              Close
            </Button>
          </View>
        </View>
      )}
    </>
  );
};

/* -------------------------------- Screen -------------------------------- */

export default function AdvancedBookingScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();
  const { selectedId, properties } = useProperty();
  const { profileData } = useSelector((state: any) => state.profileDetails);
  const propertyId = selectedId as string | undefined;

  const isAddMode = String(id) === "add";
  const isConvertMode = !isAddMode && mode === "convert";
  const isEditMode = !isAddMode && !isConvertMode;

  const ownerIdSafe = str(
    profileData?.ownerId ?? profileData?.userId ?? profileData?._id ?? "",
    ""
  );

  const currentProperty = useMemo(
    () => properties.find((p) => p._id === propertyId),
    [properties, propertyId]
  );

  const {
    data: roomsResp,
    isLoading: roomsLoading,
    error: roomsError,
  } = useGetAllRooms(propertyId as string);

  const {
    data: tenantsResp,
    isLoading: tenantsLoading,
    error: tenantsError,
  } = useGetAllTenants(propertyId as string, "?status=3,5,6");

  const rooms = useMemo(() => extractRooms(roomsResp), [roomsResp]);
  const allAdvanceTenants = useMemo(() => extractAdvanceTenants(tenantsResp), [tenantsResp]);

  const currentTenant = useMemo(() => {
    if (isAddMode || !id) return null;
    const key = String(id);
    return (
      allAdvanceTenants[0]?.tenants?.find((t: any) => String(t?._id ?? t?.id ?? "") === key) ?? null
    );
  }, [allAdvanceTenants, id, isAddMode]);

  /* ----------------------------- form state ----------------------------- */

  const [tenantName, setTenantName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [gender, setGender] = useState<"Male" | "Female">("Male");

  const [joiningDate, setJoiningDate] = useState<Date | null>(null);
  const [initialJoiningDate, setInitialJoiningDate] = useState<Date | null>(null);

  const [roomId, setRoomId] = useState<string>("");
  const [bed, setBed] = useState<string>("");

  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [advRentCollected, setAdvRentCollected] = useState("");
  const [advDepositCollected, setAdvDepositCollected] = useState("");
  const [rentCollected, setRentCollected] = useState("");
  const [depositCollected, setDepositCollected] = useState("");

  const [dueType, setDueType] = useState<DueType>("Monthly");
  const [dueDate, setDueDate] = useState<Date | null>(null);

  /* ---------------------- prefill Edit / Convert ----------------------- */

  useEffect(() => {
    if (isAddMode || !currentTenant) {
      setInitialJoiningDate(null);
      return;
    }

    setTenantName(str(currentTenant.tenantName, ""));
    setPhone(str(currentTenant.phoneNumber, "").replace(/[^\d]/g, "").slice(0, 10));
    setEmail(str(currentTenant.email ?? "", ""));

    setGender(String(currentTenant.gender).toLowerCase() === "female" ? "Female" : "Male");

    const j =
      parseISODate(currentTenant.joiningDate) ||
      parseISODate(currentTenant.joinDate) ||
      parseISODate(currentTenant.joinedOn);
    setJoiningDate(j);
    setInitialJoiningDate(j);

    // setRoomId(str(currentTenant.roomId ?? "", ""));

    const tenantRoomIdRaw =
      currentTenant?.roomId?._id ??
      currentTenant?.roomId ??
      currentTenant?.room?._id ??
      currentTenant?.room?.id ??
      "";

    const tenantRoomId = str(tenantRoomIdRaw, "");
    setRoomId(tenantRoomId);
    setBed(str(currentTenant.bedNumber ?? "", "").toUpperCase());

    setRentAmount(
      currentTenant.rentAmount != null
        ? formatAmountInput(String(num(currentTenant.rentAmount)))
        : ""
    );
    setDepositAmount(
      currentTenant.depositAmount != null
        ? formatAmountInput(String(num(currentTenant.depositAmount)))
        : ""
    );

    setAdvRentCollected(
      currentTenant.advanceRentAmountPaid != null
        ? formatAmountInput(String(num(currentTenant.advanceRentAmountPaid)))
        : ""
    );
    setAdvDepositCollected(
      currentTenant.advanceDepositAmountPaid != null
        ? formatAmountInput(String(num(currentTenant.advanceDepositAmountPaid)))
        : ""
    );

    setRentCollected(
      currentTenant.rentAmountPaid != null
        ? formatAmountInput(String(num(currentTenant.rentAmountPaid)))
        : ""
    );
    setDepositCollected(
      currentTenant.depositAmountPaid != null
        ? formatAmountInput(String(num(currentTenant.depositAmountPaid)))
        : ""
    );

    // For both Edit and Convert, default Due Type to Monthly.
    // For Convert mode, actual dueDate will be recomputed in the due-date effect.
    setDueType("Monthly");
    setDueDate(null);
  }, [isAddMode, currentTenant]);

  /* ---------------------- recompute Due Date logic --------------------- */

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

  /* ------------------------- rooms & beds options ---------------------- */

  const roomOptions: RoomOption[] = useMemo(
    () =>
      (rooms ?? [])
        .map((room: any) => {
          const rid = str(room?._id ?? room?.id ?? "", "");
          const roomNo = str(room?.roomNo ?? room?.roomNumber ?? "", "");
          if (!rid || !roomNo) return null;
          return {
            id: rid,
            roomNo,
            status: deriveRoomStatus(room),
          } as RoomOption;
        })
        .filter(Boolean) as RoomOption[],
    [rooms]
  );

  const selectedRoom = useMemo(
    () => rooms.find((r: any) => String(r?._id ?? r?.id ?? "") === roomId),
    [rooms, roomId]
  );

  // Auto-bind rent & deposit when a room is picked (user can still override)
  useEffect(() => {
    if (!selectedRoom) return;
    const price = num(selectedRoom.bedPrice);
    const deposit = num(selectedRoom.securityDeposit);

    if (price > 0) {
      setRentAmount(formatAmountInput(String(price)));
    }
    if (deposit > 0) {
      setDepositAmount(formatAmountInput(String(deposit)));
    }
  }, [selectedRoom]);

  const bedOptions: BedOption[] = useMemo(() => {
    if (!selectedRoom) return [];

    const sharing = num(selectedRoom.beds, 0);
    if (!sharing) return [];

    const letters = BED_LETTERS.slice(0, Math.min(sharing, BED_LETTERS.length)).split("");

    const bpr: any[] = Array.isArray(selectedRoom.bedsPerRoom) ? selectedRoom.bedsPerRoom : [];

    const tenantBedUpper = str(bed, "").toUpperCase();
    // const isExistingAssignment =
    //   !isAddMode &&
    //   !!currentTenant &&
    //   str(currentTenant.roomId ?? "", "") === roomId &&
    //   !!tenantBedUpper;

    const tenantRoomIdForCheck = currentTenant
      ? str(
          currentTenant.roomId?._id ??
            currentTenant.roomId ??
            currentTenant.room?._id ??
            currentTenant.room?.id ??
            "",
          ""
        )
      : "";

    const isExistingAssignment =
      !isAddMode && !!tenantRoomIdForCheck && tenantRoomIdForCheck === roomId && !!tenantBedUpper;

    return letters.map((letter) => {
      const match = bpr.find(
        (b: any) => str(b?._id ?? b?.bedNumber, "").toUpperCase() === letter.toUpperCase()
      );
      const codes = (Array.isArray(match?.tenantsPerBed) ? match.tenantsPerBed : [])
        .map((t: any) => num(t?.tenantStatus))
        .filter((c: number) => c > 0);
      const status = bedStatusFromTenantStatuses(codes);
      const isCurrent = isExistingAssignment && tenantBedUpper === letter.toUpperCase();

      // In add mode: only Available can be selected.
      // In edit/convert: Available + current tenant's own bed can be selected.
      const disabled = status !== "Available" && !isCurrent;

      return {
        value: letter,
        status,
        disabled,
      };
    });
  }, [selectedRoom, bed, isAddMode, currentTenant, roomId]);

  // Reset bed when room changes to something incompatible
  useEffect(() => {
    if (!selectedRoom) {
      setBed("");
      return;
    }
    const sharing = num(selectedRoom.beds, 0);
    const allowedLetters = BED_LETTERS.slice(0, Math.min(sharing, BED_LETTERS.length))
      .split("")
      .map((c) => c.toUpperCase());

    const upperBed = str(bed, "").toUpperCase();
    const isExistingAssignment =
      !isAddMode &&
      !!currentTenant &&
      str(currentTenant.roomId ?? "", "") === roomId &&
      upperBed === str(currentTenant.bedNumber ?? "", "").toUpperCase();

    if (!bed) return;

    if (!allowedLetters.includes(upperBed) && !isExistingAssignment) {
      setBed("");
    }
  }, [selectedRoom, bed, isAddMode, currentTenant, roomId]);

  /* ---------------------------- joining date limits -------------------- */

  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const joiningMinDate = useMemo(() => {
    if (isAddMode) {
      return addDays(todayStart, 1); // tomorrow
    }
    if (initialJoiningDate) {
      return startOfDay(addMonths(initialJoiningDate, -1)); // 1 month back
    }
    return undefined;
  }, [isAddMode, initialJoiningDate, todayStart]);

  const joiningMaxDate = useMemo(() => {
    if (isAddMode) {
      return undefined; // no upper limit in add mode
    }
    if (initialJoiningDate) {
      return startOfDay(initialJoiningDate);
    }
    return undefined;
  }, [isAddMode, initialJoiningDate]);

  /* ---------------------------- validation ----------------------------- */
  const validate = (): string | null => {
    if (!propertyId) return "Please select a property first.";

    if (!tenantName.trim()) return "Tenant name is required.";

    if (!phone.trim()) return "Phone number is required.";
    if (phone.trim().length !== 10) return "Phone number must be 10 digits.";

    if (!joiningDate) return "Date of joining is required.";

    // Joining date rules
    const jdStart = startOfDay(joiningDate);
    if (isAddMode) {
      const tomorrow = addDays(todayStart, 1);
      if (jdStart.getTime() < tomorrow.getTime()) {
        return "For advance booking, date of joining must be from tomorrow onwards.";
      }
    } else if (initialJoiningDate) {
      const minAllowed = startOfDay(addMonths(initialJoiningDate, -1));
      const maxAllowed = startOfDay(initialJoiningDate);
      if (jdStart.getTime() < minAllowed.getTime() || jdStart.getTime() > maxAllowed.getTime()) {
        return "In edit / convert mode, date of joining can only be changed up to 1 month earlier than the original date.";
      }
    }

    if (!roomId) return "Please select a room.";
    if (!bed) return "Please select a bed.";

    if (!rentAmount.trim()) return "Rent amount is required.";
    if (!depositAmount.trim()) return "Deposit amount is required.";

    const rent = parseAmount(rentAmount);
    const deposit = parseAmount(depositAmount);
    const advRent = parseAmount(advRentCollected);
    const advDeposit = parseAmount(advDepositCollected);
    const collectedRentNum = parseAmount(rentCollected);
    const collectedDepositNum = parseAmount(depositCollected);

    if (rent <= 0) return "Rent amount must be greater than 0.";
    if (deposit <= 0) return "Deposit amount must be greater than 0.";

    if (advRentCollected.trim() && advRent <= 0) {
      return "Paid advance rent amount must be greater than 0.";
    }

    if (advDepositCollected.trim() && advDeposit <= 0) {
      return "Paid advance deposit amount must be greater than 0.";
    }

    if (advRent > 0 && rent > 0 && advRent > rent) {
      return "Paid advance rent amount cannot be greater than rent amount.";
    }

    if (advDeposit > 0 && deposit > 0 && advDeposit > deposit) {
      return "Paid advance deposit amount cannot be greater than deposit amount.";
    }

    if (isConvertMode) {
      if (!advRentCollected.trim()) {
        return "Paid advance rent amount is required in convert mode.";
      }
      if (!advDepositCollected.trim()) {
        return "Paid advance deposit amount is required in convert mode.";
      }

      if (!dueType) return "Please select due type.";
      if (!dueDate) return "Due date is required.";

      const today = startOfDay(new Date());
      if (startOfDay(dueDate).getTime() < today.getTime()) {
        return "Due date cannot be in the past.";
      }

      if (collectedRentNum > 0 && collectedRentNum > advRent + rent) {
        return "Collected rent amount cannot be greater than paid advance rent plus rent amount.";
      }

      if (collectedDepositNum > 0 && collectedDepositNum > deposit + advDeposit) {
        return "Collected deposit amount cannot be greater than deposit amount plus paid advance deposit.";
      }
    }

    if (email.trim()) {
      const re = /^\S+@\S+\.\S+$/;
      if (!re.test(email.trim())) return "Please enter a valid email address.";
    }

    if (!isAddMode && !currentTenant) {
      return "Unable to load advance booking details for this tenant.";
    }

    return null;
  };

  /* ----------------------------- navigation ---------------------------- */

  const goToAdvanceBookingTab = () => {
    if (propertyId) {
      router.replace({
        pathname: `/protected/property/${propertyId}`,
        params: { tab: "Advance Booking" },
      });
    } else {
      router.replace("/protected/(tabs)/Properties");
    }
  };

  const handleBack = () => {
    goToAdvanceBookingTab();
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  /* ----------------------------- error toast --------------------------- */

  useEffect(() => {
    const err: any = roomsError || tenantsError;
    if (!err) return;
    const msg = getErrorMessageFromError(err, "Something went wrong. Please try again.");
    Toast.show({ type: "error", text1: msg, position: "bottom" });
  }, [roomsError, tenantsError]);

  /* ------------------------------ mutations ---------------------------- */

  const insertTenantMutation = useInsertTenant((resp: any) => {
    const payload = unwrapPayload(resp);

    if (isErrorPayload(payload)) {
      const errMsg = getPayloadMessage(payload, "Something went wrong. Please try again.");
      Toast.show({ type: "error", text1: errMsg, position: "bottom" });
      return;
    }

    const msg = getPayloadMessage(payload, "Advance booking added successfully.");
    Toast.show({ type: "success", text1: msg, position: "bottom" });
    goToAdvanceBookingTab();
  });

  const updateTenantMutation = useUpdateTenant((resp: any) => {
    const payload = unwrapPayload(resp);

    if (isErrorPayload(payload)) {
      const errMsg = getPayloadMessage(payload, "Something went wrong. Please try again.");
      Toast.show({ type: "error", text1: errMsg, position: "bottom" });
      return;
    }

    const fallbackMsg = isConvertMode
      ? "Tenant converted successfully."
      : "Advance booking updated successfully.";
    const msg = getPayloadMessage(payload, fallbackMsg);

    Toast.show({ type: "success", text1: msg, position: "bottom" });
    goToAdvanceBookingTab();
  });

  useEffect(() => {
    const err: any = insertTenantMutation.error || updateTenantMutation.error;
    if (!err) return;
    const msg = getErrorMessageFromError(err, "Something went wrong. Please try again.");
    Toast.show({ type: "error", text1: msg, position: "bottom" });
  }, [insertTenantMutation.error, updateTenantMutation.error]);

  const isSubmitting = insertTenantMutation.isPending || updateTenantMutation.isPending;

  /* ------------------------------ submit ------------------------------- */

  const onSubmit = () => {
    const error = validate();
    if (error) {
      Toast.show({ type: "error", text1: error, position: "bottom" });
      return;
    }

    if (!propertyId) return;

    const rentNum = parseAmount(rentAmount);
    const depositNum = parseAmount(depositAmount);
    const advRentNum = parseAmount(advRentCollected);
    const advDepositNum = parseAmount(advDepositCollected);
    const collectedRentNum = parseAmount(rentCollected);
    const collectedDepositNum = parseAmount(depositCollected);

    const formData = new FormData();

    formData.append("tenantName", tenantName.trim());
    formData.append("phoneNumber", phone.trim());
    if (email.trim()) formData.append("email", email.trim());
    formData.append("gender", gender);

    if (joiningDate) {
      formData.append("joiningDate", joiningDate.toISOString());
    }

    if (roomId) {
      formData.append("roomId", roomId);
      // for safety if backend expects this typo'd key
      formData.append("roomld", roomId);
    }
    if (bed) {
      formData.append("bedNumber", bed);
    }

    formData.append("rentAmount", String(rentNum));
    formData.append("depositAmount", String(depositNum));

    // As per your examples
    formData.append("lockingPeriod", "");
    formData.append("noticePeriod", "15");

    if (advRentNum) {
      formData.append("advanceRentAmountPaid", String(advRentNum));
    }
    if (advDepositNum) {
      formData.append("advanceDepositAmountPaid", String(advDepositNum));
    }

    if (ownerIdSafe) {
      formData.append("ownerId", ownerIdSafe);
      formData.append("ownerld", ownerIdSafe);
      formData.append("createdBy", ownerIdSafe);
    }

    if (isAddMode) {
      // Add Advance Booking
      formData.append("status", "3");
      formData.append("dueType", "0");
      insertTenantMutation.mutate(formData);
    } else {
      const tenantKey = str(currentTenant?._id ?? id, "");
      if (!tenantKey) {
        Toast.show({
          type: "error",
          text1: "Unable to identify booking record.",
          position: "bottom",
        });
        return;
      }

      if (isConvertMode) {
        // Convert to tenant
        const dueTypeCode = dueType === "FirstMonth" ? 0 : dueType === "Custom" ? 2 : 1;

        formData.append("status", "1");
        formData.append("dueType", String(dueTypeCode));

        if (dueDate) {
          formData.append("dueDate", dueDate.toUTCString());
        }

        if (collectedRentNum) {
          formData.append("rentAmountPaid", String(collectedRentNum));
        }
        if (collectedDepositNum) {
          formData.append("depositAmountPaid", String(collectedDepositNum));
        }

        // Due amounts – sensible formula
        const dueRentAmount = Math.max(rentNum - advRentNum - collectedRentNum, 0);
        const dueDepositAmount = Math.max(depositNum - advDepositNum - collectedDepositNum, 0);

        formData.append("dueRentAmount", String(dueRentAmount));
        formData.append("dueDepositAmount", String(dueDepositAmount));
      } else if (isEditMode) {
        // Edit advance booking
        formData.append("status", "3");
        formData.append("dueType", "0");
      }

      updateTenantMutation.mutate({ formData, tenantId: tenantKey });
    }
  };
  /* ------------------------------ styles ------------------------------- */
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
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
          // Extra bottom padding so buttons don't touch the "chin" / nav bar
          paddingBottom: insets.bottom + spacing.lg * 2,
        },
        sectionCard: {
          borderWidth: 1,
          borderColor: colors.borderColor,
          borderRadius: radius.xl,
          backgroundColor: colors.cardBackground,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontWeight: "700",
          marginBottom: 8,
          fontSize: typography.fontSizeMd,
        },
        fieldBlock: {
          marginBottom: spacing.md,
        },
        label: {
          color: colors.textSecondary,
          fontWeight: "600",
          marginBottom: 6,
          fontSize: typography.fontSizeSm,
        },
        disabledInput: {
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          padding: 14,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderColor,
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
        },
        secondaryBtn: {
          flex: 1,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderColor,
          minHeight: 44,
          justifyContent: "center",
        },
        primaryBtn: {
          flex: 1,
          borderRadius: radius.lg,
          minHeight: 44,
          justifyContent: "center",
        },
        genderChipRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.lg,
        },
        genderChip: {
          flexDirection: "row",
          alignItems: "center",
        },
      }),
    [colors, radius, spacing, typography, insets.bottom]
  );

  const headerTitle = isAddMode
    ? "Add Advance Booking"
    : isConvertMode
    ? "Convert to Tenant"
    : "Edit Advance Booking";

  const headerSubtitle = str(currentProperty?.propertyName ?? "", "");

  const inputContentStyle = { minHeight: 44, paddingVertical: 8 };

  // Loading state when editing but tenant not yet loaded
  if (!isAddMode && tenantsLoading && !currentTenant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          android_ripple={{
            color: hexToRgba(colors.textSecondary, 0.2),
            borderless: true,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 18 }}>{"←"}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <PaperText style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </PaperText>
          {!!headerSubtitle && (
            <PaperText style={styles.headerSubtitle} numberOfLines={1}>
              {headerSubtitle}
            </PaperText>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Property (read only) */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Property</Text>
            <RNTextInput
              editable={false}
              value={str(currentProperty?.propertyName ?? "", "Select property")}
              style={styles.disabledInput}
            />
          </View>

          {/* Tenant details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tenant details</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Tenant name *</Text>
              <TextInput
                value={tenantName}
                onChangeText={setTenantName}
                mode="outlined"
                placeholder="Enter tenant name"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                contentStyle={inputContentStyle}
              />
            </View>

            {/* <View style={styles.row}> */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Phone number *</Text>
              <TextInput
                value={phone}
                onChangeText={(t) => setPhone(onlyDigitsMax(t, 10))}
                mode="outlined"
                placeholder="10 digit number"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
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
                contentStyle={inputContentStyle}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Email (optional)</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                placeholder="Enter tenant email"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                contentStyle={inputContentStyle}
              />
            </View>
            {/* </View> */}

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Gender *</Text>
              <RadioButton.Group
                onValueChange={(v) => setGender(v === "Female" ? "Female" : "Male")}
                value={gender}
              >
                <View style={styles.genderChipRow}>
                  <Pressable
                    style={styles.genderChip}
                    onPress={() => setGender("Male")}
                    accessibilityRole="button"
                    accessibilityLabel="Male"
                  >
                    <RadioButton value="Male" />
                    <Text style={{ color: colors.textPrimary }}>Male</Text>
                  </Pressable>
                  <Pressable
                    style={styles.genderChip}
                    onPress={() => setGender("Female")}
                    accessibilityRole="button"
                    accessibilityLabel="Female"
                  >
                    <RadioButton value="Female" />
                    <Text style={{ color: colors.textPrimary }}>Female</Text>
                  </Pressable>
                </View>
              </RadioButton.Group>
            </View>
          </View>

          {/* Booking details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Booking details</Text>

            <DateField
              label="Date of joining *"
              value={joiningDate}
              onChange={(d) => setJoiningDate(startOfDay(d))}
              placeholder="Select date of joining"
              minimumDate={joiningMinDate}
              maximumDate={joiningMaxDate}
            />

            {/* <View style={styles.row}> */}
            <View style={styles.col}>
              <RoomSelect label="Room *" value={roomId} onChange={setRoomId} rooms={roomOptions} />
            </View>
            <View style={styles.col}>
              <BedSelect
                label="Bed *"
                value={bed}
                options={bedOptions}
                onChange={setBed}
                disabled={!roomId}
              />
            </View>
            {/* </View> */}

            {isConvertMode && (
              <>
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Due type *</Text>
                  <RadioButton.Group
                    value={dueType}
                    onValueChange={(v) => {
                      const mapped =
                        v === "FirstMonth" ? "FirstMonth" : v === "Custom" ? "Custom" : "Monthly";
                      setDueType(mapped);
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: spacing.md,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <RadioButton value="Monthly" />
                        <Text style={{ color: colors.textPrimary }}>Monthly</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <RadioButton value="FirstMonth" />
                        <Text style={{ color: colors.textPrimary }}>1st Month</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <RadioButton value="Custom" />
                        <Text style={{ color: colors.textPrimary }}>Custom</Text>
                      </View>
                    </View>
                  </RadioButton.Group>
                </View>

                <DateField
                  label="Due date *"
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Select due date"
                  disabled={dueType !== "Custom"}
                  minimumDate={startOfDay(new Date())}
                />
              </>
            )}
          </View>

          {/* Financials */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Financials</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Rent amount *</Text>
              <TextInput
                value={rentAmount}
                onChangeText={(t) => setRentAmount(formatAmountInput(t))}
                mode="outlined"
                placeholder="e.g., 5,000"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                maxLength={MAX_AMOUNT_DIGITS + 3}
                left={
                  <TextInput.Affix
                    text="₹"
                    textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                  />
                }
                contentStyle={inputContentStyle}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Deposit amount *</Text>
              <TextInput
                value={depositAmount}
                onChangeText={(t) => setDepositAmount(formatAmountInput(t))}
                mode="outlined"
                placeholder="e.g., 10,000"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                maxLength={MAX_AMOUNT_DIGITS + 3}
                left={
                  <TextInput.Affix
                    text="₹"
                    textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                  />
                }
                contentStyle={inputContentStyle}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Paid advance rent amount{isConvertMode ? " *" : ""}</Text>
              <TextInput
                value={advRentCollected}
                onChangeText={(t) => setAdvRentCollected(formatAmountInput(t))}
                mode="outlined"
                placeholder="e.g., 5,000"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                maxLength={MAX_AMOUNT_DIGITS + 3}
                left={
                  <TextInput.Affix
                    text="₹"
                    textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                  />
                }
                contentStyle={inputContentStyle}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>
                Paid advance deposit amount{isConvertMode ? " *" : ""}
              </Text>
              <TextInput
                value={advDepositCollected}
                onChangeText={(t) => setAdvDepositCollected(formatAmountInput(t))}
                mode="outlined"
                placeholder="e.g., 5,000"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                maxLength={MAX_AMOUNT_DIGITS + 3}
                left={
                  <TextInput.Affix
                    text="₹"
                    textStyle={{ color: colors.textSecondary, fontWeight: "600" }}
                  />
                }
                contentStyle={inputContentStyle}
              />
            </View>

            {isConvertMode && (
              <>
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Collected rent amount (optional)</Text>
                  <TextInput
                    value={rentCollected}
                    onChangeText={(t) => setRentCollected(formatAmountInput(t))}
                    mode="outlined"
                    placeholder="e.g., 5,000"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={{ backgroundColor: colors.cardSurface }}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    maxLength={MAX_AMOUNT_DIGITS + 3}
                    left={
                      <TextInput.Affix
                        text="₹"
                        textStyle={{
                          color: colors.textSecondary,
                          fontWeight: "600",
                        }}
                      />
                    }
                    contentStyle={inputContentStyle}
                  />
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Collected deposit amount (optional)</Text>
                  <TextInput
                    value={depositCollected}
                    onChangeText={(t) => setDepositCollected(formatAmountInput(t))}
                    mode="outlined"
                    placeholder="e.g., 5,000"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={{ backgroundColor: colors.cardSurface }}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    maxLength={MAX_AMOUNT_DIGITS + 3}
                    left={
                      <TextInput.Affix
                        text="₹"
                        textStyle={{
                          color: colors.textSecondary,
                          fontWeight: "600",
                        }}
                      />
                    }
                    contentStyle={inputContentStyle}
                  />
                </View>
              </>
            )}
          </View>

          {/* Loading hint for rooms */}
          {roomsLoading && (
            <View style={{ marginTop: spacing.sm, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>
                Loading rooms…
              </Text>
            </View>
          )}

          {/* Footer buttons */}
          <View style={styles.footerRow}>
            <Button
              mode="outlined"
              style={styles.secondaryBtn}
              textColor={colors.textPrimary}
              onPress={handleBack}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              style={styles.primaryBtn}
              onPress={onSubmit}
              disabled={roomsLoading || (tenantsLoading && !isAddMode) || isSubmitting}
            >
              {isConvertMode ? "Save & Convert" : isAddMode ? "Save Booking" : "Save Changes"}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
