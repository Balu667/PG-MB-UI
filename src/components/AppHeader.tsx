// src/components/AppHeader.tsx
// Premium redesigned header with Profile, Notifications, and Property selector
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  StatusBar,
  Platform,
  Modal,
  FlatList,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
  I18nManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { useProperty } from "@/src/context/PropertyContext";
import NotificationsSheet from "@/src/components/NotificationsSheet";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

interface AppHeaderProps {
  showBack?: boolean;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  avatarUri?: string;
}

interface Property {
  _id: string;
  propertyName: string;
  area?: string;
  city?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HEADER ICON BUTTON COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface HeaderIconButtonProps {
  icon: string;
  iconFamily?: "material" | "ionicons" | "material-community";
  onPress: () => void;
  badge?: number;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

const HeaderIconButton = React.memo<HeaderIconButtonProps>(
  ({ icon, iconFamily = "material", onPress, badge, accessibilityLabel, accessibilityHint }) => {
    const { colors, radius } = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }, [scaleAnim]);

    const IconComponent =
      iconFamily === "ionicons"
        ? Ionicons
        : iconFamily === "material-community"
        ? MaterialCommunityIcons
        : MaterialIcons;

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: hexToRgba("#FFFFFF", 0.2), borderless: true, radius: 22 }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessible
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View
          style={[
            {
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: hexToRgba("#FFFFFF", 0.12),
              justifyContent: "center",
              alignItems: "center",
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <IconComponent name={icon as never} size={22} color="#FFFFFF" />
          {badge !== undefined && badge > 0 && (
            <View
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: "#EF4444",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 4,
                borderWidth: 2,
                borderColor: colors.primary,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "800",
                }}
              >
                {badge > 99 ? "99+" : badge}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }
);

HeaderIconButton.displayName = "HeaderIconButton";

/* ─────────────────────────────────────────────────────────────────────────────
   PROPERTY SELECTOR ITEM
───────────────────────────────────────────────────────────────────────────── */

interface PropertyItemProps {
  item: Property;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const PropertyItem = React.memo<PropertyItemProps>(({ item, isSelected, onSelect }) => {
  const { colors, spacing, radius } = useTheme();

  const getInitials = (name?: string) => {
    if (!name) return "PG";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((w) => (w[0] ?? "").toUpperCase()).join("") || "PG";
  };

  const initials = getInitials(item.propertyName);
  const subtitle = [item.area, item.city].filter(Boolean).join(", ");

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 14,
          backgroundColor: isSelected ? hexToRgba(colors.accent, 0.08) : "transparent",
          borderRadius: isSelected ? radius.lg : 0,
          marginHorizontal: isSelected ? 8 : 0,
          marginVertical: isSelected ? 4 : 0,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.selectionAsync();
        onSelect(item._id);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.propertyName}`}
      accessibilityState={{ selected: isSelected }}
      accessible
    >
      {/* Avatar */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: isSelected ? colors.accent : hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: isSelected ? "#FFFFFF" : colors.accent,
            fontWeight: "700",
            fontSize: 14,
            letterSpacing: 0.5,
          }}
        >
          {initials}
        </Text>
      </View>

      {/* Text content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            color: colors.textPrimary,
            fontWeight: isSelected ? "700" : "500",
          }}
          numberOfLines={1}
        >
          {item.propertyName}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Check icon */}
      {isSelected && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="check" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
});

PropertyItem.displayName = "PropertyItem";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const AppHeader: React.FC<AppHeaderProps> = ({
  showBack = false,
  onBackPress,
  onNotificationPress,
  avatarUri,
}) => {
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { properties, selectedId, setSelected, loading } = useProperty();

  // Redux profile data
  const profileData = useSelector(
    (state: { profileDetails?: { profileData?: Record<string, unknown> } }) =>
      state?.profileDetails?.profileData
  );

  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Animations
  const menuAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Get current property
  const currentProperty = useMemo(
    () => properties.find((p) => p._id === selectedId),
    [properties, selectedId]
  );

  const currentTitle = currentProperty?.propertyName ?? "Select property";

  // Utilities
  const getInitials = useCallback((name?: string) => {
    if (!name) return "PG";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((w) => (w[0] ?? "").toUpperCase()).join("") || "PG";
  }, []);

  const shouldShowInitials = !avatarUri || avatarUri.trim().length === 0;
  const initials = useMemo(() => getInitials(currentTitle), [currentTitle, getInitials]);

  // Get user name for profile
  const userName = useMemo(() => {
    if (!profileData) return "";
    return String(profileData.name ?? profileData.userName ?? profileData.fullName ?? "");
  }, [profileData]);

  const userInitials = useMemo(() => getInitials(userName || "User"), [userName, getInitials]);

  // Animation helpers
  const openMenu = useCallback(() => {
    setShowPropertyMenu(true);
    Animated.parallel([
      Animated.spring(menuAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 65,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [menuAnim, backdropAnim]);

  const closeMenu = useCallback(() => {
    Animated.parallel([
      Animated.spring(menuAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setShowPropertyMenu(false));
  }, [menuAnim, backdropAnim]);

  const handlePropertySelect = useCallback(
    (id: string) => {
      setSelected(id);
      closeMenu();
    },
    [setSelected, closeMenu]
  );

  const handleNotificationPress = useCallback(() => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowNotifications(true);
    }
  }, [onNotificationPress]);

  const handleProfilePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/protected/profile");
  }, []);

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md + 4,
          paddingTop: insets.top + spacing.sm,
        },
        mainRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        leftSection: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          flex: 1,
          maxWidth: width * 0.6,
        },
        rightSection: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        avatarContainer: {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: hexToRgba("#FFFFFF", 0.15),
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: hexToRgba("#FFFFFF", 0.25),
        },
        avatarImage: {
          width: 40,
          height: 40,
          borderRadius: 12,
        },
        avatarText: {
          color: "#FFFFFF",
          fontWeight: "700",
          fontSize: 15,
          letterSpacing: 0.5,
        },
        propertySelector: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: radius.lg,
          backgroundColor: hexToRgba("#FFFFFF", 0.1),
        },
        propertyText: {
          flex: 1,
          fontSize: 15,
          color: "#FFFFFF",
          fontWeight: "600",
        },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: hexToRgba("#FFFFFF", 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        // Modal styles
        modalOverlay: {
          flex: 1,
          backgroundColor: "transparent",
        },
        menuContainer: {
          position: "absolute",
          left: spacing.md,
          right: spacing.md,
          top: insets.top + 70,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          overflow: "hidden",
          maxHeight: 400,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 16,
        },
        menuHeader: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textSecondary, 0.1),
        },
        menuTitle: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        listContent: {
          paddingVertical: spacing.sm,
        },
        separator: {
          height: 1,
          backgroundColor: hexToRgba(colors.textSecondary, 0.08),
          marginHorizontal: spacing.md,
        },
        loadingContainer: {
          paddingVertical: 32,
          alignItems: "center",
          gap: 12,
        },
        emptyContainer: {
          paddingVertical: 32,
          paddingHorizontal: spacing.md,
          alignItems: "center",
        },
        emptyText: {
          color: colors.textSecondary,
          fontSize: 15,
        },
      }),
    [colors, spacing, radius, insets.top, width]
  );

  // Render property menu
  const renderPropertyMenu = () => {
    const translateY = menuAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-20, 0],
    });

    const opacity = menuAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Modal
        visible={showPropertyMenu}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: hexToRgba("#000000", 0.4),
              opacity: backdropAnim,
            },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={closeMenu}>
            <Animated.View
              style={[
                styles.menuContainer,
                {
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Your Properties</Text>
              </View>

              {/* Content */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={{ color: colors.textSecondary, fontWeight: "500" }}>
                    Loading properties...
                  </Text>
                </View>
              ) : properties.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="home-off-outline"
                    size={48}
                    color={colors.textMuted}
                  />
                  <Text style={[styles.emptyText, { marginTop: 12 }]}>No properties found</Text>
                </View>
              ) : (
                <FlatList
                  data={properties}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.listContent}
                  renderItem={({ item }) => (
                    <PropertyItem
                      item={item}
                      isSelected={selectedId === item._id}
                      onSelect={handlePropertySelect}
                    />
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Modal>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />

      <View style={styles.wrapper}>
        <View style={styles.mainRow}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            {showBack ? (
              <Pressable
                onPress={onBackPress}
                android_ripple={{ color: hexToRgba("#FFFFFF", 0.2), borderless: true }}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                accessibilityHint="Navigate to previous screen"
                accessible
              >
                <MaterialIcons
                  name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
                  size={24}
                  color="#FFFFFF"
                />
              </Pressable>
            ) : shouldShowInitials ? (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            ) : (
              <View style={styles.avatarContainer}>
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              </View>
            )}

            {/* Property Selector */}
            <TouchableOpacity
              style={styles.propertySelector}
              activeOpacity={0.7}
              onPress={() => !loading && openMenu()}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={`Current property: ${currentTitle}. Tap to change.`}
              accessibilityHint="Opens property selection menu"
              accessible
            >
              <Text style={styles.propertyText} numberOfLines={1}>
                {currentTitle}
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="keyboard-arrow-down" size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Right Section - Action Buttons */}
          <View style={styles.rightSection}>
            {/* Notifications */}
            <HeaderIconButton
              icon="notifications-outline"
              iconFamily="ionicons"
              onPress={handleNotificationPress}
              badge={3}
              accessibilityLabel="Notifications"
              accessibilityHint="Opens notifications panel"
            />

            {/* Profile */}
            <HeaderIconButton
              icon="person-outline"
              iconFamily="ionicons"
              onPress={handleProfilePress}
              accessibilityLabel="Profile"
              accessibilityHint="Opens profile screen"
            />
          </View>
        </View>
      </View>

      {/* Property Selection Modal */}
      {renderPropertyMenu()}

      {/* Notifications Sheet */}
      <NotificationsSheet
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default React.memo(AppHeader);
