// app/protected/tenant/view/[id].tsx
// Tenant Profile View Screen - Premium design with Profile & Transactions tabs
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  I18nManager,
  RefreshControl,
  Modal,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, TextInput, RadioButton, Text as PaperText, Divider, Portal, Dialog, Snackbar } from "react-native-paper";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";

// Use require for expo-file-system to avoid TypeScript issues with legacy exports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FileSystem = require("expo-file-system");
import * as Sharing from "expo-sharing";
import { useSelector } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useGetAllTenantDetails, useUpdateTenant, useSendEKYC } from "@/src/hooks/tenants";
import { useGetAllRooms } from "@/src/hooks/room";
import { useGetAllTenantPayments, useInsertPayment } from "@/src/hooks/payments";
import { useProperty } from "@/src/context/PropertyContext";
import StatsGrid, { Metric } from "@/src/components/StatsGrid";
import AddButton from "@/src/components/Common/AddButton";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */

const TABS = ["Profile Details", "Transactions"] as const;
type TabKey = (typeof TABS)[number];

const MEAL_PREFERENCES = [
  { id: "Non-Vegetarian", value: "Non-Vegetarian" },
  { id: "Vegetarian", value: "Vegetarian" },
  { id: "Eggetarian", value: "Eggetarian" },
] as const;

const BLOOD_GROUPS = [
  { id: "A+", value: "A+" },
  { id: "A-", value: "A-" },
  { id: "B+", value: "B+" },
  { id: "B-", value: "B-" },
  { id: "O+", value: "O+" },
  { id: "O-", value: "O-" },
  { id: "AB+", value: "AB+" },
  { id: "AB-", value: "AB-" },
] as const;

const VEHICLE_TYPES = [
  { id: "2-Wheeler", value: "2-Wheeler" },
  { id: "4-Wheeler", value: "4-Wheeler" },
] as const;

type ActionType = "SEND_EKYC" | "APPROVE_KYC" | "REJECT_KYC" | "GIVE_NOTICE" | "CHECKOUT_TENANT" | "REMOVE_NOTICE";

const ACTION_OPTIONS_DEFAULT: { id: ActionType; value: string }[] = [
  { id: "SEND_EKYC", value: "Send E-KYC" },
  { id: "APPROVE_KYC", value: "Approve KYC" },
  { id: "GIVE_NOTICE", value: "Give Notice" },
  { id: "CHECKOUT_TENANT", value: "Checkout Tenant" },
];

const ACTION_OPTIONS_NOTICE: { id: ActionType; value: string }[] = [
  { id: "REMOVE_NOTICE", value: "Remove Notice" },
  { id: "CHECKOUT_TENANT", value: "Checkout Tenant" },
];

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

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;

const str = (v: unknown, fallback = ""): string =>
  v == null ? fallback : String(v);

const formatIndianNumber = (n: number): string => {
  if (isNaN(n)) return "0";
  const s = Math.abs(Math.round(n)).toString();
  if (s.length <= 3) return n < 0 ? `-${s}` : s;
  let result = s.slice(-3);
  let remaining = s.slice(0, -3);
  while (remaining.length > 2) {
    result = remaining.slice(-2) + "," + result;
    remaining = remaining.slice(0, -2);
  }
  if (remaining.length > 0) result = remaining + "," + result;
  return n < 0 ? `-${result}` : result;
};

const parseFormattedNumber = (s: string): number => {
  const cleaned = s.replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
};

const formatDisplayDate = (d: Date | null | undefined): string => {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const parseISODate = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
};

const validateEmail = (email: string): boolean => {
  if (!email.trim()) return true;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10;
};

const validateVehicleNumber = (vn: string): boolean => {
  if (!vn.trim()) return true; // Not mandatory
  // Patterns: AP-39-QJ-2345, MH12AB1234, DL-8C-1234
  const patterns = [
    /^[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{1,4}$/i,
    /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i,
  ];
  return patterns.some((p) => p.test(vn.trim()));
};

const getMonthYear = (iso?: string): string => {
  const d = parseISODate(iso);
  return d ? d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—";
};

const getKycStatusText = (status: number): { text: string; color: string; bgColor: string } => {
  switch (status) {
    case 0:
      return { text: "Please Send E-KYC link to verify", color: "#B45309", bgColor: hexToRgba("#F59E0B", 0.15) };
    case 1:
      return { text: "Verified", color: "#059669", bgColor: hexToRgba("#10B981", 0.15) };
    case 3:
      return { text: "Rejected the verification, please send the verification link again", color: "#DC2626", bgColor: hexToRgba("#EF4444", 0.15) };
    case 4:
      return { text: "E-KYC Link sent", color: "#0EA5E9", bgColor: hexToRgba("#0EA5E9", 0.15) };
    default:
      return { text: "KYC Status Unknown", color: "#6B7280", bgColor: hexToRgba("#6B7280", 0.15) };
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   LABELED COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

const Labeled = React.memo(
  ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => {
    const { colors } = useTheme();
    return (
      <View style={{ marginTop: 8, marginBottom: 10 }}>
        <PaperText style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </PaperText>
        {children}
      </View>
    );
  }
);
Labeled.displayName = "Labeled";

/* ═══════════════════════════════════════════════════════════════════════════
   SHEET SELECT COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

interface SheetSelectProps {
  value?: string;
  options: readonly { id: string; value: string }[];
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
  const selectedLabel = options.find((o) => o.id === value || o.value === value)?.value;

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
          backgroundColor: disabled ? hexToRgba(colors.textMuted, 0.05) : colors.cardSurface,
          paddingVertical: 12,
          paddingHorizontal: 12,
          opacity: disabled ? 0.7 : 1,
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        accessible
      >
        <PaperText
          style={{ color: selectedLabel ? colors.textPrimary : colors.textMuted, fontSize: typography.fontSizeMd, flex: 1 }}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </PaperText>
        {!disabled && <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />}
      </Pressable>

      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)} style={{ backgroundColor: colors.cardBackground, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
          <Dialog.Title style={{ color: colors.textPrimary, marginBottom: 6, fontWeight: "600" }}>{placeholder}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ padding: spacing.sm }} keyboardShouldPersistTaps="always">
              {options.map((opt) => {
                const isSelected = opt.id === value || opt.value === value;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    style={{
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderColor: hexToRgba(colors.textSecondary, 0.12),
                      minHeight: 48,
                      justifyContent: "center",
                      backgroundColor: isSelected ? hexToRgba(colors.accent, 0.1) : "transparent",
                      borderRadius: isSelected ? 10 : 0,
                      paddingHorizontal: 8,
                      marginBottom: 4,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={opt.value}
                    accessible
                  >
                    <PaperText style={{ color: colors.textPrimary, fontWeight: isSelected ? "700" : "400" }}>{opt.value}</PaperText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)} textColor={colors.accent}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   FILE UPLOAD COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

interface FileUploadProps {
  label: string;
  value: { fileName?: string; filePath?: string; uri?: string } | null;
  onChange: (file: { fileName: string; filePath?: string; uri: string; type: string } | null) => void;
  existingUrl?: string;
}

const FileUpload = React.memo(function FileUpload({ label, value, onChange, existingUrl }: FileUploadProps) {
  const { colors, radius, spacing, typography } = useTheme();

  const pickFile = useCallback(async () => {
    try {
      Haptics.selectionAsync();
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileSize = asset.size || 0;
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (fileSize > maxSize) {
          Alert.alert("File Too Large", "Please select a file smaller than 5MB.");
          return;
        }

        const mimeType = asset.mimeType || "application/octet-stream";
        onChange({
          fileName: asset.name,
          uri: asset.uri,
          type: mimeType,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file.");
    }
  }, [onChange]);

  const removeFile = useCallback(() => {
    Haptics.selectionAsync();
    onChange(null);
  }, [onChange]);

  const viewFile = useCallback(() => {
    const url = value?.uri || (value?.filePath ? toAbsoluteFileUrl(value.filePath) : existingUrl);
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert("Error", "Cannot open file."));
    }
  }, [value, existingUrl]);

  const downloadFile = useCallback(async () => {
    try {
      Haptics.selectionAsync();
      const url = value?.uri || (value?.filePath ? toAbsoluteFileUrl(value.filePath) : existingUrl);
      if (!url) {
        Alert.alert("Error", "No file to download.");
        return;
      }

      const fileName = value?.fileName || (value?.filePath ? value.filePath.split("/").pop() : "document");
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      
      if (downloadResult.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert("Success", "File downloaded successfully.");
        }
      } else {
        Alert.alert("Error", "Failed to download file.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to download file.");
    }
  }, [value, existingUrl]);

  const hasFile = !!(value?.fileName || value?.filePath || existingUrl);
  const displayName = value?.fileName || (value?.filePath ? value.filePath.split("/").pop() : "");

  return (
    <View style={{ marginTop: 8, marginBottom: 10 }}>
      <PaperText style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>{label}</PaperText>
      <PaperText style={{ color: colors.textMuted, fontSize: 11, marginBottom: 8 }}>
        Supported: JPG, PNG, PDF (Max 5MB)
      </PaperText>

      {hasFile ? (
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: hexToRgba(colors.accent, 0.08),
          padding: spacing.sm,
          borderRadius: radius.lg,
          gap: 10,
        }}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.accent} />
          <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 13 }} numberOfLines={1}>
            {displayName || "Document uploaded"}
          </Text>
          <Pressable onPress={viewFile} style={{ padding: 6 }} accessibilityLabel="View file">
            <MaterialIcons name="visibility" size={20} color={colors.accent} />
          </Pressable>
          <Pressable onPress={downloadFile} style={{ padding: 6 }} accessibilityLabel="Download file">
            <MaterialIcons name="file-download" size={20} color={colors.accent} />
          </Pressable>
          <Pressable onPress={removeFile} style={{ padding: 6 }} accessibilityLabel="Remove file">
            <MaterialIcons name="delete-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={pickFile}
          style={{
            borderWidth: 1.5,
            borderColor: colors.borderColor,
            borderStyle: "dashed",
            borderRadius: radius.lg,
            backgroundColor: colors.cardSurface,
            paddingVertical: 20,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          accessibilityRole="button"
          accessibilityLabel={`Upload ${label}`}
          accessible
        >
          <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Tap to upload</Text>
        </Pressable>
      )}
    </View>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   TAB BAR COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

interface TabBarProps {
  tabs: readonly string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabBar = React.memo(function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={{
      flexDirection: "row",
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderColor: hexToRgba(colors.borderColor, 0.5),
      paddingHorizontal: spacing.sm,
    }}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <Pressable
            key={tab}
            onPress={() => {
              Haptics.selectionAsync();
              onTabChange(tab);
            }}
            style={{
              flex: 1,
              paddingVertical: spacing.sm + 4,
              alignItems: "center",
              borderBottomWidth: 3,
              borderBottomColor: isActive ? colors.accent : "transparent",
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessible
          >
            <Text style={{
              fontSize: typography.fontSizeSm,
              fontWeight: isActive ? "700" : "500",
              color: isActive ? colors.accent : colors.textMuted,
            }}>
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSACTION CARD COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

interface TransactionCardProps {
  payment: Record<string, unknown>;
  propertyId: string;
}

const TransactionCard = React.memo(function TransactionCard({ payment, propertyId }: TransactionCardProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();

  const category = str(payment?.paymentCategory, "Payment").replace(/_/g, " ");
  const amount = num(payment?.amount);
  const totalAmount = num(payment?.totalAmount);
  const dueDate = parseISODate(payment?.dueDate);
  const description = str(payment?.description, "—");
  const paymentId = str(payment?._id);
  const status = num(payment?.status);

  // Category display: Month + Category
  const monthYear = getMonthYear(payment?.dueDate as string);
  const categoryDisplay = `${monthYear} - ${category.charAt(0).toUpperCase() + category.slice(1)}`;

  const categoryColor = useMemo(() => {
    const cat = category.toLowerCase();
    if (cat.includes("rent")) return "#3B82F6";
    if (cat.includes("security") || cat.includes("deposit")) return "#8B5CF6";
    if (cat.includes("electricity")) return "#F59E0B";
    if (cat.includes("maintenance")) return "#10B981";
    return colors.accent;
  }, [category, colors.accent]);

  const handlePayNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/protected/dues/[id]",
      params: { id: propertyId, dueId: paymentId, mode: "pay" },
    });
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/protected/dues/[id]",
      params: { id: propertyId, dueId: paymentId, mode: "edit" },
    });
  };

  return (
    <View style={{
      backgroundColor: colors.cardBackground,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: hexToRgba(colors.borderColor, 0.5),
      marginBottom: spacing.sm,
      overflow: "hidden",
      ...(Platform.OS === "ios"
        ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }
        : { elevation: 3 }),
    }}>
      {/* Category Bar */}
      <View style={{ height: 4, backgroundColor: categoryColor }} />

      <View style={{ padding: spacing.md }}>
        {/* Header: Category + Amount */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.fontSizeMd, fontWeight: "700", color: colors.textPrimary }}>
              {categoryDisplay}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: typography.fontSizeLg, fontWeight: "800", color: "#EF4444" }}>
              ₹{formatIndianNumber(amount)}
            </Text>
          </View>
        </View>

        {/* Details Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.sm }}>
          <View style={{ width: "50%", paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>Total Amount</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>₹{formatIndianNumber(totalAmount)}</Text>
          </View>
          <View style={{ width: "50%", paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>Due Amount</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#EF4444" }}>₹{formatIndianNumber(amount)}</Text>
          </View>
          <View style={{ width: "50%", paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>Due Date</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{formatDisplayDate(dueDate)}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={{ backgroundColor: hexToRgba(colors.textMuted, 0.05), padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>Description</Text>
          <Text style={{ fontSize: 13, color: colors.textPrimary }} numberOfLines={2}>{description}</Text>
        </View>

        {/* Actions */}
        {status === 2 && (
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable
              onPress={handlePayNow}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: colors.accent,
                paddingVertical: 10,
                borderRadius: radius.md,
              }}
              accessibilityRole="button"
              accessibilityLabel="Pay now"
              accessible
            >
              <MaterialIcons name="payment" size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>Pay Now</Text>
            </Pressable>
            <Pressable
              onPress={handleEdit}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: hexToRgba(colors.textMuted, 0.1),
                paddingVertical: 10,
                borderRadius: radius.md,
              }}
              accessibilityRole="button"
              accessibilityLabel="Edit payment"
              accessible
            >
              <MaterialIcons name="edit" size={16} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary, fontWeight: "600", fontSize: 13 }}>Edit</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIRMATION MODAL COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  showReasonInput?: boolean;
  reason?: string;
  onReasonChange?: (r: string) => void;
  showCheckoutInputs?: boolean;
  showNoticeInputs?: boolean;
  paidDeposit?: number;
  refundAmount?: string;
  onRefundChange?: (r: string) => void;
  refundError?: string;
  moveOutDate?: Date;
  onMoveOutDateChange?: (d: Date) => void;
}

const ConfirmModal = React.memo(function ConfirmModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  loading,
  showReasonInput,
  reason,
  onReasonChange,
  showCheckoutInputs,
  showNoticeInputs,
  paidDeposit,
  refundAmount,
  onRefundChange,
  refundError,
  moveOutDate,
  onMoveOutDateChange,
}: ConfirmModalProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() => moveOutDate || new Date());
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Sync tempDate with moveOutDate
  useEffect(() => {
    if (moveOutDate) {
      setTempDate(moveOutDate);
    }
  }, [moveOutDate]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.md,
      }}>
        <View style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          overflow: "hidden",
          ...(Platform.OS === "ios"
            ? { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20 }
            : { elevation: 10 }),
        }}>
          {/* Header */}
          <View style={{ backgroundColor: hexToRgba(colors.accent, 0.1), paddingVertical: spacing.md, paddingHorizontal: spacing.md }}>
            <Text style={{ fontSize: typography.fontSizeLg, fontWeight: "700", color: colors.textPrimary, textAlign: "center" }}>
              {title}
            </Text>
          </View>

          {/* Body */}
          <View style={{ padding: spacing.md }}>
            <Text style={{ fontSize: typography.fontSizeMd, color: colors.textPrimary, lineHeight: 22, marginBottom: spacing.md }}>
              {message}
            </Text>

            {/* Reason Input for Reject KYC */}
            {showReasonInput && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>Rejection Reason *</Text>
                <TextInput
                  value={reason}
                  onChangeText={onReasonChange}
                  mode="outlined"
                  placeholder="Enter reason for rejection"
                  multiline
                  numberOfLines={3}
                  outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                  activeOutlineColor={colors.accent}
                  style={{ backgroundColor: colors.cardSurface }}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.textMuted}
                  contentStyle={{ minHeight: 80, textAlignVertical: "top" }}
                  theme={{ roundness: radius.lg }}
                />
              </View>
            )}

            {/* Notice Inputs */}
            {showNoticeInputs && (
              <View style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>Paid Deposit Amount</Text>
                    <TextInput
                      value={`₹ ${formatIndianNumber(paidDeposit || 0)}`}
                      mode="outlined"
                      editable={false}
                      outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                      style={{ backgroundColor: hexToRgba(colors.textMuted, 0.05) }}
                      textColor={colors.textPrimary}
                      contentStyle={{ minHeight: 48 }}
                      theme={{ roundness: radius.lg }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>Move out Date</Text>
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.borderColor,
                        borderRadius: radius.lg,
                        backgroundColor: colors.cardSurface,
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        minHeight: 48,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <MaterialIcons name="event" size={18} color={colors.textSecondary} />
                      <Text style={{ color: colors.textPrimary, fontSize: 14, flex: 1 }}>
                        {moveOutDate ? formatDisplayDate(moveOutDate) : "Select date"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <Text style={{ color: colors.textPrimary, marginTop: spacing.md, lineHeight: 20 }}>
                  Are you sure you want to issue a notice to this tenant?
                </Text>
                
                {/* Android Date Picker */}
                {Platform.OS === "android" && showDatePicker && (
                  <DateTimePicker
                    value={moveOutDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={todayStart}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
                        onMoveOutDateChange?.(selectedDate);
                      }
                    }}
                  />
                )}
                
                {/* iOS Date Picker Modal */}
                {Platform.OS === "ios" && showDatePicker && (
                  <Modal visible={showDatePicker} transparent animationType="slide">
                    <Pressable 
                      style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Pressable style={{ backgroundColor: colors.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderColor: colors.borderColor }}>
                          <Pressable onPress={() => setShowDatePicker(false)}>
                            <Text style={{ color: colors.error, fontWeight: "600" }}>Cancel</Text>
                          </Pressable>
                          <Text style={{ fontWeight: "600", color: colors.textPrimary }}>Select Date</Text>
                          <Pressable onPress={() => {
                            if (tempDate && !isNaN(tempDate.getTime())) {
                              onMoveOutDateChange?.(tempDate);
                            }
                            setShowDatePicker(false);
                          }}>
                            <Text style={{ color: colors.accent, fontWeight: "600" }}>Done</Text>
                          </Pressable>
                        </View>
                        <DateTimePicker
                          value={tempDate instanceof Date && !isNaN(tempDate.getTime()) ? tempDate : new Date()}
                          mode="date"
                          display="spinner"
                          minimumDate={todayStart}
                          onChange={(event, selectedDate) => {
                            if (selectedDate && !isNaN(selectedDate.getTime())) {
                              setTempDate(selectedDate);
                            }
                          }}
                          style={{ height: 200 }}
                          textColor={colors.textPrimary}
                          themeVariant="light"
                        />
                      </Pressable>
                    </Pressable>
                  </Modal>
                )}
              </View>
            )}

            {/* Checkout Inputs */}
            {showCheckoutInputs && (
              <View style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>Paid Deposit Amount</Text>
                    <TextInput
                      value={`₹ ${formatIndianNumber(paidDeposit || 0)}`}
                      mode="outlined"
                      editable={false}
                      outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                      style={{ backgroundColor: hexToRgba(colors.textMuted, 0.05) }}
                      textColor={colors.textPrimary}
                      contentStyle={{ minHeight: 48 }}
                      theme={{ roundness: radius.lg }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }}>Refund Amount</Text>
                    <TextInput
                      value={refundAmount}
                      onChangeText={(t) => {
                        // Only allow digits, remove non-numeric characters
                        const digitsOnly = t.replace(/[^0-9]/g, "");
                        onRefundChange?.(digitsOnly);
                        // Clear error when user types
                        if (refundError) {
                          // This will be handled by the parent component
                        }
                      }}
                      mode="outlined"
                      placeholder="Enter amount"
                      keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      outlineColor={refundError ? colors.error : hexToRgba(colors.textSecondary, 0.22)}
                      activeOutlineColor={refundError ? colors.error : colors.accent}
                      style={{ backgroundColor: colors.cardSurface }}
                      textColor={colors.textPrimary}
                      placeholderTextColor={colors.textMuted}
                      contentStyle={{ minHeight: 48 }}
                      theme={{ roundness: radius.lg }}
                    />
                  </View>
                </View>
                {refundError && (
                  <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{refundError}</Text>
                )}
                <Text style={{ color: colors.textPrimary, marginTop: spacing.md, lineHeight: 20 }}>
                  Are you sure you want to remove this tenant?
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderColor: colors.borderColor }}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={{ flex: 1, paddingVertical: 14, alignItems: "center", borderRightWidth: 1, borderColor: colors.borderColor }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessible
            >
              <Text style={{ fontSize: typography.fontSizeMd, fontWeight: "600", color: colors.textMuted }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={{ flex: 1, paddingVertical: 14, alignItems: "center", backgroundColor: hexToRgba(colors.accent, 0.1) }}
              accessibilityRole="button"
              accessibilityLabel="Confirm"
              accessible
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={{ fontSize: typography.fontSizeMd, fontWeight: "700", color: colors.accent }}>Confirm</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN SCREEN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export default function TenantProfileView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors, spacing, radius, typography } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenantId = String(id ?? "");

  // Property context
  const { selectedId: contextPropertyId } = useProperty();

  // Profile data from Redux
  const profileData = useSelector(
    (state: { profileDetails?: { profileData?: Record<string, unknown> } }) =>
      state?.profileDetails?.profileData
  );
  const ownerId = str(
    (profileData as Record<string, unknown>)?.ownerId ??
      (profileData as Record<string, unknown>)?.userId ??
      (profileData as Record<string, unknown>)?._id ??
      ""
  );

  const [activeTab, setActiveTab] = useState<TabKey>("Profile Details");
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Modal states
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: ActionType | null;
    title: string;
    message: string;
  }>({ visible: false, type: null, title: "", message: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundError, setRefundError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d;
  });
  const [showMoveOutDatePicker, setShowMoveOutDatePicker] = useState(false);
  const [tempMoveOutDate, setTempMoveOutDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d;
  });

  // API Hooks
  const tenantQuery = useGetAllTenantDetails(tenantId);
  const tenant = tenantQuery?.data?.data ?? tenantQuery?.data ?? null;
  const propertyId = str(tenant?.propertyId, "") || String(contextPropertyId || "");
  const roomId = str(tenant?.roomId, "");
  const tenantStatus = num(tenant?.status);

  const roomsQuery = useGetAllRooms(propertyId || null);
  const paymentsQuery = useGetAllTenantPayments(tenantId);
  const sendEkyc = useSendEKYC(tenantId);

  // Insert payment hook for checkout refund
  const insertPayment = useInsertPayment(() => {});

  // Update tenant hook
  const updateTenant = useUpdateTenant((data) => {
    showSnackbar(data?.message || "Tenant updated successfully");
    tenantQuery.refetch();
  });

  // Show snackbar helper
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // Extract payments data
  const paymentsData = useMemo(() => {
    const raw = paymentsQuery?.data;
    const payments = Array.isArray(raw?.payments) ? raw.payments : [];
    const firstPayment = (payments[0] ?? {}) as Record<string, unknown>;
    const metadata = (firstPayment.metadata ?? {}) as Record<string, unknown>;
    const duePayments = Array.isArray(firstPayment.duePayments) ? firstPayment.duePayments : [];
    const paidPayments = Array.isArray(firstPayment.paidPayments) ? firstPayment.paidPayments : [];

    return {
      totalDues: num(metadata?.totalDues),
      totalCollections: num(metadata?.totalCollections),
      duePayments: duePayments as Record<string, unknown>[],
      paidPayments: paidPayments as Record<string, unknown>[],
    };
  }, [paymentsQuery?.data]);

  // Form state
  const [tenantName, setTenantName] = useState("");
  const [joiningDate, setJoiningDate] = useState<Date | null>(null);
  const [noticePeriod, setNoticePeriod] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [mealType, setMealType] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [alternativeNumber, setAlternativeNumber] = useState("");
  const [email, setEmail] = useState("");
  const [workingName, setWorkingName] = useState("");
  const [workingAddress, setWorkingAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [emContactName, setEmContactName] = useState("");
  const [emContactNumber, setEmContactNumber] = useState("");
  const [emRelation, setEmRelation] = useState("");
  const [idProof, setIdProof] = useState<{ fileName?: string; filePath?: string; uri?: string; type?: string } | null>(null);
  const [rentalAgreement, setRentalAgreement] = useState<{ fileName?: string; filePath?: string; uri?: string; type?: string } | null>(null);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() => new Date());

  // Prefill form when tenant data loads
  const prefilled = useRef(false);
  useEffect(() => {
    if (!tenant) return;

    setTenantName(str(tenant.tenantName));
    setJoiningDate(parseISODate(tenant.joiningDate));
    setNoticePeriod(String(num(tenant.noticePeriod)));
    setRoomNumber(str(tenant.roomNumber));
    setBedNumber(str(tenant.bedNumber));
    setRentAmount(String(num(tenant.rentAmount)));
    setDepositAmount(String(num(tenant.depositAmount)));
    setPhoneNumber(str(tenant.phoneNumber));
    setGender(str(tenant.gender));
    setMealType(str(tenant.tenantMealType));
    setBloodGroup(str(tenant.bloodGroup));
    setAlternativeNumber(str(tenant.alternativeNumber));
    setEmail(str(tenant.email));
    setWorkingName(str(tenant.workingName));
    setWorkingAddress(str(tenant.workingAddress));
    setPermanentAddress(str(tenant.permanentAddress));
    setVehicleType(str(tenant.vehicleType));
    setVehicleNumber(str(tenant.vehicleNumber));
    setEmContactName(str(tenant.emContactName));
    setEmContactNumber(str(tenant.emContactNumber));
    setEmRelation(str(tenant.emRelation));

    // Documents
    const idProofArr = Array.isArray(tenant.idProof) ? tenant.idProof : [];
    if (idProofArr.length > 0) {
      setIdProof({ fileName: idProofArr[0]?.fileName, filePath: idProofArr[0]?.filePath });
    } else {
      setIdProof(null);
    }

    const rentalArr = Array.isArray(tenant.rentalAgreement) ? tenant.rentalAgreement : [];
    if (rentalArr.length > 0) {
      setRentalAgreement({ fileName: rentalArr[0]?.fileName, filePath: rentalArr[0]?.filePath });
    } else {
      setRentalAgreement(null);
    }

    prefilled.current = true;
  }, [tenant]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([tenantQuery.refetch(), paymentsQuery.refetch()]);
    setRefreshing(false);
  }, [tenantQuery, paymentsQuery]);

  // Navigation back to Tenants Tab
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (propertyId) {
      router.replace({
        pathname: `/protected/property/${propertyId}`,
        params: { tab: "Tenants", refresh: String(Date.now()) },
      });
    } else {
      router.back();
    }
  }, [router, propertyId]);

  // Toggle edit mode
  const toggleEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing((prev) => !prev);
  }, []);

  // Validate and save
  const handleSave = useCallback(() => {
    const errors: string[] = [];

    if (!tenantName.trim()) errors.push("• Tenant name is required.");
    if (!joiningDate) errors.push("• Date of joining is required.");
    if (!noticePeriod.trim()) errors.push("• Notice period is required.");
    if (!roomNumber.trim()) errors.push("• Room number is required.");
    if (!bedNumber.trim()) errors.push("• Bed number is required.");
    if (!rentAmount.trim()) errors.push("• Rent amount is required.");
    if (!depositAmount.trim()) errors.push("• Security deposit is required.");
    if (!phoneNumber.trim()) errors.push("• Phone number is required.");
    else if (!validatePhone(phoneNumber)) errors.push("• Phone number must be exactly 10 digits.");
    if (!gender.trim()) errors.push("• Gender is required.");

    // Optional field validations
    if (alternativeNumber.trim() && !validatePhone(alternativeNumber)) {
      errors.push("• Alternative number must be exactly 10 digits.");
    }
    if (emContactNumber.trim() && !validatePhone(emContactNumber)) {
      errors.push("• Emergency contact number must be exactly 10 digits.");
    }
    if (email.trim() && !validateEmail(email)) {
      errors.push("• Please enter a valid email address.");
    }
    if (vehicleNumber.trim() && !validateVehicleNumber(vehicleNumber)) {
      errors.push("• Enter a valid vehicle number (e.g., AP-39-QJ-2345, MH12AB1234, DL-8C-1234).");
    }

    if (errors.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Validation Error", errors.join("\n"), [{ text: "OK" }]);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const formData = new FormData();
    formData.append("tenantName", tenantName.trim());
    formData.append("joiningDate", joiningDate?.toISOString() || "");
    formData.append("noticePeriod", noticePeriod.trim());
    formData.append("roomNumber", roomNumber.trim());
    formData.append("bedNumber", bedNumber.trim());
    formData.append("rentAmount", String(num(rentAmount)));
    formData.append("depositAmount", String(num(depositAmount)));
    formData.append("phoneNumber", phoneNumber.trim());
    formData.append("gender", gender.trim());
    formData.append("alternativeNumber", alternativeNumber.trim());
    formData.append("email", email.trim());
    formData.append("tenantMealType", mealType || "");
    formData.append("bloodGroup", bloodGroup || "");
    formData.append("workingName", workingName.trim());
    formData.append("workingAddress", workingAddress.trim());
    formData.append("permanentAddress", permanentAddress.trim());
    formData.append("vehicleType", vehicleType || "");
    formData.append("vehicleNumber", vehicleNumber.trim());
    formData.append("emContactName", emContactName.trim());
    formData.append("emContactNumber", emContactNumber.trim());
    formData.append("emRelation", emRelation.trim());
    formData.append("profilePic", "null");

    // ID Proof
    if (idProof?.uri) {
      formData.append("idProof", {
        uri: idProof.uri,
        name: idProof.fileName || "idproof.jpg",
        type: idProof.type || "image/jpeg",
      } as unknown as Blob);
    }

    // Rental Agreement
    if (rentalAgreement?.uri) {
      formData.append("rentalAgreement", {
        uri: rentalAgreement.uri,
        name: rentalAgreement.fileName || "rental.pdf",
        type: rentalAgreement.type || "application/pdf",
      } as unknown as Blob);
    }

    updateTenant.mutate(
      { formData, tenantId },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
        onError: (error: unknown) => {
          const msg = error instanceof Error ? error.message : "Failed to update tenant.";
          Alert.alert("Error", msg, [{ text: "OK" }]);
        },
      }
    );
  }, [
    tenantName, joiningDate, noticePeriod, roomNumber, bedNumber, rentAmount, depositAmount,
    phoneNumber, gender, alternativeNumber, email, mealType, bloodGroup, workingName, workingAddress, permanentAddress,
    vehicleType, vehicleNumber, emContactName, emContactNumber, emRelation, idProof, rentalAgreement, tenantId, updateTenant,
  ]);

  // Date picker handlers
  const openDatePicker = useCallback(() => {
    const validDate = joiningDate instanceof Date && !isNaN(joiningDate.getTime()) ? joiningDate : new Date();
    setTempDate(new Date(validDate.getTime()));
    setShowDatePicker(true);
  }, [joiningDate]);

  const handleDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate && !isNaN(selectedDate.getTime())) {
        setJoiningDate(new Date(selectedDate.getTime()));
      }
    } else {
      if (selectedDate && !isNaN(selectedDate.getTime())) {
        setTempDate(new Date(selectedDate.getTime()));
      }
    }
  }, []);

  const confirmIosDate = useCallback(() => {
    if (tempDate instanceof Date && !isNaN(tempDate.getTime())) {
      setJoiningDate(new Date(tempDate.getTime()));
    }
    setShowDatePicker(false);
  }, [tempDate]);

  const cancelIosDate = useCallback(() => setShowDatePicker(false), []);

  // Action handlers
  const getActionOptions = useMemo(() => {
    // If tenant is in notice period (status 2), show only REMOVE_NOTICE and CHECKOUT_TENANT
    if (tenantStatus === 2) {
      return ACTION_OPTIONS_NOTICE;
    }

    const kycStatus = num(tenant?.kycStatus);
    
    // When kycStatus === 1 (verified) and status === 1 (active), show Reject KYC, Give Notice, Checkout Tenant
    if (kycStatus === 1 && tenantStatus === 1) {
      return [
        { id: "REJECT_KYC" as ActionType, value: "Reject KYC" },
        { id: "GIVE_NOTICE" as ActionType, value: "Give Notice" },
        { id: "CHECKOUT_TENANT" as ActionType, value: "Checkout Tenant" },
      ];
    }
    
    const options = [...ACTION_OPTIONS_DEFAULT];
    // Add REJECT KYC when kycStatus === 4 (E-KYC link sent)
    if (kycStatus === 4) {
      options.splice(2, 0, { id: "REJECT_KYC", value: "Reject KYC" });
    }
    return options;
  }, [tenant?.kycStatus, tenantStatus]);

  const handleActionSelect = useCallback((action: string) => {
    const actionType = action as ActionType;
    const dueAmount = num(tenant?.dueAmount);

    switch (actionType) {
      case "SEND_EKYC":
        setModalConfig({
          visible: true,
          type: "SEND_EKYC",
          title: "Confirmation",
          message: "Are you sure you want to send the eKYC request to this tenant?",
        });
        break;
      case "APPROVE_KYC":
        setModalConfig({
          visible: true,
          type: "APPROVE_KYC",
          title: "Confirmation",
          message: "Are you sure you want to confirm the eKYC for this tenant?",
        });
        break;
      case "REJECT_KYC":
        setRejectReason("");
        setModalConfig({
          visible: true,
          type: "REJECT_KYC",
          title: "Confirmation",
          message: "Are you sure you want to reject the eKYC?",
        });
        break;
      case "GIVE_NOTICE":
        // Reset move out date based on noticePeriod from API (default 15 if not available)
        const noticePeriodDays = num(tenant?.noticePeriod, 15);
        const defaultMoveOutDate = new Date();
        defaultMoveOutDate.setDate(defaultMoveOutDate.getDate() + noticePeriodDays);
        setMoveOutDate(defaultMoveOutDate);
        setTempMoveOutDate(defaultMoveOutDate);
        setModalConfig({
          visible: true,
          type: "GIVE_NOTICE",
          title: "Issue Notice to Tenant",
          message: "", // Will show custom content
        });
        break;
      case "CHECKOUT_TENANT":
        setRefundAmount("");
        setRefundError("");
        setModalConfig({
          visible: true,
          type: "CHECKOUT_TENANT",
          title: "Remove tenant From the PG",
          message: `Are you sure you want remove this tenant from pg. This tenant having un-paid dues ₹${formatIndianNumber(dueAmount)}`,
        });
        break;
      case "REMOVE_NOTICE":
        setModalConfig({
          visible: true,
          type: "REMOVE_NOTICE",
          title: "Remove Tenant Notice",
          message: "Are you sure you want to remove the notice for this tenant?",
        });
        break;
    }
  }, [tenant?.dueAmount]);

  const closeModal = useCallback(() => {
    setModalConfig({ visible: false, type: null, title: "", message: "" });
    setRejectReason("");
    setRefundAmount("");
    setRefundError("");
  }, []);

  const handleConfirmAction = useCallback(async () => {
    const { type } = modalConfig;
    if (!type) return;

    setActionLoading(true);

    try {
      switch (type) {
        case "SEND_EKYC":
          sendEkyc.mutate(
            { tenantId },
            {
              onSuccess: (data) => {
                showSnackbar(data?.message || "E-KYC link sent successfully");
                tenantQuery.refetch();
                closeModal();
              },
              onError: () => closeModal(),
              onSettled: () => setActionLoading(false),
            }
          );
          return;

        case "APPROVE_KYC": {
          const formData = new FormData();
          formData.append("verified", "true");
          formData.append("rejected", "false");
          formData.append("kycStatus", "1");

          updateTenant.mutate(
            { formData, tenantId },
            {
              onSuccess: (data) => {
                showSnackbar(data?.message || "KYC approved successfully");
                closeModal();
              },
              onError: () => closeModal(),
              onSettled: () => setActionLoading(false),
            }
          );
          return;
        }

        case "REJECT_KYC": {
          if (!rejectReason.trim()) {
            Alert.alert("Error", "Please enter a rejection reason.");
            setActionLoading(false);
            return;
          }

          const formData = new FormData();
          formData.append("rejected", "true");
          formData.append("filledKycLink", "false");
          formData.append("verified", "false");
          formData.append("sentKycLink", "false");
          formData.append("kycStatus", "3");
          formData.append("kycRejectReason", rejectReason.trim());

          updateTenant.mutate(
            { formData, tenantId },
            {
              onSuccess: (data) => {
                showSnackbar(data?.message || "KYC rejected");
                closeModal();
              },
              onError: () => closeModal(),
              onSettled: () => setActionLoading(false),
            }
          );
          return;
        }

        case "GIVE_NOTICE": {
          // Dismiss keyboard first
          Keyboard.dismiss();

          const formData = new FormData();
          formData.append("status", "2");
          formData.append("moveOutDate", moveOutDate.toISOString());

          updateTenant.mutate(
            { formData, tenantId },
            {
              onSuccess: (data) => {
                showSnackbar(data?.message || "Notice issued successfully");
                // Refetch tenant details to update KYC banner
                tenantQuery.refetch();
                closeModal();
              },
              onError: (error) => {
                const msg = error instanceof Error ? error.message : "Failed to issue notice.";
                showSnackbar(msg);
                closeModal();
              },
              onSettled: () => setActionLoading(false),
            }
          );
          return;
        }

        case "CHECKOUT_TENANT": {
          // Dismiss keyboard first
          Keyboard.dismiss();

          const paidDeposit = num(tenant?.collectedDeposit);
          const refund = parseFormattedNumber(refundAmount);

          if (refund > paidDeposit) {
            setRefundError("Refund amount cannot be greater than paid deposit.");
            setActionLoading(false);
            return;
          }

          // Step 1: Insert refund payment
          const paymentPayload = {
            status: 3,
            tenantId: tenantId,
            roomId: roomId,
            totalAmount: paidDeposit,
            amount: String(refund),
            paymentCategory: "Refund",
            propertyId: propertyId,
            paymentMode: "cash",
            description: "security deposit amount refunded to the tenant",
            createdBy: ownerId,
          };

          insertPayment.mutate(paymentPayload, {
            onSuccess: (paymentData) => {
              // Step 2: Update tenant status to 4 (checked out)
              const formData = new FormData();
              formData.append("status", "4");

              updateTenant.mutate(
                { formData, tenantId },
                {
                  onSuccess: () => {
                    showSnackbar(paymentData?.message || "Tenant checked out successfully");
                    closeModal();
                    // Navigate back to Tenants tab
                    if (propertyId) {
                      router.replace({
                        pathname: `/protected/property/${propertyId}`,
                        params: { tab: "Tenants", refresh: String(Date.now()) },
                      });
                    }
                  },
                  onError: () => {
                    closeModal();
                    setActionLoading(false);
                  },
                  onSettled: () => setActionLoading(false),
                }
              );
            },
            onError: () => {
              closeModal();
              setActionLoading(false);
            },
          });
          return;
        }

        case "REMOVE_NOTICE": {
          // Dismiss keyboard first
          Keyboard.dismiss();

          const formData = new FormData();
          formData.append("status", "1");

          updateTenant.mutate(
            { formData, tenantId },
            {
              onSuccess: (data) => {
                showSnackbar(data?.message || "Notice removed successfully");
                // Refetch tenant details to update KYC banner
                tenantQuery.refetch();
                closeModal();
              },
              onError: (error) => {
                const msg = error instanceof Error ? error.message : "Failed to remove notice.";
                showSnackbar(msg);
                closeModal();
              },
              onSettled: () => setActionLoading(false),
            }
          );
          return;
        }
      }
    } catch (error) {
      setActionLoading(false);
      closeModal();
    }
  }, [modalConfig, rejectReason, refundAmount, tenantId, sendEkyc, updateTenant, tenant?.collectedDeposit, tenantQuery, showSnackbar, closeModal, moveOutDate, insertPayment, roomId, propertyId, ownerId, router]);

  // Stats for Transactions tab
  const transactionStats: Metric[] = useMemo(() => [
    {
      key: "dues",
      label: "Total Dues",
      value: `₹${formatIndianNumber(paymentsData.totalDues)}`,
      icon: "cash-remove",
      iconBg: "#FEE2E2",
      iconColor: "#B91C1C",
    },
    {
      key: "collections",
      label: "Total Collection",
      value: `₹${formatIndianNumber(paymentsData.totalCollections)}`,
      icon: "cash-check",
      iconBg: "#DCFCE7",
      iconColor: "#16A34A",
    },
  ], [paymentsData.totalDues, paymentsData.totalCollections]);

  // KYC status
  const kycStatus = num(tenant?.kycStatus);
  const kycConfig = getKycStatusText(kycStatus);
  const sharingType = num(tenant?.sharingType);

  // Styles
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
          flex: 1,
        },
        headerSubtitle: {
          color: colors.textSecondary,
          fontSize: 13,
          marginTop: 2,
        },
        editBtn: {
          backgroundColor: isEditing ? colors.accent : hexToRgba(colors.accent, 0.1),
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: radius.lg,
        },
        editBtnText: {
          color: isEditing ? "#FFFFFF" : colors.accent,
          fontWeight: "600",
          fontSize: 13,
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
            ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 }
            : { elevation: 4 }),
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontWeight: "700",
          marginBottom: 8,
          fontSize: typography.fontSizeMd,
        },
        input: {
          backgroundColor: isEditing ? colors.cardSurface : hexToRgba(colors.textMuted, 0.05),
        },
        inputDisabled: {
          backgroundColor: hexToRgba(colors.textMuted, 0.05),
        },
        kycBanner: {
          backgroundColor: kycConfig.bgColor,
          padding: spacing.md,
          borderRadius: radius.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: spacing.sm,
        },
        kycText: {
          flex: 1,
          color: kycConfig.color,
          fontWeight: "600",
          fontSize: typography.fontSizeSm,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
        emptyState: {
          alignItems: "center",
          paddingVertical: spacing.xl * 2,
        },
        emptyText: {
          color: colors.textMuted,
          fontSize: typography.fontSizeMd,
          marginTop: spacing.md,
        },
        dateBtn: {
          borderWidth: 1,
          borderColor: colors.borderColor,
          borderRadius: radius.lg,
          backgroundColor: isEditing ? colors.cardSurface : hexToRgba(colors.textMuted, 0.05),
          paddingVertical: 14,
          paddingHorizontal: 12,
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          opacity: isEditing ? 1 : 0.7,
        },
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
        actionDropdown: {
          marginBottom: spacing.md,
        },
      }),
    [colors, spacing, radius, typography, isEditing, insets.bottom, kycConfig]
  );

  // Loading state
  if (tenantQuery.isLoading && !tenant) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.textMuted, marginTop: spacing.md }}>Loading tenant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          android_ripple={{ color: hexToRgba(colors.textSecondary, 0.2), borderless: true }}
        >
          <MaterialIcons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {str(tenant?.tenantName, "Tenant Profile")}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Room {str(tenant?.roomNumber, "—")} - {sharingType} Sharing
          </Text>
        </View>
        {activeTab === "Profile Details" && (
          <Pressable style={styles.editBtn} onPress={isEditing ? handleSave : toggleEdit} disabled={updateTenant.isPending}>
            {updateTenant.isPending ? (
              <ActivityIndicator size="small" color={isEditing ? "#FFFFFF" : colors.accent} />
            ) : (
              <Text style={styles.editBtnText}>{isEditing ? "Save Details" : "Edit Details"}</Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Tab Bar */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={(t) => setActiveTab(t as TabKey)} />

      {/* Tab Content */}
      {activeTab === "Profile Details" ? (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 110 : 0}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              style={styles.body}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.accent]} />}
            >
              {/* Status Banner */}
              {tenantStatus === 2 ? (
                <View style={[styles.kycBanner, { backgroundColor: hexToRgba("#F59E0B", 0.15) }]}>
                  <MaterialIcons name="schedule" size={24} color="#B45309" />
                  <Text style={[styles.kycText, { color: "#B45309" }]}>
                    Tenant Serving in Notice Period{"\n"}Move out Date - {formatDisplayDate(parseISODate(tenant?.moveOutDate))}
                  </Text>
                </View>
              ) : (
                <View style={styles.kycBanner}>
                  <MaterialIcons
                    name={kycStatus === 1 ? "check-circle" : kycStatus === 3 ? "error" : "warning"}
                    size={24}
                    color={kycConfig.color}
                  />
                  <Text style={styles.kycText}>{kycConfig.text}</Text>
                </View>
              )}

              {/* Action Dropdown */}
              <View style={styles.actionDropdown}>
                <SheetSelect
                  value=""
                  options={getActionOptions}
                  placeholder="Select Action"
                  onChange={handleActionSelect}
                  disabled={false}
                />
              </View>

              {/* Renting Details */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Renting Details</Text>

                <Labeled label="Tenant Name" required>
                  <TextInput
                    value={tenantName}
                    onChangeText={setTenantName}
                    mode="outlined"
                    placeholder="Enter tenant name"
                    editable={isEditing}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Tenant name"
                  />
                </Labeled>

                <Labeled label="Date of Joining" required>
                  <Pressable style={styles.dateBtn} onPress={isEditing ? openDatePicker : undefined} disabled={!isEditing}>
                    <MaterialIcons name="event" size={20} color={colors.textSecondary} />
                    <Text style={{ color: joiningDate ? colors.textPrimary : colors.textMuted, fontSize: typography.fontSizeMd, flex: 1 }}>
                      {formatDisplayDate(joiningDate)}
                    </Text>
                    {isEditing && <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />}
                  </Pressable>
                </Labeled>

                <Labeled label="Notice Period" required>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        value={noticePeriod}
                        onChangeText={(t) => setNoticePeriod(t.replace(/\D/g, ""))}
                        mode="outlined"
                        placeholder="e.g., 15"
                        keyboardType="numeric"
                        editable={isEditing}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                        theme={{ roundness: radius.lg }}
                        accessibilityLabel="Notice period"
                      />
                    </View>
                    <Text style={{ color: colors.textMuted, fontWeight: "600" }}>Days</Text>
                  </View>
                </Labeled>

                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Labeled label="Room No" required>
                      <TextInput
                        value={roomNumber}
                        onChangeText={setRoomNumber}
                        mode="outlined"
                        placeholder="Room"
                        editable={false}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.inputDisabled}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                        theme={{ roundness: radius.lg }}
                        accessibilityLabel="Room number"
                      />
                    </Labeled>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Labeled label="Bed No" required>
                      <TextInput
                        value={bedNumber}
                        onChangeText={setBedNumber}
                        mode="outlined"
                        placeholder="Bed"
                        editable={false}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.inputDisabled}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                        theme={{ roundness: radius.lg }}
                        accessibilityLabel="Bed number"
                      />
                    </Labeled>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Labeled label="Rent Amount" required>
                      <TextInput
                        value={rentAmount ? `₹ ${formatIndianNumber(num(rentAmount))}` : ""}
                        onChangeText={(t) => setRentAmount(t.replace(/[^0-9]/g, ""))}
                        mode="outlined"
                        placeholder="₹ 0"
                        keyboardType="numeric"
                        editable={isEditing}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                        theme={{ roundness: radius.lg }}
                        accessibilityLabel="Rent amount"
                      />
                    </Labeled>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Labeled label="Security Deposit" required>
                      <TextInput
                        value={depositAmount ? `₹ ${formatIndianNumber(num(depositAmount))}` : ""}
                        onChangeText={(t) => setDepositAmount(t.replace(/[^0-9]/g, ""))}
                        mode="outlined"
                        placeholder="₹ 0"
                        keyboardType="numeric"
                        editable={isEditing}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                        theme={{ roundness: radius.lg }}
                        accessibilityLabel="Security deposit"
                      />
                    </Labeled>
                  </View>
                </View>
              </View>

              {/* Personal Details */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Personal Details</Text>

                <Labeled label="Phone Number" required>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, "").slice(0, 10))}
                    mode="outlined"
                    placeholder="10 digit number"
                    keyboardType="phone-pad"
                    editable={isEditing}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Phone number"
                  />
                </Labeled>

                <Labeled label="Gender" required>
                  <RadioButton.Group onValueChange={isEditing ? setGender : () => {}} value={gender}>
                    <View style={{ flexDirection: "row", gap: spacing.lg }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <RadioButton value="Male" disabled={!isEditing} color={colors.accent} />
                        <Text style={{ color: colors.textPrimary }}>Male</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <RadioButton value="Female" disabled={!isEditing} color={colors.accent} />
                        <Text style={{ color: colors.textPrimary }}>Female</Text>
                      </View>
                    </View>
                  </RadioButton.Group>
                </Labeled>

                <Labeled label="Meal Type">
                  <SheetSelect value={mealType} options={MEAL_PREFERENCES} placeholder="Select meal preference" onChange={setMealType} disabled={!isEditing} />
                </Labeled>

                <Labeled label="Blood Group">
                  <SheetSelect value={bloodGroup} options={BLOOD_GROUPS} placeholder="Select blood group" onChange={setBloodGroup} disabled={!isEditing} />
                </Labeled>

                <Labeled label="Alternative Phone Number">
                  <TextInput
                    value={alternativeNumber}
                    onChangeText={(t) => setAlternativeNumber(t.replace(/\D/g, "").slice(0, 10))}
                    mode="outlined"
                    placeholder="10 digit number"
                    keyboardType="phone-pad"
                    editable={isEditing}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Alternative phone number"
                  />
                </Labeled>

                <Labeled label="Email">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={isEditing}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Email address"
                  />
                </Labeled>
              </View>

              {/* Work Details */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Work Details</Text>

                <Labeled label="Office / College Name">
                  <TextInput
                    value={workingName}
                    onChangeText={setWorkingName}
                    mode="outlined"
                    placeholder="Enter name"
                    editable={isEditing}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Office or college name"
                  />
                </Labeled>

                <Labeled label="Office / College Address">
                  <TextInput
                    value={workingAddress}
                    onChangeText={setWorkingAddress}
                    mode="outlined"
                    placeholder="Enter full address"
                    editable={isEditing}
                    multiline
                    numberOfLines={3}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 80, paddingVertical: 8, textAlignVertical: "top" }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Office or college address"
                  />
                </Labeled>

                <Labeled label="Permanent Address">
                  <TextInput
                    value={permanentAddress}
                    onChangeText={setPermanentAddress}
                    mode="outlined"
                    placeholder="Enter permanent address"
                    editable={isEditing}
                    multiline
                    numberOfLines={3}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 80, paddingVertical: 8, textAlignVertical: "top" }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Permanent address"
                  />
                </Labeled>
              </View>

              {/* Vehicle Details */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Vehicle Details</Text>

                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Labeled label="Vehicle Type">
                      <SheetSelect value={vehicleType} options={VEHICLE_TYPES} placeholder="Select type" onChange={setVehicleType} disabled={!isEditing} />
                    </Labeled>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Labeled label="Vehicle Number">
                      <TextInput
                        value={vehicleNumber}
                        onChangeText={setVehicleNumber}
                        mode="outlined"
                        placeholder="e.g., AP39QJ2345"
                        autoCapitalize="characters"
                        editable={isEditing}
                        outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                        activeOutlineColor={colors.accent}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.textMuted}
                        contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                        theme={{ roundness: radius.lg }}
                        accessibilityLabel="Vehicle number"
                      />
                    </Labeled>
                  </View>
                </View>
              </View>

              {/* Emergency Contact */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Emergency Contact</Text>

                <Labeled label="Contact Name">
                  <TextInput
                    value={emContactName}
                    onChangeText={setEmContactName}
                    mode="outlined"
                    placeholder="Enter name"
                    editable={isEditing}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Emergency contact name"
                  />
                </Labeled>

                <Labeled label="Contact Number">
                  <TextInput
                    value={emContactNumber}
                    onChangeText={(t) => setEmContactNumber(t.replace(/\D/g, "").slice(0, 10))}
                    mode="outlined"
                    placeholder="10 digit number"
                    keyboardType="phone-pad"
                    editable={isEditing}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Emergency contact number"
                  />
                </Labeled>

                <Labeled label="Relation">
                  <TextInput
                    value={emRelation}
                    onChangeText={setEmRelation}
                    mode="outlined"
                    placeholder="e.g., Father, Mother"
                    editable={isEditing}
                    outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                    contentStyle={{ minHeight: 48, paddingVertical: 8 }}
                    theme={{ roundness: radius.lg }}
                    accessibilityLabel="Relation with emergency contact"
                  />
                </Labeled>
              </View>

              {/* Documents Uploaded */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Documents Uploaded</Text>

                <FileUpload
                  label="Govt ID Proof"
                  value={idProof}
                  onChange={setIdProof}
                  existingUrl={idProof?.filePath ? toAbsoluteFileUrl(idProof.filePath) : undefined}
                />

                <FileUpload
                  label="Rental Agreement"
                  value={rentalAgreement}
                  onChange={setRentalAgreement}
                  existingUrl={rentalAgreement?.filePath ? toAbsoluteFileUrl(rentalAgreement.filePath) : undefined}
                />
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      ) : (
        /* Transactions Tab */
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.accent]} />}
        >
          {/* Stats */}
          <StatsGrid metrics={transactionStats} minVisible={2} />

          <Divider style={{ marginVertical: spacing.md, backgroundColor: colors.borderColor }} />

          {/* Due Payments */}
          <Text style={[styles.sectionTitle, { marginBottom: spacing.sm }]}>Due Payments</Text>

          {paymentsData.duePayments.length > 0 ? (
            paymentsData.duePayments.map((payment, idx) => (
              <TransactionCard key={str(payment?._id, String(idx))} payment={payment} propertyId={propertyId} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No pending dues</Text>
            </View>
          )}

          {/* Paid Payments */}
          {paymentsData.paidPayments.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Paid Payments</Text>
              {paymentsData.paidPayments.map((payment, idx) => (
                <TransactionCard key={str(payment?._id, String(idx))} payment={payment} propertyId={propertyId} />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Add Dues Button - only shown on Transactions tab */}
      {activeTab === "Transactions" && (
        <AddButton
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: `/protected/dues/${propertyId}`,
              params: { mode: "add", tenantId: tenantId },
            });
          }}
        />
      )}

      {/* Date Picker - Android */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker value={joiningDate || new Date()} mode="date" display="default" onChange={handleDateChange} />
      )}

      {/* Date Picker - iOS Modal */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={cancelIosDate}>
          <Pressable style={styles.datePickerModal} onPress={cancelIosDate}>
            <Pressable style={styles.datePickerContainer} onPress={() => {}}>
              <View style={styles.datePickerHeader}>
                <Pressable onPress={cancelIosDate} style={styles.datePickerBtn}>
                  <Text style={[styles.datePickerBtnText, { color: colors.error }]}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>Date of Joining</Text>
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

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        onCancel={closeModal}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        showReasonInput={modalConfig.type === "REJECT_KYC"}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        showCheckoutInputs={modalConfig.type === "CHECKOUT_TENANT"}
        paidDeposit={num(tenant?.collectedDeposit)}
        refundAmount={refundAmount}
        onRefundChange={setRefundAmount}
        refundError={refundError}
        showNoticeInputs={modalConfig.type === "GIVE_NOTICE"}
        moveOutDate={moveOutDate}
        onMoveOutDateChange={setMoveOutDate}
      />

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: colors.cardBackground }}
        action={{ label: "OK", onPress: () => setSnackbarVisible(false), textColor: colors.accent }}
      >
        <Text style={{ color: colors.textPrimary }}>{snackbarMessage}</Text>
      </Snackbar>
    </SafeAreaView>
  );
}
