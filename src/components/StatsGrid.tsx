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
  minVisible?: 2 | 3 | 4; // default 2
  cardHeight?: number; // default now 88
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

  /* --------------- sizing ---------------------------------------- */
  const GAP = 14;
  const SIDE_PADDING = 32;
  const MIN_CARD_W = 116; // ← smaller
  const targetCols = Math.max(minVisible, Math.floor(width / 140));
  const cardW = React.useMemo(
    () => Math.max(MIN_CARD_W, (width - SIDE_PADDING - GAP * (targetCols - 1)) / targetCols),
    [width, targetCols]
  );

  /* --------------- font helper ----------------------------------- */
  const clamp = (min: number, v: number, max: number) =>
    Math.max(min, Math.min(v, max)) / PixelRatio.getFontScale();

  /* --------------- render ---------------------------------------- */
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
          paddingLeft: 16,
          paddingRight: 16 - GAP,
          paddingVertical: 14,
          gap: GAP,
        },
        style,
      ]}
      renderItem={({ item }) => (
        <View style={[styles.card, { width: cardW, minHeight: cardHeight }]}>
          {item.icon && (
            <View style={[styles.iconBubble, { backgroundColor: item.iconBg ?? "#E5F0FF" }]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={17}
                color={item.iconColor ?? Colors.primary}
              />
            </View>
          )}

          <Text
            style={[styles.value, { fontSize: clamp(18, cardW * 0.16, 30) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item.value}
          </Text>

          <Text
            style={[styles.label, { fontSize: clamp(11, cardW * 0.095, 15) }]}
            numberOfLines={2}
          >
            {item.label}
          </Text>
        </View>
      )}
      /* enable wrap on big screens */
      ListFooterComponent={() => <View style={{ width: SIDE_PADDING }} />}
      numColumns={width >= 780 ? Math.min(metrics.length, targetCols) : 1}
    />
  );
};

/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16, // slightly tighter radius
    paddingVertical: 14,
    paddingHorizontal: 14,
    justifyContent: "space-between",

    shadowColor: "#000",
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
    color: "#111827",
  },
  label: {
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "600",
  },
});

export default StatsGrid;
