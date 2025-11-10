/* eslint-disable no-console */
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Text as PaperText, TextInput, Divider, Portal, Dialog } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSelector } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import {
  useGetDailyExpensesList,
  useInsertDailyExpenses,
  useUpdateDailyExpenses,
  useDeleteDailyExpensesImage,
} from "@/src/hooks/dailyExpenses";

// ---------------- Types ----------------
type PhotoItem = { uri: string; filePath?: string; isNew?: boolean };
type FormValues = {
  category?: string;
  amount: string; // numeric string
  date: Date;
  photos: PhotoItem[]; // <== now objects, not strings
  description?: string; // optional (API accepts if present)
};

const CATEGORY_OPTIONS = [
  "Building Rent",
  "Groceries",
  "Salaries",
  "Maintenance",
  "Electricity",
  "Other",
] as const;

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png"]);

// ---------------- File base ----------------
const FILE_BASES = [
  (process.env.FILE_URL || "").trim(),
  (Constants?.expoConfig as any)?.extra?.fileUrl || "",
  (process.env.EXPO_PUBLIC_IMAGE_BASE_URL || "").trim(),
  (process.env.EXPO_PUBLIC_FILE_BASE_URL || "").trim(),
]
  .filter(Boolean)
  .map((b) => String(b).replace(/\/+$/, ""));

function toAbsoluteFileUrl(p?: string) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return FILE_BASES.length ? `${FILE_BASES[0]}/${p.replace(/^\/+/, "")}` : p;
}

const toDDMMYYYY = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

// Small, pure subcomponents (memoized) to avoid re-creations
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

// Dropdown (memoized)
const SheetSelect = React.memo(function SheetSelect({
  value,
  options,
  placeholder,
  onChange,
  disabled,
  loading,
}: {
  value?: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { colors, radius, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);

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
          {value || (loading ? "Loading..." : placeholder)}
        </PaperText>
        <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
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
                    key={opt}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onChange(opt);
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
                    accessibilityLabel={opt}
                  >
                    <PaperText style={{ color: colors.textPrimary }}>{opt}</PaperText>
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

// ---------------- Screen ----------------
export default function AddOrEditExpense() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, spacing, radius, typography } = useTheme();

  // optional: profile for createdBy (if available in your RN store)
  const profileData = useSelector((state: any) => state?.profileDetails?.profileData);

  const params = useLocalSearchParams<{ id: string; expenseId?: string }>();
  const propertyId = (params?.id ?? "") as string;
  const expenseId = (params?.expenseId ?? "") as string;
  const isEditMode = !!expenseId;

  // read list only to prefill edit mode
  const { data: listResp } = useGetDailyExpensesList(propertyId);
  const existing = useMemo(() => {
    const arr: any[] = Array.isArray(listResp) ? listResp : [];
    return arr.find((x) => String(x?._id) === String(expenseId));
  }, [listResp, expenseId]);

  const [values, setValues] = useState<FormValues>({
    category: undefined,
    amount: "",
    date: new Date(),
    photos: [],
    description: "",
  });

  // --- mutations
  const insertExpense = useInsertDailyExpenses(() => {
    navigateBackToExpenses();
  });
  const updateExpense = useUpdateDailyExpenses(() => {
    navigateBackToExpenses();
  });
  const deleteImage = useDeleteDailyExpensesImage(() => {});

  // prefill in edit mode safely
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEditMode || prefilled.current) return;
    if (!existing || typeof existing !== "object") return;

    const d = existing?.date ? new Date(existing.date) : new Date();

    const imgs: PhotoItem[] = Array.isArray(existing?.images)
      ? (existing.images
          .map((img: any) => {
            const fp =
              typeof img === "string" ? img : typeof img?.filePath === "string" ? img.filePath : "";
            const uri = toAbsoluteFileUrl(fp);
            return fp ? ({ uri, filePath: fp, isNew: false } as PhotoItem) : null;
          })
          .filter(Boolean) as PhotoItem[])
      : [];

    setValues({
      category: typeof existing?.category === "string" ? existing.category : undefined,
      amount:
        typeof existing?.amount === "number"
          ? String(existing.amount)
          : String(existing?.amount ?? ""),
      date: isNaN(d.getTime()) ? new Date() : d,
      photos: imgs,
      description: existing?.description ? String(existing.description) : "",
    });

    prefilled.current = true;
  }, [isEditMode, existing]);

  // Date dialog state
  const [dateOpen, setDateOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(values.date);

  // styles
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
      body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
      input: { backgroundColor: colors.cardSurface } as const,
      photosGrid: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        gap: 8,
        marginTop: spacing.sm,
      },
      thumbWrap: {
        width: 100,
        height: 100,
        borderRadius: radius.md,
        overflow: "hidden" as const,
        borderWidth: 1,
        borderColor: hexToRgba(colors.textSecondary, 0.18),
      },
      removeBadge: {
        position: "absolute" as const,
        right: 4,
        top: 4,
        backgroundColor: hexToRgba(colors.error, 0.9),
        borderRadius: radius.full,
        paddingHorizontal: 6,
        paddingVertical: 2,
      },
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
      dateBtn: {
        borderWidth: 1,
        borderColor: colors.borderColor,
        borderRadius: radius.lg,
        backgroundColor: colors.cardSurface,
        paddingVertical: 12,
        paddingHorizontal: 12,
        minHeight: 44,
        justifyContent: "center" as const,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 10,
      },
    }),
    [colors, spacing, radius, typography]
  );

  const headerTitle = isEditMode ? "Edit Expense" : "Add Expense";
  const inputContent = { minHeight: 44, paddingVertical: 8 };

  // --- IMPORTANT: pure check (no mutation of Date object)
  const hasUnsavedChanges = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const valueStart = new Date(values.date.getTime());
    valueStart.setHours(0, 0, 0, 0);
    const dateChanged = valueStart.getTime() !== todayStart.getTime();

    return (
      !!values.category ||
      !!values.amount ||
      !!values.description ||
      (values.photos?.length ?? 0) > 0 ||
      dateChanged
    );
  }, [values.category, values.amount, values.description, values.photos, values.date]);

  const navigateBackToExpenses = () => {
    try {
      queryClient.invalidateQueries({ queryKey: ["expensesList", propertyId] });
    } catch {}
    router.replace({
      pathname: `/protected/property/${propertyId}`,
      params: { tab: "Expenses", refresh: String(Date.now()) },
    });
  };

  const onCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      Alert.alert("Discard changes?", "Your unsaved changes will be lost.", [
        { text: "No", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigateBackToExpenses() },
      ]);
    } else {
      navigateBackToExpenses();
    }
  }, [hasUnsavedChanges]);

  const validateNow = useCallback(() => {
    const errs: string[] = [];
    if (!values.category) errs.push("Expense category is required.");
    const amtNum = Number(values.amount || 0);
    if (!values.amount || isNaN(amtNum) || amtNum <= 0) errs.push("Enter a valid amount.");
    if (!(values.date instanceof Date) || isNaN(values.date.getTime()))
      errs.push("Pick a valid date.");
    return errs;
  }, [values]);

  // stable handler: Amount input (prevents rebinds)
  const onAmountChange = useCallback((t: string) => {
    setValues((p) => ({ ...p, amount: t.replace(/[^0-9]/g, "").slice(0, 9) }));
  }, []);

  // submit with API integration
  const onSubmit = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const errs = validateNow();
    if (errs.length) {
      Alert.alert("Please fix", errs.join("\n"));
      return;
    }

    const fd = new FormData();
    if (values.category) fd.append("category", values.category);
    fd.append("amount", String(Number(values.amount)));
    fd.append("date", values.date.toISOString());
    if (values.description) fd.append("description", values.description);
    fd.append("propertyId", propertyId);
    if (profileData?.userId) fd.append("createdBy", String(profileData.userId));

    // append only new images
    for (let i = 0; i < values.photos.length; i++) {
      const p = values.photos[i];
      if (!p?.isNew) continue;
      const uri = p.uri;
      if (!uri) continue;
      const name = (uri.split("/").pop() || `bill_${i}.jpg`).split("?")[0];
      const ext = (name.split(".").pop() || "jpg").toLowerCase();
      const type =
        ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/jpeg";

      if (Platform.OS === "web") {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        // @ts-ignore - RN web supports File in this environment
        const file = new File([blob], name, { type });
        // server expects `images` key (matches web)
        // @ts-ignore
        fd.append("images", file);
      } else {
        // @ts-ignore
        fd.append("images", { uri, name, type });
      }
    }

    if (isEditMode) {
      updateExpense.mutate({ formData: fd, expenseId });
    } else {
      insertExpense.mutate(fd);
    }
  }, [
    validateNow,
    values,
    isEditMode,
    propertyId,
    profileData,
    insertExpense,
    updateExpense,
    expenseId,
  ]);

  const pickPhotos = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission needed", "Please allow photo library access to pick images.");
          return;
        }
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 0,
        quality: 0.9,
      });

      if (!res?.canceled) {
        const filtered = (res.assets || [])
          .map((a) => a?.uri)
          .filter(Boolean)
          .filter((uri) => {
            const name = (uri!.split("/").pop() || "").split("?")[0].toLowerCase();
            const ext = name.split(".").pop() || "";
            return ALLOWED_EXT.has(ext);
          }) as string[];

        if ((filtered?.length ?? 0) < (res.assets?.length ?? 0)) {
          Alert.alert("Some files skipped", "Only jpg, jpeg, png are allowed.");
        }

        setValues((p) => ({
          ...p,
          photos: [
            ...(p.photos || []),
            ...(filtered || []).map((u) => ({ uri: u, isNew: true } as PhotoItem)),
          ],
        }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.log("Image picker error:", e);
      Alert.alert("Could not open gallery", "Please try again.");
    }
  }, []);

  const removePhoto = useCallback(
    (item: PhotoItem) => {
      // existing server image -> hit delete endpoint (only in edit mode)
      if (isEditMode && item.filePath && expenseId) {
        deleteImage.mutate(
          { payload: { filePath: item.filePath }, expenseId },
          {
            onSuccess: () => {
              setValues((p) => ({
                ...p,
                photos: (p.photos || []).filter((x) => x.uri !== item.uri),
              }));
            },
          }
        );
        return;
      }
      // local image -> just remove
      setValues((p) => ({ ...p, photos: (p.photos || []).filter((x) => x.uri !== item.uri) }));
      Haptics.selectionAsync();
    },
    [deleteImage, isEditMode, expenseId]
  );

  return (
    <View style={s.container}>
      {/* Header (title only; AppHeader back is enabled via layout) */}
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
            {/* Category */}
            <Title>Expense</Title>
            <Labeled label="Category *">
              <SheetSelect
                value={values.category}
                placeholder="Select category"
                options={[...CATEGORY_OPTIONS]}
                onChange={(v) => setValues((p) => ({ ...p, category: v }))}
              />
            </Labeled>

            {/* Amount & Date */}
            <View style={{ flexDirection: "row", gap: spacing.md - 8, flexWrap: "wrap" }}>
              <View style={{ flex: 1, minWidth: 220 }}>
                <Labeled label="Amount (₹) *">
                  <TextInput
                    value={values.amount}
                    onChangeText={onAmountChange}
                    placeholder="e.g., 1200"
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    autoCorrect={false}
                    autoCapitalize="none"
                    blurOnSubmit={false}
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={s.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 44, paddingVertical: 8 }}
                    accessibilityLabel="Expense amount"
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </Labeled>
              </View>

              <View style={{ flex: 1, minWidth: 220 }}>
                <Labeled label="Date *">
                  <Pressable
                    style={s.dateBtn}
                    onPress={() => {
                      setTempDate(values.date);
                      setDateOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Select date"
                  >
                    <MaterialIcons name="event" size={18} color={colors.textSecondary} />
                    <PaperText>
                      {values?.date instanceof Date && !isNaN(values.date.getTime())
                        ? toDDMMYYYY(values.date)
                        : "Select date"}
                    </PaperText>
                  </Pressable>
                </Labeled>
              </View>
            </View>

            {/* Optional description (kept simple / optional) */}
            <Labeled label="Description (optional)">
              <TextInput
                value={values.description}
                onChangeText={(t) => setValues((p) => ({ ...p, description: t }))}
                placeholder="Add a note"
                mode="outlined"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={s.input}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                contentStyle={{ minHeight: 44, paddingVertical: 8 }}
                accessibilityLabel="Description"
              />
            </Labeled>

            {/* Date dialog */}
            <Portal>
              <Dialog
                visible={dateOpen}
                onDismiss={() => setDateOpen(false)}
                style={{ backgroundColor: colors.cardBackground }}
              >
                <Dialog.Title style={{ color: colors.textPrimary }}>Pick date</Dialog.Title>
                <Dialog.Content>
                  <DateTimePicker
                    value={
                      tempDate instanceof Date && !isNaN(tempDate.getTime()) ? tempDate : new Date()
                    }
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(_, d) => {
                      if (d && !isNaN(d.getTime())) setTempDate(d);
                    }}
                  />
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setDateOpen(false)} textColor={colors.textPrimary}>
                    Cancel
                  </Button>
                  <Button
                    onPress={() => {
                      setValues((p) => ({ ...p, date: tempDate }));
                      setDateOpen(false);
                    }}
                    textColor={colors.accent}
                  >
                    Done
                  </Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>

            <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

            {/* Photos */}
            <PaperText style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>
              Bill photos (optional)
            </PaperText>
            <Button
              mode="outlined"
              onPress={pickPhotos}
              style={{
                marginTop: 4,
                borderRadius: radius.lg,
                minHeight: 44,
                justifyContent: "center",
              }}
              textColor={colors.textPrimary}
              accessibilityLabel="Pick images"
            >
              Pick images (jpg, jpeg, png)
            </Button>

            <View style={s.photosGrid}>
              {(values.photos || []).map((ph) => (
                <View key={ph.uri} style={s.thumbWrap}>
                  <Image source={{ uri: ph.uri }} style={{ width: "100%", height: "100%" }} />
                  <Pressable
                    onPress={() => removePhoto(ph)}
                    style={s.removeBadge}
                    accessibilityLabel="Remove photo"
                  >
                    <PaperText style={{ color: colors.white, fontWeight: "700" }}>×</PaperText>
                  </Pressable>
                </View>
              ))}
            </View>

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
                loading={insertExpense.isPending || updateExpense.isPending}
                disabled={insertExpense.isPending || updateExpense.isPending}
                accessibilityLabel={isEditMode ? "Update expense" : "Submit expense"}
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
