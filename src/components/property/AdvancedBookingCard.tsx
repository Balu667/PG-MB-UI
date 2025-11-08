// src/components/property/AdvancedBookingCard.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Menu, IconButton, Portal, Dialog, Button, Snackbar } from "react-native-paper";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

const num = (v: any, f = 0) => (typeof v === "number" ? v : Number(v ?? f)) || 0;
const str = (v: any, f = "") => (v == null ? f : String(v));

/** status label from code (same as TenantCard) */
const statusLabelFromCode = (code: any): string => {
  switch (num(code)) {
    case 1:
      return "Active";
    case 2:
      return "Under Notice";
    case 3:
      return "Adv Booking";
    case 5:
      return "Expired Booking";
    case 6:
      return "Canceled Booking";
    default:
      return "";
  }
};

/** palette mapping like TenantCard */
const statusTint = (colors: any) => ({
  "Adv Booking": colors.advBookedBeds,
  "Expired Booking": colors.error,
  "Canceled Booking": colors.error,
  "Under Notice": colors.underNoticeBeds ?? colors.advBookedBeds,
  Active: colors.success,
});

const tId = (t: any) => str(t?._id ?? t?.id, "");
const tName = (t: any) => str(t?.tenantName ?? t?.name, "—");
const tPhone = (t: any) => str(t?.phoneNumber ?? t?.phone, "—");
const tRoom = (t: any) => str(t?.roomNumber ?? t?.room, "—");
const tBed = (t: any) => str(t?.bedNumber ?? t?.bedNo ?? "", "");
const tSharingType = (t: any) => num(t?.sharingType ?? t?.sharing ?? 0);

const tImage = (t: any) => {
  const arr = Array.isArray(t?.profilePic) ? t.profilePic : [];
  const fp = arr?.[0]?.filePath ? String(arr[0].filePath) : null;
  return fp || t?.imageUri || "https://via.placeholder.com/54";
};

const sumAdvancePaid = (t: any) => num(t?.advanceRentAmountPaid) + num(t?.advanceDepositAmountPaid);

/** prefer correct joiningDate, bookingDate as-is */
const parseDate = (v: any) => {
  try {
    const s = str(v, "");
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const formatDate = (v: any) => {
  const d = parseDate(v);
  if (!d) return "—";
  try {
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d.toISOString().slice(0, 10);
  }
};

interface Props {
  tenant: any;
  onDelete?: (id: string) => void;
}

const AdvancedBookingCard: React.FC<Props> = ({ tenant, onDelete }) => {
  const { colors, spacing, radius, shadow } = useTheme();
  const router = useRouter();
  const STATUS_COLORS = useMemo(() => statusTint(colors), [colors]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          borderRadius: radius.lg,
          backgroundColor: colors.cardBackground,
          padding: spacing.md,
          shadowColor: shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          borderWidth: 1,
          borderColor: colors.borderColor,
        },
        row: { flexDirection: "row", alignItems: "center" },
        avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.surface },
        info: { marginLeft: spacing.sm, flex: 1 },
        name: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
        phone: { fontSize: 13, color: colors.textSecondary },
        amtBlock: { alignItems: "flex-end" },
        amt: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
        bottomRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.md - 2 },
        badge: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
        },
        badgeTxt: { fontSize: 12, color: colors.textSecondary },
        statusBadge: (bg: string) => ({
          backgroundColor: bg,
          borderRadius: radius.md,
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
        }),
        statusTxt: { fontSize: 12, color: colors.white, fontWeight: "600" },
        activeTxt: { fontSize: 12, fontWeight: "700", color: colors.success }, // green “(Active)”
      }),
    [colors, spacing, radius, shadow]
  );

  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState(false);

  const id = tId(tenant);
  const statusLabel = statusLabelFromCode(tenant?.status);
  const advPaid = sumAdvancePaid(tenant);
  const booking = formatDate(tenant?.bookingDate);
  const joining = formatDate(tenant?.joiningDate ?? tenant?.joinedOn ?? tenant?.joinDate);

  const isAdvBooking = num(tenant?.status) === 3;

  return (
    <View style={s.wrap}>
      {/* top row */}
      <View style={[s.row, { marginBottom: spacing.sm }]}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push({
              pathname: "/protected/tenant/TenantProfileDetails",
              params: { id },
            });
          }}
          style={[s.row, { flex: 1 }]}
          android_ripple={{ color: hexToRgba(colors.primary, 0.07) }}
        >
          <Image source={{ uri: tImage(tenant) }} style={s.avatar} />
          <View style={s.info}>
            <Text style={s.name}>{tName(tenant)}</Text>
            <Text style={s.phone}>{tPhone(tenant)}</Text>
          </View>
          <View style={s.amtBlock}>
            <Text style={s.amt}>₹{advPaid.toLocaleString("en-IN")}</Text>
          </View>
        </Pressable>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/protected/tenant/[id]", params: { id } });
            }}
            title="Edit"
            leadingIcon="pencil"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              setConfirmOpen(true);
            }}
            title="Delete"
            leadingIcon="delete"
          />
        </Menu>
      </View>

      {/* bottom badges: Booking, Joining, Room, Bed, Sharing, Status */}
      <View style={s.bottomRow}>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>Booking: {booking}</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>Joining: {joining}</Text>
        </View>

        {!!tRoom(tenant) && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>Room: {tRoom(tenant)}</Text>
          </View>
        )}
        {!!tBed(tenant) && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>Bed: {tBed(tenant)}</Text>
          </View>
        )}
        {!!tSharingType(tenant) && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>Sharing: {tSharingType(tenant)}</Text>
          </View>
        )}

        {!!statusLabel && (
          <>
            <View style={s.statusBadge(STATUS_COLORS[statusLabel] ?? colors.accent)}>
              <Text style={s.statusTxt}>{statusLabel}</Text>
            </View>
            {/* 👇 Extra green hint for status 3 */}
            {isAdvBooking && <Text style={s.activeTxt}>(Active)</Text>}
          </>
        )}
      </View>

      {/* Delete confirm */}
      <Portal>
        <Dialog visible={confirmOpen} onDismiss={() => setConfirmOpen(false)}>
          <Dialog.Title>Delete Tenant</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.textSecondary }}>
              Delete this tenant? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              textColor={colors.white}
              buttonColor={colors.error}
              onPress={() => {
                setConfirmOpen(false);
                onDelete?.(id);
                setSnack(true);
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={snack} onDismiss={() => setSnack(false)} duration={1200}>
        Tenant deleted
      </Snackbar>
    </View>
  );
};

export default AdvancedBookingCard;
