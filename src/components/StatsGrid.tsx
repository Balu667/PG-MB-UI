// src/components/StatsGrid/StatsGrid.tsx
//------------------------------------------------------------
import React from "react";
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
import Colors from "@/src/constants/Colors";

/* ------------------------------------------------------------------ */
/** Every metric card you want to show */
export interface Metric {
  /** Unique key for FlatList */
  key: string;
  label: string;
  /** string|number because sometimes you'll pass “₹12 k” etc. */
  value: string | number;
  /** Any MaterialCommunityIcons icon name (or pass null for no icon) */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Pastel background behind the icon bubble */
  iconBg?: string;
  /** Override icon colour (defaults to theme primary) */
  iconColor?: string;
}

/** Optional tweaks                              */
export interface StatsGridProps {
  metrics: Metric[];
  /**   2 (default) | 3 | 4 */
  minColumns?: 2 | 3 | 4;
  /** Card aspect ratio when you have 1‑column layouts */
  cardHeight?: number;
  style?: ViewStyle;
}

/* ------------------------------------------------------------------ */
const StatsGrid: React.FC<StatsGridProps> = ({
  metrics,
  minColumns = 2,
  cardHeight = 110,
  style,
}) => {
  const { width } = useWindowDimensions();

  /* --- determine how many columns for this screen width --- */
  const columns = React.useMemo(() => {
    if (width >= 1100) return 4; // big tablets, desktop web
    if (width >= 780) return Math.max(minColumns, 3); // tablets / landscape phones
    return minColumns; // portrait phones
  }, [width, minColumns]);

  const GAP = 14; // card spacing
  const SIDE_PADDING = 32;
  const cardWidth = (width - SIDE_PADDING - GAP * (columns - 1)) / columns;

  /* Utility to keep font readable at all sizes */
  const clamp = (min: number, v: number, max: number) =>
    Math.max(min, Math.min(v, max)) / PixelRatio.getFontScale();

  return (
    <FlatList
      data={metrics}
      keyExtractor={(m) => m.key}
      numColumns={columns}
      scrollEnabled={false}
      /* -------------- horizontal spacing -------------- */
      columnWrapperStyle={{ gap: GAP }}
      /* -------------- vertical spacing -------------- */
      contentContainerStyle={[{ paddingTop: 18, paddingBottom: GAP }, style]}
      renderItem={({ item, index }) => {
        /* add bottom‑margin to every row except the last one */
        const isLastRow = Math.ceil((index + 1) / columns) === Math.ceil(metrics.length / columns);

        return (
          <View
            style={[
              styles.card,
              {
                width: cardWidth,
                minHeight: cardHeight,
                marginBottom: isLastRow ? 0 : GAP,
              },
            ]}
          >
            {item.icon && (
              <View style={[styles.iconBubble, { backgroundColor: item.iconBg ?? "#E5F0FF" }]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={item.iconColor ?? Colors.primary}
                />
              </View>
            )}

            <Text
              style={[styles.value, { fontSize: clamp(20, cardWidth * 0.16, 32) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {item.value}
            </Text>

            <Text
              style={[styles.label, { fontSize: clamp(12, cardWidth * 0.09, 16) }]}
              numberOfLines={2}
            >
              {item.label}
            </Text>
          </View>
        );
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    justifyContent: "space-between",

    /* soft shadow */
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginBottom: 6,
  },
  value: {
    fontWeight: "700",
    color: "#111827",
  },
  label: {
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "600",
  },
});

export default StatsGrid;
