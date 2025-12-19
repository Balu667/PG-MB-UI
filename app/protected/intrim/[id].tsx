// app/protected/intrim/[id].tsx
// Add/Edit Interim Booking Screen - Premium design matching tenant and advancedBooking screens
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Modal,
  BackHandler,
  I18nManager,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  TextInput,
  RadioButton,
  Text as PaperText,
  Button,
  Portal,
  Dialog,
  Divider,
  Snackbar,
} from "react-native-paper";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSelector } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useGetRoomsForShortTermBooking } from "@/src/hooks/room";
import { useInsertShortTerm, useUpdateTenant, useGetAllTenantDetails } from "@/src/hooks/tenants";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;

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

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone: string): boolean => /^\d{10}$/.test(phone.replace(/\D/g, ""));

const MAX_AMOUNT_DIGITS = 9;

// Calculate due amount for stay - supports same-day (1 day) stays
const calculateDueAmount = (joiningDate: Date | null, moveOutDate: Date | null, rentAmount: number): number => {
  if (!joiningDate || !moveOutDate || rentAmount <= 0) return 0;

  const start = startOfDay(joiningDate);
  const end = startOfDay(moveOutDate);

  // Allow same day stay (1 day)
  if (end.getTime() === start.getTime()) {
    const daysInMonth = getDaysInMonth(start.getFullYear(), start.getMonth());
    return Math.round(rentAmount / daysInMonth);
  }

  if (end < start) return 0;

  // Calculate staying days (inclusive)
  const stayingDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Check if same month
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const daysInMonth = getDaysInMonth(start.getFullYear(), start.getMonth());
    return Math.round((rentAmount / daysInMonth) * stayingDays);
  }

  // Multiple months - split calculation
  let totalAmount = 0;
  let currentDate = new Date(start);

  while (currentDate <= end) {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);

    // First day of next month
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Days in this month
    const startDay = currentDate.getDate();
    const endDay = end < lastDayOfMonth ? end.getDate() : lastDayOfMonth.getDate();
    const daysInPeriod = endDay - startDay + 1;

    totalAmount += (rentAmount / daysInCurrentMonth) * daysInPeriod;

    // Move to next month
    if (nextMonth > end) break;
    currentDate = nextMonth;
  }

  return Math.round(totalAmount);
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

export default function IntrimBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();

  const params = useLocalSearchParams<{
    id: string;
    bookingId?: string;
    mode?: string;
  }>();

  const propertyId = String(params?.id ?? "");
  const bookingId = String(params?.bookingId ?? "");
  const mode = String(params?.mode ?? "add");
  const isEditMode = mode === "edit";

  // Redux state
  const { profileData } = useSelector((state: { profileDetails: { profileData: unknown } }) => state.profileDetails) as {
    profileData: Record<string, unknown> | null;
  };
  const ownerId = str(profileData?.ownerId || profileData?.userId || profileData?._id || "");

  // Form state
  const [tenantName, setTenantName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [joiningDate, setJoiningDate] = useState<Date | null>(null);
  const [moveOutDate, setMoveOutDate] = useState<Date | null>(null);
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [roomId, setRoomId] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [collectedAdvRent, setCollectedAdvRent] = useState("");
  const [collectedAdvDeposit, setCollectedAdvDeposit] = useState("");
  const [email, setEmail] = useState("");

  // Date pickers
  const [showJoiningPicker, setShowJoiningPicker] = useState(false);
  const [showMoveOutPicker, setShowMoveOutPicker] = useState(false);
  const [tempJoiningDate, setTempJoiningDate] = useState<Date>(() => new Date());
  const [tempMoveOutDate, setTempMoveOutDate] = useState<Date>(() => new Date());

  // UI state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const prefilled = useRef(false);

  // Track previous dates for clearing amounts
  const prevJoiningDateRef = useRef<Date | null>(null);
  const prevMoveOutDateRef = useRef<Date | null>(null);
  const initialLoadRef = useRef(true);

  // APIs
  const tenantQuery = useGetAllTenantDetails(isEditMode ? bookingId : "");

  const joiningDateStr = joiningDate?.toISOString() ?? "";
  const moveOutDateStr = moveOutDate?.toISOString() ?? "";
  const roomsQuery = useGetRoomsForShortTermBooking(
    propertyId,
    joiningDateStr && moveOutDateStr ? { joiningDate: joiningDateStr, moveOutDate: moveOutDateStr } : {}
  );

  const insertShortTerm = useInsertShortTerm(() => {});
  const updateTenant = useUpdateTenant(() => {});

  const existingTenant = tenantQuery?.data?.data ?? tenantQuery?.data;

  // Prefill in edit mode
  useEffect(() => {
    if (isEditMode && existingTenant && !prefilled.current) {
      prefilled.current = true;
      initialLoadRef.current = true;
      setTenantName(str(existingTenant?.tenantName, ""));
      setPhoneNumber(str(existingTenant?.phoneNumber, ""));
      const jDate = parseISODate(existingTenant?.joiningDate);
      const mDate = parseISODate(existingTenant?.moveOutDate);
      setJoiningDate(jDate);
      setMoveOutDate(mDate);
      prevJoiningDateRef.current = jDate;
      prevMoveOutDateRef.current = mDate;
      setGender(str(existingTenant?.gender, "Male") === "Female" ? "Female" : "Male");
      setRoomId(str(existingTenant?.roomId, ""));
      setBedNumber(str(existingTenant?.bedNumber, ""));
      setRentAmount(String(num(existingTenant?.rentAmount)));
      setDepositAmount(String(num(existingTenant?.depositAmount)));
      setCollectedAdvRent(String(num(existingTenant?.advanceRentAmountPaid) || ""));
      setCollectedAdvDeposit(String(num(existingTenant?.advanceDepositAmountPaid) || ""));
      setEmail(str(existingTenant?.email, ""));
    }
  }, [isEditMode, existingTenant]);

  // Clear room/bed/amounts when dates change (but not on initial load)
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      prevJoiningDateRef.current = joiningDate;
      prevMoveOutDateRef.current = moveOutDate;
      return;
    }

    const joiningChanged = 
      (prevJoiningDateRef.current !== null && joiningDate?.getTime() !== prevJoiningDateRef.current?.getTime()) ||
      (prevJoiningDateRef.current === null && joiningDate !== null);
    
    const moveOutChanged = 
      (prevMoveOutDateRef.current !== null && moveOutDate?.getTime() !== prevMoveOutDateRef.current?.getTime()) ||
      (prevMoveOutDateRef.current === null && moveOutDate !== null);

    if (joiningChanged || moveOutChanged) {
      // Clear room, bed and all amounts when dates change
      setRoomId("");
      setBedNumber("");
      setRentAmount("");
      setDepositAmount("");
      setCollectedAdvRent("");
      setCollectedAdvDeposit("");
    }

    prevJoiningDateRef.current = joiningDate;
    prevMoveOutDateRef.current = moveOutDate;
  }, [joiningDate, moveOutDate]);

  // Room options
  const roomOptions: SheetSelectOption[] = useMemo(() => {
    const rooms = (roomsQuery?.data?.rooms ?? []) as unknown as Record<string, unknown>[];
    return rooms.map((r) => ({
      id: str(r?._id),
      label: `Room ${str(r?.roomNo, "Room")}`,
      sublabel: `${num(r?.beds, 0)} beds`,
    }));
  }, [roomsQuery?.data?.rooms]);

  // Selected room data
  const selectedRoomData = useMemo(() => {
    const rooms = (roomsQuery?.data?.rooms ?? []) as unknown as Record<string, unknown>[];
    return rooms.find((r) => str(r?._id) === roomId);
  }, [roomsQuery?.data?.rooms, roomId]);

  // Bed status colors
  const bedStatusColors: Record<string, string> = useMemo(
    () => ({
      Filled: colors.filledBeds ?? "#EF4444",
      AdvBooked: colors.advBookedBeds ?? "#F59E0B",
      ShortTerm: colors.advBookedBeds ?? "#F59E0B",
      Available: colors.availableBeds ?? "#22C55E",
    }),
    [colors]
  );

  // Bed options based on selected room
  const bedOptions: SheetSelectOption[] = useMemo(() => {
    if (!roomId || !selectedRoomData) return [];

    const bedsPerRoom = (selectedRoomData?.bedsPerRoom ?? []) as Record<string, unknown>[];
    const bedCount = num(selectedRoomData?.beds, 0);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const options: SheetSelectOption[] = [];

    for (let i = 0; i < bedCount; i++) {
      const bedId = alphabet[i] || String(i + 1);
      const bedInfo = bedsPerRoom.find((b) => str(b?._id) === bedId);
      const tenants = (bedInfo?.tenantsPerBed ?? []) as Record<string, unknown>[];

      let statusLabel = "Available";
      let statusColor = bedStatusColors.Available;
      let disabled = false;

      if (tenants.length > 0) {
        const hasActive = tenants.some((t) => num(t?.tenantStatus) === 1);
        const hasShortTerm = tenants.some((t) => num(t?.tenantStatus) === 7);
        const hasAdvance = tenants.some((t) => num(t?.tenantStatus) === 3);

        if (hasActive) {
          statusLabel = "Filled";
          statusColor = bedStatusColors.Filled;
          disabled = !isEditMode;
        } else if (hasShortTerm) {
          statusLabel = "Short Term";
          statusColor = bedStatusColors.ShortTerm;
          disabled = !isEditMode;
        } else if (hasAdvance) {
          statusLabel = "Adv Booked";
          statusColor = bedStatusColors.AdvBooked;
          disabled = !isEditMode;
        }
      }

      options.push({
        id: bedId,
        label: `Bed ${bedId}`,
        status: statusLabel,
        statusColor,
        disabled,
      });
    }

    return options;
  }, [roomId, selectedRoomData, bedStatusColors, isEditMode]);

  // Auto-fill rent and deposit when room is selected
  useEffect(() => {
    if (roomId && selectedRoomData && !isEditMode) {
      const price = num(selectedRoomData?.bedPrice, 0);
      const deposit = num(selectedRoomData?.securityDeposit, 0);
      if (price > 0) {
        setRentAmount(String(price));
      }
      if (deposit > 0) {
        setDepositAmount(String(deposit));
      }
    }
  }, [roomId, selectedRoomData, isEditMode]);

  // Calculate due amount
  const dueAmountForStay = useMemo(() => {
    const rent = Number(parseFormattedNumber(rentAmount)) || 0;
    return calculateDueAmount(joiningDate, moveOutDate, rent);
  }, [joiningDate, moveOutDate, rentAmount]);

  // Stay days note
  const stayDaysNote = useMemo(() => {
    if (!joiningDate || !moveOutDate) return "";
    const start = startOfDay(joiningDate);
    const end = startOfDay(moveOutDate);
    
    // Same day = 1 day stay
    if (end.getTime() === start.getTime()) {
      return "Due rent amount is calculated for 1 day";
    }
    
    if (end < start) return "";
    
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `Due rent amount is calculated for ${days} day${days === 1 ? "" : "s"}`;
  }, [joiningDate, moveOutDate]);

  // Date constraints
  const today = useMemo(() => startOfDay(new Date()), []);
  const oneMonthFromToday = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 1);
    return d;
  }, [today]);

  const minJoiningDate = today;
  const maxJoiningDate = oneMonthFromToday;
  // Move out date: min is the joining date (same day allowed), max is 1 month from today
  const minMoveOutDate = joiningDate ? startOfDay(joiningDate) : today;
  const maxMoveOutDate = oneMonthFromToday;

  // Navigation
  const navigateBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace({
      pathname: `/protected/property/${propertyId}`,
      params: { tab: "Interim Bookings", refresh: String(Date.now()) },
    });
  }, [router, propertyId]);

  // Back handler
  useEffect(() => {
    const backAction = () => {
      navigateBack();
      return true;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => subscription.remove();
  }, [navigateBack]);

  // Validation
  const validate = useCallback((): string[] => {
    const errors: string[] = [];

    if (!tenantName.trim()) errors.push("• Tenant name is required.");
    if (!phoneNumber.trim()) errors.push("• Phone number is required.");
    else if (!validatePhone(phoneNumber)) errors.push("• Phone number must be exactly 10 digits.");
    if (!joiningDate) errors.push("• Date of joining is required.");
    if (!moveOutDate) errors.push("• Move out date is required.");
    if (!roomId) errors.push("• Room selection is required.");
    if (!bedNumber) errors.push("• Bed selection is required.");
    if (!rentAmount.trim() || Number(parseFormattedNumber(rentAmount)) <= 0) errors.push("• Rent amount is required.");
    if (!depositAmount.trim() || Number(parseFormattedNumber(depositAmount)) <= 0) errors.push("• Deposit amount is required.");

    const advRent = Number(parseFormattedNumber(collectedAdvRent)) || 0;
    const advDeposit = Number(parseFormattedNumber(collectedAdvDeposit)) || 0;
    const deposit = Number(parseFormattedNumber(depositAmount)) || 0;

    if (advRent > dueAmountForStay) {
      errors.push("• Collected advance rent cannot exceed due amount for stay.");
    }
    if (advDeposit > deposit) {
      errors.push("• Collected advance deposit cannot exceed deposit amount.");
    }

    if (email.trim() && !validateEmail(email)) {
      errors.push("• Please enter a valid email address.");
    }

    return errors;
  }, [tenantName, phoneNumber, joiningDate, moveOutDate, roomId, bedNumber, rentAmount, depositAmount, collectedAdvRent, collectedAdvDeposit, email, dueAmountForStay]);

  // Submit
  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();
    const errors = validate();
    if (errors.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Validation Error", errors.join("\n"), [{ text: "OK" }]);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const formData = new FormData();
    formData.append("tenantName", tenantName.trim());
    formData.append("phoneNumber", phoneNumber.trim());
    formData.append("roomId", roomId);
    formData.append("rentAmount", String(Number(parseFormattedNumber(rentAmount))));
    formData.append("depositAmount", String(Number(parseFormattedNumber(depositAmount))));
    formData.append("lockingPeriod", "");
    formData.append("noticePeriod", "15");
    formData.append("joiningDate", joiningDate?.toISOString() ?? "");
    formData.append("moveOutDate", moveOutDate?.toISOString() ?? "");
    formData.append("bedNumber", bedNumber);
    formData.append("gender", gender);
    formData.append("advanceRentAmountPaid", String(Number(parseFormattedNumber(collectedAdvRent)) || 0));
    formData.append("advanceDepositAmountPaid", String(Number(parseFormattedNumber(collectedAdvDeposit)) || 0));
    formData.append("email", email.trim());
    formData.append("calcultedRentAmount", dueAmountForStay > 0 ? String(dueAmountForStay) : "");
    formData.append("status", "7");
    formData.append("dueType", "0");
    formData.append("ownerId", ownerId);
    formData.append("createdBy", ownerId);

    if (isEditMode) {
      updateTenant.mutate(
        { formData, tenantId: bookingId },
        {
          onSuccess: (data: unknown) => {
            const response = data as Record<string, unknown>;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSnackbarMessage(str(response?.message, "Booking updated successfully"));
            setSnackbarVisible(true);
            setTimeout(() => {
              navigateBack();
            }, 500);
          },
          onError: (error: unknown) => {
            const err = error as { message?: string; errorMessage?: string };
            Alert.alert("Error", err?.errorMessage || err?.message || "Failed to update booking.");
          },
        }
      );
    } else {
      insertShortTerm.mutate(formData, {
        onSuccess: (data: unknown) => {
          const response = data as Record<string, unknown>;
          if (response?.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSnackbarMessage(str(response?.message, "Booking created successfully"));
            setSnackbarVisible(true);
            setTimeout(() => {
              navigateBack();
            }, 500);
          } else {
            Alert.alert("Error", str(response?.errorMessage, "Failed to create booking."));
          }
        },
        onError: (error: unknown) => {
          const err = error as { message?: string; errorMessage?: string };
          Alert.alert("Error", err?.errorMessage || err?.message || "Failed to create booking.");
        },
      });
    }
  }, [validate, tenantName, phoneNumber, roomId, rentAmount, depositAmount, joiningDate, moveOutDate, bedNumber, gender, collectedAdvRent, collectedAdvDeposit, email, dueAmountForStay, ownerId, isEditMode, bookingId, navigateBack, insertShortTerm, updateTenant]);

  // Input handlers
  const onNameChange = useCallback((text: string) => {
    setTenantName(text);
  }, []);

  const onPhoneChange = useCallback((text: string) => {
    const digitsOnly = text.replace(/[^\d]/g, "").slice(0, 10);
    setPhoneNumber(digitsOnly);
  }, []);

  const onAmountChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) => (text: string) => {
      const digitsOnly = parseFormattedNumber(text).slice(0, MAX_AMOUNT_DIGITS);
      setter(digitsOnly ? formatIndianNumber(digitsOnly) : "");
    },
    []
  );

  // Date picker handlers
  const openJoiningDatePicker = useCallback(() => {
    const validDate =
      joiningDate instanceof Date && !isNaN(joiningDate.getTime()) ? joiningDate : new Date();
    setTempJoiningDate(new Date(validDate.getTime()));
    setShowJoiningPicker(true);
  }, [joiningDate]);

  const openMoveOutDatePicker = useCallback(() => {
    if (!joiningDate) return;
    const validDate =
      moveOutDate instanceof Date && !isNaN(moveOutDate.getTime()) ? moveOutDate : joiningDate;
    setTempMoveOutDate(new Date(validDate.getTime()));
    setShowMoveOutPicker(true);
  }, [joiningDate, moveOutDate]);

  const handleJoiningDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowJoiningPicker(false);
        if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
          setJoiningDate(startOfDay(selectedDate));
          // Reset move out date if it's before joining date
          if (moveOutDate && startOfDay(selectedDate) > moveOutDate) {
            setMoveOutDate(null);
          }
        }
      } else {
        if (selectedDate && !isNaN(selectedDate.getTime())) {
          setTempJoiningDate(new Date(selectedDate.getTime()));
        }
      }
    },
    [moveOutDate]
  );

  const handleMoveOutDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowMoveOutPicker(false);
        if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
          setMoveOutDate(startOfDay(selectedDate));
        }
      } else {
        if (selectedDate && !isNaN(selectedDate.getTime())) {
          setTempMoveOutDate(new Date(selectedDate.getTime()));
        }
      }
    },
    []
  );

  const confirmJoiningDate = useCallback(() => {
    if (tempJoiningDate instanceof Date && !isNaN(tempJoiningDate.getTime())) {
      setJoiningDate(startOfDay(tempJoiningDate));
      if (moveOutDate && startOfDay(tempJoiningDate) > moveOutDate) {
        setMoveOutDate(null);
      }
    }
    setShowJoiningPicker(false);
  }, [tempJoiningDate, moveOutDate]);

  const confirmMoveOutDate = useCallback(() => {
    if (tempMoveOutDate instanceof Date && !isNaN(tempMoveOutDate.getTime())) {
      setMoveOutDate(startOfDay(tempMoveOutDate));
    }
    setShowMoveOutPicker(false);
  }, [tempMoveOutDate]);

  const isMutating = insertShortTerm.isPending || updateTenant.isPending;
  const isLoadingRooms = roomsQuery.isFetching;
  const datesSelected = !!(joiningDate && moveOutDate);

  // Styles
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
        helpText: {
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 4,
          fontStyle: "italic",
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
        loadingContainer: {
          padding: spacing.lg,
          alignItems: "center",
        },
      }),
    [colors, spacing, radius, typography, insets.bottom]
  );

  const headerTitle = isEditMode ? "Edit Interim Booking" : "Add Interim Booking";
  const isLoading = isEditMode && tenantQuery.isLoading && !existingTenant;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <View style={[styles.loadingContainer, { flex: 1, justifyContent: "center" }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <PaperText style={{ color: colors.textSecondary, marginTop: spacing.md }}>
            Loading...
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
            onPress={navigateBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Navigate back to interim bookings list"
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
                    value={phoneNumber}
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

                <Labeled label="Move Out Date" required>
                  <Pressable
                    style={[styles.dateBtn, !joiningDate && styles.disabledDateBtn]}
                    onPress={openMoveOutDatePicker}
                    disabled={!joiningDate}
                    accessibilityRole="button"
                    accessibilityLabel={`Select move out date, current: ${formatDisplayDate(moveOutDate)}`}
                    accessibilityState={{ disabled: !joiningDate }}
                    accessible
                  >
                    <MaterialIcons name="event" size={20} color={colors.textSecondary} />
                    <PaperText
                      style={{
                        color: moveOutDate ? colors.textPrimary : colors.textMuted,
                        fontSize: typography.fontSizeMd,
                        flex: 1,
                      }}
                    >
                      {formatDisplayDate(moveOutDate)}
                    </PaperText>
                    <MaterialIcons
                      name="keyboard-arrow-down"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </Labeled>

                {stayDaysNote ? (
                  <Text style={styles.helpText} accessible accessibilityRole="text">
                    {stayDaysNote}
                  </Text>
                ) : null}

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Labeled label="Room" required>
                      <SheetSelect
                        value={roomId}
                        placeholder="Select Room"
                        options={roomOptions}
                        onChange={(v) => {
                          setRoomId(v);
                          setBedNumber("");
                        }}
                        disabled={!datesSelected || isLoadingRooms}
                      />
                      {isLoadingRooms && datesSelected && (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                          <ActivityIndicator size="small" color={colors.accent} />
                          <Text style={{ marginLeft: 8, color: colors.textSecondary, fontSize: 12 }}>
                            Loading rooms...
                          </Text>
                        </View>
                      )}
                    </Labeled>
                  </View>
                  <View style={styles.col}>
                    <Labeled label="Bed" required>
                      <SheetSelect
                        value={bedNumber}
                        placeholder="Select Bed"
                        options={bedOptions}
                        onChange={setBedNumber}
                        disabled={!roomId}
                      />
                    </Labeled>
                  </View>
                </View>
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
                        value={rentAmount ? formatIndianNumber(rentAmount) : ""}
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
                        value={depositAmount ? formatIndianNumber(depositAmount) : ""}
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

                <Labeled label="Due Amount for Stay">
                  <TextInput
                    value={dueAmountForStay > 0 ? `₹ ${formatIndianNumber(String(dueAmountForStay))}` : ""}
                    editable={false}
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    style={[styles.input, { backgroundColor: colors.surface }]}
                    textColor={colors.textPrimary}
                    placeholder="Auto-calculated"
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, padding: spacing.sm }}
                    accessibilityLabel="Due amount for stay"
                  />
                </Labeled>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Labeled label="Collected Adv. Rent">
                      <TextInput
                        value={collectedAdvRent ? formatIndianNumber(collectedAdvRent) : ""}
                        onChangeText={onAmountChange(setCollectedAdvRent)}
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
                        accessibilityLabel="Collected advance rent"
                      />
                    </Labeled>
                  </View>
                  <View style={styles.col}>
                    <Labeled label="Collected Adv. Deposit">
                      <TextInput
                        value={collectedAdvDeposit ? formatIndianNumber(collectedAdvDeposit) : ""}
                        onChangeText={onAmountChange(setCollectedAdvDeposit)}
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
                        accessibilityLabel="Collected advance deposit"
                      />
                    </Labeled>
                  </View>
                </View>
              </View>

              <Divider
                style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }}
              />

              {/* Footer Buttons */}
              <View style={styles.footerRow}>
                <Button
                  mode="outlined"
                  style={styles.secondaryBtn}
                  textColor={colors.textPrimary}
                  onPress={navigateBack}
                  disabled={isMutating}
                  accessibilityLabel="Cancel and go back"
                  accessibilityHint="Discards changes and returns to bookings list"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  style={styles.primaryBtn}
                  onPress={handleSubmit}
                  loading={isMutating}
                  disabled={isMutating}
                  accessibilityLabel={isEditMode ? "Save changes" : "Save booking"}
                >
                  {isEditMode ? "Save Changes" : "Save Booking"}
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>

      {/* Joining Date Picker - Platform specific */}
      {Platform.OS === "android" && showJoiningPicker && (
        <DateTimePicker
          value={joiningDate || today}
          mode="date"
          display="default"
          onChange={handleJoiningDateChange}
          minimumDate={minJoiningDate}
          maximumDate={maxJoiningDate}
        />
      )}

      {/* Move Out Date Picker - Platform specific */}
      {Platform.OS === "android" && showMoveOutPicker && (
        <DateTimePicker
          value={moveOutDate || minMoveOutDate}
          mode="date"
          display="default"
          onChange={handleMoveOutDateChange}
          minimumDate={minMoveOutDate}
          maximumDate={maxMoveOutDate}
        />
      )}

      {/* iOS Joining Date Picker Modal */}
      {Platform.OS === "ios" && showJoiningPicker && (
        <Modal
          visible={showJoiningPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowJoiningPicker(false)}
        >
          <Pressable
            style={styles.datePickerModal}
            onPress={() => setShowJoiningPicker(false)}
          >
            <Pressable style={styles.datePickerContainer} onPress={() => {}}>
              <View style={styles.datePickerHeader}>
                <Pressable
                  onPress={() => setShowJoiningPicker(false)}
                  style={styles.datePickerBtn}
                >
                  <Text style={[styles.datePickerBtnText, { color: colors.error }]}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>Select Joining Date</Text>
                <Pressable onPress={confirmJoiningDate} style={styles.datePickerBtn}>
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

      {/* iOS Move Out Date Picker Modal */}
      {Platform.OS === "ios" && showMoveOutPicker && (
        <Modal
          visible={showMoveOutPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMoveOutPicker(false)}
        >
          <Pressable
            style={styles.datePickerModal}
            onPress={() => setShowMoveOutPicker(false)}
          >
            <Pressable style={styles.datePickerContainer} onPress={() => {}}>
              <View style={styles.datePickerHeader}>
                <Pressable
                  onPress={() => setShowMoveOutPicker(false)}
                  style={styles.datePickerBtn}
                >
                  <Text style={[styles.datePickerBtnText, { color: colors.error }]}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>Select Move Out Date</Text>
                <Pressable onPress={confirmMoveOutDate} style={styles.datePickerBtn}>
                  <Text style={[styles.datePickerBtnText, { color: colors.accent }]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={
                  tempMoveOutDate instanceof Date && !isNaN(tempMoveOutDate.getTime())
                    ? tempMoveOutDate
                    : minMoveOutDate
                }
                mode="date"
                display="spinner"
                onChange={handleMoveOutDateChange}
                style={{ height: 200 }}
                textColor={colors.textPrimary}
                themeVariant="light"
                minimumDate={minMoveOutDate}
                maximumDate={maxMoveOutDate}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ backgroundColor: colors.accent }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}
