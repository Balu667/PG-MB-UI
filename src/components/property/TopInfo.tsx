// src/components/property/TopInfo.tsx
// Premium compact property header with animated accent
import React, { useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Animated,
  I18nManager,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ─────────────────────────────────────────────────────────────────────────────
   PROPS INTERFACE
───────────────────────────────────────────────────────────────────────────── */

interface Props {
  name: string;
  area: string;
  city: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function TopInfo({ name, area, city }: Props) {
  const { width } = useWindowDimensions();
  const { colors, spacing, typography } = useTheme();

  // Subtle pulse animation for the accent dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.borderColor, 0.4),
          ...Platform.select({
            ios: {
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
            },
            android: {
              elevation: 1,
            },
          }),
        },
        content: {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          alignItems: "center",
        },
        propertyIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: hexToRgba(colors.accent, 0.1),
          alignItems: "center",
          justifyContent: "center",
          marginRight: I18nManager.isRTL ? 0 : spacing.sm,
          marginLeft: I18nManager.isRTL ? spacing.sm : 0,
        },
        textContainer: {
          flex: 1,
        },
        nameRow: {
          flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          alignItems: "center",
        },
        liveDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#22C55E",
          marginRight: I18nManager.isRTL ? 0 : 6,
          marginLeft: I18nManager.isRTL ? 6 : 0,
        },
        propertyName: {
          fontSize: typography.fontSizeMd + 1,
          fontWeight: "700",
          color: colors.textPrimary,
          letterSpacing: Platform.OS === "ios" ? 0.2 : 0.3,
          flex: 1,
        },
        locationRow: {
          flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          alignItems: "center",
          marginTop: 2,
        },
        locationIcon: {
          marginRight: I18nManager.isRTL ? 0 : 3,
          marginLeft: I18nManager.isRTL ? 3 : 0,
        },
        locationText: {
          fontSize: typography.fontSizeSm - 1,
          color: colors.textSecondary,
          maxWidth: width - spacing.md * 2 - 80,
        },
      }),
    [colors, spacing, typography, width]
  );

  return (
    <View style={s.container}>
      <View style={s.content}>
        {/* Property Icon */}
        <View style={s.propertyIcon}>
          <MaterialCommunityIcons
            name="office-building"
            size={22}
            color={colors.accent}
          />
        </View>

        {/* Text Content */}
        <View style={s.textContainer}>
          <View style={s.nameRow}>
            {/* Live indicator dot with pulse */}
            <Animated.View
              style={[
                s.liveDot,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Text
              style={s.propertyName}
              numberOfLines={1}
              accessibilityRole="header"
              accessible
            >
              {name}
            </Text>
          </View>
          <View style={s.locationRow}>
            <MaterialIcons
              name="location-on"
              size={13}
              color={colors.textMuted}
              style={s.locationIcon}
            />
            <Text style={s.locationText} numberOfLines={1}>
              {area}, {city}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
