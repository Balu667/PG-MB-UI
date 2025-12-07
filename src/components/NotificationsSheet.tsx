// src/components/NotificationsSheet.tsx
// Premium Notifications Bottom Sheet with elegant animations
import React, { useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ScrollView,
  Platform,
  useWindowDimensions,
  I18nManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

interface NotificationsSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  type: "payment" | "booking" | "alert" | "info" | "success";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   DUMMY NOTIFICATIONS DATA
───────────────────────────────────────────────────────────────────────────── */

const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    type: "payment",
    title: "Payment Received",
    message: "₹5,000 rent payment received from Rahul Kumar for Room 101",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "booking",
    title: "New Booking Request",
    message: "Priya Sharma has requested advance booking for Room 205",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "alert",
    title: "Due Payment Reminder",
    message: "3 tenants have pending dues over ₹10,000",
    time: "3 hours ago",
    read: false,
  },
  {
    id: "4",
    type: "success",
    title: "Tenant Converted",
    message: "Amit Singh has been successfully converted from advance booking",
    time: "Yesterday",
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "Monthly Report Ready",
    message: "Your November collection report is now available",
    time: "2 days ago",
    read: true,
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface NotificationCardProps {
  item: NotificationItem;
  onPress: () => void;
}

const NotificationCard = React.memo<NotificationCardProps>(({ item, onPress }) => {
  const { colors, spacing, radius } = useTheme();

  const typeConfig = useMemo(() => {
    switch (item.type) {
      case "payment":
        return {
          icon: "cash",
          iconFamily: "material-community" as const,
          bgColor: "#DCFCE7",
          iconColor: "#16A34A",
        };
      case "booking":
        return {
          icon: "calendar-check",
          iconFamily: "material-community" as const,
          bgColor: "#DBEAFE",
          iconColor: "#2563EB",
        };
      case "alert":
        return {
          icon: "alert-circle",
          iconFamily: "material-community" as const,
          bgColor: "#FEE2E2",
          iconColor: "#DC2626",
        };
      case "success":
        return {
          icon: "check-circle",
          iconFamily: "material-community" as const,
          bgColor: "#D1FAE5",
          iconColor: "#059669",
        };
      default:
        return {
          icon: "information",
          iconFamily: "material-community" as const,
          bgColor: "#E0E7FF",
          iconColor: "#4F46E5",
        };
    }
  }, [item.type]);

  const IconComponent =
    typeConfig.iconFamily === "material-community" ? MaterialCommunityIcons : MaterialIcons;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          padding: spacing.md,
          gap: 14,
          backgroundColor: pressed
            ? hexToRgba(colors.textSecondary, 0.05)
            : item.read
            ? "transparent"
            : hexToRgba(colors.accent, 0.04),
          borderRadius: radius.lg,
          marginHorizontal: spacing.md,
          marginVertical: 4,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.message}`}
      accessibilityHint="Tap to view notification details"
      accessible
    >
      {/* Icon */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: typeConfig.bgColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconComponent name={typeConfig.icon as never} size={24} color={typeConfig.iconColor} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: item.read ? "500" : "700",
              color: colors.textPrimary,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.read && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.accent,
              }}
            />
          )}
        </View>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 4,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            marginTop: 6,
          }}
        >
          {item.time}
        </Text>
      </View>
    </Pressable>
  );
});

NotificationCard.displayName = "NotificationCard";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const NotificationsSheet: React.FC<NotificationsSheetProps> = ({ visible, onClose }) => {
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const sheetHeight = Math.min(height * 0.75, 600);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
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
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, height, slideAnim, backdropAnim]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const unreadCount = DUMMY_NOTIFICATIONS.filter((n) => !n.read).length;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: "flex-end",
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: hexToRgba("#000000", 0.5),
        },
        sheet: {
          height: sheetHeight,
          backgroundColor: colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 24,
        },
        handleContainer: {
          alignItems: "center",
          paddingTop: 12,
          paddingBottom: 8,
        },
        handle: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: hexToRgba(colors.textSecondary, 0.3),
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textSecondary, 0.1),
        },
        headerLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        iconBadge: {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        headerSubtitle: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
        },
        closeButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: hexToRgba(colors.textSecondary, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        content: {
          flex: 1,
        },
        scrollContent: {
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.md,
        },
        emptyContainer: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 60,
        },
        emptyIcon: {
          marginBottom: 16,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: "600",
          color: colors.textPrimary,
          marginBottom: 8,
        },
        emptyText: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          paddingHorizontal: spacing.lg,
        },
        markAllButton: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          marginHorizontal: spacing.md,
          marginTop: spacing.sm,
          borderRadius: radius.lg,
          backgroundColor: hexToRgba(colors.accent, 0.1),
        },
        markAllText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.accent,
        },
      }),
    [colors, spacing, radius, insets.bottom, sheetHeight]
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="notifications" size={22} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Text style={styles.headerSubtitle}>
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close notifications"
              accessible
            >
              <MaterialIcons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {DUMMY_NOTIFICATIONS.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="bell-off-outline"
                  size={64}
                  color={colors.textMuted}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptyText}>
                  You're all caught up! New notifications will appear here.
                </Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {DUMMY_NOTIFICATIONS.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    item={notification}
                    onPress={() => {
                      // Handle notification press - can be extended
                    }}
                  />
                ))}

                {/* Mark all as read button */}
                {unreadCount > 0 && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.markAllButton,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      // Mark all as read logic
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Mark all notifications as read"
                    accessible
                  >
                    <MaterialCommunityIcons
                      name="check-all"
                      size={18}
                      color={colors.accent}
                    />
                    <Text style={styles.markAllText}>Mark all as read</Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default React.memo(NotificationsSheet);

