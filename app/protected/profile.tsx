// app/protected/profile.tsx
// Premium Profile Screen with user info, settings, and logout
import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  I18nManager,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { persistor } from "@/src/redux/store";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

interface MenuItemProps {
  icon: string;
  iconFamily?: "material" | "ionicons" | "material-community";
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
  badge?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MENU ITEM COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const MenuItem = React.memo<MenuItemProps>(
  ({ icon, iconFamily = "material", title, subtitle, onPress, showChevron = true, danger, badge }) => {
    const { colors, spacing, radius } = useTheme();

    const IconComponent =
      iconFamily === "ionicons"
        ? Ionicons
        : iconFamily === "material-community"
        ? MaterialCommunityIcons
        : MaterialIcons;

    const iconColor = danger ? colors.error : colors.accent;
    const iconBg = danger
      ? hexToRgba(colors.error, 0.1)
      : hexToRgba(colors.accent, 0.1);

    return (
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 16,
            paddingHorizontal: spacing.md,
            gap: 14,
            backgroundColor: pressed ? hexToRgba(colors.textSecondary, 0.05) : "transparent",
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={subtitle}
        accessible
      >
        {/* Icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent name={icon as never} size={22} color={iconColor} />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: danger ? colors.error : colors.textPrimary,
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

        {/* Badge */}
        {badge && (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radius.full,
              backgroundColor: hexToRgba(colors.accent, 0.15),
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.accent,
              }}
            >
              {badge}
            </Text>
          </View>
        )}

        {/* Chevron */}
        {showChevron && !danger && (
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

MenuItem.displayName = "MenuItem";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();

  // Redux profile data
  const profileData = useSelector(
    (state: { profileDetails?: { profileData?: Record<string, unknown> } }) =>
      state?.profileDetails?.profileData
  );

  // Extract user info
  const userName = String(profileData?.name ?? profileData?.userName ?? profileData?.fullName ?? "User");
  const userEmail = String(profileData?.email ?? "");
  const userPhone = String(profileData?.phoneNumber ?? profileData?.phone ?? profileData?.mobile ?? "");
  const userRole = String(profileData?.role ?? profileData?.userRole ?? "Owner");

  // Role display
  const roleDisplay = useMemo(() => {
    const role = String(profileData?.role ?? 1);
    switch (role) {
      case "1":
        return "Owner";
      case "2":
        return "Admin";
      case "3":
        return "Staff";
      default:
        return userRole || "Owner";
    }
  }, [profileData?.role, userRole]);

  // Get initials
  const getInitials = useCallback((name: string) => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((w) => (w[0] ?? "").toUpperCase()).join("") || "U";
  }, []);

  const initials = getInitials(userName);

  // Handlers
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/protected/(tabs)/Properties");
  }, [router]);

  const handleSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/protected/settings");
  }, [router]);

  const handleLogout = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("userToken");
              await persistor.purge();
              dispatch({ type: "LOGOUT" });
            } finally {
              router.replace("/public");
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [dispatch, router]);

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
        profileCard: {
          marginHorizontal: spacing.md,
          marginTop: spacing.lg,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          padding: spacing.lg,
          alignItems: "center",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.05,
          shadowRadius: 12,
          elevation: 4,
        },
        avatarContainer: {
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        },
        avatarText: {
          fontSize: 36,
          fontWeight: "800",
          color: "#FFFFFF",
          letterSpacing: 1,
        },
        userName: {
          fontSize: 24,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: 6,
        },
        roleBadge: {
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: radius.full,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          marginBottom: spacing.md,
        },
        roleText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.accent,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        infoRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
        },
        infoText: {
          fontSize: 14,
          color: colors.textSecondary,
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
        versionText: {
          textAlign: "center",
          fontSize: 12,
          color: colors.textMuted,
          marginTop: spacing.lg,
          marginBottom: spacing.md,
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
          accessibilityHint="Navigate to Properties screen"
          accessible
        >
          <MaterialIcons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={colors.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleDisplay}</Text>
          </View>

          {/* Contact Info */}
          {userPhone ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={18} color={colors.textSecondary} />
              <Text style={styles.infoText}>{userPhone}</Text>
            </View>
          ) : null}
          {userEmail ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={18} color={colors.textSecondary} />
              <Text style={styles.infoText}>{userEmail}</Text>
            </View>
          ) : null}
        </View>

        {/* Account Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <MenuItem
            icon="person-outline"
            iconFamily="ionicons"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <MenuItem
            icon="lock-closed-outline"
            iconFamily="ionicons"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => {}}
          />
        </View>

        {/* Settings Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <MenuItem
            icon="settings-outline"
            iconFamily="ionicons"
            title="Settings"
            subtitle="App preferences and configuration"
            onPress={handleSettings}
          />
          <View style={styles.separator} />
          <MenuItem
            icon="notifications-outline"
            iconFamily="ionicons"
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <MenuItem
            icon="moon-outline"
            iconFamily="ionicons"
            title="Appearance"
            subtitle="Theme and display settings"
            badge="Auto"
            onPress={() => {}}
          />
        </View>

        {/* Support Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support</Text>
          </View>
          <MenuItem
            icon="help-circle-outline"
            iconFamily="ionicons"
            title="Help & Support"
            subtitle="Get help with the app"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <MenuItem
            icon="document-text-outline"
            iconFamily="ionicons"
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => {}}
          />
        </View>

        {/* Logout Section */}
        <View style={styles.sectionCard}>
          <MenuItem
            icon="log-out-outline"
            iconFamily="ionicons"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            danger
            showChevron={false}
          />
        </View>

        {/* Version */}
        <Text style={styles.versionText}>PGMS Mobile v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

