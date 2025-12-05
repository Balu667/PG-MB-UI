// app/protected/expenses/[id].tsx
// Add/Edit Expense Screen - Premium design with proper validation
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
  Modal,
  useWindowDimensions,
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
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import {
  useGetDailyExpensesList,
  useInsertDailyExpenses,
  useUpdateDailyExpenses,
  useDeleteDailyExpensesImage,
} from "@/src/hooks/dailyExpenses";
import { useProperty } from "@/src/context/PropertyContext";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

interface PhotoItem {
  uri: string;
  filePath?: string;
  isNew: boolean;
  fileName?: string;
}

interface FormValues {
  category: string;
  amount: string;
  date: Date;
  photos: PhotoItem[];
  description: string;
}

const CATEGORY_OPTIONS = [
  "Building Rent",
  "Groceries",
  "Salaries",
  "Maintenance",
  "Electricity",
  "Other",
] as const;

// Allowed image extensions (including Apple formats)
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "heic", "heif", "webp"]);

// File base URL for images
const getExpoFileUrl = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extra = (Constants as any)?.expoConfig?.extra;
    return extra?.fileUrl || "";
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

function toAbsoluteFileUrl(p?: string): string {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return FILE_BASES.length ? `${FILE_BASES[0]}/${p.replace(/^\/+/, "")}` : p;
}

const formatDisplayDate = (d: Date): string =>
  d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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
  options: readonly string[];
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
          {value || placeholder}
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

export default function AddOrEditExpense() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, spacing, radius, typography } = useTheme();

  // Params
  const params = useLocalSearchParams<{ id: string; expenseId?: string }>();
  const propertyId = String(params?.id ?? "");
  const expenseId = String(params?.expenseId ?? "");
  const isEditMode = !!expenseId;

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

  // Fetch expense list to prefill in edit mode
  const { data: listResp } = useGetDailyExpensesList(propertyId);
  const existing = useMemo(() => {
    const arr: Record<string, unknown>[] = Array.isArray(listResp) ? listResp : [];
    return arr.find((x) => String(x?._id) === expenseId);
  }, [listResp, expenseId]);

  // Form state
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // Track initial values for dirty check
  const initialValues = useRef<FormValues | null>(null);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() => new Date());

  // Mutations
  const insertExpense = useInsertDailyExpenses(() => {});
  const updateExpense = useUpdateDailyExpenses(() => {});
  const deleteImage = useDeleteDailyExpensesImage(() => {});

  // Prefill in edit mode
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEditMode || prefilled.current || !existing) return;

    const expCategory = String(existing?.category ?? "");
    const expAmount = String(existing?.amount ?? "");
    const expDate = existing?.date ? new Date(String(existing.date)) : new Date();
    const expDesc = String(existing?.description ?? "");

    // Parse images - handle nested arrays and flat arrays
    const rawImages = existing?.images;
    const parsedPhotos: PhotoItem[] = [];

    if (Array.isArray(rawImages)) {
      rawImages.forEach((img) => {
        // Handle nested array structure: [[{fileName, filePath}]]
        if (Array.isArray(img)) {
          img.forEach((nestedImg) => {
            if (nestedImg && typeof nestedImg === "object" && nestedImg.filePath) {
              parsedPhotos.push({
                uri: toAbsoluteFileUrl(String(nestedImg.filePath)),
                filePath: String(nestedImg.filePath),
                fileName: String(nestedImg.fileName ?? ""),
                isNew: false,
              });
            }
          });
        } else if (img && typeof img === "object") {
          // Handle flat array structure: [{fileName, filePath}]
          const imgObj = img as { filePath?: string; fileName?: string };
          if (imgObj.filePath) {
            parsedPhotos.push({
              uri: toAbsoluteFileUrl(String(imgObj.filePath)),
              filePath: String(imgObj.filePath),
              fileName: String(imgObj.fileName ?? ""),
              isNew: false,
            });
          }
        }
      });
    }

    setCategory(expCategory);
    setAmount(expAmount);
    setDate(isNaN(expDate.getTime()) ? new Date() : expDate);
    setDescription(expDesc);
    setPhotos(parsedPhotos);

    // Store initial values
    initialValues.current = {
      category: expCategory,
      amount: expAmount,
      date: isNaN(expDate.getTime()) ? new Date() : expDate,
      description: expDesc,
      photos: parsedPhotos,
    };

    prefilled.current = true;
  }, [isEditMode, existing]);

  // Set initial values for add mode
  useEffect(() => {
    if (!isEditMode && !initialValues.current) {
      const now = new Date();
      initialValues.current = {
        category: "",
        amount: "",
        date: now,
        description: "",
        photos: [],
      };
    }
  }, [isEditMode]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!initialValues.current) {
      return !!(category || amount || description || photos.length > 0);
    }

    const initial = initialValues.current;
    const dateChanged =
      date.toISOString().split("T")[0] !== initial.date.toISOString().split("T")[0];

    return (
      category !== initial.category ||
      amount !== initial.amount ||
      description !== initial.description ||
      dateChanged ||
      photos.length !== initial.photos.length
    );
  }, [category, amount, description, date, photos]);

  // Navigation back to ExpensesTab with refresh
  const navigateBackToExpenses = useCallback(() => {
    try {
      queryClient.invalidateQueries({ queryKey: ["expensesList", propertyId] });
    } catch {
      // Ignore
    }
    router.replace({
      pathname: `/protected/property/${propertyId}`,
      params: { tab: "Expenses", refresh: String(Date.now()) },
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
    showUnsavedChangesAlert(navigateBackToExpenses);
  }, [showUnsavedChangesAlert, navigateBackToExpenses]);

  // Handle cancel button
  const onCancel = useCallback(() => {
    showUnsavedChangesAlert(navigateBackToExpenses);
  }, [showUnsavedChangesAlert, navigateBackToExpenses]);

  // Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  // Input handlers - store raw digits but display formatted
  const onAmountChange = useCallback((text: string) => {
    const digitsOnly = parseFormattedNumber(text).slice(0, 9);
    setAmount(digitsOnly);
  }, []);

  // Formatted amount for display
  const displayAmount = useMemo(() => {
    return amount ? formatIndianNumber(amount) : "";
  }, [amount]);

  // Validation
  const validate = useCallback((): string[] => {
    const errs: string[] = [];

    // Category validation
    if (!category || !category.trim()) {
      errs.push("• Expense category is required.");
    }

    // Amount validation
    const amtNum = Number(amount || 0);
    if (!amount) {
      errs.push("• Amount is required.");
    } else if (isNaN(amtNum) || amtNum <= 0) {
      errs.push("• Please enter a valid amount greater than 0.");
    } else if (amtNum > 99999999) {
      errs.push("• Amount cannot exceed ₹9,99,99,999.");
    }

    // Date validation
    if (!date) {
      errs.push("• Please select a date.");
    } else if (!(date instanceof Date) || isNaN(date.getTime())) {
      errs.push("• Please select a valid date.");
    }

    // Description validation (optional but check length if provided)
    if (description && description.trim().length > 500) {
      errs.push("• Description cannot exceed 500 characters.");
    }

    return errs;
  }, [category, amount, date, description]);

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
      const fd = new FormData();
      
      // Append text fields - ensure proper string encoding
      fd.append("category", category.trim());
      fd.append("amount", String(parseInt(amount, 10) || 0));
      fd.append("date", date.toISOString());
      fd.append("description", description.trim() || "");
      fd.append("propertyId", propertyId);
      fd.append("createdBy", createdBy || "");

      // Append only NEW images
      const newPhotos = photos.filter((p) => p.isNew && p.uri);
      
      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i];
        let imageUri = photo.uri;

        // Extract filename from URI or use provided fileName
        let fileName = photo.fileName || "";
        if (!fileName) {
          const uriParts = imageUri.split("/");
          fileName = uriParts[uriParts.length - 1] || `bill_${Date.now()}_${i}.jpg`;
        }
        // Remove query params from filename
        fileName = fileName.split("?")[0];
        // Clean filename - remove special characters that might cause issues
        fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        // Ensure filename has extension
        if (!fileName.includes(".")) {
          fileName = `${fileName}.jpg`;
        }
        
        // Determine MIME type from extension
        const ext = (fileName.split(".").pop() || "jpg").toLowerCase();
        let mimeType = "image/jpeg";
        if (ext === "png") {
          mimeType = "image/png";
        } else if (ext === "gif") {
          mimeType = "image/gif";
        } else if (ext === "heic" || ext === "heif") {
          mimeType = "image/heic";
        } else if (ext === "webp") {
          mimeType = "image/webp";
        }

        if (Platform.OS === "web") {
          try {
            const resp = await fetch(imageUri);
            const blob = await resp.blob();
            const file = new File([blob], fileName, { type: mimeType });
            // @ts-ignore
            fd.append("images", file);
          } catch {
            // Skip failed image silently
          }
        } else if (Platform.OS === "android") {
          // Android-specific handling
          // Ensure URI has proper format
          if (!imageUri.startsWith("file://") && !imageUri.startsWith("content://")) {
            imageUri = `file://${imageUri}`;
          }
          // @ts-ignore - React Native FormData accepts this format
          fd.append("images", {
            uri: imageUri,
            name: fileName,
            type: mimeType,
          });
        } else {
          // iOS handling
          // @ts-ignore - React Native FormData accepts this format
          fd.append("images", {
            uri: imageUri,
            name: fileName,
            type: mimeType,
          });
        }
      }

      if (isEditMode && expenseId) {
        updateExpense.mutate(
          { formData: fd, expenseId },
          {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigateBackToExpenses();
            },
            onError: () => {
              Alert.alert(
                "Update Failed",
                "Could not update expense. Please check your connection and try again.",
                [{ text: "OK" }]
              );
            },
          }
        );
      } else {
        insertExpense.mutate(fd, {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigateBackToExpenses();
          },
          onError: () => {
            Alert.alert(
              "Add Failed",
              "Could not add expense. Please check your connection and try again.",
              [{ text: "OK" }]
            );
          },
        });
      }
    } catch {
      Alert.alert(
        "Error",
        "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, [
    validate,
    category,
    amount,
    date,
    description,
    propertyId,
    createdBy,
    photos,
    isEditMode,
    expenseId,
    insertExpense,
    updateExpense,
    navigateBackToExpenses,
  ]);

  // Pick photos
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
        quality: 0.85,
        exif: false,
      });

      if (!res.canceled && res.assets?.length) {
        // Filter valid extensions
        const validAssets = res.assets.filter((a) => {
          if (!a.uri) return false;
          const ext = (a.uri.split(".").pop() || "").toLowerCase().split("?")[0];
          // Also check mimeType if available
          if (a.mimeType) {
            const validMimes = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp", "image/gif"];
            if (validMimes.some((m) => a.mimeType?.includes(m))) return true;
          }
          return ALLOWED_EXT.has(ext);
        });

        if (validAssets.length < res.assets.length) {
          Alert.alert("Some files skipped", "Only JPG, PNG, HEIC, and WEBP images are allowed.");
        }

        const newPhotos: PhotoItem[] = validAssets.map((a) => {
          let fileName = a.fileName || a.uri.split("/").pop() || `image_${Date.now()}.jpg`;
          // Remove query params
          fileName = fileName.split("?")[0];
          
          return {
            uri: a.uri,
            isNew: true,
            fileName,
          };
        });

        setPhotos((prev) => [...prev, ...newPhotos]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Error", "Could not open gallery. Please try again.");
    }
  }, []);

  // Remove photo
  const removePhoto = useCallback(
    (photo: PhotoItem, index: number) => {
      Haptics.selectionAsync();

      // If existing server image in edit mode, call delete API
      if (isEditMode && photo.filePath && expenseId && !photo.isNew) {
        deleteImage.mutate(
          { payload: { filePath: photo.filePath }, expenseId },
          {
            onSuccess: () => {
              setPhotos((prev) => prev.filter((_, i) => i !== index));
            },
            onError: () => {
              Alert.alert("Error", "Failed to delete image. Please try again.");
            },
          }
        );
        return;
      }

      // Local image - just remove from state
      setPhotos((prev) => prev.filter((_, i) => i !== index));
    },
    [isEditMode, expenseId, deleteImage]
  );

  // Date picker handlers
  const openDatePicker = useCallback(() => {
    // Ensure we have a valid date before opening
    const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    setTempDate(new Date(validDate.getTime()));
    setShowDatePicker(true);
  }, [date]);

  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        // Android: Close immediately after any action
        setShowDatePicker(false);
        if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
          setDate(new Date(selectedDate.getTime()));
        }
      } else {
        // iOS: Update temp date (spinner mode, user is still selecting)
        if (selectedDate && !isNaN(selectedDate.getTime())) {
          setTempDate(new Date(selectedDate.getTime()));
        }
      }
    },
    []
  );

  const confirmIosDate = useCallback(() => {
    if (tempDate instanceof Date && !isNaN(tempDate.getTime())) {
      setDate(new Date(tempDate.getTime()));
    }
    setShowDatePicker(false);
  }, [tempDate]);

  const cancelIosDate = useCallback(() => {
    setShowDatePicker(false);
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
          // iOS shadow
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
        photosGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
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
        },
        thumbImage: {
          width: "100%",
          height: "100%",
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

  const headerTitle = isEditMode ? "Edit Expense" : "Add Expense";
  const isSubmitting = insertExpense.isPending || updateExpense.isPending;

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
            accessibilityHint="Navigate back to expenses list"
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
              {/* Expense Details Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Expense Details
                </Text>

                {/* Category */}
                <Labeled label="Category *">
                  <SheetSelect
                    value={category}
                    placeholder="Select category"
                    options={CATEGORY_OPTIONS}
                    onChange={setCategory}
                  />
                </Labeled>

                {/* Amount */}
                <Labeled label="Amount *">
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
                        accessibilityLabel="Expense amount"
                        accessibilityHint="Enter the expense amount in rupees"
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                    </View>
                  </View>
                </Labeled>

                {/* Date */}
                <Labeled label="Date *">
                  <Pressable
                    style={styles.dateBtn}
                    onPress={openDatePicker}
                    accessibilityRole="button"
                    accessibilityLabel={`Select date, current: ${formatDisplayDate(date)}`}
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
                      {formatDisplayDate(date)}
                    </PaperText>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
                  </Pressable>
                </Labeled>

                {/* Description */}
                <Labeled label="Description (optional)">
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add a note about this expense"
                    mode="outlined"
                    theme={{ roundness: radius.lg }}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, padding: spacing.sm }}
                    accessibilityLabel="Expense description"
                    accessibilityHint="Optional description for the expense"
                    multiline
                    numberOfLines={2}
                  />
                </Labeled>
              </View>

              {/* Bill Photos Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle} accessible accessibilityRole="header">
                  Bill Photos (optional)
                </Text>

                <Button
                  mode="outlined"
                  onPress={pickPhotos}
                  icon="camera"
                  style={{
                    borderRadius: radius.lg,
                    minHeight: 48,
                    justifyContent: "center",
                    borderColor: colors.borderColor,
                  }}
                  textColor={colors.textPrimary}
                  accessibilityLabel="Pick images"
                  accessibilityHint="Opens gallery to select bill images"
                >
                  Pick Images
                </Button>

                {photos.length > 0 && (
                  <View style={styles.photosGrid}>
                    {photos.map((photo, index) => (
                      <View key={`${photo.uri}-${index}`} style={styles.thumbWrap}>
                        <Image
                          source={{ uri: photo.uri }}
                          style={styles.thumbImage}
                          resizeMode="cover"
                        />
                        <Pressable
                          onPress={() => removePhoto(photo, index)}
                          style={styles.removeBadge}
                          accessibilityLabel="Remove photo"
                          accessibilityHint="Removes this photo from the expense"
                          accessible
                        >
                          <MaterialIcons name="close" size={16} color={colors.white} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
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
                  accessibilityHint="Discards changes and returns to expenses list"
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
                  accessibilityLabel={isEditMode ? "Update expense" : "Submit expense"}
                  accessibilityHint={isEditMode ? "Saves changes to expense" : "Creates new expense"}
                >
                  {isEditMode ? "Update" : "Submit"}
                </Button>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>

      {/* Date Picker - Platform specific */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={cancelIosDate}
        >
          <Pressable style={styles.datePickerModal} onPress={cancelIosDate}>
            <Pressable style={styles.datePickerContainer} onPress={() => {}}>
              <View style={styles.datePickerHeader}>
                <Pressable onPress={cancelIosDate} style={styles.datePickerBtn}>
                  <Text style={[styles.datePickerBtnText, { color: colors.error }]}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <Pressable onPress={confirmIosDate} style={styles.datePickerBtn}>
                  <Text style={[styles.datePickerBtnText, { color: colors.accent }]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate instanceof Date && !isNaN(tempDate.getTime()) ? tempDate : new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
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
