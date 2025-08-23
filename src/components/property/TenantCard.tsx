// import React, { useMemo } from "react";
// import { View, Text, StyleSheet, Image, Pressable, useWindowDimensions } from "react-native";
// import * as Haptics from "expo-haptics";
// import { Tenant } from "@/src/constants/mockTenants";
// import { useTheme } from "@/src/theme/ThemeContext";
// import { hexToRgba } from "@/src/theme";

// /* ------------------------------------------------------------------ */
// /*  STATUS → COLOUR MAP (theme-aware)                                  */
// /* ------------------------------------------------------------------ */
// const statusTint = (colors: any) => ({
//   Active: colors.success,
//   Dues: colors.error,
//   "Under Notice": colors.advBookedBeds,
// });

// /* ------------------------------------------------------------------ */
// /*  COMPONENT                                                          */
// /* ------------------------------------------------------------------ */
// interface Props {
//   tenant: Tenant;
//   onPress?: () => void;
// }

// const TenantCard: React.FC<Props> = ({ tenant, onPress }) => {
//   const { width } = useWindowDimensions();
//   const { colors, spacing, radius, shadow } = useTheme();

//   /* responsive width (same calculation used elsewhere) */
//   const COLS = width >= 1000 ? 3 : width >= 740 ? 2 : 1;
//   const GAP = spacing.md - 2;
//   const SIDE = spacing.md * 2;
//   const cardW = (width - SIDE - GAP * (COLS - 1)) / COLS;

//   const STATUS_COLORS = useMemo(() => statusTint(colors), [colors]);

//   /* ---------- styles (memo) ---------- */
//   const s = useMemo(
//     () =>
//       StyleSheet.create({
//         wrap: {
//           width: cardW,
//           borderRadius: radius.lg,
//           backgroundColor: colors.cardBackground,
//           padding: spacing.md,
//           shadowColor: shadow,
//           shadowOffset: { width: 0, height: 6 },
//           shadowOpacity: 0.08,
//           shadowRadius: 8,
//           borderWidth: 1,
//           borderColor: colors.borderColor,
//         },

//         /* top row */
//         topRow: { flexDirection: "row", alignItems: "center" },
//         avatar: {
//           width: 54,
//           height: 54,
//           borderRadius: 27,
//           backgroundColor: colors.surface,
//         },
//         info: { marginLeft: spacing.sm, flex: 1 },
//         name: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
//         phone: { fontSize: 13, color: colors.textSecondary },

//         rentBlock: { alignItems: "flex-end" },
//         rent: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
//         dues: { fontSize: 13, color: colors.error, marginTop: 2 },

//         /* bottom row */
//         bottomRow: {
//           flexDirection: "row",
//           flexWrap: "wrap",
//           gap: 8,
//           marginTop: spacing.md - 2,
//         },
//         badge: {
//           backgroundColor: colors.surface,
//           borderRadius: radius.md,
//           paddingHorizontal: spacing.sm,
//           paddingVertical: 3,
//         },
//         badgeTxt: { fontSize: 12, color: colors.textSecondary },

//         statusBadge: (bg: string) => ({
//           backgroundColor: bg,
//           borderRadius: radius.md,
//           paddingHorizontal: spacing.sm,
//           paddingVertical: 3,
//         }),
//         statusTxt: { fontSize: 12, color: colors.white, fontWeight: "600" },
//       }),
//     [colors, spacing, radius, cardW, shadow]
//   );

//   /* ---------- render ---------- */
//   return (
//     <Pressable
//       onPress={() => {
//         Haptics.selectionAsync();
//         onPress?.();
//       }}
//       android_ripple={{ color: hexToRgba(colors.primary, 0.07) }}
//       style={s.wrap}
//     >
//       {/* -- top row */}
//       <View style={s.topRow}>
//         <Image source={{ uri: tenant.imageUri }} style={s.avatar} />
//         <View style={s.info}>
//           <Text style={s.name}>{tenant.name}</Text>
//           <Text style={s.phone}>{tenant.phone}</Text>
//         </View>
//         <View style={s.rentBlock}>
//           <Text style={s.rent}>₹{tenant.rent.toLocaleString()}</Text>
//           {tenant.dues > 0 && <Text style={s.dues}>Due: ₹{tenant.dues.toLocaleString()}</Text>}
//         </View>
//       </View>

//       {/* -- bottom row */}
//       <View style={s.bottomRow}>
//         <View style={s.badge}>
//           <Text style={s.badgeTxt}>Room: {tenant.room}</Text>
//         </View>
//         <View style={s.badge}>
//           <Text style={s.badgeTxt}>{tenant.sharing} Sharing</Text>
//         </View>
//         <View style={s.statusBadge(STATUS_COLORS[tenant.status])}>
//           <Text style={s.statusTxt}>{tenant.status}</Text>
//         </View>
//       </View>
//     </Pressable>
//   );
// };

// export default TenantCard;
// src/components/property/TenantCard.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Menu, IconButton, Portal, Dialog, Button, Snackbar } from "react-native-paper";
import { Tenant } from "@/src/constants/mockTenants";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* status tint */
const statusTint = (colors: any) => ({
  Active: colors.success,
  Dues: colors.error,
  "Under Notice": colors.advBookedBeds,
});

interface Props {
  tenant: Tenant;
  onDelete?: (id: string) => void; // provided by list screen
}

const TenantCard: React.FC<Props> = ({ tenant, onDelete }) => {
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
        rentBlock: { alignItems: "flex-end" },
        rent: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
        dues: { fontSize: 13, color: colors.error, marginTop: 2 },
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
      }),
    [colors, spacing, radius, shadow]
  );

  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState(false);

  return (
    <View style={s.wrap}>
      {/* top row with 3-dot menu */}
      <View style={[s.row, { marginBottom: spacing.sm }]}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push({
              pathname: "/protected/tenant/TenantProfileDetails",
              params: { id: tenant.id },
            });
          }}
          style={[s.row, { flex: 1 }]}
          android_ripple={{ color: hexToRgba(colors.primary, 0.07) }}
        >
          <Image source={{ uri: tenant.imageUri }} style={s.avatar} />
          <View style={s.info}>
            <Text style={s.name}>{tenant.name}</Text>
            <Text style={s.phone}>{tenant.phone}</Text>
          </View>
          <View style={s.rentBlock}>
            <Text style={s.rent}>₹{tenant.rent.toLocaleString()}</Text>
            {tenant.dues > 0 && <Text style={s.dues}>Due: ₹{tenant.dues.toLocaleString()}</Text>}
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
              router.push({ pathname: "/protected/tenant/[id]", params: { id: tenant.id } });
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

      {/* bottom row */}
      <View style={s.bottomRow}>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>Room: {tenant.room}</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{tenant.sharing} Sharing</Text>
        </View>
        <View style={s.statusBadge(STATUS_COLORS[tenant.status])}>
          <Text style={s.statusTxt}>{tenant.status}</Text>
        </View>
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
                onDelete?.(tenant.id);
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

export default TenantCard;
