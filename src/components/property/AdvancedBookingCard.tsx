// src/components/property/AdvancedBookingCard.tsx
// Premium Advanced Booking Card - Compact, user-friendly design with inline actions
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  Animated,
  useWindowDimensions,
  LayoutAnimation,
  UIManager,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  Portal,
  Dialog,
  Button,
  TextInput as PaperTextInput,
  Text as PaperText,
} from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useUpdateTenant } from "@/src/hooks/tenants";
import { useInsertPayment } from "@/src/hooks/payments";

// Note: LayoutAnimation works without this in New Architecture

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const num = (v: unknown, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || f;
const str = (v: unknown, f = "") => (v == null ? f : String(v));

// Status definitions
const STATUS_CONFIG: Record<number, { label: string; color: string; icon: string }> = {
  3: { label: "Active", color: "#10B981", icon: "calendar-check" },
  5: { label: "Expired", color: "#EF4444", icon: "calendar-remove" },
  6: { label: "Cancelled", color: "#6B7280", icon: "close-circle" },
};

// Tenant data extractors
const tId = (t: Record<string, unknown>) => str(t?._id ?? t?.id, "");
const tName = (t: Record<string, unknown>) => str(t?.tenantName ?? t?.name, "—");
const tPhone = (t: Record<string, unknown>) => str(t?.phoneNumber ?? t?.phone, "—");
const tRoom = (t: Record<string, unknown>) => str(t?.roomNumber ?? t?.room, "—");
const tBed = (t: Record<string, unknown>) => str(t?.bedNumber ?? t?.bedNo ?? "", "");
const tRent = (t: Record<string, unknown>) => num(t?.rentAmount ?? 0);
const tDeposit = (t: Record<string, unknown>) => num(t?.depositAmount ?? 0);
const tAdvRent = (t: Record<string, unknown>) => num(t?.advanceRentAmountPaid ?? 0);
const tAdvDeposit = (t: Record<string, unknown>) => num(t?.advanceDepositAmountPaid ?? 0);

const formatCurrency = (amount: number): string =>
  `₹${amount.toLocaleString("en-IN")}`;

const parseDate = (v: unknown): Date | null => {
  try {
    const s = str(v, "");
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const formatDate = (v: unknown): string => {
  const d = parseDate(v);
  if (!d) return "—";
  try {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
};

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

interface Props {
  tenant: Record<string, unknown>;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onConvertToTenant?: (tenant: Record<string, unknown>) => void;
  onReceipt?: (tenant: Record<string, unknown>) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ACTION BUTTON COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface ActionBtnProps {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  bgColor: string;
  disabled?: boolean;
}

const ActionBtn: React.FC<ActionBtnProps> = ({
  icon,
  label,
  onPress,
  color,
  bgColor,
  disabled,
}) => {
  const { radius } = useTheme();

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: radius.md,
        backgroundColor: pressed ? hexToRgba(color, 0.2) : bgColor,
        opacity: disabled ? 0.5 : 1,
        minHeight: 48,
      })}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons
        name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={20}
        color={color}
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: color,
          marginTop: 3,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const AdvancedBookingCard: React.FC<Props> = ({
  tenant,
  onEdit,
  onConvertToTenant,
  onReceipt,
}) => {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Responsive columns
  const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
  const GAP = spacing.md - 2;
  const SIDE = spacing.md * 2;
  const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

  // State
  const [expanded, setExpanded] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [refundAmountText, setRefundAmountText] = useState("");

  // Animation
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // API hooks
  const updateTenantMutation = useUpdateTenant(() => {
    setCancelModalVisible(false);
  });

  const insertPaymentMutation = useInsertPayment(() => {});

  // Derived values
  const id = tId(tenant);
  const name = tName(tenant);
  const phone = tPhone(tenant);
  const room = tRoom(tenant);
  const bed = tBed(tenant);
  const rent = tRent(tenant);
  const deposit = tDeposit(tenant);
  const advRent = tAdvRent(tenant);
  const advDeposit = tAdvDeposit(tenant);
  const status = num(tenant?.status, 3);
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG[3];

  const bookingDate = formatDate(tenant?.bookingDate);
  const joiningDate = formatDate(tenant?.joiningDate ?? tenant?.joinedOn ?? tenant?.joinDate);

  const totalAdvancePaid = advRent + advDeposit;
  const hasAdvancePayment = totalAdvancePaid > 0;
  const isActive = status === 3;
  const isCancelled = status === 6;
  const initials = getInitials(name);

  // Handlers
  const handleToggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onEdit) {
      onEdit(id);
    } else {
      router.push({
        pathname: "/protected/advancedBooking/[id]",
        params: { id, mode: "edit" },
      });
    }
  }, [onEdit, id, router]);

  const handleConvert = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onConvertToTenant) {
      onConvertToTenant(tenant);
    } else {
      router.push({
        pathname: "/protected/advancedBooking/[id]",
        params: { id, mode: "convert" },
      });
    }
  }, [onConvertToTenant, tenant, router, id]);

  const handleReceipt = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onReceipt) {
      onReceipt(tenant);
    } else {
      Alert.alert("Receipt", "Receipt feature will be available soon.", [{ text: "OK" }]);
    }
  }, [onReceipt, tenant]);

  const handleOpenCancelModal = useCallback(() => {
    setRefundAmountText("");
    setCancelModalVisible(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    if (!id) {
      Alert.alert("Error", "Unable to identify booking record.");
      return;
    }

    const rawRefund = refundAmountText.trim().replace(/[^\d]/g, "");
    const hasRefund = rawRefund.length > 0 && Number(rawRefund) > 0;

    const formData = new FormData();
    formData.append("status", "6");
    formData.append("refundAmount", hasRefund ? rawRefund : "0");

    updateTenantMutation.mutate(
      { formData, tenantId: id },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCancelModalVisible(false);
        },
        onError: (error) => {
          const errMsg =
            (error as { message?: string })?.message ||
            "Failed to cancel booking. Please try again.";
          Alert.alert("Error", errMsg);
        },
      }
    );

    if (hasRefund) {
      const roomId = str(
        (tenant?.roomId as Record<string, unknown>)?._id ??
          tenant?.roomId ??
          (tenant?.room as Record<string, unknown>)?.id ??
          "",
        ""
      );
      const propertyId = str(
        (tenant?.propertyId as Record<string, unknown>)?._id ??
          tenant?.propertyId ??
          "",
        ""
      );
      const createdBy = str(tenant?.createdBy ?? tenant?.ownerId ?? "", "");

      const paymentPayload = {
        status: 3,
        tenantId: id,
        roomId,
        amount: rawRefund,
        paymentCategory: "Refund",
        propertyId,
        paymentMode: "cash",
        description: "Advance booking amount refunded to tenant",
        createdBy,
      };

      insertPaymentMutation.mutate(paymentPayload);
    }
  }, [id, refundAmountText, updateTenantMutation, insertPaymentMutation, tenant]);

  const isMutating = updateTenantMutation.isPending || insertPaymentMutation.isPending;

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardOuter: {
          width: cardW,
          borderRadius: radius.lg,
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: Platform.OS === "ios"
            ? hexToRgba(colors.textMuted, 0.12)
            : hexToRgba(colors.textMuted, 0.08),
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: Platform.OS === "ios" ? 0.12 : 0.06,
          shadowRadius: Platform.OS === "ios" ? 10 : 8,
          elevation: 4,
          overflow: "hidden",
        },
        // Top section with status indicator
        topRow: {
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.md,
          gap: spacing.sm + 2,
        },
        statusIndicator: {
          width: 4,
          height: 52,
          borderRadius: 2,
          backgroundColor: statusConfig.color,
        },
        avatarContainer: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: hexToRgba(statusConfig.color, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        avatarText: {
          fontSize: 16,
          fontWeight: "700",
          color: statusConfig.color,
        },
        mainInfo: {
          flex: 1,
        },
        nameRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        name: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.textPrimary,
          flex: 1,
        },
        statusBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: hexToRgba(statusConfig.color, 0.12),
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: radius.sm,
        },
        statusText: {
          fontSize: 11,
          fontWeight: "700",
          color: statusConfig.color,
        },
        phone: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 2,
        },
        amountBadge: {
          backgroundColor: hexToRgba(colors.accent, 0.1),
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: radius.md,
          alignItems: "flex-end",
        },
        amountLabel: {
          fontSize: 10,
          color: colors.textSecondary,
        },
        amountValue: {
          fontSize: 14,
          fontWeight: "800",
          color: hasAdvancePayment ? "#10B981" : colors.textPrimary,
        },
        // Info chips row
        chipsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm + 2,
        },
        chip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: colors.surface,
          paddingHorizontal: 8,
          paddingVertical: 5,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textMuted, 0.06),
        },
        chipText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        chipValue: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        // Expand toggle
        expandToggle: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: hexToRgba(colors.textMuted, 0.08),
          gap: 6,
        },
        expandText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
        },
        // Expanded actions
        actionsRow: {
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          paddingTop: spacing.xs,
        },
        // Cancel modal
        cancelInfoRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 6,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textMuted, 0.1),
        },
        cancelInfoLabel: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        cancelInfoValue: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.textPrimary,
        },
      }),
    [colors, spacing, radius, cardW, statusConfig, hasAdvancePayment]
  );

  return (
    <>
      <View style={styles.cardOuter}>
        {/* Main card content */}
        <Pressable
          onPress={handleToggleExpand}
          android_ripple={{ color: hexToRgba(colors.primary, 0.05) }}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${statusConfig.label}, Room ${room}`}
          accessibilityHint="Tap to show actions"
        >
          {/* Top row */}
          <View style={styles.topRow}>
            <View style={styles.statusIndicator} />

            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.mainInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <View style={styles.statusBadge}>
                  <MaterialCommunityIcons
                    name={statusConfig.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={12}
                    color={statusConfig.color}
                  />
                  <Text style={styles.statusText}>{statusConfig.label}</Text>
                </View>
              </View>
              <Text style={styles.phone}>{phone}</Text>
            </View>

            <View style={styles.amountBadge}>
              <Text style={styles.amountLabel}>Advance</Text>
              <Text style={styles.amountValue}>{formatCurrency(totalAdvancePaid)}</Text>
            </View>
          </View>

          {/* Info chips */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="door" size={12} color={colors.textMuted} />
              <Text style={styles.chipText}>Room</Text>
              <Text style={styles.chipValue}>{room}</Text>
            </View>
            {bed && (
              <View style={styles.chip}>
                <MaterialCommunityIcons name="bed" size={12} color={colors.textMuted} />
                <Text style={styles.chipText}>Bed</Text>
                <Text style={styles.chipValue}>{bed}</Text>
              </View>
            )}
            <View style={styles.chip}>
              <MaterialCommunityIcons name="calendar-plus" size={12} color={colors.textMuted} />
              <Text style={styles.chipText}>Booked</Text>
              <Text style={styles.chipValue}>{bookingDate}</Text>
            </View>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="calendar-arrow-right" size={12} color={colors.accent} />
              <Text style={styles.chipText}>Join</Text>
              <Text style={[styles.chipValue, { color: colors.accent }]}>{joiningDate}</Text>
            </View>
          </View>

          {/* Expand toggle */}
          <View style={styles.expandToggle}>
            <Text style={styles.expandText}>{expanded ? "Hide actions" : "Tap for actions"}</Text>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </View>
        </Pressable>

        {/* Expanded actions */}
        {expanded && (
          <View style={styles.actionsRow}>
            <ActionBtn
              icon="pencil"
              label="Edit"
              onPress={handleEdit}
              color={colors.accent}
              bgColor={hexToRgba(colors.accent, 0.1)}
            />

            {/* Convert to Tenant - available for Active (3) and Cancelled (6) */}
            {(isActive || isCancelled) && (
              <ActionBtn
                icon="account-convert"
                label="Convert"
                onPress={handleConvert}
                color="#8B5CF6"
                bgColor={hexToRgba("#8B5CF6", 0.1)}
              />
            )}

            {/* Receipt - only when advance payment exists */}
            {hasAdvancePayment && (
              <ActionBtn
                icon="receipt"
                label="Receipt"
                onPress={handleReceipt}
                color="#0EA5E9"
                bgColor={hexToRgba("#0EA5E9", 0.1)}
              />
            )}

            {/* Cancel Booking - only for Active */}
            {isActive && (
              <ActionBtn
                icon="calendar-remove"
                label="Cancel"
                onPress={handleOpenCancelModal}
                color="#EF4444"
                bgColor={hexToRgba("#EF4444", 0.1)}
              />
            )}
          </View>
        )}
      </View>

      {/* Cancel Booking Modal */}
      <Portal>
        <Dialog
          visible={cancelModalVisible}
          onDismiss={() => setCancelModalVisible(false)}
          style={{ backgroundColor: colors.cardBackground, borderRadius: 16 }}
        >
          <Dialog.Title style={{ color: colors.textPrimary, fontWeight: "700" }}>
            Cancel Booking
          </Dialog.Title>
          <Dialog.Content>
            <View style={{ gap: spacing.sm }}>
              <PaperText style={{ color: colors.textSecondary, marginBottom: spacing.xs }}>
                Are you sure you want to cancel this booking for {name}?
              </PaperText>

              <View style={styles.cancelInfoRow}>
                <Text style={styles.cancelInfoLabel}>Adv. Rent Paid</Text>
                <Text style={styles.cancelInfoValue}>{formatCurrency(advRent)}</Text>
              </View>

              <View style={styles.cancelInfoRow}>
                <Text style={styles.cancelInfoLabel}>Adv. Deposit Paid</Text>
                <Text style={styles.cancelInfoValue}>{formatCurrency(advDeposit)}</Text>
              </View>

              <View style={[styles.cancelInfoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.cancelInfoLabel}>Total Paid</Text>
                <Text style={[styles.cancelInfoValue, { color: colors.accent }]}>
                  {formatCurrency(totalAdvancePaid)}
                </Text>
              </View>

              <PaperTextInput
                label="Refund Amount (optional)"
                mode="outlined"
                value={refundAmountText}
                onChangeText={setRefundAmountText}
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                style={{ backgroundColor: colors.cardSurface, marginTop: spacing.xs }}
                textColor={colors.textPrimary}
                left={<PaperTextInput.Affix text="₹" />}
              />
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                Leave blank if no refund is required.
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setCancelModalVisible(false)}
              textColor={colors.textPrimary}
              disabled={isMutating}
            >
              Go Back
            </Button>
            <Button
              onPress={handleConfirmCancel}
              loading={isMutating}
              textColor={colors.error}
              disabled={isMutating}
            >
              Cancel Booking
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

export default AdvancedBookingCard;
