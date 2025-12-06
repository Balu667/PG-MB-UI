// app/protected/rooms/[id].tsx
// Add/Edit Room Screen - Premium design with proper validation
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  I18nManager,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Button,
  Text as PaperText,
  TextInput,
  Portal,
  Dialog,
  Chip,
  Divider,
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useProperty } from "@/src/context/PropertyContext";
import { useGetAllRooms, useInsertRoom, useUpdateRoom, useDeleteRoomImage } from "@/src/hooks/room";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

type LocalImage = { uri: string; name: string; type: string };

// CDN base URL for images
const getExpoFileUrl = (): string => {
  try {
    const extra = (Constants as Record<string, unknown>)?.expoConfig as Record<string, unknown> | undefined;
    return String((extra?.extra as Record<string, unknown>)?.fileUrl || "");
  } catch {
    return "";
  }
};

const FILE_BASES = [
  (process.env.FILE_URL || "").trim(),
  getExpoFileUrl(),
  (process.env.EXPO_PUBLIC_IMAGE_BASE_URL || "").trim(),
  (process.env.EXPO_PUBLIC_FILE_BASE_URL || "").trim(),
]
  .filter(Boolean)
  .map((b) => String(b).replace(/\/+$/, ""));

const CDN_BASE = FILE_BASES[0] || "";

const FLOORS = [
  { name: "Ground Floor", value: 0 },
  { name: "1st Floor", value: 1 },
  { name: "2nd Floor", value: 2 },
  { name: "3rd Floor", value: 3 },
  { name: "4th Floor", value: 4 },
  { name: "5th Floor", value: 5 },
  { name: "6th Floor", value: 6 },
  { name: "7th Floor", value: 7 },
  { name: "8th Floor", value: 8 },
  { name: "9th Floor", value: 9 },
  { name: "10th Floor", value: 10 },
];

const SHARING_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  name: `${i + 1} Sharing`,
  value: i + 1,
}));

const ROOM_FACILITY_OPTIONS = [
  { label: "Washing Machine", value: "washingMachine", icon: "washing-machine" },
  { label: "WiFi", value: "wifi", icon: "wifi" },
  { label: "Hot Water", value: "hotWater", icon: "water-boiler" },
  { label: "Table", value: "table", icon: "desk" },
  { label: "TV", value: "tv", icon: "television" },
  { label: "AC", value: "ac", icon: "air-conditioner" },
  { label: "Fridge", value: "fridge", icon: "fridge" },
  { label: "Gym", value: "gym", icon: "dumbbell" },
];

const ROOM_TYPE_OPTIONS = [
  { label: "Corner Room", value: "Corner Room" },
  { label: "Large Room", value: "Large Room" },
  { label: "Ventilation", value: "Ventilation" },
  { label: "Middle Room", value: "Middle Room" },
  { label: "Hall", value: "Hall" },
];

const num = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;

const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v));

// Format number to Indian currency format (2,34,567)
const formatIndianNumber = (n: string): string => {
  const cleaned = n.replace(/[^0-9]/g, "");
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
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

/** Shape-safe extractor for `useGetAllRooms` responses */
function extractRooms(resp: unknown): Record<string, unknown>[] {
  if (!resp) return [];
  if (resp && typeof resp === "object" && !Array.isArray(resp)) {
    const r = resp as Record<string, unknown>;
    if (Array.isArray(r.data)) {
      const first = (r.data as Record<string, unknown>[])[0];
      if (first && Array.isArray(first.rooms)) return first.rooms as Record<string, unknown>[];
      if (Array.isArray(r.data)) return r.data as Record<string, unknown>[];
    }
    if (Array.isArray(r.rooms)) return r.rooms as Record<string, unknown>[];
  }
  if (Array.isArray(resp)) {
    const first = (resp as Record<string, unknown>[])[0];
    if (first && Array.isArray(first.rooms)) return first.rooms as Record<string, unknown>[];
    return resp as Record<string, unknown>[];
  }
  return [];
}

/** Build absolute URL for image */
function toAbsoluteFileUrl(filePath?: string): string {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return CDN_BASE ? `${CDN_BASE}/${filePath.replace(/^\/+/, "")}` : "";
}

/** Normalize images from API response */
function normalizeImages(
  raw: unknown
): Array<{ filePath: string; url: string; fileName?: string }> {
  const flat = Array.isArray(raw) ? raw.flat(3) : [];
  return flat
    .map((img: unknown) => {
      if (!img || typeof img !== "object") return null;
      const imgObj = img as Record<string, unknown>;
      const filePath = str(imgObj?.filePath);
      const fileName = str(imgObj?.fileName);
      const direct = str(imgObj?.cdnUrl || imgObj?.url);
      const url = direct || toAbsoluteFileUrl(filePath);
      return filePath ? { filePath, url, fileName } : null;
    })
    .filter(Boolean) as Array<{ filePath: string; url: string; fileName?: string }>;
}

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
   SHEET SELECT COMPONENT (Premium Dropdown)
───────────────────────────────────────────────────────────────────────────── */

interface SheetSelectProps {
  value?: number | string;
  options: readonly { name: string; value: number | string }[];
  placeholder: string;
  onChange: (v: number | string) => void;
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

  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption?.name;

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
        <View
          style={{
            backgroundColor: hexToRgba(colors.accent, 0.1),
            borderRadius: radius.md,
            padding: 4,
          }}
        >
          <MaterialIcons
            name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color={colors.accent}
          />
        </View>
      </Pressable>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            marginTop: "auto",
          }}
        >
          <Dialog.Title
            style={{
              color: colors.textPrimary,
              marginBottom: 6,
              fontWeight: "700",
              fontSize: typography.fontSizeLg,
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
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={String(opt.value)}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderBottomWidth: 1,
                      borderColor: hexToRgba(colors.textSecondary, 0.1),
                      minHeight: 52,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: isSelected
                        ? hexToRgba(colors.accent, 0.1)
                        : "transparent",
                      borderRadius: isSelected ? radius.md : 0,
                      marginBottom: 4,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={opt.name}
                    accessibilityState={{ selected: isSelected }}
                    accessible
                  >
                    <PaperText
                      style={{
                        color: colors.textPrimary,
                        fontWeight: isSelected ? "700" : "500",
                        fontSize: typography.fontSizeMd,
                      }}
                    >
                      {opt.name}
                    </PaperText>
                    {isSelected && (
                      <MaterialIcons name="check" size={20} color={colors.accent} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              onPress={() => setOpen(false)}
              textColor={colors.accent}
              style={{ minWidth: 80 }}
            >
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   CHIP CHECKBOX COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const ChipCheckbox: React.FC<{
  label: string;
  selected: boolean;
  onToggle: () => void;
  icon?: string;
}> = ({ label, selected, onToggle, icon }) => {
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
        borderRadius: radius.lg,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: selected ? hexToRgba(colors.accent, 0.14) : colors.cardSurface,
        borderColor: selected ? colors.accent : colors.borderColor,
        borderWidth: 1.5,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={16}
          color={selected ? colors.accent : colors.textSecondary}
        />
      )}
      <PaperText
        style={{
          color: selected ? colors.accent : colors.textPrimary,
          fontSize: typography.fontSizeSm,
          fontWeight: selected ? "700" : "500",
        }}
      >
        {label}
      </PaperText>
      {selected && (
        <MaterialIcons name="check-circle" size={14} color={colors.accent} />
      )}
    </Pressable>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   SEGMENTED CONTROL
───────────────────────────────────────────────────────────────────────────── */

const Segmented: React.FC<{
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ value, options, onChange }) => {
  const { colors, radius, typography, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
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
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: selected ? colors.accent : "transparent",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
            }}
          >
            <PaperText
              style={{
                color: selected ? colors.white : colors.textPrimary,
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
   MAIN SCREEN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function AddEditRoomScreen() {
  const router = useRouter();
  const { id, pid } = useLocalSearchParams<{ id: string; pid?: string }>();
  const isAddMode = String(id) === "add";

  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors, spacing, radius, typography } = useTheme();

  const { selectedId, properties } = useProperty();
  const propertyId = selectedId || pid || "";
  const currentProperty = useMemo(
    () => properties.find((p) => p._id === propertyId),
    [properties, propertyId]
  );

  const {
    data: roomsResp,
    isLoading: roomsLoading,
    refetch: refetchRooms,
  } = useGetAllRooms(propertyId as string);

  const allRooms = useMemo(() => extractRooms(roomsResp), [roomsResp]);

  const currentRoom = useMemo(
    () => (!isAddMode ? allRooms.find((r) => String(r?._id) === String(id)) : null),
    [allRooms, id, isAddMode]
  );

  // ----- Form state -----
  const [roomNumbers, setRoomNumbers] = useState<string[]>([]);
  const [roomNoInput, setRoomNoInput] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [floorValue, setFloorValue] = useState<number>(1);
  const [sharing, setSharing] = useState<number>(1);
  const [amountPerBed, setAmountPerBed] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [electricity, setElectricity] = useState<"Yes" | "No">("Yes");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [newImages, setNewImages] = useState<LocalImage[]>([]);
  const [deletingImagePath, setDeletingImagePath] = useState<string | null>(null);

  const existingImages = useMemo(
    () => normalizeImages(currentRoom?.images),
    [currentRoom?.images]
  );

  // Track initial values for dirty check
  const initialValuesSet = useRef(false);

  // ----- Prefill edit mode -----
  useEffect(() => {
    if (!isAddMode && currentRoom && !initialValuesSet.current) {
      setRoomNo(str(currentRoom.roomNo ?? currentRoom.roomNumber ?? ""));
      setFloorValue(num(currentRoom.floor, 1));
      setSharing(num(currentRoom.beds, 1));
      setAmountPerBed(
        currentRoom.bedPrice != null ? String(num(currentRoom.bedPrice, 0)) : ""
      );
      setSecurityDeposit(
        currentRoom.securityDeposit != null ? String(num(currentRoom.securityDeposit, 0)) : ""
      );
      const e =
        str(currentRoom.electricityBillInclude ?? "yes").toLowerCase() === "no" ? "No" : "Yes";
      setElectricity(e as "Yes" | "No");
      setSelectedFacilities(
        Array.isArray(currentRoom.facilities) ? (currentRoom.facilities as string[]) : []
      );
      setSelectedRoomTypes(
        Array.isArray(currentRoom.roomType) ? (currentRoom.roomType as string[]) : []
      );
      setRemarks(str(currentRoom.remarks ?? ""));
      initialValuesSet.current = true;
    }
  }, [isAddMode, currentRoom]);

  // ----- Mutations -----
  const goToRoomsTab = useCallback(() => {
    try {
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey.some((k) => typeof k === "string" && /room/i.test(k as string)),
      });
    } catch {
      // ignore
    }

    if (propertyId) {
      router.replace({
        pathname: `/protected/property/${propertyId}`,
        params: { tab: "Rooms", refresh: String(Date.now()) },
      });
    } else {
      router.replace("/protected/(tabs)/Properties");
    }
  }, [queryClient, propertyId, router]);

  const onCreateSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Rooms created successfully!", [
      { text: "OK", onPress: goToRoomsTab },
    ]);
  }, [goToRoomsTab]);

  const onUpdateSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Room updated successfully!", [
      { text: "OK", onPress: goToRoomsTab },
    ]);
  }, [goToRoomsTab]);

  const onMutationError = useCallback((error: unknown) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    let msg = "Something went wrong. Please try again.";

    if (error && typeof error === "object") {
      const err = error as Record<string, unknown>;
      const data = (err?.response as Record<string, unknown>)?.data ?? err?.data ?? err;
      if (data && typeof data === "object") {
        const dataObj = data as Record<string, unknown>;
        msg = String(dataObj.errorMessage || dataObj.message || msg);
      } else if (typeof data === "string") {
        msg = data;
      } else if (typeof err?.message === "string") {
        msg = err.message;
      }
    } else if (error instanceof Error) {
      msg = error.message || msg;
    }

    Alert.alert("Error", msg, [{ text: "OK" }]);
  }, []);

  const { mutate: insertRoom, isPending: creating } = useInsertRoom(onCreateSuccess);
  const { mutate: updateRoom, isPending: updating } = useUpdateRoom(onUpdateSuccess);
  const { mutate: deleteRoomImage, isPending: deleting } = useDeleteRoomImage(() => {
    setDeletingImagePath(null);
    refetchRooms();
  });

  // Handle API errors
  useEffect(() => {
    // This is handled in onMutationError now
  }, []);

  const saving = creating || updating;

  // ----- Handlers -----
  const toggleInArray = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const addRoomNumberChip = () => {
    const value = roomNoInput.trim();
    if (!value) return;
    if (!roomNumbers.includes(value)) {
      setRoomNumbers((prev) => [...prev, value]);
    }
    setRoomNoInput("");
  };

  const onAmountPerBedChange = useCallback((text: string) => {
    const digitsOnly = parseFormattedNumber(text).slice(0, 8);
    setAmountPerBed(digitsOnly);
  }, []);

  const onSecurityDepositChange = useCallback((text: string) => {
    const digitsOnly = parseFormattedNumber(text).slice(0, 8);
    setSecurityDeposit(digitsOnly);
  }, []);

  // Formatted amounts for display
  const displayAmountPerBed = useMemo(
    () => (amountPerBed ? formatIndianNumber(amountPerBed) : ""),
    [amountPerBed]
  );

  const displaySecurityDeposit = useMemo(
    () => (securityDeposit ? formatIndianNumber(securityDeposit) : ""),
    [securityDeposit]
  );

  const pickImages = async () => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Permission needed",
            "Please allow photo access to pick images.",
            [{ text: "OK" }]
          );
          return;
        }
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        selectionLimit: 0,
        // Note: MediaTypeOptions is deprecated in newer expo-image-picker versions
        // The MediaType enum may not be available in the current installed version
        // This warning can be safely ignored - functionality is not affected
        // TODO: Update to use MediaType when expo-image-picker is updated
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - MediaTypeOptions is deprecated but still works
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (res.canceled) return;

      const picked: LocalImage[] = res.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName || `room_${Date.now()}.jpg`,
        type: a.mimeType || "image/jpeg",
      }));

      setNewImages((prev) => [...prev, ...picked]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Could not open gallery. Please try again.", [{ text: "OK" }]);
    }
  };

  const removeNewImage = (uri: string) =>
    setNewImages((prev) => prev.filter((i) => i.uri !== uri));

  const handleDeleteExistingImage = (filePath: string) => {
    if (!filePath || !id) return;

    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setDeletingImagePath(filePath);
            deleteRoomImage({
              payload: { filePath },
              roomId: String(id),
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const buildCreateFormData = () => {
    const fd = new FormData();
    if (propertyId) fd.append("propertyId", propertyId);

    roomNumbers.forEach((rn) => {
      fd.append("roomNumber", rn);
    });

    fd.append("floor", String(floorValue));
    fd.append("beds", String(sharing));
    fd.append("bedPrice", String(num(amountPerBed)));
    fd.append("securityDeposit", String(num(securityDeposit)));
    fd.append("electricityBillInclude", electricity.toLowerCase());

    selectedFacilities.forEach((f) => fd.append("facilities", f));
    selectedRoomTypes.forEach((t) => fd.append("roomType", t));
    if (remarks.trim()) fd.append("remarks", remarks.trim());

    newImages.forEach((img) => {
      // @ts-ignore React Native file
      fd.append("images", { uri: img.uri, name: img.name, type: img.type });
    });

    return fd;
  };

  const buildUpdateFormData = () => {
    const fd = new FormData();
    if (propertyId) fd.append("propertyId", propertyId);
    fd.append("roomNo", roomNo.trim());
    fd.append("floor", String(floorValue));
    fd.append("beds", String(sharing));
    fd.append("bedPrice", String(num(amountPerBed)));
    fd.append("securityDeposit", String(num(securityDeposit)));
    fd.append("electricityBillInclude", electricity.toLowerCase());

    selectedFacilities.forEach((f) => fd.append("facilities", f));
    selectedRoomTypes.forEach((t) => fd.append("roomType", t));
    if (remarks.trim()) fd.append("remarks", remarks.trim());

    newImages.forEach((img) => {
      // @ts-ignore React Native file
      fd.append("images", { uri: img.uri, name: img.name, type: img.type });
    });

    return fd;
  };

  const validate = (): string[] => {
    const errs: string[] = [];

    if (!propertyId) {
      errs.push("• Please select a property first.");
    }

    if (isAddMode) {
      if (roomNumbers.length === 0) {
        errs.push("• Add at least one room number.");
      }
    } else {
      if (!roomNo.trim()) {
        errs.push("• Room number is required.");
      }
    }

    if (!amountPerBed.trim()) {
      errs.push("• Amount per bed is required.");
    } else {
      const amt = num(amountPerBed);
      if (amt <= 0) {
        errs.push("• Amount per bed must be greater than 0.");
      } else if (amt > 99999999) {
        errs.push("• Amount per bed cannot exceed ₹9,99,99,999.");
      }
    }

    if (!securityDeposit.trim()) {
      errs.push("• Security deposit is required.");
    } else {
      const dep = num(securityDeposit);
      if (dep < 0) {
        errs.push("• Security deposit cannot be negative.");
      } else if (dep > 99999999) {
        errs.push("• Security deposit cannot exceed ₹9,99,99,999.");
      }
    }

    return errs;
  };

  const onSubmit = () => {
    const errs = validate();
    if (errs.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Validation Error", errs.join("\n"), [{ text: "OK" }], {
        cancelable: true,
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      if (isAddMode) {
        const fd = buildCreateFormData();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        insertRoom(fd as any, {
          onError: onMutationError,
        });
      } else {
        const fd = buildUpdateFormData();
        updateRoom(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { formData: fd as any, roomId: String(id) },
          { onError: onMutationError }
        );
      }
    } catch (error) {
      onMutationError(error);
    }
  };

  const handleBackOrCancel = () => {
    goToRoomsTab();
  };

  // Hardware back → go to Rooms tab
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBackOrCancel();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─────────────────────────────────────────────────────────────────────────────
     STYLES
  ───────────────────────────────────────────────────────────────────────────── */

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
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
        row: {
          flexDirection: "row",
          gap: spacing.md,
        },
        col: {
          flex: 1,
        },
        chipRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: 6,
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
        photosGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginTop: spacing.sm,
        },
        thumbWrap: {
          width: 100,
          height: 100,
          borderRadius: radius.md,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.18),
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        thumb: {
          width: "100%",
          height: "100%",
        },
        noPreview: {
          alignItems: "center",
          justifyContent: "center",
          padding: 8,
        },
        noPreviewText: {
          color: colors.textMuted,
          fontSize: 10,
          textAlign: "center",
          marginTop: 4,
        },
        removeBadge: {
          position: "absolute",
          right: 4,
          top: 4,
          backgroundColor: hexToRgba(colors.error, 0.95),
          borderRadius: radius.full,
          width: 24,
          height: 24,
          alignItems: "center",
          justifyContent: "center",
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
      }),
    [colors, spacing, radius, typography]
  );

  const headerTitle = isAddMode ? "Add Rooms" : "Edit Room";
  const headerSubtitle = isAddMode
    ? "Create one or more rooms"
    : str(currentRoom?.roomNo ?? currentRoom?.roomNumber ?? "", "");

  // ----- Loading state for edit -----
  if (!isAddMode && roomsLoading && !currentRoom) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <PaperText style={{ color: colors.textSecondary, marginTop: 12 }}>
            Loading room details...
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
            onPress={handleBackOrCancel}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            android_ripple={{ color: hexToRgba(colors.textSecondary, 0.2), borderless: true }}
          >
            <MaterialIcons
              name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <PaperText style={styles.headerTitle} numberOfLines={1}>
              {headerTitle}
            </PaperText>
            {!!headerSubtitle && (
              <PaperText style={styles.headerSubtitle} numberOfLines={1}>
                {headerSubtitle}
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
              {/* Basic Details Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Basic Details</Text>

                {/* Property (read only) */}
                <Labeled label="Property">
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: colors.borderColor,
                      borderRadius: radius.lg,
                      backgroundColor: colors.surface,
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                      opacity: 0.7,
                      minHeight: 55,
                      justifyContent: "center",
                    }}
                  >
                    <PaperText style={{ color: colors.textPrimary }}>
                      {str(currentProperty?.propertyName ?? "", "Select property")}
                    </PaperText>
                  </View>
                </Labeled>

                {/* Room number(s) */}
                {isAddMode ? (
                  <Labeled label="Room Numbers" required>
                    <View style={styles.row}>
                      <View style={styles.col}>
                        <TextInput
                          value={roomNoInput}
                          onChangeText={setRoomNoInput}
                          mode="outlined"
                          placeholder="Enter room number"
                          outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                          activeOutlineColor={colors.accent}
                          style={styles.input}
                          textColor={colors.textPrimary}
                          placeholderTextColor={colors.textMuted}
                          contentStyle={{ minHeight: 48, padding: spacing.sm }}
                          theme={{ roundness: radius.lg }}
                          accessibilityLabel="Room number input"
                        />
                      </View>
                      <Button
                        mode="contained"
                        onPress={addRoomNumberChip}
                        style={{ alignSelf: "center", minWidth: 60 }}
                        disabled={!roomNoInput.trim()}
                      >
                        Add
                      </Button>
                    </View>
                    {roomNumbers.length > 0 && (
                      <View style={styles.chipRow}>
                        {roomNumbers.map((rn) => (
                          <Chip
                            key={rn}
                            onClose={() => setRoomNumbers((prev) => prev.filter((x) => x !== rn))}
                            style={{ marginRight: 6, marginTop: 6 }}
                            textStyle={{ fontWeight: "600" }}
                          >
                            {rn}
                          </Chip>
                        ))}
                      </View>
                    )}
                  </Labeled>
                ) : (
                  <Labeled label="Room Number" required>
                    <TextInput
                      value={roomNo}
                      onChangeText={setRoomNo}
                      mode="outlined"
                      placeholder="e.g., 210"
                      outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                      activeOutlineColor={colors.accent}
                      style={styles.input}
                      textColor={colors.textPrimary}
                      placeholderTextColor={colors.textMuted}
                      contentStyle={{ minHeight: 48, padding: spacing.sm }}
                      theme={{ roundness: radius.lg }}
                      accessibilityLabel="Room number"
                    />
                  </Labeled>
                )}

                {/* Floor + Sharing */}
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Labeled label="Floor" required>
                      <SheetSelect
                        value={floorValue}
                        placeholder="Select floor"
                        options={FLOORS}
                        onChange={(v) => setFloorValue(v as number)}
                      />
                    </Labeled>
                  </View>
                  <View style={styles.col}>
                    <Labeled label="Sharing Type" required>
                      <SheetSelect
                        value={sharing}
                        placeholder="Select sharing"
                        options={SHARING_OPTIONS}
                        onChange={(v) => setSharing(v as number)}
                      />
                    </Labeled>
                  </View>
                </View>
              </View>

              {/* Pricing Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Pricing</Text>

                {/* Amount per bed */}
                <Labeled label="Amount per Bed" required>
                  <View style={styles.amountRow}>
                    <View style={styles.currencyPrefix}>
                      <Text style={styles.currencyText}>₹</Text>
                    </View>
                    <View style={styles.amountInputWrap}>
                      <TextInput
                        value={displayAmountPerBed}
                        onChangeText={onAmountPerBedChange}
                        mode="outlined"
                        placeholder="e.g., 5,000"
                        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={{ minHeight: 48, padding: spacing.sm }}
                        theme={{ roundness: radius.lg }}
                        accessibilityLabel="Amount per bed"
                        accessibilityHint="Enter the rent amount per bed"
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                    </View>
                  </View>
                </Labeled>

                {/* Security deposit */}
                <Labeled label="Security Deposit" required>
                  <View style={styles.amountRow}>
                    <View style={styles.currencyPrefix}>
                      <Text style={styles.currencyText}>₹</Text>
                    </View>
                    <View style={styles.amountInputWrap}>
                      <TextInput
                        value={displaySecurityDeposit}
                        onChangeText={onSecurityDepositChange}
                        mode="outlined"
                        placeholder="e.g., 7,000"
                        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={{ minHeight: 48, padding: spacing.sm }}
                        theme={{ roundness: radius.lg }}
                        accessibilityLabel="Security deposit"
                        accessibilityHint="Enter the security deposit amount"
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                    </View>
                  </View>
                </Labeled>

                {/* Electricity */}
                <Labeled label="Electricity Bill Included">
                  <Segmented
                    value={electricity}
                    options={["Yes", "No"]}
                    onChange={(v) => setElectricity(v as "Yes" | "No")}
                  />
                </Labeled>
              </View>

              {/* Facilities Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Facilities</Text>
                <View style={styles.chipRow}>
                  {ROOM_FACILITY_OPTIONS.map((f) => {
                    const selected = selectedFacilities.includes(f.value);
                    return (
                      <ChipCheckbox
                        key={f.value}
                        label={f.label}
                        icon={f.icon}
                        selected={selected}
                        onToggle={() =>
                          setSelectedFacilities((prev) => toggleInArray(prev, f.value))
                        }
                      />
                    );
                  })}
                </View>
              </View>

              {/* Room Type Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Room Type</Text>
                <View style={styles.chipRow}>
                  {ROOM_TYPE_OPTIONS.map((rt) => {
                    const selected = selectedRoomTypes.includes(rt.value);
                    return (
                      <ChipCheckbox
                        key={rt.value}
                        label={rt.label}
                        selected={selected}
                        onToggle={() =>
                          setSelectedRoomTypes((prev) => toggleInArray(prev, rt.value))
                        }
                      />
                    );
                  })}
                </View>
              </View>

              {/* Remarks Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Remarks</Text>
                <Labeled label="Room Remarks (optional)">
                  <TextInput
                    value={remarks}
                    onChangeText={setRemarks}
                    mode="outlined"
                    placeholder="Add any notes for this room"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    contentStyle={{
                      minHeight: 80,
                      textAlignVertical: "top",
                      paddingVertical: 8,
                    }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Room remarks"
                  />
                </Labeled>
              </View>

              {/* Photos Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Room Photos</Text>

                <Button
                  mode="outlined"
                  onPress={pickImages}
                  style={{
                    borderRadius: radius.lg,
                    minHeight: 48,
                    justifyContent: "center",
                    borderColor: colors.borderColor,
                  }}
                  textColor={colors.textPrimary}
                  disabled={saving}
                  icon="camera"
                >
                  Add Photos
                </Button>

                {/* Existing images (edit mode) */}
                {!isAddMode && existingImages.length > 0 && (
                  <>
                    <PaperText
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        marginTop: spacing.md,
                        marginBottom: 4,
                      }}
                    >
                      Existing Photos
                    </PaperText>
                    <View style={styles.photosGrid}>
                      {existingImages.map((img, index) => {
                        const isDeleting = deleting && deletingImagePath === img.filePath;
                        return (
                          <View key={`${img.filePath}-${index}`} style={styles.thumbWrap}>
                            {img.url ? (
                              <Image
                                source={{ uri: img.url }}
                                style={styles.thumb}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.noPreview}>
                                <MaterialCommunityIcons
                                  name="image-off"
                                  size={24}
                                  color={colors.textMuted}
                                />
                                <Text style={styles.noPreviewText} numberOfLines={2}>
                                  {img.fileName || "No preview"}
                                </Text>
                              </View>
                            )}
                            <Pressable
                              onPress={() => handleDeleteExistingImage(img.filePath)}
                              disabled={isDeleting}
                              style={styles.removeBadge}
                              accessibilityLabel="Delete photo"
                            >
                              {isDeleting ? (
                                <ActivityIndicator size="small" color={colors.white} />
                              ) : (
                                <MaterialIcons name="close" size={16} color={colors.white} />
                              )}
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* New images */}
                {newImages.length > 0 && (
                  <>
                    <PaperText
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        marginTop: spacing.md,
                        marginBottom: 4,
                      }}
                    >
                      New Photos
                    </PaperText>
                    <View style={styles.photosGrid}>
                      {newImages.map((img) => (
                        <View key={img.uri} style={styles.thumbWrap}>
                          <Image
                            source={{ uri: img.uri }}
                            style={styles.thumb}
                            resizeMode="cover"
                          />
                          <Pressable
                            onPress={() => removeNewImage(img.uri)}
                            style={styles.removeBadge}
                            accessibilityLabel="Remove photo"
                          >
                            <MaterialIcons name="close" size={16} color={colors.white} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>

              <Divider
                style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }}
              />

              {/* Footer buttons */}
              <View style={styles.footerRow}>
                <Button
                  mode="outlined"
                  style={styles.secondaryBtn}
                  textColor={colors.textPrimary}
                  onPress={handleBackOrCancel}
                  disabled={saving}
                  accessibilityLabel="Cancel and go back"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  style={styles.primaryBtn}
                  onPress={onSubmit}
                  disabled={saving}
                  loading={saving}
                  accessibilityLabel={isAddMode ? "Create rooms" : "Update room"}
                >
                  {isAddMode ? "Create" : "Update"}
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
