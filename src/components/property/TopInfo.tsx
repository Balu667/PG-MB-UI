import React, { useMemo } from "react";
import { View, Text, StyleSheet, useWindowDimensions, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

interface Props {
  name: string;
  area: string;
  city: string;
}

export default function TopInfo({ name, area, city }: Props) {
  const { width } = useWindowDimensions();
  const { colors, spacing, typography } = useTheme();

  /* ---------------- theme-aware styles ---------------- */
  const s = useMemo(
    () =>
      StyleSheet.create({
        hero: {
          overflow: "hidden",
          width: "100%",
        },

        /* decorative bubbles */
        bubble: (bg: string, size: number, x: number, y: number) => ({
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          opacity: 0.18,
          top: y,
          left: x,
        }),

        content: {
          paddingVertical: spacing.lg + 6,
          paddingHorizontal: spacing.lg,
        },
        pgName: {
          fontSize: typography.fontSizeLg + 6,
          fontWeight: typography.weightBold as any,
          color: colors.textPrimary,
          letterSpacing: Platform.OS === "ios" ? 0.3 : 0.5,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: spacing.xs + 2,
        },
        loc: {
          fontSize: typography.fontSizeSm,
          color: colors.textSecondary,
          marginLeft: 4,
          maxWidth: width - spacing.lg * 2 - 30,
        },
      }),
    [colors, spacing, typography, width]
  );

  /* ---------------- render ---------------- */
  return (
    <View style={s.hero}>
      {/* a soft top-to-transparent gradient */}
      <LinearGradient
        colors={[
          hexToRgba(colors.surface, 0.85),
          hexToRgba(colors.surface, 0.6),
          hexToRgba(colors.background, 0.0),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ width: "100%" }}
      >
        {/* decorative, theme-tinted bubbles */}
        <View style={s.bubble(colors.circle1, width * 0.55, -width * 0.25, -width * 0.18)} />
        <View style={s.bubble(colors.circle2, width * 0.32, width * 0.55, -width * 0.07)} />

        {/* main content */}
        <View style={s.content}>
          <Text style={s.pgName} numberOfLines={1}>
            {name}
          </Text>

          <View style={s.row}>
            <MaterialIcons name="location-on" size={18} color={colors.textSecondary} />
            <Text style={s.loc} numberOfLines={1}>
              {area}, {city}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
