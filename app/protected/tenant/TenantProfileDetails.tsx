// app/protected/tenant/TenantProfileDetails.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { getTenantById } from "@/src/constants/tenantMock";
import { Button } from "react-native-paper";
import { hexToRgba } from "@/src/theme";

export default function TenantProfileDetails() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();

  const tenant = useMemo(() => (id ? getTenantById(id) : undefined), [id]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        header: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
          backgroundColor: colors.background,
        },
        title: { color: colors.textPrimary, fontWeight: "700", fontSize: typography.fontSizeLg },
        body: { padding: spacing.md },
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderColor,
        },
        label: { color: colors.textSecondary, fontSize: 12, marginTop: 6 },
        value: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
        topBtn: { marginTop: spacing.md, borderRadius: radius.lg, alignSelf: "flex-start" },
      }),
    [colors, spacing, radius, typography]
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Tenant Details</Text>
        {id ? (
          <Button
            mode="contained"
            style={s.topBtn}
            onPress={() => router.push({ pathname: "/protected/tenant/[id]", params: { id } })}
          >
            Edit
          </Button>
        ) : null}
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.card}>
          <Text style={s.label}>Name</Text>
          <Text style={s.value}>{tenant?.name || "-"}</Text>

          <Text style={s.label}>Phone</Text>
          <Text style={s.value}>{tenant?.phone || "-"}</Text>

          <Text style={s.label}>Room</Text>
          <Text style={s.value}>{tenant?.room || "-"}</Text>

          <Text style={s.label}>Bed</Text>
          <Text style={s.value}>{tenant?.bedNo || "-"}</Text>

          <Text style={s.label}>Rent</Text>
          <Text style={s.value}>{tenant ? `₹${tenant.rent.toLocaleString()}` : "-"}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
