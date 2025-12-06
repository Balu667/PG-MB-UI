// app/protected/dues/[id].tsx
// Pay/Edit Due Screen - Premium design with proper validation
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Text,
  StyleSheet,
  I18nManager,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Text as PaperText,
  TextInput,
  Divider,
  Portal,
  Dialog,
} from "react-native-paper";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useGetAllPropertyPayments, useUpdatePayment } from "@/src/hooks/payments";
import { useProperty } from "@/src/context/PropertyContext";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

interface FormValues {
  paymentCategory: string;
  amount: string;
  dueDate: Date | null;
  collectedAmount: string;
  paymentMode: string;
  paymentDate: Date | null;
  description: string;
}

const PAYMENT_CATEGORIES = [
  { id: "rent", value: "Rent" },
  { id: "maintenance", value: "maintenance" },
  { id: "electricity", value: "electricity bill" },
  { id: "water", value: "water bill" },
  { id: "food", value: "food charges" },
  { id: "internet", value: "internet charges" },
  { id: "laundry", value: "laundry charges" },
  { id: "security", value: "security deposit" },
  { id: "cleaning", value: "cleaning services" },
  { id: "parking", value: "parking charges" },
] as const;

const PAYMENT_MODES = [
  { id: "cash", value: "Cash" },
  { id: "online", value: "Online" },
] as const;

const formatDisplayDate = (d: Date | null): string => {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "Select date";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Format number to Indian currency format (2,34,567)
const formatIndianNumber = (num: string): string => {
  const cleaned = num.replace(/[^0-9]/g, "");
  if (!cleaned) return "";

  const number = parseInt(cleaned, 10);
  if (isNaN(number)) return cleaned;

  return number.toLocaleString("en-IN");
};

// Parse formatted number back to raw digits
const parseFormattedNumber = (formatted: string): string => {
  return formatted.replace(/[^0-9]/g, "");
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
   SHEET SELECT COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface SheetSelectProps {
  value?: string;
  options: readonly { id: string; value: string }[];
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

  const selectedLabel = options.find((o) => o.id === value)?.value;

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
          backgroundColor: colors.cardSurface,
          paddingVertical: 12,
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
        <PaperText
          style={{
            color: selectedLabel ? colors.textPrimary : colors.textMuted,
            fontSize: typography.fontSizeMd,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </PaperText>
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
              fontWeight: typography.weightMedium,
              fontSize: typography.fontSizeMd,
            }}
          >
            {placeholder}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ padding: spacing.sm }}
              keyboardShouldPersistTaps="always"
            >
              {options.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    style={{
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderColor: hexToRgba(colors.textSecondary, 0.12),
                      minHeight: 48,
                      justifyContent: "center",
                      backgroundColor: isSelected
                        ? hexToRgba(colors.accent, 0.1)
                        : "transparent",
                      borderRadius: isSelected ? 10 : 0,
                      paddingHorizontal: 8,
                      marginBottom: 4,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={opt.value}
                    accessibilityState={{ selected: isSelected }}
                    accessible
                  >
                    <PaperText
                      style={{
                        color: colors.textPrimary,
                        fontWeight: isSelected ? "700" : "400",
                      }}
                    >
                      {opt.value}
                    </PaperText>
                  </Pressable>
                );
              })}
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

export default function PayOrEditDue() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();

  // Params
  const params = useLocalSearchParams<{
    id: string;
    dueId?: string;
    mode?: string;
  }>();
  const propertyId = String(params?.id ?? "");
  const dueId = String(params?.dueId ?? "");
  const mode = String(params?.mode ?? "pay");
  const isPayMode = mode === "pay";
  const isEditMode = mode === "edit";

  // Profile data
  const profileData = useSelector(
    (state: { profileDetails?: { profileData?: Record<string, unknown> } }) =>
      state?.profileDetails?.profileData
  );
  const createdBy = String(
    (profileData as Record<string, unknown>)?.userId ||
    (profileData as Record<string, unknown>)?._id ||
    ""
  );

  // Properties from context for subtitle
  const { properties } = useProperty();
  const currentPropertyName = useMemo(() => {
    const prop = properties.find((p) => String(p._id) === propertyId);
    return prop?.propertyName ?? "";
  }, [properties, propertyId]);

  // Fetch dues to get the due item
  const duesQuery = useGetAllPropertyPayments(`${propertyId}?status=2&tenantStatus=1,2,3`);
  const existing = useMemo(() => {
    const raw = duesQuery?.data;
    const dues = raw?.data?.dues ?? raw?.dues ?? {};
    const payments: any[] = Array.isArray(dues?.payments) ? dues.payments : [];
    return payments.find((p) => String(p?._id) === dueId);
  }, [duesQuery?.data, dueId]);

  // Form state
  const [paymentCategory, setPaymentCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [collectedAmount, setCollectedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [description, setDescription] = useState("");

  // Track initial values for dirty check
  const initialValues = useRef<FormValues | null>(null);

  // Date picker states
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);
  const [tempDueDate, setTempDueDate] = useState<Date>(() => new Date());
  const [tempPaymentDate, setTempPaymentDate] = useState<Date>(() => new Date());

  // Mutation - use empty callback to prevent default alert, handle in component
  const updatePayment = useUpdatePayment(() => {});

  // Map API category value to dropdown id
  const mapCategoryToId = useCallback((category: string): string => {
    if (!category) return "";
    const cat = String(category).toLowerCase().trim();
    
    // Map API values to dropdown ids
    if (cat.includes("rent") && !cat.includes("deposit")) return "rent";
    if (cat.includes("maintenance")) return "maintenance";
    if (cat.includes("electricity")) return "electricity";
    if (cat.includes("water")) return "water";
    if (cat.includes("food")) return "food";
    if (cat.includes("internet")) return "internet";
    if (cat.includes("laundry")) return "laundry";
    if (cat.includes("security") || cat.includes("deposit")) return "security";
    if (cat.includes("cleaning")) return "cleaning";
    if (cat.includes("parking")) return "parking";
    
    // If it's already an id, return as-is
    const validIds = ["rent", "maintenance", "electricity", "water", "food", "internet", "laundry", "security", "cleaning", "parking"];
    if (validIds.includes(cat)) return cat;
    
    return cat; // Fallback to original value
  }, []);

  // Prefill form from existing due
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !existing) return;

    const apiCategory = String(existing?.paymentCategory ?? "");
    const catId = mapCategoryToId(apiCategory);
    const amt = String(existing?.amount ?? "");
    const dueDt = existing?.dueDate ? new Date(String(existing.dueDate)) : null;
    const payDt = existing?.paymentDate ? new Date(String(existing.paymentDate)) : null;
    const desc = String(existing?.description ?? "");
    // Map payment mode: API might return "Cash" or "cash", normalize to lowercase for dropdown
    const apiPayMode = String(existing?.paymentMode ?? "").toLowerCase();
    const payMode = apiPayMode === "cash" ? "cash" : apiPayMode === "online" ? "online" : apiPayMode;

    setPaymentCategory(catId);
    setAmount(amt);
    setDueDate(dueDt && !isNaN(dueDt.getTime()) ? dueDt : null);
    setPaymentDate(payDt && !isNaN(payDt.getTime()) ? payDt : null);
    setDescription(desc);
    setPaymentMode(payMode);

    // Store initial values
    initialValues.current = {
      paymentCategory: catId,
      amount: amt,
      dueDate: dueDt && !isNaN(dueDt.getTime()) ? dueDt : null,
      collectedAmount: "",
      paymentMode: payMode,
      paymentDate: payDt && !isNaN(payDt.getTime()) ? payDt : null,
      description: desc,
    };

    prefilled.current = true;
  }, [existing, mapCategoryToId]);

  // Set initial values for new form
  useEffect(() => {
    if (!initialValues.current && !existing) {
      initialValues.current = {
        paymentCategory: "",
        amount: "",
        dueDate: null,
        collectedAmount: "",
        paymentMode: "",
        paymentDate: null,
        description: "",
      };
    }
  }, [existing]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!initialValues.current) {
      return !!(
        paymentCategory ||
        amount ||
        collectedAmount ||
        paymentMode ||
        description ||
        dueDate ||
        paymentDate
      );
    }

    const initial = initialValues.current;
    const dueDateChanged =
      dueDate?.toISOString().split("T")[0] !==
      initial.dueDate?.toISOString().split("T")[0];
    const paymentDateChanged =
      paymentDate?.toISOString().split("T")[0] !==
      initial.paymentDate?.toISOString().split("T")[0];

    return (
      paymentCategory !== initial.paymentCategory ||
      amount !== initial.amount ||
      collectedAmount !== initial.collectedAmount ||
      paymentMode !== initial.paymentMode ||
      description !== initial.description ||
      dueDateChanged ||
      paymentDateChanged
    );
  }, [
    paymentCategory,
    amount,
    collectedAmount,
    paymentMode,
    description,
    dueDate,
    paymentDate,
  ]);

  // Navigation back to DuesTab with refresh
  const navigateBackToDues = useCallback(() => {
    try {
      queryClient.invalidateQueries({ queryKey: ["tenantPaymentList"] });
      queryClient.invalidateQueries({ queryKey: ["propertyPaymentList"] });
    } catch {
      // Ignore
    }
    router.replace({
      pathname: `/protected/property/${propertyId}`,
      params: { tab: "Dues", refresh: String(Date.now()) },
    });
  }, [queryClient, router, propertyId]);

  // Show unsaved changes alert
  const showUnsavedChangesAlert = useCallback(
    (onConfirm: () => void) => {
      if (hasUnsavedChanges()) {
        Alert.alert(
          "Unsaved Changes",
          "You have unsaved changes. They will not be saved. Are you sure you want to leave?",
          [
            { text: "No", style: "cancel" },
            { text: "Yes", style: "destructive", onPress: onConfirm },
          ],
          { cancelable: true }
        );
      } else {
        onConfirm();
      }
    },
    [hasUnsavedChanges]
  );

  // Handle back button
  const handleBack = useCallback(() => {
    showUnsavedChangesAlert(navigateBackToDues);
  }, [showUnsavedChangesAlert, navigateBackToDues]);

  // Handle cancel button
  const onCancel = useCallback(() => {
    showUnsavedChangesAlert(navigateBackToDues);
  }, [showUnsavedChangesAlert, navigateBackToDues]);

  // Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  // Input handlers
  const onAmountChange = useCallback((text: string) => {
    const digitsOnly = parseFormattedNumber(text).slice(0, 9);
    setAmount(digitsOnly);
  }, []);

  const onCollectedAmountChange = useCallback((text: string) => {
    const digitsOnly = parseFormattedNumber(text).slice(0, 9);
    setCollectedAmount(digitsOnly);
    // Clear payment mode and date if collected amount is cleared
    if (!digitsOnly) {
      setPaymentMode("");
      setPaymentDate(null);
    }
  }, []);

  // Formatted amounts for display
  const displayAmount = useMemo(() => {
    return amount ? formatIndianNumber(amount) : "";
  }, [amount]);

  const displayCollectedAmount = useMemo(() => {
    return collectedAmount ? formatIndianNumber(collectedAmount) : "";
  }, [collectedAmount]);

  // Validation - mode specific
  const validate = useCallback((): string[] => {
    const errs: string[] = [];

    // Common validations for both modes
    // Payment category validation
    if (!paymentCategory || !paymentCategory.trim()) {
      errs.push("• Payment category is required.");
    }

    // Due date validation
    if (!dueDate || !(dueDate instanceof Date) || isNaN(dueDate.getTime())) {
      errs.push("• Due date is required.");
    }

    // Edit mode specific validations
    if (isEditMode) {
      // Amount validation for edit mode
      const amtNum = Number(amount || 0);
      if (!amount && amount !== "0") {
        errs.push("• Due amount is required.");
      } else if (isNaN(amtNum) || amtNum < 0) {
        errs.push("• Please enter a valid amount.");
      } else if (amtNum > 99999999) {
        errs.push("• Amount cannot exceed ₹9,99,99,999.");
      }
    }

    // Pay mode specific validations
    if (isPayMode) {
      // In pay mode, if collected amount is entered, validate related fields
      if (collectedAmount) {
        const collectedNum = Number(collectedAmount || 0);
        if (isNaN(collectedNum) || collectedNum <= 0) {
          errs.push("• Collected amount must be greater than 0.");
        } else if (collectedNum > 99999999) {
          errs.push("• Collected amount cannot exceed ₹9,99,99,999.");
        }

        if (!paymentMode) {
          errs.push("• Payment mode is required when collected amount is entered.");
        }

        if (!paymentDate || !(paymentDate instanceof Date) || isNaN(paymentDate.getTime())) {
          errs.push("• Payment date is required when collected amount is entered.");
        }
      }
    }

    return errs;
  }, [
    paymentCategory,
    amount,
    dueDate,
    collectedAmount,
    paymentMode,
    paymentDate,
    isPayMode,
    isEditMode,
  ]);

  // Submit handler
  const onSubmit = useCallback(async () => {
    const errs = validate();
    if (errs.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Missing Required Fields",
        errs.join("\n"),
        [{ text: "OK", style: "default" }],
        { cancelable: true }
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Get createdBy and tenantId from existing due item
      const dueCreatedBy = String(existing?.createdBy ?? createdBy ?? "");
      const dueTenantId = String(existing?.tenantId ?? "");
      const paymentId = String(existing?._id ?? dueId);

      // Build payload based on mode
      const payload: Record<string, unknown> = {
        paymentCategory: paymentCategory.trim(),
        dueDate: dueDate?.toISOString(),
        description: description.trim() || existing?.description || "",
        createdBy: dueCreatedBy,
        tenantId: dueTenantId,
      };

      if (isEditMode) {
        // Edit mode: update due amount and add status
        payload.amount = Number(amount || 0);
        payload.status = 2;
      } else {
        // Pay mode: keep original amount, add collected amount fields
        payload.amount = Number(existing?.amount || amount || 0);
        payload.collectedAmount = collectedAmount ? Number(collectedAmount) : 0;
        
        // Add payment mode and date if collecting
        if (collectedAmount) {
          // Capitalize payment mode: "cash" -> "Cash", "online" -> "Online"
          const modeCapitalized = paymentMode
            ? paymentMode.trim().charAt(0).toUpperCase() + paymentMode.trim().slice(1).toLowerCase()
            : "Cash";
          payload.paymentMode = modeCapitalized;
          payload.paymentDate = paymentDate
            ? paymentDate.toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
        } else {
          // Even without collected amount, send default values
          payload.paymentMode = existing?.paymentMode || "Cash";
          payload.paymentDate = new Date().toISOString().split("T")[0];
        }
      }

      // Both modes use updatePayment (we're updating an existing due)
      updatePayment.mutate(
        { data: payload, paymentId },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigateBackToDues();
          },
          onError: (error: unknown) => {
            // Extract errorMessage from various possible error structures
            let errorMessage = isEditMode
              ? "Could not update due. Please check your connection and try again."
              : "Could not record payment. Please check your connection and try again.";

            if (error instanceof Error) {
              errorMessage = error.message || errorMessage;
            } else if (error && typeof error === "object") {
              // Check for errorMessage in error object
              const errObj = error as Record<string, unknown>;
              errorMessage = String(
                errObj.errorMessage || errObj.message || errObj.error || errorMessage
              );
            }

            Alert.alert(isEditMode ? "Update Failed" : "Payment Failed", errorMessage, [
              { text: "OK" },
            ]);
          },
        }
      );
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.", [{ text: "OK" }]);
    }
  }, [
    validate,
    paymentCategory,
    amount,
    dueDate,
    description,
    createdBy,
    existing,
    isPayMode,
    isEditMode,
    collectedAmount,
    paymentMode,
    paymentDate,
    updatePayment,
    navigateBackToDues,
    dueId,
  ]);

  // Date picker handlers
  const openDueDatePicker = useCallback(() => {
    const validDate = dueDate instanceof Date && !isNaN(dueDate.getTime()) ? dueDate : new Date();
    setTempDueDate(new Date(validDate.getTime()));
    setShowDueDatePicker(true);
  }, [dueDate]);

  const openPaymentDatePicker = useCallback(() => {
    const validDate =
      paymentDate instanceof Date && !isNaN(paymentDate.getTime())
        ? paymentDate
        : new Date();
    setTempPaymentDate(new Date(validDate.getTime()));
    setShowPaymentDatePicker(true);
  }, [paymentDate]);

  const handleDueDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowDueDatePicker(false);
        if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
          setDueDate(new Date(selectedDate.getTime()));
        }
      } else {
        if (selectedDate && !isNaN(selectedDate.getTime())) {
          setTempDueDate(new Date(selectedDate.getTime()));
        }
      }
    },
    []
  );

  const handlePaymentDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowPaymentDatePicker(false);
        if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
          setPaymentDate(new Date(selectedDate.getTime()));
        }
      } else {
        if (selectedDate && !isNaN(selectedDate.getTime())) {
          setTempPaymentDate(new Date(selectedDate.getTime()));
        }
      }
    },
    []
  );

  const confirmIosDueDate = useCallback(() => {
    if (tempDueDate instanceof Date && !isNaN(tempDueDate.getTime())) {
      setDueDate(new Date(tempDueDate.getTime()));
    }
    setShowDueDatePicker(false);
  }, [tempDueDate]);

  const cancelIosDueDate = useCallback(() => {
    setShowDueDatePicker(false);
  }, []);

  const confirmIosPaymentDate = useCallback(() => {
    if (tempPaymentDate instanceof Date && !isNaN(tempPaymentDate.getTime())) {
      setPaymentDate(new Date(tempPaymentDate.getTime()));
    }
    setShowPaymentDatePicker(false);
  }, [tempPaymentDate]);

  const cancelIosPaymentDate = useCallback(() => {
    setShowPaymentDatePicker(false);
  }, []);

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
        amountRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        currencyPrefix: {
          padding: spacing.sm,
          height: 55,
          borderWidth: 1,
          borderColor: colors.borderColor,
          backgroundColor: colors.cardSurface,
          borderRadius: radius.lg,
          justifyContent: "center",
          minWidth: 48,
          alignItems: "center",
        },
        currencyText: {
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: 16,
        },
        amountInputWrap: {
          flex: 1,
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

  const headerTitle = isPayMode ? "Pay Due" : "Edit Due";
  const isSubmitting = updatePayment.isPending;

  // Show payment fields only in pay mode and when collected amount has value
  const showPaymentFields = isPayMode && !!collectedAmount;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={{ flex: 1 }}>
        {/* Custom Header with Back Button */}
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Navigate back to dues list"
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
            {!!currentPropertyName && (
              <PaperText style={styles.headerSubtitle} numberOfLines={1}>
                {currentPropertyName}
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
              {/* Payment Details Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Payment Details
                </Text>

                {/* Payment Category */}
                <Labeled label="Payment Category" required>
                  <SheetSelect
                    value={paymentCategory}
                    placeholder="Select category"
                    options={PAYMENT_CATEGORIES}
                    onChange={setPaymentCategory}
                    disabled={isPayMode}
                  />
                </Labeled>

                {/* Due Amount */}
                <Labeled label="Due Amount" required>
                  <View style={styles.amountRow}>
                    <View style={styles.currencyPrefix}>
                      <Text style={styles.currencyText}>₹</Text>
                    </View>
                    <View style={styles.amountInputWrap}>
                      <TextInput
                        value={displayAmount}
                        onChangeText={onAmountChange}
                        placeholder="e.g., 2,34,567"
                        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                        autoCorrect={false}
                        autoCapitalize="none"
                        mode="outlined"
                        theme={{ roundness: radius.lg }}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={{ minHeight: 48, padding: spacing.sm }}
                        accessibilityLabel="Due amount"
                        accessibilityHint="Enter the due amount in rupees"
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                        disabled={isPayMode}
                      />
                    </View>
                  </View>
                </Labeled>

                {/* Due Date */}
                <Labeled label="Due Date" required>
                  <Pressable
                    style={[styles.dateBtn, isPayMode && { opacity: 0.6 }]}
                    onPress={isPayMode ? undefined : openDueDatePicker}
                    accessibilityRole="button"
                    accessibilityLabel={`Select due date, current: ${formatDisplayDate(dueDate)}`}
                    accessibilityState={{ disabled: isPayMode }}
                    accessible
                  >
                    <MaterialIcons name="event" size={20} color={colors.textSecondary} />
                    <PaperText
                      style={{
                        color: colors.textPrimary,
                        fontSize: typography.fontSizeMd,
                        flex: 1,
                      }}
                    >
                      {formatDisplayDate(dueDate)}
                    </PaperText>
                    {!isPayMode && (
                      <MaterialIcons
                        name="keyboard-arrow-down"
                        size={20}
                        color={colors.textSecondary}
                      />
                    )}
                  </Pressable>
                </Labeled>

                {/* Description */}
                <Labeled label="Description (optional)">
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add a note about this payment"
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, padding: spacing.sm }}
                    accessibilityLabel="Payment description"
                    accessibilityHint="Optional description for the payment"
                    multiline
                    numberOfLines={2}
                  />
                </Labeled>
              </View>

              {/* Payment Collection Section - Only in Pay Mode */}
              {isPayMode && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                    Payment Collection
                  </Text>

                  {/* Collected Amount */}
                  <Labeled label="Collected Amount">
                    <View style={styles.amountRow}>
                      <View style={styles.currencyPrefix}>
                        <Text style={styles.currencyText}>₹</Text>
                      </View>
                      <View style={styles.amountInputWrap}>
                        <TextInput
                          value={displayCollectedAmount}
                          onChangeText={onCollectedAmountChange}
                          placeholder="e.g., 2,34,567"
                          keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                          autoCorrect={false}
                          autoCapitalize="none"
                          mode="outlined"
                          theme={{ roundness: radius.lg }}
                          outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                          activeOutlineColor={colors.accent}
                          style={styles.input}
                          textColor={colors.textPrimary}
                          placeholderTextColor={colors.textMuted}
                          contentStyle={{ minHeight: 48, padding: spacing.sm }}
                          accessibilityLabel="Collected amount"
                          accessibilityHint="Enter the collected amount in rupees"
                          returnKeyType="done"
                          onSubmitEditing={() => Keyboard.dismiss()}
                        />
                      </View>
                    </View>
                  </Labeled>

                  {/* Payment Mode - Only shown when collected amount has value */}
                  {showPaymentFields && (
                    <Labeled label="Payment Mode">
                      <SheetSelect
                        value={paymentMode}
                        placeholder="Select payment mode"
                        options={PAYMENT_MODES}
                        onChange={setPaymentMode}
                        disabled={!collectedAmount}
                      />
                    </Labeled>
                  )}

                  {/* Payment Date - Only shown when collected amount has value */}
                  {showPaymentFields && (
                    <Labeled label="Payment Date" required>
                      <Pressable
                        style={styles.dateBtn}
                        onPress={openPaymentDatePicker}
                        accessibilityRole="button"
                        accessibilityLabel={`Select payment date, current: ${formatDisplayDate(
                          paymentDate
                        )}`}
                        accessible
                      >
                        <MaterialIcons name="event" size={20} color={colors.textSecondary} />
                        <PaperText
                          style={{
                            color: colors.textPrimary,
                            fontSize: typography.fontSizeMd,
                            flex: 1,
                          }}
                        >
                          {formatDisplayDate(paymentDate)}
                        </PaperText>
                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </Labeled>
                  )}
                </View>
              )}

              <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

              {/* Footer Buttons */}
              <View style={styles.footerRow}>
                <Button
                  mode="outlined"
                  style={styles.secondaryBtn}
                  textColor={colors.textPrimary}
                  onPress={onCancel}
                  accessibilityLabel="Cancel and go back"
                  accessibilityHint="Discards changes and returns to dues list"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  style={styles.primaryBtn}
                  onPress={onSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  accessibilityLabel={isPayMode ? "Submit payment" : "Update due"}
                  accessibilityHint={isPayMode ? "Processes the payment" : "Saves changes to due"}
                >
                  {isPayMode ? "Submit" : "Update"}
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>

      {/* Due Date Picker - Platform specific */}
      {Platform.OS === "android" && showDueDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDueDateChange}
        />
      )}

      {/* Payment Date Picker - Platform specific */}
      {Platform.OS === "android" && showPaymentDatePicker && (
        <DateTimePicker
          value={paymentDate || new Date()}
          mode="date"
          display="default"
          onChange={handlePaymentDateChange}
        />
      )}

      {/* iOS Due Date Picker Modal */}
      {Platform.OS === "ios" && showDueDatePicker && (
        <Modal
          visible={showDueDatePicker}
          transparent
          animationType="slide"
          onRequestClose={cancelIosDueDate}
        >
          <Pressable style={styles.datePickerModal} onPress={cancelIosDueDate}>
            <Pressable style={styles.datePickerContainer} onPress={() => {}}>
              <View style={styles.datePickerHeader}>
                <Pressable onPress={cancelIosDueDate} style={styles.datePickerBtn}>
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
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* iOS Payment Date Picker Modal */}
      {Platform.OS === "ios" && showPaymentDatePicker && (
        <Modal
          visible={showPaymentDatePicker}
          transparent
          animationType="slide"
          onRequestClose={cancelIosPaymentDate}
        >
          <Pressable style={styles.datePickerModal} onPress={cancelIosPaymentDate}>
            <Pressable style={styles.datePickerContainer} onPress={() => {}}>
              <View style={styles.datePickerHeader}>
                <Pressable onPress={cancelIosPaymentDate} style={styles.datePickerBtn}>
                  <Text style={[styles.datePickerBtnText, { color: colors.error }]}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>Select Payment Date</Text>
                <Pressable onPress={confirmIosPaymentDate} style={styles.datePickerBtn}>
                  <Text style={[styles.datePickerBtnText, { color: colors.accent }]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={
                  tempPaymentDate instanceof Date && !isNaN(tempPaymentDate.getTime())
                    ? tempPaymentDate
                    : new Date()
                }
                mode="date"
                display="spinner"
                onChange={handlePaymentDateChange}
                style={{ height: 200 }}
                textColor={colors.textPrimary}
                themeVariant="light"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

