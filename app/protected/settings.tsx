// app/protected/settings.tsx
// Settings Screen Placeholder
import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  I18nManager,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ─────────────────────────────────────────────────────────────────────────────
   SETTING ITEM COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  type?: "toggle" | "chevron" | "value";
  value?: boolean | string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

const SettingItem = React.memo<SettingItemProps>(
  ({ icon, title, subtitle, type = "chevron", value, onPress, onToggle }) => {
    const { colors, spacing, radius } = useTheme();

    return (
      <Pressable
        onPress={() => {
          if (type !== "toggle" && onPress) {
            Haptics.selectionAsync();
            onPress();
          }
        }}
        disabled={type === "toggle"}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 16,
            paddingHorizontal: spacing.md,
            gap: 14,
            backgroundColor:
              pressed && type !== "toggle"
                ? hexToRgba(colors.textSecondary, 0.05)
                : "transparent",
          },
        ]}
        accessibilityRole={type === "toggle" ? "switch" : "button"}
        accessibilityLabel={title}
        accessibilityState={type === "toggle" ? { checked: value as boolean } : undefined}
        accessible
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: hexToRgba(colors.accent, 0.1),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon as never} size={20} color={colors.accent} />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "500",
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right element */}
        {type === "toggle" ? (
          <Switch
            value={value as boolean}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              onToggle?.(v);
            }}
            trackColor={{
              false: hexToRgba(colors.textSecondary, 0.3),
              true: hexToRgba(colors.accent, 0.5),
            }}
            thumbColor={value ? colors.accent : colors.surface}
            ios_backgroundColor={hexToRgba(colors.textSecondary, 0.3)}
          />
        ) : type === "value" ? (
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            {value as string}
          </Text>
        ) : (
          <MaterialIcons
            name={I18nManager.isRTL ? "chevron-left" : "chevron-right"}
            size={22}
            color={colors.textMuted}
          />
        )}
      </Pressable>
    );
  }
);

SettingItem.displayName = "SettingItem";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  // Handlers
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textSecondary, 0.1),
          gap: 12,
        },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: hexToRgba(colors.textSecondary, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitle: {
          flex: 1,
          fontSize: 20,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        content: {
          flex: 1,
        },
        scrollContent: {
          paddingBottom: insets.bottom + spacing.lg,
        },
        sectionCard: {
          marginHorizontal: spacing.md,
          marginTop: spacing.lg,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.05,
          shadowRadius: 12,
          elevation: 4,
        },
        sectionHeader: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        },
        sectionTitle: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        separator: {
          height: 1,
          backgroundColor: hexToRgba(colors.textSecondary, 0.08),
          marginHorizontal: spacing.md,
        },
        comingSoon: {
          marginHorizontal: spacing.md,
          marginTop: spacing.xl * 2,
          alignItems: "center",
        },
        comingSoonIcon: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
        },
        comingSoonTitle: {
          fontSize: 18,
          fontWeight: "600",
          color: colors.textPrimary,
          marginBottom: 8,
        },
        comingSoonText: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          paddingHorizontal: spacing.lg,
        },
      }),
    [colors, spacing, radius, insets.bottom]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          android_ripple={{ color: hexToRgba(colors.textSecondary, 0.2), borderless: true }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Navigate to previous screen"
          accessible
        >
          <MaterialIcons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={colors.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* General Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>General</Text>
          </View>
          <SettingItem
            icon="language-outline"
            title="Language"
            type="value"
            value="English"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <SettingItem
            icon="globe-outline"
            title="Region"
            type="value"
            value="India"
            onPress={() => {}}
          />
        </View>

        {/* Notifications Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive push notifications"
            type="toggle"
            value={true}
            onToggle={() => {}}
          />
          <View style={styles.separator} />
          <SettingItem
            icon="mail-outline"
            title="Email Notifications"
            subtitle="Receive email updates"
            type="toggle"
            value={true}
            onToggle={() => {}}
          />
          <View style={styles.separator} />
          <SettingItem
            icon="cash-outline"
            title="Payment Alerts"
            subtitle="Get notified for payments"
            type="toggle"
            value={true}
            onToggle={() => {}}
          />
        </View>

        {/* Display Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Display</Text>
          </View>
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Use dark theme"
            type="toggle"
            value={false}
            onToggle={() => {}}
          />
          <View style={styles.separator} />
          <SettingItem
            icon="text-outline"
            title="Font Size"
            type="value"
            value="Medium"
            onPress={() => {}}
          />
        </View>

        {/* Coming Soon */}
        <View style={styles.comingSoon}>
          <View style={styles.comingSoonIcon}>
            <Ionicons name="construct-outline" size={36} color={colors.accent} />
          </View>
          <Text style={styles.comingSoonTitle}>More Settings Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            We're working on more customization options. Stay tuned!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

