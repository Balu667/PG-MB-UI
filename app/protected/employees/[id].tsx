// app/protected/employees/[id].tsx
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
  Checkbox,
} from "react-native-paper";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { MaterialIcons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useInsertEmployee, useUpdateEmployee, useGetAllEmployees } from "@/src/hooks/employee";
import { useProperty } from "@/src/context/PropertyContext";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPER TYPES & UTILITIES
───────────────────────────────────────────────────────────────────────────── */

interface RoleOption {
  label: string;
  value: string;
}

interface PropertyOption {
  label: string;
  value: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SMALL UI ATOMS (REUSED)
───────────────────────────────────────────────────────────────────────────── */

const Title = React.memo(({ children }: { children: React.ReactNode }) => {
  const { colors, spacing } = useTheme();
  return (
    <PaperText
      style={{
        color: colors.textSecondary,
        fontWeight: "700",
        marginBottom: 8,
        letterSpacing: 0.2,
        marginTop: spacing.lg,
      }}
      accessible
      accessibilityRole="header"
    >
      {children}
    </PaperText>
  );
});

Title.displayName = "Title";

const Labeled = React.memo(({ label, children }: { label: string; children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 8, marginBottom: 10 }}>
      <PaperText
        style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}
        accessible
        accessibilityRole="text"
      >
        {label}
      </PaperText>
      {children}
    </View>
  );
});

Labeled.displayName = "Labeled";

/* ─────────────────────────────────────────────────────────────────────────────
   SHEET SELECT COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface SheetSelectProps {
  value?: string;
  options: RoleOption[];
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

const SheetSelect = React.memo(function SheetSelect({
  value,
  options,
  placeholder,
  onChange,
  disabled,
  loading,
}: SheetSelectProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);

  const currentLabel = options.find((o) => o.value === value)?.label;

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
            color: value ? colors.textPrimary : colors.textMuted,
            fontSize: typography.fontSizeMd,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {currentLabel || (loading ? "Loading..." : placeholder)}
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
            // marginTop: "auto",
          }}
        >
          <Dialog.Title style={{ color: colors.textPrimary, marginBottom: 6, fontWeight: typography.weightMedium, fontSize: typography.fontSizeMd }}>
            {placeholder}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{  padding: spacing.sm }}
              keyboardShouldPersistTaps="always"
            >
              {loading ? (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 8 }}>
                  Loading...
                </PaperText>
              ) : options.length === 0 ? (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 8 }}>
                  No options
                </PaperText>
              ) : (
                options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onChange(opt.value);
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
                      accessibilityLabel={opt.label}
                      accessibilityState={{ selected: isSelected }}
                      accessible
                    >
                      <PaperText
                        style={{
                          color: colors.textPrimary,
                          fontWeight: isSelected ? "700" : "400",
                        }}
                      >
                        {opt.label}
                      </PaperText>
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
   MULTI SELECT SHEET COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface MultiSelectSheetProps {
  values: string[];
  options: PropertyOption[];
  placeholder: string;
  onChange: (v: string[]) => void;
}

const MultiSelectSheet = React.memo(function MultiSelectSheet({
  values,
  options,
  placeholder,
  onChange,
}: MultiSelectSheetProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedLabels = options.filter((o) => values.includes(o.value)).map((o) => o.label);

  return (
    <>
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
          minHeight: 55,
          justifyContent: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        accessibilityHint="Opens multi-selection menu"
        accessible
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <PaperText
            style={{
              color: selectedLabels.length ? colors.textPrimary : colors.textMuted,
              fontSize: typography.fontSizeMd,
              flex: 1,
            }}
            numberOfLines={2}
          >
            {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
          </PaperText>
          <MaterialIcons
            name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            // marginTop: "auto",
          }}
        >
          <Dialog.Title style={{ color: colors.textPrimary, marginBottom: 16, fontWeight: typography.weightMedium, fontSize: typography.fontSizeMd }}>
            {placeholder}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ padding: spacing.sm }}
              keyboardShouldPersistTaps="always"
            >
              {options.map((opt) => {
                const checked = values.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      const next = checked
                        ? values.filter((v) => v !== opt.value)
                        : [...values, opt.value];
                      onChange(next);
                    }}
                    style={{
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderColor: hexToRgba(colors.textSecondary, 0.12),
                      minHeight: 48,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={opt.label}
                    accessible
                  >
                    <PaperText style={{ color: colors.textPrimary, flex: 1 }}>{opt.label}</PaperText>
                    <Checkbox status={checked ? "checked" : "unchecked"} color={colors.accent} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions >
            <Button onPress={() => setOpen(false)} textColor={colors.accent}>
              Done
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

export default function AddOrEditEmployee() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();

  const { id: propertyId, employeeId } = useLocalSearchParams<{
    id: string;
    employeeId?: string;
  }>();
  const isEditMode = !!employeeId;

  // Profile (ownerId is required for payload)
  const { profileData } = useSelector((state: { profileDetails?: { profileData?: Record<string, unknown> } }) => state?.profileDetails ?? {});
  const ownerId = String(
    (profileData as Record<string, unknown>)?.ownerId ||
    (profileData as Record<string, unknown>)?.userId ||
    (profileData as Record<string, unknown>)?._id ||
    ""
  );

  // Employees list to prefill on edit
  const { data: employeesResp } = useGetAllEmployees(ownerId);
  const existing = useMemo(() => {
    const arr: Record<string, unknown>[] = Array.isArray(employeesResp)
      ? employeesResp
      : (employeesResp as { data?: Record<string, unknown>[] })?.data ?? [];
    return arr.find((x) => String(x?._id) === String(employeeId));
  }, [employeesResp, employeeId]);

  // Properties from context
  const { properties } = useProperty();
  const propertyOptions: PropertyOption[] = useMemo(
    () =>
      (Array.isArray(properties) ? properties : [])
        .map((p) => ({
          label: String(p?.propertyName ?? "—"),
          value: String(p?._id ?? ""),
        }))
        .filter((o) => !!o.value),
    [properties]
  );

  // Roles (numeric values)
  const ROLE_OPTIONS: RoleOption[] = useMemo(
    () => [
      { label: "Admin", value: "2" },
      { label: "Partner", value: "3" },
    ],
    []
  );

  // Form state
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("2"); // default Admin
  const [phone, setPhone] = useState<string>(""); // raw 10 digits
  const [email, setEmail] = useState<string>("");
  const [assignedProps, setAssignedProps] = useState<string[]>(
    propertyId ? [String(propertyId)] : []
  );

  // Track initial values for dirty check
  const initialValues = useRef<{
    name: string;
    role: string;
    phone: string;
    email: string;
    assignedProps: string[];
  } | null>(null);

  // Prefill edit mode
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEditMode || prefilled.current || !existing) return;

    const initialName = String((existing as Record<string, unknown>)?.empName ?? "");
    const initialRole = String((existing as Record<string, unknown>)?.role ?? "2");
    const initialPhone = String((existing as Record<string, unknown>)?.empContactNumber ?? "")
      .replace(/[^\d]/g, "")
      .slice(0, 10);
    const initialEmail = String((existing as Record<string, unknown>)?.empEmail ?? "");
    const ap = Array.isArray((existing as Record<string, unknown>)?.assignedProperties)
      ? ((existing as Record<string, unknown>).assignedProperties as string[])
          .map((x) => String(x))
          .filter(Boolean)
      : [];
    const initialAssigned = ap.length ? ap : propertyId ? [String(propertyId)] : [];

    setName(initialName);
    setRole(initialRole);
    setPhone(initialPhone);
    setEmail(initialEmail);
    setAssignedProps(initialAssigned);

    // Store initial values for dirty check
    initialValues.current = {
      name: initialName,
      role: initialRole,
      phone: initialPhone,
      email: initialEmail,
      assignedProps: initialAssigned,
    };

    prefilled.current = true;
  }, [isEditMode, existing, propertyId]);

  // Set initial values for add mode
  useEffect(() => {
    if (!isEditMode && !initialValues.current) {
      initialValues.current = {
        name: "",
        role: "2",
        phone: "",
        email: "",
        assignedProps: propertyId ? [String(propertyId)] : [],
      };
    }
  }, [isEditMode, propertyId]);

  // Check if form is dirty (has unsaved changes)
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!initialValues.current) {
      // If no initial values, check if any field has content
      return !!(
        name.trim() ||
        phone.trim() ||
        email.trim() ||
        role !== "2" ||
        assignedProps.length > (propertyId ? 1 : 0)
      );
    }

    const initial = initialValues.current;
    const assignedChanged =
      JSON.stringify([...assignedProps].sort()) !==
      JSON.stringify([...initial.assignedProps].sort());

    return (
      name !== initial.name ||
      role !== initial.role ||
      phone !== initial.phone ||
      email !== initial.email ||
      assignedChanged
    );
  }, [name, role, phone, email, assignedProps, propertyId]);

  // Hooks for mutations
  const insertEmployee = useInsertEmployee(() => {});
  const updateEmployee = useUpdateEmployee(() => {});

  // Input handlers

  /**
   * Name handler: Only allow alphabets (a-z, A-Z) and spaces
   * No special characters or numbers allowed
   */
  const onNameChange = useCallback((text: string) => {
    // Remove any character that is not a letter or space
    const sanitized = text.replace(/[^a-zA-Z\s]/g, "");
    setName(sanitized);
  }, []);

  /**
   * Phone handler: Only allow digits, max 10
   */
  const onPhoneChange = useCallback((text: string) => {
    const digitsOnly = (text || "").replace(/[^\d]/g, "").slice(0, 10);
    setPhone(digitsOnly);
  }, []);

  /**
   * Email validation regex (RFC 5322 compliant simplified version)
   * Checks for: local-part@domain.tld format
   */
  const isValidEmail = useCallback((emailStr?: string): boolean => {
    if (!emailStr || !emailStr.trim()) return true; // Empty is valid (optional field)
    const trimmed = emailStr.trim().toLowerCase();
    // More comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(trimmed);
  }, []);

  /**
   * Name validation: Only alphabets and spaces, min 2 characters
   */
  const isValidName = useCallback((nameStr?: string): boolean => {
    if (!nameStr || !nameStr.trim()) return false;
    const trimmed = nameStr.trim();
    // Must be at least 2 characters and only contain letters and spaces
    const nameRegex = /^[a-zA-Z][a-zA-Z\s]*[a-zA-Z]$|^[a-zA-Z]{2,}$/;
    return trimmed.length >= 2 && nameRegex.test(trimmed);
  }, []);

  /**
   * Phone validation: Exactly 10 digits
   */
  const isValidPhone = useCallback((phoneStr?: string): boolean => {
    if (!phoneStr) return false;
    const digitsOnly = phoneStr.replace(/[^\d]/g, "");
    return digitsOnly.length === 10;
  }, []);

  /**
   * Comprehensive form validation
   */
  const validate = useCallback(() => {
    const errs: string[] = [];

    // Owner validation
    if (!ownerId) {
      errs.push("Owner not found. Please re-login.");
    }

    // Name validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.push("Employee name is required.");
    } else if (trimmedName.length < 2) {
      errs.push("Employee name must be at least 2 characters.");
    } else if (!isValidName(trimmedName)) {
      errs.push("Employee name can only contain letters and spaces.");
    }

    // Role validation
    if (!role || !["2", "3"].includes(role)) {
      errs.push("Please select a valid role (Admin or Partner).");
    }

    // Phone validation
    if (!phone) {
      errs.push("Contact number is required.");
    } else if (!isValidPhone(phone)) {
      errs.push("Contact number must be exactly 10 digits.");
    }

    // Email validation (optional but must be valid if provided)
    const trimmedEmail = email.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      errs.push("Please enter a valid email address (e.g., name@example.com).");
    }

    // Properties validation
    if (!assignedProps.length) {
      errs.push("Please select at least one property.");
    }

    return errs;
  }, [ownerId, name, role, phone, email, assignedProps, isValidName, isValidPhone, isValidEmail]);

  // Navigation back to StaffTab with refresh
  const navigateBackToStaff = useCallback(() => {
    try {
      // Invalidate employee list query to ensure StaffTab refreshes
      queryClient.invalidateQueries({ queryKey: ["employeeList"] });
    } catch {
      // Ignore query client errors
    }
    router.replace({
      pathname: `/protected/property/${String(propertyId)}`,
      params: { tab: "Staff", refresh: String(Date.now()) },
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
            {
              text: "Yes",
              style: "destructive",
              onPress: onConfirm,
            },
          ],
          { cancelable: true }
        );
      } else {
        onConfirm();
      }
    },
    [hasUnsavedChanges]
  );

  // Handle back button press
  const handleBack = useCallback(() => {
    showUnsavedChangesAlert(navigateBackToStaff);
  }, [showUnsavedChangesAlert, navigateBackToStaff]);

  // Handle cancel button press
  const onCancel = useCallback(() => {
    showUnsavedChangesAlert(navigateBackToStaff);
  }, [showUnsavedChangesAlert, navigateBackToStaff]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true; // Prevent default back behavior
    });
    return () => backHandler.remove();
  }, [handleBack]);

  // Submit handler
  const onSubmit = useCallback(() => {
    const errs = validate();
    if (errs.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Please fix the following", errs.join("\n"));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Prepare payload with all values trimmed
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedRole = role.trim();

    const payload: Record<string, unknown> = {
      empName: trimmedName,
      empContactNumber: trimmedPhone,
      role: trimmedRole,
      empEmail: trimmedEmail || undefined, // Only include if not empty
      assignedProperties: assignedProps,
      status: 1,
      createdBy: ownerId,
      ownerId: ownerId,
    };

    if (isEditMode && employeeId) {
      // UPDATE
      updateEmployee.mutate(
        { data: payload, employeeId: String(employeeId) },
        {
          onSuccess: () => {
            navigateBackToStaff();
          },
          onError: () => {
            // Error is handled by the hook's onError
          },
        }
      );
    } else {
      // INSERT
      insertEmployee.mutate(payload, {
        onSuccess: () => {
          navigateBackToStaff();
        },
        onError: () => {
          // Error is handled by the hook's onError
        },
      });
    }
  }, [
    validate,
    name,
    phone,
    role,
    email,
    assignedProps,
    ownerId,
    isEditMode,
    employeeId,
    insertEmployee,
    updateEmployee,
    navigateBackToStaff,
  ]);

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
        headerTitleContainer: {
          flex: 1,
          flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          alignItems: "center",
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
        phoneRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        phonePrefix: {
          padding: spacing.sm,
          height: 55,
          borderWidth: 1,
          borderColor: colors.borderColor,
          backgroundColor: colors.cardSurface,
          borderRadius: radius.lg,
          justifyContent: "center",
          minWidth: 56,
          alignItems: "center",
        },
        phonePrefixTxt: {
          color: colors.textPrimary,
          fontWeight: "700",
        },
        phoneInputWrap: {
          flex: 1,
        },
      }),
    [colors, spacing, radius, typography]
  );

  const headerTitle = isEditMode ? "Edit Employee" : "Add Employee";
  const isSubmitting = insertEmployee.isPending || updateEmployee.isPending;

  // Get current property name for subtitle
  const currentPropertyName = useMemo(() => {
    const prop = properties.find((p) => String(p._id) === String(propertyId));
    return prop?.propertyName ?? "";
  }, [properties, propertyId]);

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
            accessibilityHint="Navigate back to staff list"
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
              {/* Employee Details Section */}
              <View style={styles.sectionCard}>
                <Text
                  style={styles.sectionTitle}
                  accessible
                  accessibilityRole="header"
                >
                  Employee Details
                </Text>

                {/* Name */}
                <Labeled label="Employee name *">
                  <TextInput
                    value={name}
                    onChangeText={onNameChange}
                    placeholder="Enter employee name (letters only)"
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    theme={{ roundness: radius.lg }}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    accessibilityLabel="Employee name"
                    accessibilityHint="Enter the employee's full name using letters and spaces only"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </Labeled>

                {/* Role */}
                <Labeled label="Role *">
                  <SheetSelect
                    value={role}
                    placeholder="Select role"
                    options={ROLE_OPTIONS}
                    onChange={setRole}
                  />
                </Labeled>

                {/* Phone with +91 prefix */}
                <Labeled label="Contact number *">
                  <View style={styles.phoneRow}>
                    <View
                      style={styles.phonePrefix}
                      accessible
                      accessibilityLabel="Country code India plus 91"
                    >
                      <Text style={styles.phonePrefixTxt}>+91</Text>
                    </View>
                    <View style={styles.phoneInputWrap}>
                      <TextInput
                        value={phone}
                        onChangeText={onPhoneChange}
                        placeholder="10 digit number"
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
                        accessibilityLabel="Employee contact number"
                        accessibilityHint="Enter exactly 10 digit phone number"
                        maxLength={10}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                    </View>
                  </View>
                </Labeled>

                {/* Email (optional) */}
                <Labeled label="Email (optional)">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    keyboardType="email-address"
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
                    accessibilityLabel="Employee email"
                    accessibilityHint="Enter a valid email address, this field is optional"
                  />
                </Labeled>
              </View>

              {/* Properties Assignment Section */}
              <View style={styles.sectionCard}>
                <Text
                  style={styles.sectionTitle}
                  accessible
                  accessibilityRole="header"
                >
                  Property Assignment
                </Text>

                <Labeled label="Assigned Properties *">
                  <MultiSelectSheet
                    values={assignedProps}
                    options={propertyOptions}
                    placeholder="Select properties"
                    onChange={setAssignedProps}
                  />
                </Labeled>
              </View>

              <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

              {/* Footer Buttons */}
              <View style={styles.footerRow}>
                <Button
                  mode="outlined"
                  style={styles.secondaryBtn}
                  textColor={colors.textPrimary}
                  onPress={onCancel}
                  accessibilityLabel="Cancel and go back"
                  accessibilityHint="Discards changes and returns to staff list"
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
                  accessibilityLabel={isEditMode ? "Update employee" : "Submit employee"}
                  accessibilityHint={
                    isEditMode ? "Saves changes to employee" : "Creates new employee"
                  }
                >
                  {isEditMode ? "Update" : "Submit"}
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
