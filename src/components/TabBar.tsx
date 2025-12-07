import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
  Animated,
  useWindowDimensions,
  I18nManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../theme/ThemeContext";
import { hexToRgba } from "../theme";

/* ─────────────────────────────────────────────────────────────────────────────
   TAB ICON MAPPING
───────────────────────────────────────────────────────────────────────────── */

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Dashboard: "dashboard",
  Rooms: "meeting-room",
  Properties: "apartment",
  Tenants: "groups",
  Store: "store",
};

/* ─────────────────────────────────────────────────────────────────────────────
   TAB ITEM COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface TabItemProps {
  route: { key: string; name: string };
  isFocused: boolean;
  title: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  isCompact: boolean;
}

const TabItem = React.memo<TabItemProps>(({ route, isFocused, title, onPress, colors, isCompact }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
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

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const iconName = TAB_ICONS[route.name] || "circle";
  const iconColor = isFocused ? colors.primary : colors.textMuted;
  const labelColor = isFocused ? colors.primary : colors.textMuted;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.tabItem}
      accessibilityState={{ selected: isFocused }}
      accessibilityRole="tab"
      accessibilityLabel={`${title} tab`}
      accessibilityHint={`Navigate to ${title}`}
      accessible
    >
      <Animated.View
        style={[
          styles.tabItemContent,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Active indicator */}
        {isFocused && (
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: colors.primary },
            ]}
          />
        )}
        <MaterialIcons
          name={iconName}
          size={isCompact ? 22 : 24}
          color={iconColor}
        />
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.label,
            {
              color: labelColor,
              fontSize: isCompact ? 10 : 11,
              fontWeight: isFocused ? "700" : "500",
            },
          ]}
          allowFontScaling
        >
          {title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

TabItem.displayName = "TabItem";

/* ─────────────────────────────────────────────────────────────────────────────
   MORE TAB ITEM COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface MoreTabItemProps {
  route: { key: string; name: string };
  isFocused: boolean;
  title: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  radius: ReturnType<typeof useTheme>["radius"];
}

const MoreTabItem = React.memo<MoreTabItemProps>(({ route, isFocused, title, onPress, colors, radius }) => {
  const iconName = TAB_ICONS[route.name] || "circle";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.moreItem}
      activeOpacity={0.7}
      accessibilityRole="menuitem"
      accessibilityLabel={`${title}`}
      accessibilityHint={`Navigate to ${title}`}
      accessible
    >
      <View
        style={[
          styles.moreItemInner,
          {
            backgroundColor: isFocused ? colors.primary : hexToRgba(colors.textMuted, 0.08),
            borderRadius: radius.lg,
          },
        ]}
      >
        <MaterialIcons
          name={iconName}
          size={24}
          color={isFocused ? "#FFFFFF" : colors.textPrimary}
        />
        <Text
          style={[
            styles.moreLabel,
            { color: isFocused ? "#FFFFFF" : colors.textPrimary },
          ]}
        >
          {title}
        </Text>
        {isFocused && (
          <View style={styles.moreActiveIndicator}>
            <MaterialIcons name="check" size={18} color="#FFFFFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

MoreTabItem.displayName = "MoreTabItem";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN TAB BAR COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, radius, spacing } = useTheme();

  const [showMore, setShowMore] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const backdropAnim = React.useRef(new Animated.Value(0)).current;

  // Responsive
  const isCompact = width < 380;
  const maxVisibleTabs = isCompact ? 4 : 4;
  const visibleTabs = state.routes.slice(0, maxVisibleTabs);
  const moreTabs = state.routes.slice(maxVisibleTabs);
  const focusedRoute = state.routes[state.index];
  const isMoreFocused = moreTabs.some((r) => r.key === focusedRoute.key);

  // Bottom padding for safe area
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);

  const openMore = useCallback(() => {
    setShowMore(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  }, [slideAnim, backdropAnim]);

  const closeMore = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowMore(false));
  }, [slideAnim, backdropAnim]);

  const handleTabPress = useCallback(
    (route: { key: string; name: string }, index: number) => {
      const isFocused = state.index === index;
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [state.index, navigation]
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: hexToRgba(colors.borderColor, 0.5),
          paddingBottom: bottomPadding,
          // Subtle shadow on iOS
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
              }
            : {
                elevation: 8,
              }),
        },
        tabsRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          paddingVertical: isCompact ? 6 : 8,
          paddingHorizontal: spacing.sm,
        },
        moreButton: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 4,
        },
        moreButtonContent: {
          alignItems: "center",
          justifyContent: "center",
        },
        modalOverlay: {
          flex: 1,
          justifyContent: "flex-end",
        },
        modalBackdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.4)",
        },
        modalContent: {
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: radius.xxl,
          borderTopRightRadius: radius.xxl,
          paddingTop: spacing.md,
          paddingBottom: bottomPadding + spacing.md,
          paddingHorizontal: spacing.md,
          // Shadow
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 16,
        },
        modalHandle: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: hexToRgba(colors.textMuted, 0.3),
          alignSelf: "center",
          marginBottom: spacing.md,
        },
        modalTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.md,
          paddingHorizontal: spacing.xs,
        },
      }),
    [colors, radius, spacing, bottomPadding, isCompact]
  );

  return (
    <>
      {/* Tab Bar */}
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.tabsRow}>
          {visibleTabs.map((route, index) => {
            const isFocused = state.index === index;
            const options = descriptors[route.key].options;
            const title = options.title || route.name;

            return (
              <TabItem
                key={route.key}
                route={route}
                isFocused={isFocused}
                title={title}
                onPress={() => handleTabPress(route, index)}
                colors={colors}
                isCompact={isCompact}
              />
            );
          })}

          {/* More Button */}
          {moreTabs.length > 0 && (
            <TouchableOpacity
              style={styles.tabItem}
              onPress={openMore}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="More options"
              accessibilityHint="Opens menu with additional tabs"
              accessible
            >
              <View style={styles.tabItemContent}>
                {isMoreFocused && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
                <Feather
                  name="more-horizontal"
                  size={isCompact ? 22 : 24}
                  color={isMoreFocused ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isMoreFocused ? colors.primary : colors.textMuted,
                      fontSize: isCompact ? 10 : 11,
                      fontWeight: isMoreFocused ? "700" : "500",
                    },
                  ]}
                >
                  More
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* More Menu Modal */}
      <Modal
        visible={showMore}
        animationType="none"
        transparent
        onRequestClose={closeMore}
        statusBarTranslucent
      >
        <View style={dynamicStyles.modalOverlay}>
          {/* Backdrop */}
          <Animated.View
            style={[dynamicStyles.modalBackdrop, { opacity: backdropAnim }]}
          >
            <Pressable style={{ flex: 1 }} onPress={closeMore} />
          </Animated.View>

          {/* Content */}
          <Animated.View
            style={[
              dynamicStyles.modalContent,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={dynamicStyles.modalHandle} />
            <Text style={dynamicStyles.modalTitle}>More Options</Text>

            {moreTabs.map((route) => {
              const isCurrent = route.key === focusedRoute.key;
              const options = descriptors[route.key].options;
              const title = options.title || route.name;

              return (
                <MoreTabItem
                  key={route.key}
                  route={route}
                  isFocused={isCurrent}
                  title={title}
                  onPress={() => {
                    navigation.navigate(route.name);
                    closeMore();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  colors={colors}
                  radius={radius}
                />
              );
            })}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   STATIC STYLES
───────────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minHeight: 50,
  },
  tabItemContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
  label: {
    marginTop: 2,
    textAlign: "center",
    includeFontPadding: false,
  },
  moreItem: {
    marginBottom: 8,
  },
  moreItemInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  moreLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  moreActiveIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TabBar;
