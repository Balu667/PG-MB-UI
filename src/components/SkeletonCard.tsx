import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  useWindowDimensions,
  AccessibilityInfo,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

const SkeletonCard: React.FC = () => {
  const { width: screenWidth, fontScale } = useWindowDimensions();
  const { colors, scheme } = useTheme();

  // --- match PropertyCard grid logic ---
  let numColumns = 2;
  if (screenWidth >= 900) numColumns = 3;
  else if (screenWidth >= 600) numColumns = 2;
  else numColumns = 1;

  const cardMargin = 12;
  const cardWidth = (screenWidth - cardMargin * (numColumns + 1)) / numColumns;

  // --- reduced motion support for accessibility ---
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((res) => mounted && setReduceMotion(res));
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduceMotion);
    return () => {
      // @ts-expect-error RN < 0.73 compat
      sub?.remove?.();
    };
  }, []);

  // --- shimmer animation ---
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim, reduceMotion]);

  const shimmerWidth = Math.max(120, Math.min(cardWidth * 0.55, 240));
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-shimmerWidth, cardWidth + shimmerWidth],
  });

  // lighter shimmer on dark; brighter on light
  const shimmerTint = scheme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)";

  const dividerColor = hexToRgba(colors.textSecondary, scheme === "dark" ? 0.14 : 0.18);
  const surfaceTint = useMemo(
    () => ({
      backgroundColor:
        scheme === "dark" ? hexToRgba(colors.white, 0.06) : hexToRgba(colors.black, 0.04),
    }),
    [scheme, colors]
  );

  const baseRadius = 20;
  const minCardHeight = Math.max(245, 220 * fontScale);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shadow: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.11,
          shadowRadius: 10,
          elevation: 12,
          borderRadius: baseRadius - 4,
        },
        card: {
          minHeight: minCardHeight,
          borderRadius: baseRadius,
          overflow: "hidden",
          backgroundColor: colors.cardBackground,
        },

        header: {
          paddingVertical: 15,
          paddingHorizontal: 20,
          borderTopLeftRadius: baseRadius,
          borderTopRightRadius: baseRadius,
        },

        // content
        section: { paddingHorizontal: 15, paddingVertical: 14, gap: 7 },

        statRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 7,
        },
        statPill: {
          width: "48%",
          height: Math.max(48, 42 * fontScale),
          borderRadius: 12,
          ...surfaceTint,
          overflow: "hidden",
        },

        financialRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: dividerColor,
          backgroundColor: colors.cardBackground,
          gap: 10,
        },
        finBlock: {
          flex: 1,
          height: Math.max(38, 34 * fontScale),
          borderRadius: 10,
          ...surfaceTint,
          overflow: "hidden",
        },

        footer: {
          paddingHorizontal: 18,
          paddingVertical: 12,
          backgroundColor: colors.cardBackground,
          borderBottomLeftRadius: baseRadius,
          borderBottomRightRadius: baseRadius,
        },

        // skeleton bars
        barLg: { height: Math.max(18, 16 * fontScale), borderRadius: 8 },
        barSm: {
          height: Math.max(14, 12 * fontScale),
          borderRadius: 8,
          marginTop: 10,
          width: "65%",
        },

        // shimmer overlay
        shimmerWrap: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
        shimmerStripe: {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: shimmerWidth,
          transform: [{ translateX }],
          opacity: 0.7,
        },
      }),
    [
      baseRadius,
      colors.cardBackground,
      dividerColor,
      fontScale,
      minCardHeight,
      shimmerWidth,
      surfaceTint,
      translateX,
    ]
  );

  const Shimmer: React.FC<{ style?: any }> = ({ style }) => (
    <View
      accessible={true}
      accessibilityRole={Platform.OS === "web" ? undefined : "image"}
      importantForAccessibility="no"
      pointerEvents="none"
      style={[style]}
    >
      {/* base */}
      <View style={{ flex: 1, backgroundColor: colors.cardSurface }} />
      {/* overlay */}
      {!reduceMotion && (
        <Animated.View style={styles.shimmerStripe}>
          <LinearGradient
            colors={["transparent", shimmerTint, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );

  return (
    <View
      style={[styles.shadow, { width: cardWidth, margin: cardMargin / 2 }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading property card"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <View style={styles.card}>
        {/* Header gradient to match PropertyCard */}
        <LinearGradient
          colors={colors.enabledGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Shimmer style={styles.barLg} />
          <Shimmer style={styles.barSm} />
        </LinearGradient>

        {/* Stats grid (5 pills) */}
        <View style={styles.section}>
          <View style={styles.statRow}>
            <Shimmer style={styles.statPill} />
            <Shimmer style={styles.statPill} />
          </View>
          <View style={styles.statRow}>
            <Shimmer style={styles.statPill} />
            <Shimmer style={styles.statPill} />
          </View>
          <View style={styles.statRow}>
            <Shimmer style={[styles.statPill, { width: "48%" }]} />
          </View>
        </View>

        {/* Financial row (3 blocks) */}
        <View style={styles.financialRow}>
          <Shimmer style={styles.finBlock} />
          <Shimmer style={styles.finBlock} />
          <Shimmer style={styles.finBlock} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Shimmer
            style={{ height: Math.max(12, 10 * fontScale), borderRadius: 8, width: "35%" }}
          />
        </View>
      </View>
    </View>
  );
};

export default SkeletonCard;
