// app/protected/intrim/[id].tsx
// Interim Booking Add/Edit Screen - Short-term bookings
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
import { TextInput, RadioButton, Snackbar } from "react-native-paper";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useSelector } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useGetRoomsForShortTermBooking } from "@/src/hooks/room";
import { useInsertShortTerm, useUpdateTenant, useGetAllTenantDetails } from "@/src/hooks/tenants";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const str = (v: unknown, f = "") => (v == null ? f : String(v));
const num = (v: unknown, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || f;

const formatIndianNumber = (n: number): string => {
  if (isNaN(n)) return "0";
  const s = Math.abs(Math.round(n)).toString();
  if (s.length <= 3) return n < 0 ? `-${s}` : s;
  let result = s.slice(-3);
  let remaining = s.slice(0, -3);
  while (remaining.length > 2) {
    result = remaining.slice(-2) + "," + result;
    remaining = remaining.slice(0, -2);
  }
  if (remaining.length > 0) result = remaining + "," + result;
  return n < 0 ? `-${result}` : result;
};

const parseFormattedNumber = (s: string): number => {
  const clean = s.replace(/[^0-9.-]/g, "");
  return Number(clean) || 0;
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
  if (!d) return "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone: string): boolean => /^\d{10}$/.test(phone.replace(/\D/g, ""));

/* ─────────────────────────────────────────────────────────────────────────────
   SHEET SELECT COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface SheetSelectOption {
  id: string;
  value: string;
  disabled?: boolean;
}

interface SheetSelectProps {
  label: string;
  value: string;
  options: SheetSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SheetSelect: React.FC<SheetSelectProps> = React.memo(function SheetSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find((o) => o.id === value);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: hexToRgba(colors.textMuted, 0.2),
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          backgroundColor: colors.surface,
        },
        text: {
          flex: 1,
          fontSize: typography.fontSizeMd,
          color: selectedOption ? colors.textPrimary : colors.textMuted,
        },
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          maxHeight: "60%",
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.borderColor, 0.3),
        },
        title: {
          fontSize: typography.fontSizeLg,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        closeText: {
          fontSize: typography.fontSizeMd,
          fontWeight: "600",
          color: colors.accent,
        },
        option: {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.borderColor, 0.1),
        },
        optionText: {
          fontSize: typography.fontSizeMd,
          color: colors.textPrimary,
        },
        optionDisabled: {
          opacity: 0.4,
        },
        optionSelected: {
          backgroundColor: hexToRgba(colors.accent, 0.08),
        },
      }),
    [colors, spacing, radius, typography, selectedOption]
  );

  return (
    <>
      <Pressable
        style={[styles.container, disabled && { opacity: 0.5 }]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.text}>{selectedOption?.value || label}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.textMuted} />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>{label}</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.option,
                    option.id === value && styles.optionSelected,
                    option.disabled && styles.optionDisabled,
                  ]}
                  onPress={() => {
                    if (!option.disabled) {
                      Haptics.selectionAsync();
                      onChange(option.id);
                      setVisible(false);
                    }
                  }}
                  disabled={option.disabled}
                >
                  <Text style={styles.optionText}>{option.value}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
});

// Calculate due amount for stay
const calculateDueAmount = (joiningDate: Date | null, moveOutDate: Date | null, rentAmount: number): number => {
  if (!joiningDate || !moveOutDate || rentAmount <= 0) return 0;

  const start = startOfDay(joiningDate);
  const end = startOfDay(moveOutDate);
  
  if (end <= start) return 0;

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
   LABELED INPUT WRAPPER
───────────────────────────────────────────────────────────────────────────── */

interface LabeledProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const Labeled: React.FC<LabeledProps> = ({ label, required, children }) => {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ fontSize: typography.fontSizeSm, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      {children}
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
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
  const [gender, setGender] = useState("Male");
  const [roomId, setRoomId] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [collectedAdvRent, setCollectedAdvRent] = useState("");
  const [collectedAdvDeposit, setCollectedAdvDeposit] = useState("");
  const [email, setEmail] = useState("");
  const [calculatedRentAmount, setCalculatedRentAmount] = useState<number | null>(null);

  // Date pickers
  const [showJoiningPicker, setShowJoiningPicker] = useState(false);
  const [showMoveOutPicker, setShowMoveOutPicker] = useState(false);
  const [tempJoiningDate, setTempJoiningDate] = useState<Date>(new Date());
  const [tempMoveOutDate, setTempMoveOutDate] = useState<Date>(new Date());

  // UI state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const prefilled = useRef(false);

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
      setTenantName(str(existingTenant?.tenantName, ""));
      setPhoneNumber(str(existingTenant?.phoneNumber, ""));
      setJoiningDate(parseISODate(existingTenant?.joiningDate));
      setMoveOutDate(parseISODate(existingTenant?.moveOutDate));
      setGender(str(existingTenant?.gender, "Male"));
      setRoomId(str(existingTenant?.roomId, ""));
      setBedNumber(str(existingTenant?.bedNumber, ""));
      setRentAmount(String(num(existingTenant?.rentAmount)));
      setDepositAmount(String(num(existingTenant?.depositAmount)));
      setCollectedAdvRent(String(num(existingTenant?.advanceRentAmountPaid) || ""));
      setCollectedAdvDeposit(String(num(existingTenant?.advanceDepositAmountPaid) || ""));
      setEmail(str(existingTenant?.email, ""));
      setCalculatedRentAmount(num(existingTenant?.calcultedRentAmount) || null);
    }
  }, [isEditMode, existingTenant]);

  // Room options
  const roomOptions = useMemo(() => {
    const rooms = (roomsQuery?.data?.rooms ?? []) as Record<string, unknown>[];
    return rooms.map((r) => ({
      id: str(r?._id),
      value: str(r?.roomNo, "Room"),
      bedPrice: num(r?.bedPrice),
      securityDeposit: num(r?.securityDeposit),
      beds: num(r?.beds),
      bedsPerRoom: (r?.bedsPerRoom ?? []) as unknown[],
    }));
  }, [roomsQuery?.data?.rooms]);

  // Bed options based on selected room
  const bedOptions = useMemo(() => {
    if (!roomId) return [];
    const selectedRoom = roomOptions.find((r: { id: string }) => r.id === roomId);
    if (!selectedRoom) return [];

    const bedsPerRoom = (selectedRoom.bedsPerRoom ?? []) as Record<string, unknown>[];
    const bedCount = selectedRoom.beds || 0;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const options: { id: string; value: string; disabled: boolean }[] = [];

    for (let i = 0; i < bedCount; i++) {
      const bedId = alphabet[i] || String(i + 1);
      const bedInfo = bedsPerRoom.find((b) => str(b?._id) === bedId);
      const tenants = (bedInfo?.tenantsPerBed ?? []) as Record<string, unknown>[];

      let statusLabel = "";
      let disabled = false;

      if (tenants.length === 0) {
        statusLabel = " (Available)";
      } else {
        // Check tenant statuses
        const hasActive = tenants.some((t) => num(t?.tenantStatus) === 1);
        const hasShortTerm = tenants.some((t) => num(t?.tenantStatus) === 7);
        const hasAdvance = tenants.some((t) => num(t?.tenantStatus) === 3);

        if (hasActive) {
          statusLabel = " (Filled)";
          disabled = !isEditMode;
        } else if (hasShortTerm) {
          statusLabel = " (Short Term)";
          disabled = !isEditMode;
        } else if (hasAdvance) {
          statusLabel = " (Advance Booking)";
          disabled = !isEditMode;
        } else {
          statusLabel = " (Partially Filled)";
        }
      }

      options.push({ id: bedId, value: `Bed ${bedId}${statusLabel}`, disabled });
    }

    return options;
  }, [roomId, roomOptions, isEditMode]);

  // Auto-fill rent and deposit when room is selected
  useEffect(() => {
    if (roomId && !isEditMode) {
      const selectedRoom = roomOptions.find((r: { id: string }) => r.id === roomId);
      if (selectedRoom) {
        setRentAmount(String(selectedRoom.bedPrice || 0));
        setDepositAmount(String(selectedRoom.securityDeposit || 0));
      }
    }
  }, [roomId, roomOptions, isEditMode]);

  // Calculate due amount
  const dueAmountForStay = useMemo(() => {
    if (calculatedRentAmount) return calculatedRentAmount;
    const rent = parseFormattedNumber(rentAmount);
    return calculateDueAmount(joiningDate, moveOutDate, rent);
  }, [joiningDate, moveOutDate, rentAmount, calculatedRentAmount]);

  // Stay days note
  const stayDaysNote = useMemo(() => {
    if (!joiningDate || !moveOutDate) return "";
    const start = startOfDay(joiningDate);
    const end = startOfDay(moveOutDate);
    if (end <= start) return "";
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
  const minMoveOutDate = joiningDate ? startOfDay(joiningDate) : today;
  const maxMoveOutDate = oneMonthFromToday;

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
    if (!rentAmount.trim() || parseFormattedNumber(rentAmount) <= 0) errors.push("• Rent amount is required.");
    if (!depositAmount.trim() || parseFormattedNumber(depositAmount) <= 0) errors.push("• Deposit amount is required.");

    const advRent = parseFormattedNumber(collectedAdvRent);
    const advDeposit = parseFormattedNumber(collectedAdvDeposit);
    const deposit = parseFormattedNumber(depositAmount);

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
    formData.append("rentAmount", String(parseFormattedNumber(rentAmount)));
    formData.append("depositAmount", String(parseFormattedNumber(depositAmount)));
    formData.append("lockingPeriod", "");
    formData.append("noticePeriod", "15");
    formData.append("joiningDate", joiningDate?.toISOString() ?? "");
    formData.append("moveOutDate", moveOutDate?.toISOString() ?? "");
    formData.append("bedNumber", bedNumber);
    formData.append("gender", gender);
    formData.append("advanceRentAmountPaid", String(parseFormattedNumber(collectedAdvRent) || 0));
    formData.append("advanceDepositAmountPaid", String(parseFormattedNumber(collectedAdvDeposit) || 0));
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
              router.replace({
                pathname: `/protected/property/${propertyId}`,
                params: { tab: "Interim Bookings", refresh: String(Date.now()) },
              });
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
              router.replace({
                pathname: `/protected/property/${propertyId}`,
                params: { tab: "Interim Bookings", refresh: String(Date.now()) },
              });
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
  }, [validate, tenantName, phoneNumber, roomId, rentAmount, depositAmount, joiningDate, moveOutDate, bedNumber, gender, collectedAdvRent, collectedAdvDeposit, email, dueAmountForStay, ownerId, isEditMode, bookingId, propertyId, router, insertShortTerm, updateTenant]);

  // Navigation
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace({
      pathname: `/protected/property/${propertyId}`,
      params: { tab: "Interim Bookings", refresh: String(Date.now()) },
    });
  }, [router, propertyId]);

  // Back handler
  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => subscription.remove();
  }, [handleBack]);

  // Date picker handlers
  const handleJoiningDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowJoiningPicker(false);
      if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
        setJoiningDate(startOfDay(selectedDate));
        // Reset move out date if it's before joining date
        if (moveOutDate && startOfDay(selectedDate) > moveOutDate) {
          setMoveOutDate(null);
        }
        // Reset room and bed when dates change
        if (!isEditMode) {
          setRoomId("");
          setBedNumber("");
        }
      }
    } else {
      if (selectedDate && !isNaN(selectedDate.getTime())) {
        setTempJoiningDate(selectedDate);
      }
    }
  }, [moveOutDate, isEditMode]);

  const handleMoveOutDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowMoveOutPicker(false);
      if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
        setMoveOutDate(startOfDay(selectedDate));
        // Reset room and bed when dates change
        if (!isEditMode) {
          setRoomId("");
          setBedNumber("");
        }
      }
    } else {
      if (selectedDate && !isNaN(selectedDate.getTime())) {
        setTempMoveOutDate(selectedDate);
      }
    }
  }, [isEditMode]);

  const confirmJoiningDate = useCallback(() => {
    setJoiningDate(startOfDay(tempJoiningDate));
    setShowJoiningPicker(false);
    if (moveOutDate && startOfDay(tempJoiningDate) > moveOutDate) {
      setMoveOutDate(null);
    }
    if (!isEditMode) {
      setRoomId("");
      setBedNumber("");
    }
  }, [tempJoiningDate, moveOutDate, isEditMode]);

  const confirmMoveOutDate = useCallback(() => {
    setMoveOutDate(startOfDay(tempMoveOutDate));
    setShowMoveOutPicker(false);
    if (!isEditMode) {
      setRoomId("");
      setBedNumber("");
    }
  }, [tempMoveOutDate, isEditMode]);

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
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.borderColor, 0.3),
          gap: spacing.sm,
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: hexToRgba(colors.textMuted, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitle: {
          flex: 1,
          fontSize: typography.fontSizeLg,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        submitBtn: {
          backgroundColor: colors.accent,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
        },
        submitBtnDisabled: {
          opacity: 0.5,
        },
        submitBtnText: {
          fontSize: typography.fontSizeSm,
          fontWeight: "700",
          color: "#FFFFFF",
        },
        body: {
          flex: 1,
          padding: spacing.md,
        },
        sectionTitle: {
          fontSize: typography.fontSizeMd,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.md,
          marginTop: spacing.sm,
        },
        input: {
          backgroundColor: colors.surface,
          fontSize: typography.fontSizeMd,
        },
        dateField: {
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: hexToRgba(colors.textMuted, 0.2),
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 4,
          backgroundColor: colors.surface,
        },
        dateFieldDisabled: {
          opacity: 0.5,
        },
        dateText: {
          flex: 1,
          fontSize: typography.fontSizeMd,
          color: colors.textPrimary,
        },
        datePlaceholder: {
          color: colors.textMuted,
        },
        radioRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.lg,
        },
        radioItem: {
          flexDirection: "row",
          alignItems: "center",
        },
        radioLabel: {
          fontSize: typography.fontSizeMd,
          color: colors.textPrimary,
        },
        noteText: {
          fontSize: typography.fontSizeSm,
          color: colors.textSecondary,
          fontStyle: "italic",
          marginTop: -spacing.sm,
          marginBottom: spacing.md,
        },
        disabledField: {
          opacity: 0.6,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        },
        modalContent: {
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingBottom: insets.bottom + spacing.md,
        },
        modalHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.borderColor, 0.3),
        },
        modalTitle: {
          fontSize: typography.fontSizeLg,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        modalAction: {
          fontSize: typography.fontSizeMd,
          fontWeight: "600",
          color: colors.accent,
        },
        loadingContainer: {
          padding: spacing.lg,
          alignItems: "center",
        },
      }),
    [colors, spacing, radius, typography, insets.bottom]
  );

  if (isEditMode && tenantQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={[styles.loadingContainer, { flex: 1, justifyContent: "center" }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEditMode ? "Edit Interim Booking" : "Add Interim Booking"}</Text>
        <Pressable
          style={[styles.submitBtn, isMutating && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isMutating}
          accessibilityRole="button"
          accessibilityLabel="Save booking"
        >
          {isMutating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      {/* Body */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg * 2 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Booking Details</Text>

            {/* Tenant Name */}
            <Labeled label="Tenant Name" required>
              <TextInput
                mode="outlined"
                value={tenantName}
                onChangeText={setTenantName}
                placeholder="Enter tenant name"
                style={styles.input}
                outlineColor={hexToRgba(colors.textMuted, 0.2)}
                activeOutlineColor={colors.accent}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
              />
            </Labeled>

            {/* Phone Number */}
            <Labeled label="Phone Number" required>
              <TextInput
                mode="outlined"
                value={phoneNumber}
                onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit phone number"
                keyboardType="phone-pad"
                style={styles.input}
                outlineColor={hexToRgba(colors.textMuted, 0.2)}
                activeOutlineColor={colors.accent}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                maxLength={10}
              />
            </Labeled>

            {/* Date of Joining */}
            <Labeled label="Date of Joining" required>
              <Pressable
                style={styles.dateField}
                onPress={() => {
                  setTempJoiningDate(joiningDate ?? today);
                  setShowJoiningPicker(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Select joining date"
              >
                <Text style={[styles.dateText, !joiningDate && styles.datePlaceholder]}>
                  {joiningDate ? formatDisplayDate(joiningDate) : "Select date"}
                </Text>
                <MaterialIcons name="calendar-today" size={20} color={colors.textMuted} />
              </Pressable>
            </Labeled>

            {/* Move Out Date */}
            <Labeled label="Move Out Date" required>
              <Pressable
                style={[styles.dateField, !joiningDate && styles.dateFieldDisabled]}
                onPress={() => {
                  if (joiningDate) {
                    setTempMoveOutDate(moveOutDate ?? joiningDate);
                    setShowMoveOutPicker(true);
                  }
                }}
                disabled={!joiningDate}
                accessibilityRole="button"
                accessibilityLabel="Select move out date"
              >
                <Text style={[styles.dateText, !moveOutDate && styles.datePlaceholder]}>
                  {moveOutDate ? formatDisplayDate(moveOutDate) : "Select date"}
                </Text>
                <MaterialIcons name="calendar-today" size={20} color={colors.textMuted} />
              </Pressable>
            </Labeled>

            {stayDaysNote ? <Text style={styles.noteText}>{stayDaysNote}</Text> : null}

            {/* Gender */}
            <Labeled label="Gender" required>
              <View style={styles.radioRow}>
                <View style={styles.radioItem}>
                  <RadioButton value="Male" status={gender === "Male" ? "checked" : "unchecked"} onPress={() => setGender("Male")} color={colors.accent} />
                  <Text style={styles.radioLabel}>Male</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="Female" status={gender === "Female" ? "checked" : "unchecked"} onPress={() => setGender("Female")} color={colors.accent} />
                  <Text style={styles.radioLabel}>Female</Text>
                </View>
              </View>
            </Labeled>

            <Text style={styles.sectionTitle}>Room Details</Text>

            {/* Room Select */}
            <Labeled label="Room" required>
              <View style={!datesSelected && styles.disabledField}>
                <SheetSelect
                  label="Select Room"
                  value={roomId}
                  options={roomOptions.map((r) => ({ id: r.id, value: r.value }))}
                  onChange={(v: string) => {
                    setRoomId(v);
                    setBedNumber("");
                  }}
                  disabled={!datesSelected || isLoadingRooms}
                />
              </View>
              {isLoadingRooms && datesSelected && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={{ marginLeft: 8, color: colors.textSecondary, fontSize: 12 }}>Loading rooms...</Text>
                </View>
              )}
            </Labeled>

            {/* Bed Select */}
            <Labeled label="Bed" required>
              <View style={!roomId && styles.disabledField}>
                <SheetSelect
                  label="Select Bed"
                  value={bedNumber}
                  options={bedOptions}
                  onChange={setBedNumber}
                  disabled={!roomId}
                />
              </View>
            </Labeled>

            <Text style={styles.sectionTitle}>Payment Details</Text>

            {/* Rent Amount */}
            <Labeled label="Rent Amount" required>
              <TextInput
                mode="outlined"
                value={formatIndianNumber(parseFormattedNumber(rentAmount))}
                onChangeText={(t) => setRentAmount(t.replace(/[^0-9]/g, ""))}
                placeholder="Enter rent amount"
                keyboardType="numeric"
                style={styles.input}
                outlineColor={hexToRgba(colors.textMuted, 0.2)}
                activeOutlineColor={colors.accent}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                left={<TextInput.Affix text="₹" />}
              />
            </Labeled>

            {/* Deposit Amount */}
            <Labeled label="Deposit Amount" required>
              <TextInput
                mode="outlined"
                value={formatIndianNumber(parseFormattedNumber(depositAmount))}
                onChangeText={(t) => setDepositAmount(t.replace(/[^0-9]/g, ""))}
                placeholder="Enter deposit amount"
                keyboardType="numeric"
                style={styles.input}
                outlineColor={hexToRgba(colors.textMuted, 0.2)}
                activeOutlineColor={colors.accent}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                left={<TextInput.Affix text="₹" />}
              />
            </Labeled>

            {/* Due Amount for Stay */}
            <Labeled label="Due Amount for Stay" required>
              <TextInput
                mode="outlined"
                value={formatIndianNumber(dueAmountForStay)}
                editable={false}
                style={[styles.input, styles.disabledField]}
                outlineColor={hexToRgba(colors.textMuted, 0.2)}
                textColor={colors.textPrimary}
                left={<TextInput.Affix text="₹" />}
              />
            </Labeled>

            {/* Collected Adv Rent */}
            <Labeled label="Collected Adv Rent Amount">
              <TextInput
                mode="outlined"
                value={collectedAdvRent ? formatIndianNumber(parseFormattedNumber(collectedAdvRent)) : ""}
                onChangeText={(t) => setCollectedAdvRent(t.replace(/[^0-9]/g, ""))}
                placeholder="Enter collected advance rent"
                keyboardType="numeric"
                style={styles.input}
                outlineColor={hexToRgba(colors.textMuted, 0.2)}
                activeOutlineColor={colors.accent}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                left={<TextInput.Affix text="₹" />}
              />
            </Labeled>

            {/* Collected Adv Deposit */}
            <Labeled label="Collected Adv Deposit Amount">
              <TextInput
                mode="outlined"
                value={collectedAdvDeposit ? formatIndianNumber(parseFormattedNumber(collectedAdvDeposit)) : ""}
                onChangeText={(t) => setCollectedAdvDeposit(t.replace(/[^0-9]/g, ""))}
                placeholder="Enter collected advance deposit"
                keyboardType="numeric"
                style={styles.input}
                outlineColor={hexToRgba(colors.textMuted, 0.2)}
                activeOutlineColor={colors.accent}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                left={<TextInput.Affix text="₹" />}
              />
            </Labeled>

            {/* Email */}
            <Labeled label="Email">
              <TextInput
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineColor={hexToRgba(colors.textMuted, 0.2)}
                activeOutlineColor={colors.accent}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
              />
            </Labeled>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Android Date Pickers */}
      {Platform.OS === "android" && showJoiningPicker && (
        <DateTimePicker
          value={joiningDate ?? today}
          mode="date"
          display="default"
          onChange={handleJoiningDateChange}
          minimumDate={minJoiningDate}
          maximumDate={maxJoiningDate}
        />
      )}
      {Platform.OS === "android" && showMoveOutPicker && (
        <DateTimePicker
          value={moveOutDate ?? minMoveOutDate}
          mode="date"
          display="default"
          onChange={handleMoveOutDateChange}
          minimumDate={minMoveOutDate}
          maximumDate={maxMoveOutDate}
        />
      )}

      {/* iOS Date Picker Modals */}
      {Platform.OS === "ios" && showJoiningPicker && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowJoiningPicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowJoiningPicker(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowJoiningPicker(false)}>
                  <Text style={[styles.modalAction, { color: colors.error }]}>Cancel</Text>
                </Pressable>
                <Text style={styles.modalTitle}>Date of Joining</Text>
                <Pressable onPress={confirmJoiningDate}>
                  <Text style={styles.modalAction}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempJoiningDate}
                mode="date"
                display="spinner"
                onChange={handleJoiningDateChange}
                minimumDate={minJoiningDate}
                maximumDate={maxJoiningDate}
                style={{ height: 200 }}
                textColor={colors.textPrimary}
                themeVariant="light"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {Platform.OS === "ios" && showMoveOutPicker && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowMoveOutPicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowMoveOutPicker(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowMoveOutPicker(false)}>
                  <Text style={[styles.modalAction, { color: colors.error }]}>Cancel</Text>
                </Pressable>
                <Text style={styles.modalTitle}>Move Out Date</Text>
                <Pressable onPress={confirmMoveOutDate}>
                  <Text style={styles.modalAction}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempMoveOutDate}
                mode="date"
                display="spinner"
                onChange={handleMoveOutDateChange}
                minimumDate={minMoveOutDate}
                maximumDate={maxMoveOutDate}
                style={{ height: 200 }}
                textColor={colors.textPrimary}
                themeVariant="light"
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
