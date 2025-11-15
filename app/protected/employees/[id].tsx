/* eslint-disable no-console */
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Text,
} from "react-native";
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

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useInsertEmployee, useUpdateEmployee, useGetAllEmployees } from "@/src/hooks/employee";
import { useProperty } from "@/src/context/PropertyContext";

/* ───────────────────────── Small UI atoms (reused) ───────────────────────── */

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
    >
      {children}
    </PaperText>
  );
});

const Labeled = React.memo(({ label, children }: { label: string; children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 8, marginBottom: 10 }}>
      <PaperText style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>
        {label}
      </PaperText>
      {children}
    </View>
  );
});

const SheetSelect = React.memo(function SheetSelect({
  value,
  options,
  placeholder,
  onChange,
  disabled,
  loading,
}: {
  value?: string;
  options: { label: string; value: string }[];
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
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
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
      >
        <PaperText
          style={{
            color: value ? colors.textPrimary : colors.textMuted,
            fontSize: typography.fontSizeMd,
          }}
          numberOfLines={1}
        >
          {currentLabel || (loading ? "Loading..." : placeholder)}
        </PaperText>
      </Pressable>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            marginTop: "auto",
          }}
        >
          <Dialog.Title style={{ color: colors.textPrimary, marginBottom: -6 }}>
            {placeholder}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
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
                options.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderColor: hexToRgba(colors.textSecondary, 0.12),
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                  >
                    <PaperText style={{ color: colors.textPrimary }}>{opt.label}</PaperText>
                  </Pressable>
                ))
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

const MultiSelectSheet = React.memo(function MultiSelectSheet({
  values,
  options,
  placeholder,
  onChange,
}: {
  values: string[];
  options: { label: string; value: string }[];
  placeholder: string;
  onChange: (v: string[]) => void;
}) {
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
          minHeight: 44,
          justifyContent: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
      >
        <PaperText
          style={{
            color: selectedLabels.length ? colors.textPrimary : colors.textMuted,
            fontSize: typography.fontSizeMd,
          }}
          numberOfLines={2}
        >
          {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
        </PaperText>
      </Pressable>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            marginTop: "auto",
          }}
        >
          <Dialog.Title style={{ color: colors.textPrimary, marginBottom: -6 }}>
            {placeholder}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
              keyboardShouldPersistTaps="always"
            >
              {options.map((opt) => {
                const checked = values.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      const next = checked
                        ? values.filter((v) => v !== opt.value)
                        : [...values, opt.value];
                      onChange(next);
                    }}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderColor: hexToRgba(colors.textSecondary, 0.12),
                      minHeight: 44,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={opt.label}
                  >
                    <PaperText style={{ color: colors.textPrimary }}>{opt.label}</PaperText>
                    <Checkbox status={checked ? "checked" : "unchecked"} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)} textColor={colors.accent}>
              Done
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
});

/* ────────────────────────────── Screen ────────────────────────────── */

export default function AddOrEditEmployee() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, spacing, radius, typography } = useTheme();
  const { id: propertyId, employeeId } = useLocalSearchParams<{
    id: string;
    employeeId?: string;
  }>();
  const isEditMode = !!employeeId;

  // profile (ownerId is required for payload)
  const { profileData } = useSelector((state: any) => state?.profileDetails);
  const ownerId =
    String(profileData?.ownerId || profileData?.userId || profileData?._id || "") || "";

  // employees list to prefill on edit
  const { data: employeesResp } = useGetAllEmployees(ownerId);
  const existing = useMemo(() => {
    const arr: any[] = Array.isArray(employeesResp) ? employeesResp : employeesResp?.data || [];
    return arr.find((x) => String(x?._id) === String(employeeId));
  }, [employeesResp, employeeId]);

  // properties from context (source = useGetPropertyDetailsList)
  const { properties } = useProperty();
  const propertyOptions = useMemo(
    () =>
      (Array.isArray(properties) ? properties : [])
        .map((p: any) => ({ label: String(p?.propertyName ?? "—"), value: String(p?._id ?? "") }))
        .filter((o) => !!o.value),
    [properties]
  );

  // roles (requested numeric values, but we'll send as string in payload)
  const ROLES_NUM = useMemo(
    () => [
      { name: "Admin", value: 2 },
      { name: "Partner", value: 3 },
    ],
    []
  );
  const ROLE_OPTIONS = useMemo(
    () => ROLES_NUM.map((r) => ({ label: r.name, value: String(r.value) })),
    [ROLES_NUM]
  );

  // form state
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("2"); // default Admin
  const [phone, setPhone] = useState<string>(""); // raw 10 digits
  const [email, setEmail] = useState<string>("");
  const [assignedProps, setAssignedProps] = useState<string[]>(
    propertyId ? [String(propertyId)] : []
  );

  // prefill edit
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEditMode || prefilled.current || !existing) return;
    setName(String(existing?.empName ?? ""));
    setRole(String(existing?.role ?? "2"));
    setPhone(
      String(existing?.empContactNumber ?? "")
        .replace(/[^\d]/g, "")
        .slice(0, 10)
    );
    setEmail(String(existing?.empEmail ?? ""));
    const ap = Array.isArray(existing?.assignedProperties)
      ? existing.assignedProperties.map((x: any) => String(x)).filter(Boolean)
      : [];
    setAssignedProps(ap.length ? ap : propertyId ? [String(propertyId)] : []);
    prefilled.current = true;
  }, [isEditMode, existing, propertyId]);

  // hooks for mutations
  const insertEmployee = useInsertEmployee(() => {});
  const updateEmployee = useUpdateEmployee(() => {});

  // styling
  const s = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: colors.background },
      header: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderColor: hexToRgba(colors.textSecondary, 0.12),
      },
      headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLg,
        fontWeight: "700" as const,
      },
      input: { backgroundColor: colors.cardSurface } as const,
      footerRow: {
        flexDirection: "row" as const,
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
        minHeight: 44,
        justifyContent: "center" as const,
      },
      primaryBtn: { flex: 1, borderRadius: radius.lg, minHeight: 44, justifyContent: "center" },
      phoneRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 8,
      },
      phonePrefix: {
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: colors.borderColor,
        backgroundColor: colors.cardSurface,
        borderRadius: radius.lg,
        justifyContent: "center",
      },
      phonePrefixTxt: { color: colors.textPrimary, fontWeight: "700" as const },
      phoneInputWrap: { flex: 1 },
    }),
    [colors, spacing, radius, typography]
  );

  const headerTitle = isEditMode ? "Edit Employee" : "Add Employee";

  // input handlers
  const onPhoneChange = useCallback((t: string) => {
    setPhone((t || "").replace(/[^\d]/g, "").slice(0, 10));
  }, []);

  // validation helpers
  const isValidEmail = (v?: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

  const validate = useCallback(() => {
    const errs: string[] = [];
    if (!ownerId) errs.push("Owner not found. Please re-login.");
    if (!name || name.trim().length < 2) errs.push("Employee name is required.");
    if (!role || !["2", "3"].includes(role)) errs.push("Select a valid role (Admin or Partner).");
    if (!phone || phone.length !== 10) errs.push("Enter a valid 10-digit contact number.");
    if (!isValidEmail(email)) errs.push("Enter a valid email address.");
    if (!assignedProps.length) errs.push("Select at least one property.");
    return errs;
  }, [ownerId, name, role, phone, email, assignedProps]);

  const navigateBackToStaff = useCallback(() => {
    try {
      queryClient.invalidateQueries({ queryKey: ["employeeList"] });
    } catch {}
    router.replace({
      pathname: `/protected/property/${String(propertyId)}`,
      params: { tab: "Staff", refresh: String(Date.now()) },
    });
  }, [queryClient, router, propertyId]);

  const onCancel = useCallback(() => {
    const hasChanges =
      !!name || !!phone || !!email || role !== "2" || (assignedProps?.length ?? 0) > 0;
    if (hasChanges) {
      Alert.alert("Discard changes?", "Your unsaved changes will be lost.", [
        { text: "No", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigateBackToStaff() },
      ]);
    } else {
      navigateBackToStaff();
    }
  }, [name, phone, email, role, assignedProps, navigateBackToStaff]);

  const onSubmit = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const errs = validate();
    if (errs.length) {
      Alert.alert("Please fix", errs.join("\n"));
      return;
    }

    const payload: any = {
      empName: name.trim(),
      empContactNumber: String(phone),
      role: String(role), // must be "2" or "3"
      empEmail: email?.trim() ? String(email).trim() : undefined,
      assignedProperties: assignedProps,
      status: 1, // always 1
      createdBy: ownerId,
      ownerId: ownerId,
    };

    if (isEditMode && employeeId) {
      // UPDATE
      updateEmployee.mutate(
        { data: payload, employeeId: String(employeeId) },
        { onSuccess: navigateBackToStaff }
      );
    } else {
      // INSERT
      insertEmployee.mutate(payload, { onSuccess: navigateBackToStaff });
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header Title (Back handled by AppHeader) */}
      <View style={s.header}>
        <PaperText style={s.headerTitle} numberOfLines={1}>
          {headerTitle}
        </PaperText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={{ flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <Title>Employee</Title>

            {/* Name */}
            <Labeled label="Employee name *">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter employee name"
                mode="outlined"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={s.input}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                contentStyle={{ minHeight: 44, paddingVertical: 8 }}
                accessibilityLabel="Employee name"
                autoCapitalize="words"
              />
            </Labeled>

            {/* Role */}
            <Labeled label="Role *">
              <SheetSelect
                value={role}
                placeholder="Select role"
                options={ROLE_OPTIONS} // Admin (2), Partner (3)
                onChange={setRole}
              />
            </Labeled>

            {/* Phone with +91 prefix */}
            <Labeled label="Employee Contact number *">
              <View style={s.phoneRow}>
                <View style={s.phonePrefix} accessible accessibilityLabel="Country code">
                  <Text style={s.phonePrefixTxt}>+91</Text>
                </View>
                <View style={s.phoneInputWrap}>
                  <TextInput
                    value={phone}
                    onChangeText={onPhoneChange}
                    placeholder="10 digits"
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    autoCorrect={false}
                    autoCapitalize="none"
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={s.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 44, paddingVertical: 8 }}
                    accessibilityLabel="Employee contact number"
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
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={s.input}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                contentStyle={{ minHeight: 44, paddingVertical: 8 }}
                accessibilityLabel="Employee email"
              />
            </Labeled>

            {/* Properties (multi-select) */}
            <Labeled label="Properties *">
              <MultiSelectSheet
                values={assignedProps}
                options={propertyOptions}
                placeholder="Select properties"
                onChange={setAssignedProps}
              />
            </Labeled>

            <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

            {/* Footer */}
            <View style={s.footerRow}>
              <Button
                mode="outlined"
                style={s.secondaryBtn}
                textColor={colors.textPrimary}
                onPress={onCancel}
                accessibilityLabel="Cancel and go back"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                style={s.primaryBtn}
                onPress={onSubmit}
                loading={insertEmployee.isPending || updateEmployee.isPending}
                disabled={insertEmployee.isPending || updateEmployee.isPending}
                accessibilityLabel={isEditMode ? "Update employee" : "Submit employee"}
              >
                {isEditMode ? "Update" : "Submit"}
              </Button>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}
