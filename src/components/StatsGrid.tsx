import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  PixelRatio,
  ViewStyle,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ------------------------------------------------------------------ */
export interface Metric {
  key: string;
  label: string;
  value: string | number;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg?: string;
  iconColor?: string;
}

export interface StatsGridProps {
  metrics: Metric[];
  /** guarantee at least this many cards are visible without horizontal scroll */
  minVisible?: 2 | 3 | 4;
  /** fixed card height (defaults to 88) */
  cardHeight?: number;
  style?: ViewStyle;
}

/* ------------------------------------------------------------------ */
const StatsGrid: React.FC<StatsGridProps> = ({
  metrics,
  minVisible = 2,
  cardHeight = 88,
  style,
}) => {
  const { width } = useWindowDimensions();
  const { colors, spacing, radius } = useTheme();

  /* ---------- sizing ------------------------------------------------ */
  const GAP = spacing.md - 2; // 14 with default spacing
  const SIDE_PADDING = spacing.lg + 8; // keeps first/last card visible
  const MIN_CARD_W = 116;

  const targetCols = Math.max(minVisible, Math.floor(width / 140));
  const cardW = React.useMemo(
    () => Math.max(MIN_CARD_W, (width - SIDE_PADDING - GAP * (targetCols - 1)) / targetCols),
    [width, targetCols]
  );

  /* ---------- font clamp helper ------------------------------------ */
  const clamp = (min: number, v: number, max: number) =>
    Math.max(min, Math.min(v, max)) / PixelRatio.getFontScale();

  /* ---------- themed styles (memo) --------------------------------- */
  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderColor: colors.borderColor,
          borderWidth: 1,
          backgroundColor: colors.cardBackground,
          borderRadius: radius.lg,
          paddingVertical: spacing.md - 2,
          paddingHorizontal: spacing.md - 2,
          justifyContent: "space-between",

          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.07,
          shadowRadius: 10,
          elevation: 4,
        },
        iconBubble: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "flex-end",
          marginBottom: 4,
        },
        value: {
          fontWeight: "700",
          color: colors.textPrimary,
        },
        label: {
          color: colors.textSecondary,
          lineHeight: 18,
          fontWeight: "600",
        },
      }),
    [colors, spacing, radius]
  );

  /* ---------- render ------------------------------------------------ */
  return (
    <FlatList
      horizontal
      data={metrics}
      keyExtractor={(m) => m.key}
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardW + GAP}
      decelerationRate="fast"
      contentContainerStyle={[
        {
          paddingLeft: spacing.md,
          paddingRight: spacing.md - GAP,
          paddingVertical: spacing.md - 2,
          gap: GAP,
        },
        style,
      ]}
      renderItem={({ item }) => (
        <View style={[s.card, { width: cardW, minHeight: cardHeight }]}>
          {item.icon && (
            <View
              style={[
                s.iconBubble,
                {
                  backgroundColor: item.iconBg ?? hexToRgba(colors.primary, 0.12),
                },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={17}
                color={item.iconColor ?? colors.primary}
              />
            </View>
          )}

          <Text
            style={[s.value, { fontSize: clamp(18, cardW * 0.16, 30) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item.value}
          </Text>

          <Text style={[s.label, { fontSize: clamp(11, cardW * 0.095, 15) }]} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      )}
      /* filler to keep last card fully visible */
      ListFooterComponent={() => <View style={{ width: SIDE_PADDING }} />}
      /* allow wrapping on tablets / web */
      numColumns={width >= 780 ? Math.min(metrics.length, targetCols) : 1}
    />
  );
};

export default StatsGrid;
