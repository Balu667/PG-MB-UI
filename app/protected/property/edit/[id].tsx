// app/protected/property/edit/[id].tsx
// Add/Edit Property Screen - Premium Design (Rewritten)
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
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
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
   TYPES & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

interface FormValues {
  name: string;
  type: string;
  meal: string;
  doorNo: string;
  street: string;
  area: string;
  landmark: string;
  state: string;
  city: string;
  pincode: string;
  noticeDays: string;
  facilities: string[];
  photos: string[];
}

const FACILITY_OPTIONS = [
  "Washing machine",
  "Wifi",
  "Hot water",
  "Table",
  "TV",
  "AC",
  "Fridge",
];

const TYPE_OPTIONS = ["Men's", "Women's", "Co-living"];
const MEAL_OPTIONS = ["Veg", "Non-veg", "Both"];

// File URL helpers
const FILE_BASES = [
  (process.env.FILE_URL || "").trim(),
  ((Constants as any)?.expoConfig?.extra?.fileUrl || "").trim(),
  (process.env.EXPO_PUBLIC_IMAGE_BASE_URL || "").trim(),
  (process.env.EXPO_PUBLIC_FILE_BASE_URL || "").trim(),
]
  .filter(Boolean)
  .map((b) => String(b).replace(/\/+$/, ""));

const toAbsoluteFileUrl = (p?: string): string => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return FILE_BASES.length ? `${FILE_BASES[0]}/${p.replace(/^\/+/, "")}` : p;
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
  options: string[];
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
          {value || (loading ? "Loading..." : placeholder)}
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
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ padding: spacing.sm }}
              keyboardShouldPersistTaps="always"
            >
              {loading ? (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 8 }}>
                  Loading...
                </PaperText>
              ) : options.length === 0 ? (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 8 }}>
                  No options available
                </PaperText>
              ) : (
                options.map((opt) => {
                  const isSelected = opt === value;
                  return (
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
                      accessibilityLabel={opt}
                      accessibilityState={{ selected: isSelected }}
                      accessible
                    >
                      <PaperText
                        style={{
                          color: colors.textPrimary,
                          fontWeight: isSelected ? "700" : "400",
                        }}
                      >
                        {opt}
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
   SEGMENTED CONTROL COMPONENT
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

/* ─────────────────────────────────────────────────────────────────────────────
   CHIP CHECKBOX COMPONENT
───────────────────────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN SCREEN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function AddOrEditProperty() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();

  // Params
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditMode = id !== "new" && !!id;

  // Profile data
  const { profileData } = useSelector(
    (state: { profileDetails?: { profileData?: Record<string, unknown> } }) =>
      state?.profileDetails ?? {}
  );
  const ownerId = String(
    (profileData as Record<string, unknown>)?.ownerId ||
      (profileData as Record<string, unknown>)?.userId ||
      (profileData as Record<string, unknown>)?._id ||
      ""
  );

  // Fetch property data for edit mode
  const { data: propertyResp } = useGetPropertyData(isEditMode ? id : "");

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("Men's");
  const [meal, setMeal] = useState("Veg");
  const [doorNo, setDoorNo] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [noticeDays, setNoticeDays] = useState("");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  // City loading
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [stateIso2, setStateIso2] = useState<string | undefined>();
  const prevIso2Ref = useRef<string | undefined>(undefined);

  const { mutate: fetchCities, isPending: loadingCities } = useGetStateCityList((res: any) => {
    const arr = (res?.data ?? res ?? []) as any[];
    const names = arr.map((c) => (typeof c === "string" ? c : c?.name)).filter(Boolean);
    setCityOptions(names);
  });

  // Track initial values for dirty check
  const initialValues = useRef<FormValues | null>(null);

  // Mapping helpers
  const toScreenTenantType = useCallback((t?: string): string => {
    if (!t) return "Men's";
    const s = String(t).toLowerCase();
    if (s.startsWith("male") || s === "men's") return "Men's";
    if (s.startsWith("female") || s === "women's") return "Women's";
    return "Co-living";
  }, []);

  const toScreenMealType = useCallback((m?: string): string => {
    if (!m) return "Veg";
    const s = String(m).toLowerCase().replace(/\s+/g, "");
    if (s.includes("non-veg") || s.includes("nonveg") || s === "non-veg") return "Non-veg";
    if (s.includes("both")) return "Both";
    return "Veg";
  }, []);

  const normalizeFacilities = useCallback((input: any): string[] => {
    const raw: string[] = Array.isArray(input)
      ? (input as any[]).flatMap((x) => String(x ?? "").split(","))
      : typeof input === "string"
      ? String(input).split(",")
      : [];

    const dict = new Map<string, string>();
    FACILITY_OPTIONS.forEach((opt) => dict.set(opt.toLowerCase(), opt));
    dict.set("washing machine", "Washing machine");
    dict.set("hot water", "Hot water");
    dict.set("wifi", "Wifi");
    dict.set("wi-fi", "Wifi");
    dict.set("ac", "AC");
    dict.set("a/c", "AC");
    dict.set("tv", "TV");
    dict.set("fridge", "Fridge");
    dict.set("table", "Table");

    return raw
      .map((x) => String(x).trim())
      .filter(Boolean)
      .map((x) => dict.get(x.toLowerCase()) || x)
      .filter((x) => FACILITY_OPTIONS.includes(x));
  }, []);

  // Prefill form from API data
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEditMode || prefilled.current) return;

    const raw = propertyResp?.data as any;
    const prop = Array.isArray(raw) ? raw[0] : raw;

    if (!prop || typeof prop !== "object" || !prop._id) return;

    const initialName = String(prop.propertyName || "");
    const initialType = toScreenTenantType(prop.tenantType);
    const initialMeal = toScreenMealType(prop.mealType);
    const initialDoorNo = String(prop.doorNo || "");
    const initialStreet = String(prop.streetName || "");
    const initialArea = String(prop.area || "");
    const initialLandmark = String(prop.landmark || "");
    const initialState = String(prop.state || "");
    const initialCity = String(prop.city || "");
    const initialPincode = String(prop.pincode || "");
    const initialNoticeDays = String(prop.noticePeriod || "");
    const initialFacilities = normalizeFacilities(prop.facilities);

    // Parse images
    const apiPhotosRaw: string[] = Array.isArray(prop.images)
      ? prop.images
          .map((img: any) =>
            typeof img === "string" ? img : typeof img?.filePath === "string" ? img.filePath : ""
          )
          .filter(Boolean)
      : [];
    const initialPhotos = apiPhotosRaw.map(toAbsoluteFileUrl);

    // Set form state
    setName(initialName);
    setType(initialType);
    setMeal(initialMeal);
    setDoorNo(initialDoorNo);
    setStreet(initialStreet);
    setArea(initialArea);
    setLandmark(initialLandmark);
    setState(initialState);
    setCity(initialCity);
    setPincode(initialPincode);
    setNoticeDays(initialNoticeDays);
    setFacilities(initialFacilities);
    setPhotos(initialPhotos);

    // Set state ISO for city loading
    const sel = StateCityList.find((s) => s.name === initialState);
    if (sel?.iso2) setStateIso2(sel.iso2);

    // Store initial values for dirty check
    initialValues.current = {
      name: initialName,
      type: initialType,
      meal: initialMeal,
      doorNo: initialDoorNo,
      street: initialStreet,
      area: initialArea,
      landmark: initialLandmark,
      state: initialState,
      city: initialCity,
      pincode: initialPincode,
      noticeDays: initialNoticeDays,
      facilities: initialFacilities,
      photos: initialPhotos,
    };

    prefilled.current = true;
  }, [isEditMode, propertyResp, toScreenTenantType, toScreenMealType, normalizeFacilities]);

  // Set initial values for add mode
  useEffect(() => {
    if (!isEditMode && !initialValues.current) {
      initialValues.current = {
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
      };
    }
  }, [isEditMode]);

  // State -> City flow
  useEffect(() => {
    const sel = StateCityList.find((s) => s.name === state);
    if (sel?.iso2 && sel.iso2 !== stateIso2) {
      setStateIso2(sel.iso2);
    }
  }, [state, stateIso2]);

  useEffect(() => {
    if (!stateIso2) {
      setCityOptions([]);
      return;
    }
    if (prevIso2Ref.current && prevIso2Ref.current !== stateIso2) {
      setCity("");
    }
    prevIso2Ref.current = stateIso2;
    fetchCities(stateIso2);
  }, [stateIso2, fetchCities]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!initialValues.current) {
      return !!(
        name.trim() ||
        doorNo.trim() ||
        street.trim() ||
        area.trim() ||
        state ||
        city ||
        pincode.trim() ||
        noticeDays.trim() ||
        facilities.length > 0 ||
        photos.length > 0
      );
    }

    const initial = initialValues.current;
    const facilitiesChanged =
      JSON.stringify([...facilities].sort()) !== JSON.stringify([...initial.facilities].sort());
    const photosChanged =
      JSON.stringify([...photos].sort()) !== JSON.stringify([...initial.photos].sort());

    return (
      name !== initial.name ||
      type !== initial.type ||
      meal !== initial.meal ||
      doorNo !== initial.doorNo ||
      street !== initial.street ||
      area !== initial.area ||
      landmark !== initial.landmark ||
      state !== initial.state ||
      city !== initial.city ||
      pincode !== initial.pincode ||
      noticeDays !== initial.noticeDays ||
      facilitiesChanged ||
      photosChanged
    );
  }, [name, type, meal, doorNo, street, area, landmark, state, city, pincode, noticeDays, facilities, photos]);

  // Navigation back to Properties with refresh
  const navigateBackToProperties = useCallback(() => {
    try {
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey.some((k) => typeof k === "string" && /property/i.test(k)),
      });
    } catch {
      // Ignore
    }
    router.replace({
      pathname: "/protected/(tabs)/Properties",
      params: { refresh: String(Date.now()) },
    });
  }, [queryClient, router]);

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
    showUnsavedChangesAlert(navigateBackToProperties);
  }, [showUnsavedChangesAlert, navigateBackToProperties]);

  // Handle cancel button
  const onCancel = useCallback(() => {
    showUnsavedChangesAlert(navigateBackToProperties);
  }, [showUnsavedChangesAlert, navigateBackToProperties]);

  // Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  // Input handlers
  const onPincodeChange = useCallback((text: string) => {
    const digitsOnly = text.replace(/\D/g, "").slice(0, 6);
    setPincode(digitsOnly);
  }, []);

  const onNoticeDaysChange = useCallback((text: string) => {
    const digitsOnly = text.replace(/\D/g, "");
    setNoticeDays(digitsOnly);
  }, []);

  const onStateChange = useCallback((newState: string) => {
    setState(newState);
    const sel = StateCityList.find((s) => s.name === newState);
    setStateIso2(sel?.iso2);
  }, []);

  const toggleFacility = useCallback((facility: string) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  }, []);

  // Photo picker
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
        allowsMultipleSelection: true,
        selectionLimit: 0,
        mediaTypes: ["images"],
        quality: 0.9,
      });

      if (!res.canceled) {
        const uris = res.assets.map((a) => a.uri);
        setPhotos((prev) => [...prev, ...uris]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Could not open gallery", "Please try again.");
    }
  }, []);

  const removePhoto = useCallback((uri: string) => {
    setPhotos((prev) => prev.filter((u) => u !== uri));
    Haptics.selectionAsync();
  }, []);

  // Validation
  const validate = useCallback((): string[] => {
    const errs: string[] = [];

    if (!name.trim()) {
      errs.push("• PG name is required.");
    }

    if (!doorNo.trim()) {
      errs.push("• D.No/Building No is required.");
    }

    if (!street.trim()) {
      errs.push("• Street name is required.");
    }

    if (!area.trim()) {
      errs.push("• Area is required.");
    }

    if (!state) {
      errs.push("• State is required.");
    }

    if (!city) {
      errs.push("• City is required.");
    }

    if (!pincode || pincode.length !== 6) {
      errs.push("• Pincode must be 6 digits.");
    }

    if (!noticeDays || isNaN(Number(noticeDays))) {
      errs.push("• Notice period (days) is required.");
    }

    return errs;
  }, [name, doorNo, street, area, state, city, pincode, noticeDays]);

  // Mutations
  const insertProperty = useInsertProperty(() => {}, ownerId);
  const updateProperty = useUpdateProperty(() => {}, ownerId);
  const isSubmitting = insertProperty.isPending || updateProperty.isPending;

  // Build FormData
  const buildFormData = useCallback(async (): Promise<FormData> => {
    const fd = new FormData();
    
    // Map types for API
    const mapTenantType = (t: string) =>
      t === "Men's" ? "Male" : t === "Women's" ? "Female" : "Co-living";
    const mapMealType = (m: string) => (m === "Non-veg" ? "Non-Veg" : m);

    fd.append("propertyName", name.trim());
    fd.append("tenantType", mapTenantType(type));
    fd.append("mealType", mapMealType(meal));
    fd.append("doorNo", doorNo.trim());
    fd.append("streetName", street.trim());
    fd.append("area", area.trim());
    fd.append("landmark", landmark.trim());
    fd.append("state", state);
    fd.append("city", city);
    fd.append("pincode", pincode);
    fd.append("noticePeriod", String(Number(noticeDays) || 0));

    facilities.forEach((f) => fd.append("facilities", f));

    if (ownerId) {
      fd.append("ownerId", ownerId);
      fd.append("createdBy", ownerId);
    }

    // Handle photos
    for (let idx = 0; idx < photos.length; idx++) {
      const uri = photos[idx];
      if (!uri) continue;

      const isRemote = /^https?:\/\//i.test(uri);
      if (isEditMode && isRemote) continue; // Skip existing images in edit mode

      const fileName = (uri.split("/").pop() || `photo_${idx}.jpg`).split("?")[0];
      const ext = fileName.split(".").pop()?.toLowerCase();
      const mime =
        ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/jpeg";

      if (Platform.OS === "web") {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        const file = new File([blob], fileName, { type: mime });
        fd.append("images", file);
      } else {
        // React Native requires this format for file uploads
        fd.append("images", {
          uri,
          name: fileName,
          type: mime,
        } as unknown as Blob);
      }
    }

    return fd;
  }, [name, type, meal, doorNo, street, area, landmark, state, city, pincode, noticeDays, facilities, photos, ownerId, isEditMode]);

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
      const formData = await buildFormData();

      if (isEditMode && id) {
        updateProperty.mutate(
          { formData, propertyId: id },
          {
            onSuccess: () => {
              Alert.alert("Success", "Property updated successfully!", [
                { text: "OK", onPress: navigateBackToProperties },
              ]);
            },
            onError: (error: unknown) => {
              let errorMessage = "Could not update property. Please try again.";
              if (error instanceof Error) {
                errorMessage = error.message || errorMessage;
              }
              Alert.alert("Update Failed", errorMessage, [{ text: "OK" }]);
            },
          }
        );
      } else {
        insertProperty.mutate(formData, {
          onSuccess: () => {
            Alert.alert("Success", "Property added successfully!", [
              { text: "OK", onPress: navigateBackToProperties },
            ]);
          },
          onError: (error: unknown) => {
            let errorMessage = "Could not add property. Please try again.";
            if (error instanceof Error) {
              errorMessage = error.message || errorMessage;
            }
            Alert.alert("Add Failed", errorMessage, [{ text: "OK" }]);
          },
        });
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.", [{ text: "OK" }]);
    }
  }, [validate, buildFormData, isEditMode, id, updateProperty, insertProperty, navigateBackToProperties]);

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
        photosGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: spacing.sm,
        },
        thumbWrap: {
          width: 90,
          height: 90,
          borderRadius: radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.5),
          backgroundColor: colors.cardSurface,
        },
        removeBadge: {
          position: "absolute",
          right: 4,
          top: 4,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: hexToRgba(colors.error, 0.9),
          alignItems: "center",
          justifyContent: "center",
        },
        facilitiesWrap: {
          flexDirection: "row",
          flexWrap: "wrap",
        },
      }),
    [colors, spacing, radius, typography]
  );

  const headerTitle = isEditMode ? "Edit Property" : "Add Property";
  const stateNames = useMemo(() => StateCityList.map((s) => s.name), []);

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
            accessibilityHint="Navigate back to properties list"
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
            <PaperText style={styles.headerSubtitle} numberOfLines={1}>
              {isEditMode ? "Update property details" : "Enter property information"}
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
              {/* Basic Details Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Basic Details
                </Text>

                {/* PG Name */}
                <Labeled label="PG Name" required>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter PG name"
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    accessibilityLabel="PG name"
                  />
                </Labeled>

                {/* PG Type */}
                <Labeled label="PG Type" required>
                  <Segmented value={type} options={TYPE_OPTIONS} onChange={setType} />
                </Labeled>

                {/* Meal Type */}
                <Labeled label="Meal Type" required>
                  <Segmented value={meal} options={MEAL_OPTIONS} onChange={setMeal} />
                </Labeled>
              </View>

              {/* Address Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Address
                </Text>

                {/* D.No/Building No */}
                <Labeled label="D.No/Building No" required>
                  <TextInput
                    value={doorNo}
                    onChangeText={setDoorNo}
                    placeholder="e.g., 12-5/7"
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    accessibilityLabel="Door or building number"
                  />
                </Labeled>

                {/* Street Name */}
                <Labeled label="Street Name" required>
                  <TextInput
                    value={street}
                    onChangeText={setStreet}
                    placeholder="Street name"
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    accessibilityLabel="Street name"
                  />
                </Labeled>

                {/* Area */}
                <Labeled label="Area" required>
                  <TextInput
                    value={area}
                    onChangeText={setArea}
                    placeholder="Locality/Area"
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    accessibilityLabel="Area"
                  />
                </Labeled>

                {/* Landmark */}
                <Labeled label="Landmark (optional)">
                  <TextInput
                    value={landmark}
                    onChangeText={setLandmark}
                    placeholder="Near ..."
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    accessibilityLabel="Landmark"
                  />
                </Labeled>
              </View>

              {/* Location Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Location
                </Text>

                {/* State */}
                <Labeled label="State" required>
                  <SheetSelect
                    value={state}
                    placeholder="Select State"
                    options={stateNames}
                    onChange={onStateChange}
                  />
                </Labeled>

                {/* City */}
                <Labeled label="City" required>
                  <SheetSelect
                    value={city}
                    placeholder={stateIso2 ? "Select City" : "Select State first"}
                    options={cityOptions}
                    onChange={setCity}
                    disabled={!stateIso2}
                    loading={!!stateIso2 && loadingCities}
                  />
                </Labeled>

                {/* Pincode */}
                <Labeled label="Pincode (6 digits)" required>
                  <TextInput
                    value={pincode}
                    onChangeText={onPincodeChange}
                    placeholder="560102"
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    maxLength={6}
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    accessibilityLabel="Pincode"
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </Labeled>
              </View>

              {/* Preferences Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Preferences
                </Text>

                {/* Notice Period */}
                <Labeled label="Notice Period (days)" required>
                  <TextInput
                    value={noticeDays}
                    onChangeText={onNoticeDaysChange}
                    placeholder="30"
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    accessibilityLabel="Notice period in days"
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </Labeled>
              </View>

              {/* Facilities Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Facilities
                </Text>
                <View style={styles.facilitiesWrap}>
                  {FACILITY_OPTIONS.map((f) => (
                    <ChipCheckbox
                      key={f}
                      label={f}
                      selected={facilities.includes(f)}
                      onToggle={() => toggleFacility(f)}
                    />
                  ))}
                </View>
              </View>

              {/* Photos Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Property Photos
                </Text>
                <Button
                  mode="outlined"
                  onPress={pickPhotos}
                  icon="image-plus"
                  style={{ borderRadius: radius.lg, borderColor: colors.borderColor }}
                  textColor={colors.textPrimary}
                  accessibilityLabel="Pick images"
                  disabled={isSubmitting}
                >
                  Pick Images
                </Button>

                <View style={styles.photosGrid}>
                  {photos.map((uri) => (
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

              <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

              {/* Footer Buttons */}
              <View style={styles.footerRow}>
                <Button
                  mode="outlined"
                  style={styles.secondaryBtn}
                  textColor={colors.textPrimary}
                  onPress={onCancel}
                  accessibilityLabel="Cancel and go back"
                  accessibilityHint="Discards changes and returns to properties list"
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
                  accessibilityLabel={isEditMode ? "Update property" : "Save property"}
                  accessibilityHint={
                    isEditMode ? "Saves changes to property" : "Creates new property"
                  }
                >
                  {isEditMode ? "Update" : "Save"}
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
