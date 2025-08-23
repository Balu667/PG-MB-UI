// app/protected/tenant/[id].tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { TextInput, Button, Snackbar } from "react-native-paper";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import {
  getTenantById,
  createTenant,
  updateTenant,
  getRooms,
  getBedsForRoom,
  RoomOption,
} from "@/src/constants/tenantMock";

/* --------------------------- utils --------------------------- */
const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${d.getFullYear()}`;

const parseDate = (str?: string) => {
  if (!str) return undefined;
  const [dd, mm, yyyy] = str.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(yyyy, (mm || 1) - 1, dd || 1);
  return isNaN(dt.getTime()) ? undefined : dt;
};

/* --------------------------- types --------------------------- */
type FormValues = {
  tenantName: string;
  phone: string; // 10 digits (we visually show +91)
  doj: string; // dd-mm-yyyy
  gender: "Male" | "Female";
  dueType: "Monthly" | "1st month" | "Custom";
  dueDate?: string; // dd-mm-yyyy, only when Custom
  room: string; // roomNo
  bed: string;
  rentAmount: string;
  depositAmount: string;
  collectedRent?: string; // add mode only
  collectedDeposit?: string; // add mode only
  email?: string; // add mode only
};

/* --------------------------- radio UI --------------------------- */
const RadioMark = ({ checked }: { checked: boolean }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: checked ? colors.accent : hexToRgba(colors.textSecondary, 0.55),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.accent,
          }}
        />
      ) : null}
    </View>
  );
};

const RadioGroup = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: any) => void;
  options: { label: string; value: any }[];
}) => {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {options.map((o) => {
        const checked = value === o.value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 6,
              marginRight: spacing.sm,
            }}
            android_ripple={{ color: hexToRgba(colors.accent, 0.12), borderless: true }}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
          >
            <RadioMark checked={checked} />
            <Text
              style={{
                marginLeft: 8,
                color: colors.textPrimary,
                includeFontPadding: false,
                lineHeight: 18,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

/* --------------------------- select (modal list) --------------------------- */
const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: RoomOption[] | { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
}) => {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedLabel = (options as any[]).find((o) => o.value === value)?.label ?? "";

  return (
    <View style={{ marginBottom: spacing.md - 6 }}>
      <Text style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.22),
          backgroundColor: disabled ? hexToRgba(colors.textSecondary, 0.06) : colors.cardSurface,
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: selectedLabel ? colors.textPrimary : colors.textMuted,
            fontSize: 15,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {selectedLabel || placeholder || "Select"}
        </Text>
        <Text style={{ color: colors.textMuted }}>▾</Text>
      </Pressable>

      {open && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            backgroundColor: colors.cardBackground,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: hexToRgba(colors.textSecondary, 0.15),
            marginTop: 6,
            maxHeight: 280,
            overflow: "hidden",
            zIndex: 30,
            elevation: 6,
          }}
        >
          <ScrollView
            style={{ maxHeight: 280 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {(options as any[]).map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {"dotColor" in opt ? (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: opt.dotColor,
                      marginRight: 8,
                    }}
                  />
                ) : null}
                <Text style={{ color: colors.textPrimary, fontSize: 15, flexShrink: 1 }}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

/* --------------------------- prefix input pill --------------------------- */
const PrefixInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  prefix,
  keyboardType,
  disabled,
  errorText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  prefix: string; // e.g., "+91" or "₹"
  keyboardType?:
    | "default"
    | "numeric"
    | "email-address"
    | "phone-pad"
    | "number-pad"
    | "decimal-pad";
  disabled?: boolean;
  errorText?: string;
}) => {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md - 6 }}>
      <Text style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.22),
          borderRadius: radius.md,
          backgroundColor: disabled ? hexToRgba(colors.textSecondary, 0.06) : colors.cardSurface,
        }}
      >
        <View
          style={{
            backgroundColor: hexToRgba(colors.accent, 0.12),
            paddingHorizontal: 10,
            paddingVertical: 8,
            height: "100%",
            borderTopLeftRadius: radius.md,
            borderBottomLeftRadius: radius.md,
            marginRight: 6,
          }}
        >
          <Text style={{ color: colors.accent, fontWeight: "700" }}>{prefix}</Text>
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          style={{ flex: 1, backgroundColor: "transparent", paddingRight: 8 }}
          outlineStyle={{ borderWidth: 0 }}
          mode="outlined"
          disabled={disabled}
          placeholderTextColor={colors.textMuted}
          textColor={colors.textPrimary}
        />
      </View>
      {!!errorText && (
        <Text style={{ color: colors.error, marginTop: 4, fontSize: 12 }}>{errorText}</Text>
      )}
    </View>
  );
};

/* --------------------------- date field --------------------------- */
const DateField = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => {
  const { colors, radius, spacing } = useTheme();
  const [show, setShow] = useState(false);
  const dt = parseDate(value) || new Date();

  return (
    <View style={{ marginBottom: spacing.md - 6 }}>
      <Text style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={() => setShow(true)}
        style={{
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.22),
          backgroundColor: disabled ? hexToRgba(colors.textSecondary, 0.06) : colors.cardSurface,
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ color: value ? colors.textPrimary : colors.textMuted, fontSize: 15 }}>
          {value || "DD-MM-YYYY"}
        </Text>
      </Pressable>

      {show && (
        <View style={{ marginTop: Platform.OS === "ios" ? 6 : 0 }}>
          <DateTimePicker
            value={dt}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={(_, picked) => {
              if (Platform.OS === "android") setShow(false);
              if (picked) onChange(formatDate(picked));
            }}
          />
          {Platform.OS === "ios" && (
            <Button style={{ marginTop: 6 }} mode="contained" onPress={() => setShow(false)}>
              Done
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

/* ===============================================================
   Add/Edit Screen
   =============================================================== */
export default function TenantUpsert() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isAdd = !id || id === "add";
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, spacing, radius, typography } = useTheme();

  /* ---------- layout columns ---------- */
  const isTwoCol = width >= 740;

  /* ---------- options / legend ---------- */
  const rooms = useMemo(() => getRooms(colors), [colors]);

  /* ---------- initial values ---------- */
  const existing = !isAdd && id ? getTenantById(id) : undefined;
  const initial: FormValues = {
    tenantName: existing?.name || "",
    phone: existing?.phone?.replace("+91 ", "") || "",
    doj: existing?.joinedOn ? formatDate(new Date(existing.joinedOn)) : formatDate(new Date()),
    gender: (existing?.gender as any) || "Male",
    dueType: "Monthly",
    dueDate: "",
    room: existing?.room || "",
    bed: existing?.bedNo || "",
    rentAmount: existing ? String(existing.rent) : "",
    depositAmount: existing ? String(existing.securityDeposit || 0) : "",
    collectedRent: isAdd ? "0" : undefined,
    collectedDeposit: isAdd ? "0" : undefined,
    email: isAdd ? "" : undefined,
  };

  /* ---------- validation schema ---------- */
  const schema = useMemo(
    () =>
      yup.object({
        tenantName: yup.string().trim().required("Tenant name is required"),
        phone: yup
          .string()
          .trim()
          .matches(/^\d{10}$/, "Enter a valid 10-digit phone number")
          .required("Phone number is required"),
        doj: yup.string().required("Date of joining is required"),
        gender: yup.string().oneOf(["Male", "Female"]).required(),
        dueType: yup.string().oneOf(["Monthly", "1st month", "Custom"]).required(),
        dueDate: yup.string().when("dueType", {
          is: (v: string) => v === "Custom",
          then: (s) => s.required("Due date is required"),
          otherwise: (s) => s.optional(),
        }),
        room: yup.string().required("Room is required"),
        bed: yup.string().required("Bed is required"),
        rentAmount: yup
          .number()
          .transform((v, o) => (o === "" ? undefined : v))
          .typeError("Enter a valid amount")
          .positive("Amount must be positive")
          .required("Rent amount is required"),
        depositAmount: yup
          .number()
          .transform((v, o) => (o === "" ? undefined : v))
          .typeError("Enter a valid amount")
          .positive("Amount must be positive")
          .required("Deposit amount is required"),
        collectedRent: isAdd
          ? yup
              .number()
              .transform((v, o) => (o === "" ? 0 : v))
              .typeError("Enter a valid amount")
              .min(0, "Must be ≥ 0")
              .test("lte-rent", "Cannot exceed Rent", function (v) {
                const rent = Number(this.parent.rentAmount || 0);
                return (v ?? 0) <= (rent || 0);
              })
          : yup.mixed().optional(),
        collectedDeposit: isAdd
          ? yup
              .number()
              .transform((v, o) => (o === "" ? 0 : v))
              .typeError("Enter a valid amount")
              .min(0, "Must be ≥ 0")
              .test("lte-dep", "Cannot exceed Deposit", function (v) {
                const dep = Number(this.parent.depositAmount || 0);
                return (v ?? 0) <= (dep || 0);
              })
          : yup.mixed().optional(),
        email: isAdd
          ? yup.string().email("Enter a valid email").optional()
          : yup.mixed().optional(),
      }),
    [isAdd]
  );

  /* ---------- form ---------- */
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues: initial,
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const dueType = watch("dueType");
  const selectedRoom = watch("room");
  const beds = useMemo(() => (selectedRoom ? getBedsForRoom(selectedRoom) : []), [selectedRoom]);

  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  /* ---------- styles ---------- */
  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.background },
        header: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
          backgroundColor: colors.background,
        },
        title: { color: colors.textPrimary, fontWeight: "700", fontSize: typography.fontSizeLg },

        container: {
          flex: 1,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.lg,
        },
        grid: {
          flexDirection: isTwoCol ? "row" : "column",
          flexWrap: "wrap",
          columnGap: spacing.md - 6,
          rowGap: spacing.md - 6,
        },
        col: { width: isTwoCol ? "48%" : "100%" },

        label: { color: colors.textPrimary, fontWeight: "600", marginBottom: 6 },
        error: { color: colors.error, fontSize: 12, marginTop: 4 },

        legendRow: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacing.sm,
          gap: 12,
        },
        dot: (bg: string) => ({ width: 10, height: 10, borderRadius: 5, backgroundColor: bg }),

        footer: {
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
        },
        primaryBtn: { flex: 1, borderRadius: radius.lg },
      }),
    [colors, spacing, typography, isTwoCol]
  );

  /* ---------- submit ---------- */
  const onSubmit = (values: FormValues) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Normalize for store
    const payload = {
      name: values.tenantName.trim(),
      phone: `+91 ${values.phone}`,
      joinedOn: parseDate(values.doj)?.toISOString() ?? new Date().toISOString(),
      gender: values.gender,
      room: values.room,
      bedNo: values.bed,
      rent: Number(values.rentAmount || 0),
      securityDeposit: Number(values.depositAmount || 0),
      email: values.email?.trim(),
    };

    if (isAdd) {
      const newId = createTenant(payload);
      setSnack({ visible: true, msg: "Tenant created" });
      // navigate to view page after a short tick
      setTimeout(
        () =>
          router.replace({
            pathname: "/protected/tenant/TenantProfileDetails",
            params: { id: newId },
          }),
        350
      );
    } else if (id) {
      updateTenant(id, payload);
      setSnack({ visible: true, msg: "Changes saved" });
      // UX: remain on page so the user can continue editing; they can back out explicitly
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={s.safe}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{isAdd ? "Add Tenant" : "Edit Tenant"}</Text>
        </View>

        <ScrollView
          style={s.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Legend for rooms */}
          <View style={s.legendRow}>
            <View style={s.dot("#0a892e")} />
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Available</Text>
            <View style={s.dot("#c80b0b")} />
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Partially/Filled</Text>
          </View>

          <View style={s.grid}>
            {/* Tenant name */}
            <View style={s.col}>
              <Controller
                control={control}
                name="tenantName"
                render={({ field: { value, onChange } }) => (
                  <View>
                    <Text style={s.label}>Tenant Name *</Text>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter Tenant Name"
                      mode="outlined"
                      outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                      activeOutlineColor={colors.accent}
                      style={{ backgroundColor: colors.cardSurface }}
                      textColor={colors.textPrimary}
                      placeholderTextColor={colors.textMuted}
                      returnKeyType="next"
                    />
                    {errors.tenantName && <Text style={s.error}>{errors.tenantName.message}</Text>}
                  </View>
                )}
              />
            </View>

            {/* Phone with +91 pill */}
            <View style={s.col}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { value, onChange } }) => (
                  <PrefixInput
                    label="Phone Number *"
                    value={value}
                    onChangeText={(t) => onChange(t.replace(/[^0-9]/g, "").slice(0, 10))}
                    placeholder="10-digit number"
                    prefix="+91"
                    keyboardType="number-pad"
                    errorText={errors.phone?.message as string}
                  />
                )}
              />
            </View>

            {/* DOJ */}
            <View style={s.col}>
              <Controller
                control={control}
                name="doj"
                render={({ field: { value, onChange } }) => (
                  <>
                    <DateField label="Date of Joining *" value={value} onChange={onChange} />
                    {errors.doj && <Text style={s.error}>{errors.doj.message}</Text>}
                  </>
                )}
              />
            </View>

            {/* Gender */}
            <View style={s.col}>
              <Controller
                control={control}
                name="gender"
                render={({ field: { value, onChange } }) => (
                  <View>
                    <Text style={s.label}>Gender *</Text>
                    <RadioGroup
                      value={value}
                      onChange={onChange}
                      options={[
                        { label: "Male", value: "Male" },
                        { label: "Female", value: "Female" },
                      ]}
                    />
                    {errors.gender && <Text style={s.error}>{errors.gender.message}</Text>}
                  </View>
                )}
              />
            </View>

            {/* Due type */}
            <View style={s.col}>
              <Controller
                control={control}
                name="dueType"
                render={({ field: { value, onChange } }) => (
                  <View>
                    <Text style={s.label}>Due Type *</Text>
                    <RadioGroup
                      value={value}
                      onChange={(v) => {
                        onChange(v);
                        if (v !== "Custom") setValue("dueDate", "");
                      }}
                      options={[
                        { label: "Monthly", value: "Monthly" },
                        { label: "1st month", value: "1st month" },
                        { label: "Custom", value: "Custom" },
                      ]}
                    />
                    {errors.dueType && <Text style={s.error}>{errors.dueType.message}</Text>}
                  </View>
                )}
              />
            </View>

            {/* Due date (only when Custom) */}
            {dueType === "Custom" && (
              <View style={s.col}>
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <DateField label="Due Date *" value={value} onChange={onChange} />
                      {errors.dueDate && <Text style={s.error}>{errors.dueDate.message}</Text>}
                    </>
                  )}
                />
              </View>
            )}

            {/* Room */}
            <View style={s.col}>
              <Controller
                control={control}
                name="room"
                render={({ field: { value, onChange } }) => (
                  <>
                    <SelectField
                      label="Room *"
                      value={value}
                      onChange={(v) => {
                        onChange(v);
                        setValue("bed", ""); // reset bed
                      }}
                      options={rooms}
                      placeholder="Select Room"
                    />
                    {errors.room && <Text style={s.error}>{errors.room.message}</Text>}
                  </>
                )}
              />
            </View>

            {/* Bed */}
            <View style={s.col}>
              <Controller
                control={control}
                name="bed"
                render={({ field: { value, onChange } }) => (
                  <>
                    <SelectField
                      label="Bed *"
                      value={value}
                      onChange={onChange}
                      options={beds}
                      placeholder="Select Bed"
                      disabled={!selectedRoom}
                    />
                    {errors.bed && <Text style={s.error}>{errors.bed.message}</Text>}
                  </>
                )}
              />
            </View>

            {/* Rent */}
            <View style={s.col}>
              <Controller
                control={control}
                name="rentAmount"
                render={({ field: { value, onChange } }) => (
                  <>
                    <PrefixInput
                      label="Rent Amount *"
                      value={value || ""}
                      onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
                      prefix="₹"
                      keyboardType="number-pad"
                      errorText={errors.rentAmount?.message as string}
                    />
                  </>
                )}
              />
            </View>

            {/* Deposit */}
            <View style={s.col}>
              <Controller
                control={control}
                name="depositAmount"
                render={({ field: { value, onChange } }) => (
                  <>
                    <PrefixInput
                      label="Deposit Amount *"
                      value={value || ""}
                      onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
                      prefix="₹"
                      keyboardType="number-pad"
                      errorText={errors.depositAmount?.message as string}
                    />
                  </>
                )}
              />
            </View>

            {/* Add-only fields */}
            {isAdd && (
              <>
                <View style={s.col}>
                  <Controller
                    control={control}
                    name="collectedRent"
                    render={({ field: { value, onChange } }) => (
                      <PrefixInput
                        label="Collected Rent Amount"
                        value={value || "0"}
                        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
                        prefix="₹"
                        keyboardType="number-pad"
                        errorText={errors.collectedRent?.message as string}
                      />
                    )}
                  />
                </View>

                <View style={s.col}>
                  <Controller
                    control={control}
                    name="collectedDeposit"
                    render={({ field: { value, onChange } }) => (
                      <PrefixInput
                        label="Collected Deposited Amount"
                        value={value || "0"}
                        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
                        prefix="₹"
                        keyboardType="number-pad"
                        errorText={errors.collectedDeposit?.message as string}
                      />
                    )}
                  />
                </View>

                <View style={s.col}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { value, onChange } }) => (
                      <View>
                        <Text style={s.label}>Email (optional)</Text>
                        <TextInput
                          value={value || ""}
                          onChangeText={onChange}
                          placeholder="Enter email"
                          mode="outlined"
                          outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                          activeOutlineColor={colors.accent}
                          style={{ backgroundColor: colors.cardSurface }}
                          textColor={colors.textPrimary}
                          placeholderTextColor={colors.textMuted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                        {errors.email && <Text style={s.error}>{errors.email.message}</Text>}
                      </View>
                    )}
                  />
                </View>
              </>
            )}
          </View>

          {/* Footer buttons */}
          <View style={s.footer}>
            <Button
              mode="outlined"
              style={s.secondaryBtn}
              textColor={colors.textPrimary}
              onPress={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              style={s.primaryBtn}
              disabled={!isValid}
              onPress={handleSubmit(onSubmit)}
            >
              {isAdd ? "Save & View" : "Save Changes"}
            </Button>
          </View>
        </ScrollView>

        <Snackbar
          visible={snack.visible}
          onDismiss={() => setSnack({ visible: false, msg: "" })}
          duration={1500}
          style={{
            backgroundColor: colors.accent,
            marginBottom: 10,
            marginHorizontal: 12,
            borderRadius: radius.lg,
          }}
        >
          {snack.msg}
        </Snackbar>
      </View>
    </KeyboardAvoidingView>
  );
}
