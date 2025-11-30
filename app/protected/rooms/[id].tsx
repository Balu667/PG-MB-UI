// app/protected/rooms/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button, Text as PaperText, TextInput, Portal, Dialog, Chip } from "react-native-paper";
import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useProperty } from "@/src/context/PropertyContext";
import { useGetAllRooms, useInsertRoom, useUpdateRoom, useDeleteRoomImage } from "@/src/hooks/room";

/* ------------ Types & helpers ------------ */

type LocalImage = { uri: string; name: string; type: string };

// Optional: if you have a CDN domain to serve images by filePath, set it in app config/env.
// Example (Expo): add EXPO_PUBLIC_CDN_BASE="https://cdn.example.com"
// If not set, we still show filename + a neutral placeholder box.
const CDN_BASE = process.env.EXPO_PUBLIC_CDN_BASE || "";

const FLOORS = [
  { name: "G Floor", value: 0 },
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
  { label: "Washing machine", value: "washingMachine" },
  { label: "Wifi", value: "wifi" },
  { label: "Hot water", value: "hotWater" },
  { label: "Table", value: "table" },
  { label: "TV", value: "tv" },
  { label: "AC", value: "ac" },
  { label: "Fridge", value: "fridge" },
  { label: "Gym", value: "gym" },
];

const ROOM_TYPE_OPTIONS = [
  { label: "Corner Room", value: "Corner Room" },
  { label: "Large Room", value: "Large Room" },
  { label: "Ventilation", value: "Ventilation" },
  { label: "Middle Room", value: "Middle Room" },
  { label: "Hall", value: "Hall" },
];

const num = (v: any, fallback = 0) =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;

const str = (v: any, fallback = "") => (v == null ? fallback : String(v));

/** Shape-safe extractor for `useGetAllRooms` responses */
function extractRooms(resp: any): any[] {
  if (!resp) return [];
  // If hook returned the whole API object
  if (resp && typeof resp === "object" && !Array.isArray(resp)) {
    // API style: { data: [ { rooms: [...] } ] }
    if (Array.isArray(resp.data)) {
      const first = resp.data[0];
      if (first && Array.isArray(first.rooms)) return first.rooms;
      // Some backends return data directly as an array of rooms
      if (Array.isArray(resp.data)) return resp.data;
    }
    // Or directly { rooms: [...] }
    if (Array.isArray(resp.rooms)) return resp.rooms;
  }
  // If hook returns already the inner array
  if (Array.isArray(resp)) {
    const first = resp[0];
    if (first && Array.isArray(first.rooms)) return first.rooms;
    return resp;
  }
  return [];
}

/** Flatten/normalize images; build a `url` if you have CDN_BASE */
function normalizeImages(raw: any): Array<{ filePath: string; url: string; fileName?: string }> {
  const flat = Array.isArray(raw) ? raw.flat(3) : [];
  return flat
    .map((img: any) => {
      const filePath = str(img?.filePath);
      const fileName = str(img?.fileName);
      const direct = str(img?.cdnUrl || img?.url);
      const url = direct || (CDN_BASE && filePath ? `${CDN_BASE}/${filePath}` : "");
      return filePath ? { filePath, url, fileName } : null;
    })
    .filter(Boolean) as Array<{ filePath: string; url: string; fileName?: string }>;
}

/* ------------ Small shared UI components (kept as-is) ------------ */

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

const SheetSelect: React.FC<{
  value?: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
}> = ({ value, options, placeholder, onChange }) => {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);

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
          style={{ color: value ? colors.textPrimary : colors.textMuted }}
          numberOfLines={1}
        >
          {value || placeholder}
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
              {options.length === 0 ? (
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

/* ------------ Screen ------------ */

export default function AddEditRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAddMode = String(id) === "add";

  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();
  const queryClient = useQueryClient();

  const { selectedId, properties } = useProperty();
  const propertyId = selectedId as string | undefined;
  const currentProperty = useMemo(
    () => properties.find((p) => p._id === propertyId),
    [properties, propertyId]
  );

  const {
    data: roomsResp,
    isLoading: roomsLoading,
    refetch: refetchRooms,
  } = useGetAllRooms(propertyId as string);

  // ✅ Shape-safe extraction for all room rows
  const allRooms: any[] = useMemo(() => extractRooms(roomsResp), [roomsResp]);

  // ✅ Find the current room by route id (edit mode)
  const currentRoom = useMemo(
    () => (!isAddMode ? allRooms.find((r) => String(r?._id) === String(id)) : null),
    [allRooms, id, isAddMode]
  );

  // ----- Form state -----

  // Add mode: multiple room numbers
  const [roomNumbers, setRoomNumbers] = useState<string[]>([]);
  const [roomNoInput, setRoomNoInput] = useState("");

  // Edit mode: single room number text field
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

  // ✅ Normalize existing images (works with nested arrays)
  const existingImages = useMemo(() => normalizeImages(currentRoom?.images), [currentRoom?.images]);

  // ----- Prefill edit mode -----
  useEffect(() => {
    if (!isAddMode && currentRoom) {
      setRoomNo(str(currentRoom.roomNo ?? currentRoom.roomNumber ?? ""));
      setFloorValue(num(currentRoom.floor, 1));
      setSharing(num(currentRoom.beds, 1));
      setAmountPerBed(currentRoom.bedPrice != null ? String(num(currentRoom.bedPrice, 0)) : "");
      setSecurityDeposit(
        currentRoom.securityDeposit != null ? String(num(currentRoom.securityDeposit, 0)) : ""
      );
      const e =
        str(currentRoom.electricityBillInclude ?? "yes").toLowerCase() === "no" ? "No" : "Yes";
      setElectricity(e as "Yes" | "No");
      setSelectedFacilities(Array.isArray(currentRoom.facilities) ? currentRoom.facilities : []);
      setSelectedRoomTypes(Array.isArray(currentRoom.roomType) ? currentRoom.roomType : []);
      setRemarks(str(currentRoom.remarks ?? ""));
    }
  }, [isAddMode, currentRoom]);

  // ----- Mutations -----
  const goToRoomsTab = () => {
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
        params: { tab: "Rooms" },
      });
    } else {
      router.replace("/protected/(tabs)/Properties");
    }
  };

  const onCreateSuccess = () => {
    Toast.show({
      type: "success",
      text1: "Rooms created successfully",
      position: "bottom",
    });
    goToRoomsTab();
  };

  const onUpdateSuccess = () => {
    Toast.show({
      type: "success",
      text1: "Room updated successfully",
      position: "bottom",
    });
    goToRoomsTab();
  };

  const {
    mutate: insertRoom,
    isPending: creating,
    error: createError,
  } = useInsertRoom(onCreateSuccess);

  const {
    mutate: updateRoom,
    isPending: updating,
    error: updateError,
  } = useUpdateRoom(onUpdateSuccess);

  const { mutate: deleteRoomImage, isPending: deleting } = useDeleteRoomImage(() => {
    setDeletingImagePath(null);
    refetchRooms();
  });

  const saving = creating || updating;

  // ---- API error handling ----
  useEffect(() => {
    const err: any = createError || updateError;
    if (!err) return;

    let msg = "Something went wrong. Please try again.";

    const data = err?.response?.data ?? err?.data ?? err;
    if (data && typeof data === "object") {
      msg = data.errorMessage || data.message || msg;
    } else if (typeof data === "string") {
      msg = data;
    } else if (typeof err?.message === "string") {
      msg = err.message;
    }

    Toast.show({ type: "error", text1: msg, position: "bottom" });
  }, [createError, updateError]);

  // ----- Helpers -----
  const onlyDigits = (v: string) => v.replace(/[^\d]/g, "").slice(0, 10);

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

  const pickImages = async () => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Toast.show({
            type: "error",
            text1: "Permission needed",
            text2: "Please allow photo access to pick images.",
            position: "bottom",
          });
          return;
        }
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        selectionLimit: 0,
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
      Toast.show({
        type: "error",
        text1: "Could not open gallery",
        text2: "Please try again.",
        position: "bottom",
      });
    }
  };

  const removeNewImage = (uri: string) => setNewImages((prev) => prev.filter((i) => i.uri !== uri));

  const handleDeleteExistingImage = (filePath: string) => {
    if (!filePath || !id) return;
    setDeletingImagePath(filePath);
    deleteRoomImage({
      payload: { filePath },
      roomId: String(id),
    });
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

  const validateCreate = (): string | null => {
    if (!propertyId) return "Please select a property first.";
    if (roomNumbers.length === 0) return "Add at least one room number.";
    if (!amountPerBed.trim()) return "Enter amount per bed.";
    if (!securityDeposit.trim()) return "Enter security deposit.";
    return null;
  };

  const validateUpdate = (): string | null => {
    if (!propertyId) return "Please select a property first.";
    if (!roomNo.trim()) return "Enter room number.";
    if (!amountPerBed.trim()) return "Enter amount per bed.";
    if (!securityDeposit.trim()) return "Enter security deposit.";
    return null;
  };

  const onSubmit = () => {
    const error = isAddMode ? validateCreate() : validateUpdate();
    if (error) {
      Toast.show({ type: "error", text1: error, position: "bottom" });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isAddMode) {
      const fd = buildCreateFormData();
      insertRoom(fd as any);
    } else {
      const fd = buildUpdateFormData();
      updateRoom({ formData: fd as any, roomId: String(id) });
    }
  };

  const handleBackOrCancel = () => {
    goToRoomsTab();
  };

  // Hardware back → go to Rooms tab
  useEffect(
    () => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBackOrCancel();
        return true;
      });
      return () => sub.remove();
    },
    [
      /* eslint-disable-line react-hooks/exhaustive-deps */
    ]
  );

  /* ------------ Styles ------------ */

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
        body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
        label: {
          color: colors.textSecondary,
          fontWeight: "600",
          marginBottom: 6,
        },
        disabledInput: {
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          padding: 14,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderColor,
        },
        sectionTitle: {
          color: colors.textSecondary,
          fontWeight: "700",
          marginTop: spacing.lg,
          marginBottom: 8,
          letterSpacing: 0.2,
        },
        fieldBlock: {
          marginBottom: spacing.md,
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
        groupBox: {
          borderWidth: 1,
          borderColor: colors.borderColor,
          borderRadius: radius.xl,
          padding: spacing.md,
          backgroundColor: colors.cardBackground,
          marginTop: spacing.sm,
        },
        groupTitle: {
          color: colors.textPrimary,
          fontSize: 16,
          fontWeight: "700",
          marginBottom: 6,
        },
        photosRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginTop: spacing.sm,
        },
        thumbWrap: {
          width: 90,
          height: 90,
          borderRadius: radius.md,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.18),
          backgroundColor: hexToRgba(colors.textSecondary, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        thumb: {
          width: "100%",
          height: "100%",
        },
        thumbAction: {
          marginTop: 6,
          alignSelf: "center",
          borderRadius: radius.lg,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        thumbActionText: {
          fontSize: 12,
          fontWeight: "600",
        },
        footerRow: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.lg,
          marginBottom: insets.bottom + 12,
        },
        secondaryBtn: {
          flex: 1,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderColor,
          minHeight: 44,
          justifyContent: "center",
        },
        primaryBtn: {
          flex: 1,
          borderRadius: radius.lg,
          minHeight: 44,
          justifyContent: "center",
        },
      }),
    [colors, radius, spacing, typography, insets.bottom]
  );

  const headerTitle = isAddMode ? "Add Rooms" : "Edit Room";
  const headerSubtitle = isAddMode
    ? "Create one or more rooms for this property"
    : str(currentRoom?.roomNo ?? currentRoom?.roomNumber ?? "", "");

  const inputContent = { minHeight: 44, paddingVertical: 8 };

  const floorLabel = FLOORS.find((f) => f.value === floorValue)?.name ?? "Select floor";
  const sharingLabel = SHARING_OPTIONS.find((s) => s.value === sharing)?.name ?? "Select sharing";

  // ----- Loading state for edit -----
  if (!isAddMode && roomsLoading && !currentRoom) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={handleBackOrCancel}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          android_ripple={{ color: hexToRgba(colors.textSecondary, 0.2), borderless: true }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Property (read only) */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Property</Text>
            <RNTextInput
              editable={false}
              value={str(currentProperty?.propertyName ?? "", "Select property")}
              style={styles.disabledInput}
            />
          </View>

          {/* Room number(s) */}
          {isAddMode ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Room numbers</Text>
              <View style={styles.row}>
                <View style={styles.col}>
                  <TextInput
                    value={roomNoInput}
                    onChangeText={setRoomNoInput}
                    mode="outlined"
                    placeholder="Enter room number"
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={{ backgroundColor: colors.cardSurface }}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={inputContent}
                  />
                </View>
                <Button
                  mode="contained"
                  onPress={addRoomNumberChip}
                  style={{ alignSelf: "center" }}
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
                    >
                      {rn}
                    </Chip>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Room number</Text>
              <TextInput
                value={roomNo}
                onChangeText={setRoomNo}
                mode="outlined"
                placeholder="e.g., 210"
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                contentStyle={inputContent}
              />
            </View>
          )}

          {/* Floor + Sharing */}
          <View style={[styles.fieldBlock, styles.row]}>
            <View style={styles.col}>
              <Text style={styles.label}>Select floor</Text>
              <SheetSelect
                value={floorLabel}
                placeholder="Select floor"
                options={FLOORS.map((f) => f.name)}
                onChange={(name) => {
                  const f = FLOORS.find((fl) => fl.name === name);
                  setFloorValue(f?.value ?? 1);
                }}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Select sharing</Text>
              <SheetSelect
                value={sharingLabel}
                placeholder="Select sharing"
                options={SHARING_OPTIONS.map((s) => s.name)}
                onChange={(name) => {
                  const s = SHARING_OPTIONS.find((sh) => sh.name === name);
                  setSharing(s?.value ?? 1);
                }}
              />
            </View>
          </View>

          {/* Amounts */}
          <View style={[styles.fieldBlock, styles.row]}>
            <View style={styles.col}>
              <Text style={styles.label}>Amount per bed</Text>
              <TextInput
                value={amountPerBed}
                onChangeText={(t) => setAmountPerBed(onlyDigits(t))}
                mode="outlined"
                placeholder="e.g., 5000"
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                left={<TextInput.Affix text="₹" />}
                contentStyle={inputContent}
              />
            </View>
            {/* ✅ FIX: equal width by using style={styles.col} (RN), not className */}
            <View style={styles.col}>
              <Text style={styles.label}>Security deposit</Text>
              <TextInput
                value={securityDeposit}
                onChangeText={(t) => setSecurityDeposit(onlyDigits(t))}
                mode="outlined"
                placeholder="e.g., 7000"
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface }}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
                left={<TextInput.Affix text="₹" />}
                contentStyle={inputContent}
              />
            </View>
          </View>

          {/* Electricity */}
          <View style={styles.groupBox}>
            <Text style={styles.groupTitle}>Electricity</Text>
            <Segmented
              value={electricity}
              options={["Yes", "No"]}
              onChange={(v) => setElectricity(v as "Yes" | "No")}
            />
          </View>

          {/* Facilities */}
          <View style={styles.groupBox}>
            <Text style={styles.groupTitle}>Room facilities</Text>
            <View style={styles.chipRow}>
              {ROOM_FACILITY_OPTIONS.map((f) => {
                const selected = selectedFacilities.includes(f.value);
                return (
                  <ChipCheckbox
                    key={f.value}
                    label={f.label}
                    selected={selected}
                    onToggle={() => setSelectedFacilities((prev) => toggleInArray(prev, f.value))}
                  />
                );
              })}
            </View>
          </View>

          {/* Room type */}
          <View style={styles.groupBox}>
            <Text style={styles.groupTitle}>Room type</Text>
            <View style={styles.chipRow}>
              {ROOM_TYPE_OPTIONS.map((rt) => {
                const selected = selectedRoomTypes.includes(rt.value);
                return (
                  <ChipCheckbox
                    key={rt.value}
                    label={rt.label}
                    selected={selected}
                    onToggle={() => setSelectedRoomTypes((prev) => toggleInArray(prev, rt.value))}
                  />
                );
              })}
            </View>
          </View>

          {/* Remarks */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Room remarks</Text>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              mode="outlined"
              placeholder="Add any notes for this room"
              outlineColor={hexToRgba(colors.textSecondary, 0.22)}
              activeOutlineColor={colors.accent}
              style={{ backgroundColor: colors.cardSurface }}
              textColor={colors.textPrimary}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              contentStyle={{ minHeight: 80, textAlignVertical: "top", paddingVertical: 8 }}
            />
          </View>

          {/* Photos */}
          <View style={styles.groupBox}>
            <Text style={styles.groupTitle}>Room photos</Text>

            {/* Existing images (edit mode) */}
            {!isAddMode && existingImages.length > 0 && (
              <View style={styles.photosRow}>
                {existingImages.map((img, index) => {
                  const label =
                    deleting && deletingImagePath === img.filePath ? "Deleting..." : "Delete";
                  const canPreview = !!img.url;
                  return (
                    <View key={`${img.filePath}-${index}`} style={{ alignItems: "center" }}>
                      <View style={styles.thumbWrap}>
                        {canPreview ? (
                          <Image source={{ uri: img.url }} style={styles.thumb} />
                        ) : (
                          <Text style={{ color: colors.textMuted, fontSize: 11, padding: 6 }}>
                            {img.fileName || "No preview"}
                          </Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => handleDeleteExistingImage(img.filePath)}
                        disabled={deleting}
                        style={[
                          styles.thumbAction,
                          { backgroundColor: hexToRgba(colors.error, 0.16) },
                        ]}
                      >
                        <Text style={[styles.thumbActionText, { color: colors.error }]}>
                          {label}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* New images */}
            {newImages.length > 0 && (
              <View style={styles.photosRow}>
                {newImages.map((img) => (
                  <View key={img.uri} style={{ alignItems: "center" }}>
                    <View style={styles.thumbWrap}>
                      <Image source={{ uri: img.uri }} style={styles.thumb} />
                    </View>
                    <Pressable
                      onPress={() => removeNewImage(img.uri)}
                      style={[
                        styles.thumbAction,
                        { backgroundColor: hexToRgba(colors.filledBeds, 0.15) },
                      ]}
                    >
                      <Text style={[styles.thumbActionText, { color: colors.filledBeds }]}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Button
              mode="outlined"
              onPress={pickImages}
              style={{ marginTop: spacing.sm, borderRadius: radius.lg }}
              textColor={colors.textPrimary}
              disabled={saving}
              icon="image-multiple"
            >
              Add photos
            </Button>
          </View>

          {/* Footer buttons */}
          <View style={styles.footerRow}>
            <Button
              mode="outlined"
              style={styles.secondaryBtn}
              textColor={colors.textPrimary}
              onPress={handleBackOrCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              style={styles.primaryBtn}
              onPress={onSubmit}
              disabled={saving}
              loading={saving}
            >
              {isAddMode ? "Create" : "Update"}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
