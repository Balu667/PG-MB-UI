// app/protected/AddandEditProperty.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
// top of file
import { useQueryClient } from "@tanstack/react-query";
import { Button, Text as PaperText, TextInput, Divider, Portal, Dialog } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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

/* ---------------- Types & Validation ---------------- */
type FormValues = {
  name: string;
  type: "Men’s" | "Women’s" | "Co-living";
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
  photos: string[]; // local or absolute URLs
};

const schema: yup.ObjectSchema<FormValues> = yup
  .object({
    name: yup.string().trim().required("PG name is required"),
    type: yup.mixed<FormValues["type"]>().oneOf(["Men’s", "Women’s", "Co-living"]).required(),
    meal: yup.mixed<FormValues["meal"]>().oneOf(["Veg", "Non-veg", "Both"]).required(),
    doorNo: yup.string().trim().min(1, "Required").required("D.No/Building No is required"),
    street: yup.string().trim().required("Street name is required"),
    area: yup.string().trim().required("Area is required"),
    landmark: yup.string().trim().optional(),
    state: yup.string().trim().required("State is required"),
    city: yup.string().trim().required("City is required"),
    pincode: yup
      .string()
      .matches(/^\d{6}$/, "Pincode must be 6 digits")
      .required(),
    noticeDays: yup.string().matches(/^\d+$/, "Enter a valid number").required(),
    facilities: yup.array(yup.string()).default([]),
    photos: yup.array(yup.string()).default([]),
  })
  .required();

/* ---------------- Helpers ---------------- */
const FACILITY_OPTIONS = ["Washing machine", "Wifi", "Hot water", "Table", "TV", "AC", "Fridge"];

// Prefer explicit FILE_URL from .env, then app.json extra.fileUrl, then EXPO_PUBLIC_* fallbacks
const FILE_BASES = [
  (process.env.FILE_URL || "").trim(), // <- your .env FILE_URL
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

function useCols() {
  const { width } = useWindowDimensions();
  return width >= 740 ? 2 : 1;
}

const FieldRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cols = useCols();
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: cols === 2 ? "row" : "column",
        flexWrap: "wrap",
        columnGap: spacing.md - 8,
        rowGap: spacing.md - 8,
      }}
    >
      {React.Children.map(children, (child, idx) => (
        <View key={idx} style={{ width: cols === 2 ? "48%" : "100%" }}>
          {child}
        </View>
      ))}
    </View>
  );
};

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
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: radius.xl,
              margin: 2,
              backgroundColor: selected ? hexToRgba(colors.accent, 0.14) : "transparent",
              borderWidth: selected ? 1 : 0,
              borderColor: selected ? colors.accent : "transparent",
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <PaperText
              style={{
                color: selected ? colors.accent : colors.textPrimary,
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
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: selected ? hexToRgba(colors.accent, 0.14) : colors.cardSurface,
        borderColor: selected ? colors.accent : colors.borderColor,
        borderWidth: 1,
        minHeight: 44,
        justifyContent: "center",
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <PaperText
        style={{
          color: selected ? colors.accent : colors.textPrimary,
          fontSize: typography.fontSizeSm,
          fontWeight: "600",
        }}
      >
        {label}
      </PaperText>
    </Pressable>
  );
};

/* ---------------- Bottom-Sheet style select (Paper Dialog) ---------------- */
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
          paddingVertical: 12,
          paddingHorizontal: 12,
          opacity: disabled ? 0.6 : 1,
          minHeight: 44,
          justifyContent: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
      >
        <PaperText
          style={{ color: value ? colors.textPrimary : colors.textMuted }}
          numberOfLines={1}
        >
          {value || (loading ? "Loading..." : placeholder)}
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
};

/* ---------------- Screen ---------------- */
export default function AddandEditProperty() {
  const router = useRouter();
  const params = useLocalSearchParams<
    Partial<FormValues> & {
      id?: string;
      facilities?: string; // optional JSON when navigating from card
      images?: string; // optional JSON when navigating from card
    }
  >();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();
  const cols = useCols();
  const queryClient = useQueryClient();
  // profile for ownerId/createdBy
  const { profileData } = useSelector((state: any) => state.profileDetails);
  const ownerId = profileData?.userId;

  const isEditMode = !!params?.id;

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
      type: "Men’s",
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
    shouldUnregister: false, // avoid unmounts that can cause focus flicker
  });

  /* ---------- Mapping helpers ---------- */
  const toScreenTenantType = (t?: string): FormValues["type"] => {
    if (!t) return "Men’s";
    const s = String(t).toLowerCase();
    if (s.startsWith("male")) return "Men’s";
    if (s.startsWith("female")) return "Women’s";
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

  /* ---------- Prefill from navigation params (instant) ---------- */
  const hasPrefilledFromParams = useRef(false);
  useEffect(() => {
    if (!isEditMode || !params?.id || hasPrefilledFromParams.current) return;

    let parsedFacilities: string[] = [];
    if (typeof params.facilities === "string") {
      try {
        const j = JSON.parse(params.facilities);
        parsedFacilities = normalizeFacilities(j);
      } catch {}
    }

    let parsedPhotos: string[] = [];
    if (typeof params.images === "string") {
      try {
        const j = JSON.parse(params.images);
        if (Array.isArray(j)) {
          parsedPhotos = j
            .map((img: any) => (typeof img === "string" ? img : img?.filePath || ""))
            .filter(Boolean)
            .map(toAbsoluteFileUrl);
        }
      } catch {}
    }

    const nextValues: FormValues = {
      name: params.name ?? "",
      type: toScreenTenantType(params.type),
      meal: toScreenMealType(params.meal),
      doorNo: params.doorNo ?? "",
      street: params.street ?? "",
      area: params.area ?? "",
      landmark: params.landmark ?? "",
      state: params.state ?? "",
      city: params.city ?? "",
      pincode: params.pincode ?? "",
      noticeDays: params.noticeDays ?? "",
      facilities: parsedFacilities,
      photos: parsedPhotos,
    };
    reset(nextValues, { keepDirty: false, keepTouched: false });

    const sel = StateCityList.find((s) => s.name === nextValues.state);
    if (sel?.iso2) setStateIso2(sel.iso2);

    hasPrefilledFromParams.current = true;
  }, [isEditMode, params, reset]);

  /* ---------- Prefill from API (merge, do NOT clobber while typing) ---------- */
  const { data: propertyResp } = useGetPropertyData(params?.id || "");
  const hasPrefilledFromApi = useRef(false);
  const formTouched = useRef(false);
  const markTouched = () => {
    formTouched.current = true;
  };

  useEffect(() => {
    if (!isEditMode || hasPrefilledFromApi.current) return;

    // Your API sometimes returns { data: [...] }. Normalize to the first item.
    const raw = propertyResp?.data as any;
    const prop = Array.isArray(raw) ? raw[0] : raw;

    // Only proceed when we have a valid object (prevents a reset that can steal focus)
    if (!prop || typeof prop !== "object" || !prop._id) return;

    const current = getValues();
    const prefer = (apiVal?: string, curVal?: string) =>
      typeof apiVal === "string" && apiVal.trim().length > 0 ? apiVal : curVal || "";

    // facilities
    const apiFacilities = normalizeFacilities(prop.facilities);
    const facilities = apiFacilities.length ? apiFacilities : current.facilities;

    // images → strings or objects with filePath; filter out non-strings
    const apiPhotosRaw: string[] = Array.isArray(prop.images)
      ? prop.images
          .map((img: any) =>
            typeof img === "string" ? img : typeof img?.filePath === "string" ? img.filePath : ""
          )
          .filter(Boolean)
      : prop?.filePath
      ? [prop.filePath]
      : [];
    const apiPhotos = apiPhotosRaw.map(toAbsoluteFileUrl);
    const photos = apiPhotos.length ? apiPhotos : current.photos;

    const nextValues: FormValues = {
      name: prefer(prop.propertyName, current.name),
      type: toScreenTenantType(prop.tenantType || current.type),
      meal: toScreenMealType(prop.mealType || current.meal),
      doorNo: prefer(prop.doorNo, current.doorNo),
      street: prefer(prop.streetName, current.street),
      area: prefer(prop.area, current.area),
      landmark: prefer(prop.landmark, current.landmark),
      state: prefer(prop.state, current.state),
      city: prefer(prop.city, current.city),
      pincode: prefer(prop.pincode, current.pincode),
      noticeDays: prefer(
        typeof prop.noticePeriod === "number" ? String(prop.noticePeriod) : prop.noticePeriod,
        current.noticeDays
      ),
      facilities,
      photos,
    };

    if (!formTouched.current) {
      reset(nextValues, { keepDirty: false, keepTouched: false });
      const sel = StateCityList.find((s) => s.name === nextValues.state);
      if (sel?.iso2) setStateIso2(sel.iso2);
    } else {
      // Merge without re-mounting inputs (avoid focus loss)
      if (!current.photos?.length && photos.length)
        setValue("photos", photos, { shouldDirty: false });
      if (!current.facilities?.length && facilities.length)
        setValue("facilities", facilities, { shouldDirty: false });
      if (!current.state && nextValues.state)
        setValue("state", nextValues.state, { shouldDirty: false });
      if (!current.city && nextValues.city)
        setValue("city", nextValues.city, { shouldDirty: false });
      const sel = StateCityList.find((s) => s.name === (current.state || nextValues.state));
      if (sel?.iso2) setStateIso2(sel.iso2);
    }

    hasPrefilledFromApi.current = true;
  }, [isEditMode, propertyResp, reset, getValues, setValue]);

  /* ---------- State -> City flow ---------- */
  const stateVal = watch("state");
  const selectedPhotos = watch("photos");

  useEffect(() => {
    const sel = StateCityList.find((s) => s.name === stateVal);
    if (sel?.iso2 && sel.iso2 !== stateIso2) {
      setStateIso2(sel.iso2);
    }
  }, [stateVal]); // eslint-disable-line

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

  /* ---------- Navigation guards ---------- */
  const goToListAndRefresh = () => {
    try {
      // Invalidate any query whose key contains “property”
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey.some((k) => typeof k === "string" && /property/i.test(k)),
      });
    } catch {}

    // Navigate with a changing param; Properties.tsx will refetch on change
    router.replace({
      pathname: "/protected/(tabs)/Properties",
      params: { refresh: String(Date.now()) },
    });
  };
  const hasUnsavedChanges = () =>
    isDirty || formTouched.current || (selectedPhotos?.length ?? 0) > 0;
  const attemptLeave = () => {
    if (hasUnsavedChanges()) {
      Alert.alert("Unsaved changes", "Discard your changes and go back?", [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => goToListAndRefresh() },
      ]);
    } else {
      goToListAndRefresh(); // still refresh to pick up web changes
    }
  };

  useEffect(() => {
    const onBack = () => {
      attemptLeave();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [isDirty, selectedPhotos?.length]);

  /* ---------- Photos (native + web) ---------- */
  const pickPhotos = async () => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission needed", "Please allow photo library access to pick images.");
          return;
        }
      }
      const anyPicker: any = ImagePicker;
      const mediaType = ImagePicker.MediaType.images ?? ImagePicker.MediaType.images;

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        selectionLimit: 0,
        mediaTypes: mediaType,
        quality: 0.9,
      } as any);

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

  /* ---------- Submit (ADD/EDIT) ---------- */
  const mapTenantType = (t: FormValues["type"]) =>
    t === "Men’s" ? "Male" : t === "Women’s" ? "Female" : "Co-living";
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

    // images:
    for (let idx = 0; idx < (values.photos || []).length; idx++) {
      const uri = values.photos[idx];
      if (!uri) continue;

      const isRemote = /^https?:\/\//i.test(uri);
      if (forUpdate && isRemote) continue; // keep server files

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
    Toast.show({ type: "success", text1: "Property saved", position: "bottom" });
    goToListAndRefresh();
  };
  const onUpdateSuccess = () => {
    Toast.show({ type: "success", text1: "Property updated", position: "bottom" });
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
    const formData = await buildFormDataAsync(data, isEditMode && !!params?.id);
    if (isEditMode && params?.id) {
      updateProperty({ formData, propertyId: params.id });
    } else {
      insertProperty(formData);
    }
  };

  /* ---------- Layout ---------- */
  const bottomGutter = insets.bottom + (Platform.OS === "android" ? 72 : 36);

  const s = useMemo(
    () => ({
      safeArea: { flex: 1, backgroundColor: colors.background },
      header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderColor: hexToRgba(colors.textSecondary, 0.12),
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 8,
      },
      backBtn: {
        width: 44,
        height: 44,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        borderRadius: radius.full,
      },
      headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLg,
        fontWeight: "700" as const,
        flexShrink: 1,
      },
      body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
      sectionTitle: {
        color: colors.textSecondary,
        fontWeight: "700" as const,
        marginBottom: 8,
        letterSpacing: 0.2,
        marginTop: spacing.lg,
      },
      fieldBlock: { marginTop: spacing.md * 0.75, marginBottom: 10 },
      label: { color: colors.textPrimary, fontWeight: "600" as const, marginBottom: 6 },
      error: { color: colors.error, fontSize: 12, marginTop: 4 },
      input: { backgroundColor: colors.cardSurface } as const,
      photosGrid: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        gap: 8,
        marginTop: spacing.sm,
      },
      thumbWrap: {
        width: cols === 2 ? 90 : 100,
        height: cols === 2 ? 90 : 100,
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
      footerRow: { flexDirection: "row" as const, gap: spacing.md, marginTop: spacing.lg },
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
    }),
    [colors, spacing, radius, typography, cols]
  );

  const inputContent = { minHeight: 44, paddingVertical: 8 };
  const headerTitle = isEditMode ? "Edit Property" : "Add Property";

  const Title = ({ children }: { children: React.ReactNode }) => (
    <PaperText style={s.sectionTitle}>{children}</PaperText>
  );
  const LabeledInput = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={s.fieldBlock}>
      <PaperText style={s.label}>{label}</PaperText>
      {children}
    </View>
  );

  const stateNames = useMemo(() => StateCityList.map((s) => s.name), []);
  const findStateByName = (name: string | undefined) => StateCityList.find((s) => s.name === name);

  return (
    <SafeAreaView style={s.safeArea} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={s.backBtn}
          onPress={attemptLeave}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          android_ripple={{ color: hexToRgba(colors.textSecondary, 0.2), borderless: true }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <PaperText style={s.headerTitle} numberOfLines={1}>
          {headerTitle}
        </PaperText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={s.body}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: bottomGutter }}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic details */}
          <Title>Basic details</Title>
          <FieldRow>
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange } }) => (
                <LabeledInput label="PG name *">
                  <TextInput
                    value={value}
                    onFocus={() => Haptics.selectionAsync()}
                    onChangeText={(t) => {
                      markTouched();
                      onChange(t);
                    }}
                    placeholder="Enter PG name"
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={s.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="next"
                    autoCorrect={false}
                    autoComplete="off"
                    importantForAutofill="no"
                    contentStyle={inputContent}
                    accessibilityLabel="PG name"
                  />
                  {errors.name && <PaperText style={s.error}>{errors.name.message}</PaperText>}
                </LabeledInput>
              )}
            />
            <Controller
              control={control}
              name="doorNo"
              render={({ field: { value, onChange } }) => (
                <LabeledInput label="D.No/Building No *">
                  <TextInput
                    value={value}
                    onFocus={() => Haptics.selectionAsync()}
                    onChangeText={(t) => (markTouched(), onChange(t))}
                    placeholder="e.g., 12-5/7"
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={s.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="next"
                    autoCapitalize="characters"
                    contentStyle={inputContent}
                    accessibilityLabel="Door number or building number"
                  />
                  {errors.doorNo && <PaperText style={s.error}>{errors.doorNo.message}</PaperText>}
                </LabeledInput>
              )}
            />
          </FieldRow>

          <FieldRow>
            <Controller
              control={control}
              name="street"
              render={({ field: { value, onChange } }) => (
                <LabeledInput label="Street name *">
                  <TextInput
                    value={value}
                    onFocus={() => Haptics.selectionAsync()}
                    onChangeText={(t) => (markTouched(), onChange(t))}
                    placeholder="Street"
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={s.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="next"
                    contentStyle={inputContent}
                    accessibilityLabel="Street name"
                  />
                  {errors.street && <PaperText style={s.error}>{errors.street.message}</PaperText>}
                </LabeledInput>
              )}
            />
            <Controller
              control={control}
              name="area"
              render={({ field: { value, onChange } }) => (
                <LabeledInput label="Area *">
                  <TextInput
                    value={value}
                    onFocus={() => Haptics.selectionAsync()}
                    onChangeText={(t) => (markTouched(), onChange(t))}
                    placeholder="Locality/Area"
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={s.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="next"
                    contentStyle={inputContent}
                    accessibilityLabel="Area"
                  />
                  {errors.area && <PaperText style={s.error}>{errors.area.message}</PaperText>}
                </LabeledInput>
              )}
            />
          </FieldRow>

          <FieldRow>
            <Controller
              control={control}
              name="landmark"
              render={({ field: { value, onChange } }) => (
                <LabeledInput label="Landmark (optional)">
                  <TextInput
                    value={value}
                    onFocus={() => Haptics.selectionAsync()}
                    onChangeText={(t) => (markTouched(), onChange(t))}
                    placeholder="Near ..."
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={s.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="next"
                    contentStyle={inputContent}
                    accessibilityLabel="Landmark"
                  />
                </LabeledInput>
              )}
            />
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
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    inputMode="numeric"
                    maxLength={6}
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={s.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="next"
                    contentStyle={inputContent}
                    accessibilityLabel="Pincode"
                  />
                  {errors.pincode && (
                    <PaperText style={s.error}>{errors.pincode.message}</PaperText>
                  )}
                </LabeledInput>
              )}
            />
          </FieldRow>

          <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

          {/* Location */}
          <PaperText style={s.sectionTitle}>Location</PaperText>
          <FieldRow>
            <Controller
              control={control}
              name="state"
              render={({ field: { value, onChange } }) => (
                <View style={s.fieldBlock}>
                  <PaperText style={s.label}>State *</PaperText>
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
                  {errors.state && <PaperText style={s.error}>{errors.state.message}</PaperText>}
                </View>
              )}
            />
            <Controller
              control={control}
              name="city"
              render={({ field: { value, onChange } }) => (
                <View style={s.fieldBlock}>
                  <PaperText style={s.label}>City *</PaperText>
                  <SheetSelect
                    value={value}
                    placeholder={stateIso2 ? "Select City" : "Select State first"}
                    options={cityOptions}
                    onChange={(v) => (markTouched(), onChange(v))}
                    disabled={!stateIso2}
                    loading={!!stateIso2 && loadingCities}
                  />
                  {errors.city && <PaperText style={s.error}>{errors.city.message}</PaperText>}
                </View>
              )}
            />
          </FieldRow>

          <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

          {/* Preferences */}
          <PaperText style={s.sectionTitle}>Preferences</PaperText>
          <FieldRow>
            <Controller
              control={control}
              name="type"
              render={({ field: { value, onChange } }) => (
                <View style={s.fieldBlock}>
                  <PaperText style={s.label}>PG type *</PaperText>
                  <Segmented
                    value={value}
                    options={["Men’s", "Women’s", "Co-living"]}
                    onChange={onChange}
                  />
                  {errors.type && <PaperText style={s.error}>{errors.type.message}</PaperText>}
                </View>
              )}
            />
            <Controller
              control={control}
              name="meal"
              render={({ field: { value, onChange } }) => (
                <View style={s.fieldBlock}>
                  <PaperText style={s.label}>Meal type *</PaperText>
                  <Segmented
                    value={value}
                    options={["Veg", "Non-veg", "Both"]}
                    onChange={onChange}
                  />
                  {errors.meal && <PaperText style={s.error}>{errors.meal.message}</PaperText>}
                </View>
              )}
            />
          </FieldRow>

          <FieldRow>
            <Controller
              control={control}
              name="noticeDays"
              render={({ field: { value, onChange } }) => (
                <View style={s.fieldBlock}>
                  <PaperText style={s.label}>Notice period (days) *</PaperText>
                  <TextInput
                    value={value}
                    onFocus={() => Haptics.selectionAsync()}
                    onChangeText={(t) => (markTouched(), onChange(t.replace(/[^0-9]/g, "")))}
                    placeholder="30"
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    inputMode="numeric"
                    mode="outlined"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={s.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={inputContent}
                    accessibilityLabel="Notice period in days"
                  />
                  {errors.noticeDays && (
                    <PaperText style={s.error}>{errors.noticeDays.message}</PaperText>
                  )}
                </View>
              )}
            />
          </FieldRow>

          <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

          {/* Facilities */}
          <PaperText style={s.sectionTitle}>Property Facilities</PaperText>
          <Controller
            control={control}
            name="facilities"
            render={({ field: { value, onChange } }) => (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: 4,
                  marginTop: spacing.md * 0.5,
                }}
              >
                {FACILITY_OPTIONS.map((f) => {
                  const selected = (value || []).includes(f);
                  return (
                    <ChipCheckbox
                      key={f}
                      label={f}
                      selected={selected}
                      onToggle={() => {
                        markTouched();
                        const next = selected
                          ? value.filter((x) => x !== f)
                          : [...(value || []), f];
                        onChange(next);
                      }}
                    />
                  );
                })}
              </View>
            )}
          />

          <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

          {/* Photos */}
          <PaperText style={s.sectionTitle}>Property photos</PaperText>
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
            disabled={saving}
          >
            Pick images
          </Button>

          <View style={s.photosGrid}>
            {(selectedPhotos || []).map((uri) => (
              <View key={uri} style={s.thumbWrap}>
                <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
                <Pressable
                  onPress={() => removePhoto(uri)}
                  style={s.removeBadge}
                  accessibilityLabel="Remove photo"
                >
                  <PaperText style={{ color: colors.white, fontWeight: "700" }}>×</PaperText>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Footer buttons */}
          <View style={s.footerRow}>
            <Button
              mode="outlined"
              style={s.secondaryBtn}
              textColor={colors.textPrimary}
              onPress={attemptLeave}
              accessibilityLabel="Cancel and go back"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              style={s.primaryBtn}
              onPress={handleSubmit(onSubmit)}
              accessibilityLabel={isEditMode ? "Update property" : "Submit form"}
              loading={saving}
              disabled={saving}
            >
              {isEditMode ? "Update" : "Submit"}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
