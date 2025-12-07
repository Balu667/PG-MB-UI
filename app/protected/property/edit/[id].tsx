// app/protected/property/edit/[id].tsx
// Add/Edit Property Screen - Premium Design
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  StyleSheet,
  I18nManager,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Text as PaperText, TextInput, Divider, Portal, Dialog } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import Constants from "expo-constants";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { StateCityList } from "@/src/constants/countries";
import {
  useGetStateCityList,
  useInsertProperty,
  useUpdateProperty,
  useGetPropertyData,
} from "@/src/hooks/propertyHook";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & VALIDATION
───────────────────────────────────────────────────────────────────────────── */

type FormValues = {
  name: string;
  type: "Men's" | "Women's" | "Co-living";
  meal: "Veg" | "Non-veg" | "Both";
  doorNo: string;
  street: string;
  area: string;
  landmark?: string;
  state: string;
  city: string;
  pincode: string;
  noticeDays: string;
  facilities: string[];
  photos: string[];
};

const schema: yup.ObjectSchema<FormValues> = yup
  .object({
    name: yup.string().trim().required("PG name is required"),
    type: yup.mixed<FormValues["type"]>().oneOf(["Men's", "Women's", "Co-living"]).required(),
    meal: yup.mixed<FormValues["meal"]>().oneOf(["Veg", "Non-veg", "Both"]).required(),
    doorNo: yup.string().trim().min(1, "Required").required("D.No/Building No is required"),
    street: yup.string().trim().required("Street name is required"),
    area: yup.string().trim().required("Area is required"),
    landmark: yup.string().trim().optional(),
    state: yup.string().trim().required("State is required"),
    city: yup.string().trim().required("City is required"),
    pincode: yup.string().matches(/^\d{6}$/, "Pincode must be 6 digits").required(),
    noticeDays: yup.string().matches(/^\d+$/, "Enter a valid number").required(),
    facilities: yup.array(yup.string()).default([]),
    photos: yup.array(yup.string()).default([]),
  })
  .required();

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const FACILITY_OPTIONS = ["Washing machine", "Wifi", "Hot water", "Table", "TV", "AC", "Fridge"];

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

/* ─────────────────────────────────────────────────────────────────────────────
   REUSABLE COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

const Segmented: React.FC<{
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ value, options, onChange }) => {
  const { colors, radius, typography } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: colors.cardSurface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.borderColor,
        padding: 4,
      }}
    >
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(opt);
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: radius.xl,
              margin: 2,
              backgroundColor: selected ? hexToRgba(colors.primary, 0.15) : "transparent",
              borderWidth: selected ? 1 : 0,
              borderColor: selected ? colors.primary : "transparent",
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <PaperText
              style={{
                color: selected ? colors.primary : colors.textPrimary,
                fontWeight: selected ? "700" : "500",
                fontSize: typography.fontSizeSm,
              }}
            >
              {opt}
            </PaperText>
          </Pressable>
        );
      })}
    </View>
  );
};

const ChipCheckbox: React.FC<{
  label: string;
  selected: boolean;
  onToggle: () => void;
}> = ({ label, selected, onToggle }) => {
  const { colors, radius, typography } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
      style={{
        marginRight: 8,
        marginBottom: 8,
        borderRadius: radius.xl,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: selected ? hexToRgba(colors.primary, 0.15) : colors.cardSurface,
        borderColor: selected ? colors.primary : colors.borderColor,
        borderWidth: 1,
        minHeight: 44,
        justifyContent: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons
        name={selected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
        size={18}
        color={selected ? colors.primary : colors.textMuted}
      />
      <PaperText
        style={{
          color: selected ? colors.primary : colors.textPrimary,
          fontSize: typography.fontSizeSm,
          fontWeight: "600",
        }}
      >
        {label}
      </PaperText>
    </Pressable>
  );
};

const SheetSelect: React.FC<{
  value?: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
}> = ({ value, options, placeholder, onChange, disabled, loading }) => {
  const { colors, radius, spacing } = useTheme();
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
          paddingVertical: 14,
          paddingHorizontal: 14,
          opacity: disabled ? 0.6 : 1,
          minHeight: 52,
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
      >
        <PaperText
          style={{ color: value ? colors.textPrimary : colors.textMuted, flex: 1 }}
          numberOfLines={1}
        >
          {value || (loading ? "Loading..." : placeholder)}
        </PaperText>
        <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.textMuted} />
      </Pressable>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: "auto",
            marginBottom: 0,
            marginHorizontal: 0,
          }}
        >
          <Dialog.Title style={{ color: colors.textPrimary }}>{placeholder}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
            >
              {loading ? (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 12 }}>
                  Loading...
                </PaperText>
              ) : options.length === 0 ? (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 12 }}>
                  No options available
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
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderColor: hexToRgba(colors.borderColor, 0.3),
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={opt}
                  >
                    <MaterialIcons
                      name={value === opt ? "radio-button-checked" : "radio-button-unchecked"}
                      size={20}
                      color={value === opt ? colors.primary : colors.textMuted}
                    />
                    <PaperText style={{ color: colors.textPrimary, flex: 1 }}>{opt}</PaperText>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)} textColor={colors.primary}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────────────────────────────────────── */

export default function PropertyEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { colors, spacing, radius, typography } = useTheme();
  const queryClient = useQueryClient();
  const { profileData } = useSelector((state: any) => state.profileDetails);
  const ownerId = profileData?.userId;

  const isEditMode = id !== "new" && !!id;
  const numCols = screenWidth >= 740 ? 2 : 1;

  // City list fetch state
  const [stateIso2, setStateIso2] = useState<string | undefined>();
  const prevIso2Ref = useRef<string | undefined>(undefined);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const { mutate: fetchCities, isPending: loadingCities } = useGetStateCityList((res: any) => {
    const arr = (res?.data ?? res ?? []) as any[];
    const names = arr.map((c) => (typeof c === "string" ? c : c?.name)).filter(Boolean);
    setCityOptions(names);
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      type: "Men's",
      meal: "Veg",
      doorNo: "",
      street: "",
      area: "",
      landmark: "",
      state: "",
      city: "",
      pincode: "",
      noticeDays: "",
      facilities: [],
      photos: [],
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  /* ─────────────────────────────────────────────────────────────────────────────
     MAPPING HELPERS
  ───────────────────────────────────────────────────────────────────────────── */

  const toScreenTenantType = (t?: string): FormValues["type"] => {
    if (!t) return "Men's";
    const s = String(t).toLowerCase();
    if (s.startsWith("male")) return "Men's";
    if (s.startsWith("female")) return "Women's";
    return "Co-living";
  };

  const toScreenMealType = (m?: string): FormValues["meal"] => {
    if (!m) return "Veg";
    const s = String(m).toLowerCase().replace(/\s+/g, "");
    if (s.includes("non-veg") || s.includes("nonveg")) return "Non-veg";
    if (s.includes("both")) return "Both";
    return "Veg";
  };

  const normalizeFacilities = (input: any): string[] => {
    const raw: string[] = Array.isArray(input)
      ? (input as any[]).flatMap((x) => String(x ?? "").split(","))
      : typeof input === "string"
      ? String(input).split(",")
      : [];
    const dict = new Map<string, string>(FACILITY_OPTIONS.map((opt) => [opt.toLowerCase(), opt]));
    dict.set("washing machine", "Washing machine");
    dict.set("hot water", "Hot water");
    dict.set("wifi", "Wifi");
    dict.set("wi-fi", "Wifi");
    dict.set("ac", "AC");
    dict.set("a/c", "AC");
    dict.set("tv", "TV");
    return raw
      .map((x) => String(x).trim())
      .filter(Boolean)
      .map((x) => dict.get(x.toLowerCase()) || x)
      .filter((x) => FACILITY_OPTIONS.includes(x));
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     PREFILL FROM API
  ───────────────────────────────────────────────────────────────────────────── */

  const { data: propertyResp } = useGetPropertyData(isEditMode ? id : "");
  const hasPrefilledFromApi = useRef(false);
  const formTouched = useRef(false);
  const markTouched = () => {
    formTouched.current = true;
  };

  useEffect(() => {
    if (!isEditMode || hasPrefilledFromApi.current) return;

    const raw = propertyResp?.data as any;
    const prop = Array.isArray(raw) ? raw[0] : raw;

    if (!prop || typeof prop !== "object" || !prop._id) return;

    // facilities
    const apiFacilities = normalizeFacilities(prop.facilities);

    // images
    const apiPhotosRaw: string[] = Array.isArray(prop.images)
      ? prop.images
          .map((img: any) =>
            typeof img === "string" ? img : typeof img?.filePath === "string" ? img.filePath : ""
          )
          .filter(Boolean)
      : [];
    const apiPhotos = apiPhotosRaw.map(toAbsoluteFileUrl);

    const nextValues: FormValues = {
      name: prop.propertyName || "",
      type: toScreenTenantType(prop.tenantType),
      meal: toScreenMealType(prop.mealType),
      doorNo: prop.doorNo || "",
      street: prop.streetName || "",
      area: prop.area || "",
      landmark: prop.landmark || "",
      state: prop.state || "",
      city: prop.city || "",
      pincode: prop.pincode || "",
      noticeDays: String(prop.noticePeriod || ""),
      facilities: apiFacilities,
      photos: apiPhotos,
    };

    reset(nextValues, { keepDirty: false, keepTouched: false });
    const sel = StateCityList.find((s) => s.name === nextValues.state);
    if (sel?.iso2) setStateIso2(sel.iso2);

    hasPrefilledFromApi.current = true;
  }, [isEditMode, propertyResp, reset]);

  /* ─────────────────────────────────────────────────────────────────────────────
     STATE -> CITY FLOW
  ───────────────────────────────────────────────────────────────────────────── */

  const stateVal = watch("state");
  const selectedPhotos = watch("photos");

  useEffect(() => {
    const sel = StateCityList.find((s) => s.name === stateVal);
    if (sel?.iso2 && sel.iso2 !== stateIso2) {
      setStateIso2(sel.iso2);
    }
  }, [stateVal, stateIso2]);

  useEffect(() => {
    if (!stateIso2) {
      setCityOptions([]);
      return;
    }
    if (prevIso2Ref.current && prevIso2Ref.current !== stateIso2) {
      setValue("city", "", { shouldDirty: true });
    }
    prevIso2Ref.current = stateIso2;
    fetchCities(stateIso2);
  }, [stateIso2, fetchCities, setValue]);

  /* ─────────────────────────────────────────────────────────────────────────────
     NAVIGATION GUARDS
  ───────────────────────────────────────────────────────────────────────────── */

  const goToListAndRefresh = useCallback(() => {
    try {
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey.some((k) => typeof k === "string" && /property/i.test(k)),
      });
    } catch {}

    router.replace({
      pathname: "/protected/(tabs)/Properties",
      params: { refresh: String(Date.now()) },
    });
  }, [queryClient, router]);

  const hasUnsavedChanges = useCallback(
    () => isDirty || formTouched.current || (selectedPhotos?.length ?? 0) > 0,
    [isDirty, selectedPhotos?.length]
  );

  const attemptLeave = useCallback(() => {
    if (hasUnsavedChanges()) {
      Alert.alert("Unsaved Changes", "Discard your changes and go back?", [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: goToListAndRefresh },
      ]);
    } else {
      goToListAndRefresh();
    }
  }, [hasUnsavedChanges, goToListAndRefresh]);

  useEffect(() => {
    const onBack = () => {
      attemptLeave();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [attemptLeave]);

  /* ─────────────────────────────────────────────────────────────────────────────
     PHOTOS
  ───────────────────────────────────────────────────────────────────────────── */

  const pickPhotos = async () => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission needed", "Please allow photo library access to pick images.");
          return;
        }
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        selectionLimit: 0,
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 0.9,
      });

      if (!res.canceled) {
        const uris = res.assets.map((a) => a.uri);
        setValue("photos", [...(selectedPhotos ?? []), ...uris], { shouldDirty: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        markTouched();
      }
    } catch {
      Alert.alert("Could not open gallery", "Please try again.");
    }
  };

  const removePhoto = (uri: string) => {
    setValue(
      "photos",
      (selectedPhotos ?? []).filter((u) => u !== uri),
      { shouldDirty: true }
    );
    Haptics.selectionAsync();
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     SUBMIT
  ───────────────────────────────────────────────────────────────────────────── */

  const mapTenantType = (t: FormValues["type"]) =>
    t === "Men's" ? "Male" : t === "Women's" ? "Female" : "Co-living";
  const mapMealType = (m: FormValues["meal"]) => (m === "Non-veg" ? "Non-Veg" : m);

  const buildFormDataAsync = async (values: FormValues, forUpdate = false) => {
    const fd = new FormData();
    fd.append("propertyName", values.name);
    fd.append("tenantType", mapTenantType(values.type));
    fd.append("mealType", mapMealType(values.meal));
    fd.append("doorNo", values.doorNo);
    fd.append("streetName", values.street);
    fd.append("area", values.area);
    fd.append("landmark", values.landmark || "");
    fd.append("state", values.state);
    fd.append("city", values.city);
    fd.append("pincode", values.pincode);
    fd.append("noticePeriod", String(Number(values.noticeDays) || 0));

    (values.facilities || []).forEach((f) => fd.append("facilities", f));

    if (ownerId) {
      fd.append("ownerId", ownerId);
      fd.append("createdBy", ownerId);
    }

    for (let idx = 0; idx < (values.photos || []).length; idx++) {
      const uri = values.photos[idx];
      if (!uri) continue;

      const isRemote = /^https?:\/\//i.test(uri);
      if (forUpdate && isRemote) continue;

      const name = (uri.split("/").pop() || `photo_${idx}.jpg`).split("?")[0];
      const ext = name.split(".").pop()?.toLowerCase();
      const mime =
        ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/jpeg";

      if (Platform.OS === "web") {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        const file = new File([blob], name, { type: mime });
        fd.append("images", file);
      } else {
        fd.append("images", {
          // @ts-ignore React Native file
          uri,
          name,
          type: mime,
        });
      }
    }

    return fd;
  };

  const onInsertSuccess = () => {
    Toast.show({ type: "success", text1: "Property Added!", position: "bottom" });
    goToListAndRefresh();
  };

  const onUpdateSuccess = () => {
    Toast.show({ type: "success", text1: "Property Updated!", position: "bottom" });
    goToListAndRefresh();
  };

  const { mutate: insertProperty, isPending: savingInsert } = useInsertProperty(
    onInsertSuccess,
    ownerId
  );
  const { mutate: updateProperty, isPending: savingUpdate } = useUpdateProperty(
    onUpdateSuccess,
    ownerId
  );
  const saving = savingInsert || savingUpdate;

  const onSubmit = async (data: FormValues) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const formData = await buildFormDataAsync(data, isEditMode);
    if (isEditMode && id) {
      updateProperty({ formData, propertyId: id });
    } else {
      insertProperty(formData);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     STYLES
  ───────────────────────────────────────────────────────────────────────────── */

  const bottomGutter = insets.bottom + (Platform.OS === "android" ? 72 : 36);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        header: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.5),
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        backBtn: {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: hexToRgba(colors.textMuted, 0.08),
        },
        headerTitleContainer: { flex: 1 },
        headerTitle: {
          color: colors.textPrimary,
          fontSize: 20,
          fontWeight: "700",
        },
        headerSubtitle: {
          color: colors.textMuted,
          fontSize: 13,
          marginTop: 2,
        },
        body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
        sectionCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.5),
          padding: spacing.md,
          marginBottom: spacing.md,
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
              }
            : { elevation: 2 }),
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        fieldRow: {
          flexDirection: numCols === 2 ? "row" : "column",
          gap: spacing.md,
        },
        fieldCol: {
          flex: numCols === 2 ? 1 : undefined,
          width: numCols === 1 ? "100%" : undefined,
        },
        fieldBlock: { marginBottom: spacing.md },
        label: {
          color: colors.textPrimary,
          fontWeight: "600",
          marginBottom: 8,
          fontSize: 14,
        },
        error: { color: colors.error, fontSize: 12, marginTop: 4 },
        input: { backgroundColor: colors.cardSurface },
        photosGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: spacing.sm,
        },
        thumbWrap: {
          width: numCols === 2 ? 90 : 100,
          height: numCols === 2 ? 90 : 100,
          borderRadius: radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.5),
          backgroundColor: colors.cardSurface,
        },
        removeBadge: {
          position: "absolute",
          right: 6,
          top: 6,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: hexToRgba(colors.error, 0.9),
          alignItems: "center",
          justifyContent: "center",
        },
        footerRow: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.sm,
          marginBottom: spacing.lg,
        },
        secondaryBtn: {
          flex: 1,
          borderRadius: radius.lg,
          backgroundColor: colors.cardSurface,
          borderWidth: 1,
          borderColor: colors.borderColor,
          minHeight: 52,
        },
        primaryBtn: {
          flex: 1,
          borderRadius: radius.lg,
          minHeight: 52,
        },
      }),
    [colors, spacing, radius, numCols]
  );

  const inputContentStyle = { minHeight: 52, paddingVertical: 10 };
  const headerTitle = isEditMode ? "Edit Property" : "Add Property";
  const headerSubtitle = isEditMode ? "Update property details" : "Enter property information";

  const stateNames = useMemo(() => StateCityList.map((s) => s.name), []);
  const findStateByName = (name: string | undefined) => StateCityList.find((s) => s.name === name);

  const LabeledInput = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.fieldBlock}>
      <PaperText style={styles.label}>{label}</PaperText>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={attemptLeave}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          android_ripple={{ color: hexToRgba(colors.textMuted, 0.2), borderless: true }}
        >
          <MaterialIcons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={colors.textPrimary}
          />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <PaperText style={styles.headerTitle}>{headerTitle}</PaperText>
          <PaperText style={styles.headerSubtitle}>{headerSubtitle}</PaperText>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: bottomGutter }}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Details Section */}
          <View style={styles.sectionCard}>
            <PaperText style={styles.sectionTitle}>Basic Details</PaperText>

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="PG Name *">
                      <TextInput
                        value={value}
                        onFocus={() => Haptics.selectionAsync()}
                        onChangeText={(t) => {
                          markTouched();
                          onChange(t);
                        }}
                        placeholder="Enter PG name"
                        mode="outlined"
                        outlineColor={hexToRgba(colors.borderColor, 0.8)}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={inputContentStyle}
                        accessibilityLabel="PG name"
                      />
                      {errors.name && <PaperText style={styles.error}>{errors.name.message}</PaperText>}
                    </LabeledInput>
                  )}
                />
              </View>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="doorNo"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="D.No/Building No *">
                      <TextInput
                        value={value}
                        onFocus={() => Haptics.selectionAsync()}
                        onChangeText={(t) => {
                          markTouched();
                          onChange(t);
                        }}
                        placeholder="e.g., 12-5/7"
                        mode="outlined"
                        outlineColor={hexToRgba(colors.borderColor, 0.8)}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={inputContentStyle}
                        accessibilityLabel="Door or building number"
                      />
                      {errors.doorNo && (
                        <PaperText style={styles.error}>{errors.doorNo.message}</PaperText>
                      )}
                    </LabeledInput>
                  )}
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="street"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="Street Name *">
                      <TextInput
                        value={value}
                        onFocus={() => Haptics.selectionAsync()}
                        onChangeText={(t) => {
                          markTouched();
                          onChange(t);
                        }}
                        placeholder="Street"
                        mode="outlined"
                        outlineColor={hexToRgba(colors.borderColor, 0.8)}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={inputContentStyle}
                        accessibilityLabel="Street name"
                      />
                      {errors.street && (
                        <PaperText style={styles.error}>{errors.street.message}</PaperText>
                      )}
                    </LabeledInput>
                  )}
                />
              </View>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="area"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="Area *">
                      <TextInput
                        value={value}
                        onFocus={() => Haptics.selectionAsync()}
                        onChangeText={(t) => {
                          markTouched();
                          onChange(t);
                        }}
                        placeholder="Locality/Area"
                        mode="outlined"
                        outlineColor={hexToRgba(colors.borderColor, 0.8)}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={inputContentStyle}
                        accessibilityLabel="Area"
                      />
                      {errors.area && <PaperText style={styles.error}>{errors.area.message}</PaperText>}
                    </LabeledInput>
                  )}
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="landmark"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="Landmark (Optional)">
                      <TextInput
                        value={value}
                        onFocus={() => Haptics.selectionAsync()}
                        onChangeText={(t) => {
                          markTouched();
                          onChange(t);
                        }}
                        placeholder="Near ..."
                        mode="outlined"
                        outlineColor={hexToRgba(colors.borderColor, 0.8)}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={inputContentStyle}
                        accessibilityLabel="Landmark"
                      />
                    </LabeledInput>
                  )}
                />
              </View>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="pincode"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="Pincode (6 digits) *">
                      <TextInput
                        value={value}
                        onFocus={() => Haptics.selectionAsync()}
                        onChangeText={(t) => {
                          const digits = t.replace(/\D/g, "");
                          markTouched();
                          onChange(digits.slice(0, 6));
                        }}
                        placeholder="560102"
                        keyboardType="number-pad"
                        maxLength={6}
                        mode="outlined"
                        outlineColor={hexToRgba(colors.borderColor, 0.8)}
                        activeOutlineColor={colors.primary}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={inputContentStyle}
                        accessibilityLabel="Pincode"
                      />
                      {errors.pincode && (
                        <PaperText style={styles.error}>{errors.pincode.message}</PaperText>
                      )}
                    </LabeledInput>
                  )}
                />
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.sectionCard}>
            <PaperText style={styles.sectionTitle}>Location</PaperText>

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="State *">
                      <SheetSelect
                        value={value}
                        placeholder="Select State"
                        options={stateNames}
                        onChange={(name) => {
                          Haptics.selectionAsync();
                          markTouched();
                          onChange(name);
                          const sel = findStateByName(name);
                          setStateIso2(sel?.iso2);
                        }}
                      />
                      {errors.state && (
                        <PaperText style={styles.error}>{errors.state.message}</PaperText>
                      )}
                    </LabeledInput>
                  )}
                />
              </View>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="City *">
                      <SheetSelect
                        value={value}
                        placeholder={stateIso2 ? "Select City" : "Select State first"}
                        options={cityOptions}
                        onChange={(v) => {
                          markTouched();
                          onChange(v);
                        }}
                        disabled={!stateIso2}
                        loading={!!stateIso2 && loadingCities}
                      />
                      {errors.city && <PaperText style={styles.error}>{errors.city.message}</PaperText>}
                    </LabeledInput>
                  )}
                />
              </View>
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.sectionCard}>
            <PaperText style={styles.sectionTitle}>Preferences</PaperText>

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="type"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="PG Type *">
                      <Segmented
                        value={value}
                        options={["Men's", "Women's", "Co-living"]}
                        onChange={onChange}
                      />
                      {errors.type && <PaperText style={styles.error}>{errors.type.message}</PaperText>}
                    </LabeledInput>
                  )}
                />
              </View>
              <View style={styles.fieldCol}>
                <Controller
                  control={control}
                  name="meal"
                  render={({ field: { value, onChange } }) => (
                    <LabeledInput label="Meal Type *">
                      <Segmented value={value} options={["Veg", "Non-veg", "Both"]} onChange={onChange} />
                      {errors.meal && <PaperText style={styles.error}>{errors.meal.message}</PaperText>}
                    </LabeledInput>
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="noticeDays"
              render={({ field: { value, onChange } }) => (
                <LabeledInput label="Notice Period (days) *">
                  <TextInput
                    value={value}
                    onFocus={() => Haptics.selectionAsync()}
                    onChangeText={(t) => {
                      markTouched();
                      onChange(t.replace(/[^0-9]/g, ""));
                    }}
                    placeholder="30"
                    keyboardType="number-pad"
                    mode="outlined"
                    outlineColor={hexToRgba(colors.borderColor, 0.8)}
                    activeOutlineColor={colors.primary}
                    style={[styles.input, { maxWidth: numCols === 2 ? "48%" : "100%" }]}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={inputContentStyle}
                    accessibilityLabel="Notice period in days"
                  />
                  {errors.noticeDays && (
                    <PaperText style={styles.error}>{errors.noticeDays.message}</PaperText>
                  )}
                </LabeledInput>
              )}
            />
          </View>

          {/* Facilities Section */}
          <View style={styles.sectionCard}>
            <PaperText style={styles.sectionTitle}>Facilities</PaperText>
            <Controller
              control={control}
              name="facilities"
              render={({ field: { value, onChange } }) => (
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {FACILITY_OPTIONS.map((f) => {
                    const selected = (value || []).includes(f);
                    return (
                      <ChipCheckbox
                        key={f}
                        label={f}
                        selected={selected}
                        onToggle={() => {
                          markTouched();
                          const next = selected ? value.filter((x) => x !== f) : [...(value || []), f];
                          onChange(next);
                        }}
                      />
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* Photos Section */}
          <View style={styles.sectionCard}>
            <PaperText style={styles.sectionTitle}>Property Photos</PaperText>
            <Button
              mode="outlined"
              onPress={pickPhotos}
              icon="image-plus"
              style={{ borderRadius: radius.lg, borderColor: colors.borderColor }}
              textColor={colors.textPrimary}
              accessibilityLabel="Pick images"
              disabled={saving}
            >
              Pick Images
            </Button>

            <View style={styles.photosGrid}>
              {(selectedPhotos || []).map((uri) => (
                <View key={uri} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
                  <Pressable
                    onPress={() => removePhoto(uri)}
                    style={styles.removeBadge}
                    accessibilityLabel="Remove photo"
                  >
                    <MaterialIcons name="close" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Footer Buttons */}
          <View style={styles.footerRow}>
            <Button
              mode="outlined"
              style={styles.secondaryBtn}
              textColor={colors.textPrimary}
              onPress={attemptLeave}
              accessibilityLabel="Cancel and go back"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              style={styles.primaryBtn}
              onPress={handleSubmit(onSubmit)}
              accessibilityLabel={isEditMode ? "Update property" : "Submit form"}
              loading={saving}
              disabled={saving}
            >
              {isEditMode ? "Update" : "Save"}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

