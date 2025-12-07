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

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON CARD - Matches PropertyCard design (No Images)
───────────────────────────────────────────────────────────────────────────── */

const SkeletonCard: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, radius, spacing, scheme } = useTheme();

  // Responsive sizing - match PropertyCard
  const numColumns = screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : screenWidth >= 600 ? 2 : 1;
  const cardMargin = 8;
  const cardWidth = (screenWidth - spacing.md * 2 - cardMargin * (numColumns - 1)) / numColumns;
  const isCompact = cardWidth < 320;

  // Reduced motion support
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((res) => mounted && setReduceMotion(res));
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      // @ts-expect-error RN compat
      sub?.remove?.();
    };
  }, []);

  // Shimmer animation
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim, reduceMotion]);

  const shimmerWidth = Math.max(100, cardWidth * 0.5);
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-shimmerWidth, cardWidth + shimmerWidth],
  });

  // Theme-aware colors
  const shimmerTint = scheme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)";
  const surfaceBg = scheme === "dark"
    ? hexToRgba(colors.white, 0.06)
    : hexToRgba(colors.black, 0.04);

  // Shimmer component
  const Shimmer: React.FC<{ style?: object }> = ({ style }) => (
    <View style={[style, { overflow: "hidden", backgroundColor: surfaceBg }]}>
      {!reduceMotion && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { width: shimmerWidth, transform: [{ translateX }] },
          ]}
        >
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: numColumns === 1 ? "100%" : cardWidth,
          marginBottom: cardMargin,
        },
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: hexToRgba(colors.borderColor, 0.5),
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              }
            : { elevation: 5 }),
        },
        headerArea: {
          height: isCompact ? 100 : 110,
          backgroundColor: hexToRgba(colors.primary, 0.2),
          paddingHorizontal: isCompact ? 14 : 16,
          paddingTop: isCompact ? 14 : 16,
          paddingBottom: isCompact ? 12 : 14,
        },
        headerTopRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 10,
        },
        headerLeft: {
          flex: 1,
          marginRight: 10,
        },
        propertyIdSkeleton: {
          width: 80,
          height: 20,
          borderRadius: radius.md,
          marginBottom: 8,
        },
        nameSkeleton: {
          width: "85%",
          height: isCompact ? 20 : 22,
          borderRadius: radius.md,
          marginBottom: 6,
        },
        locationSkeleton: {
          width: "70%",
          height: 14,
          borderRadius: radius.sm,
        },
        headerRight: {
          alignItems: "flex-end",
          gap: 6,
        },
        badgeSkeleton: {
          width: 90,
          height: 28,
          borderRadius: radius.full,
        },
        menuSkeleton: {
          width: 32,
          height: 32,
          borderRadius: 16,
        },
        content: {
          padding: isCompact ? 14 : 16,
        },
        infoRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        mealBadgeSkeleton: {
          width: 80,
          height: 28,
          borderRadius: radius.full,
        },
        occupancySkeleton: {
          width: 100,
          height: 32,
          borderRadius: radius.full,
        },
        statsGrid: {
          flexDirection: "row",
          gap: isCompact ? 6 : 8,
          marginBottom: 14,
        },
        statItem: {
          flex: 1,
          height: isCompact ? 70 : 75,
          borderRadius: radius.md,
        },
        divider: {
          height: 1,
          backgroundColor: hexToRgba(colors.borderColor, 0.5),
          marginBottom: 14,
        },
        financialRow: {
          flexDirection: "row",
          gap: 8,
        },
        financialItem: {
          flex: 1,
          height: isCompact ? 75 : 80,
          borderRadius: radius.md,
        },
      }),
    [colors, radius, cardWidth, numColumns, isCompact, surfaceBg]
  );

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading property card"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <View style={styles.card}>
        {/* Header Gradient Area */}
        <View style={styles.headerArea}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <Shimmer style={styles.propertyIdSkeleton} />
              <Shimmer style={styles.nameSkeleton} />
              <Shimmer style={styles.locationSkeleton} />
            </View>
            <View style={styles.headerRight}>
              <Shimmer style={styles.badgeSkeleton} />
              <Shimmer style={styles.menuSkeleton} />
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Info Row */}
          <View style={styles.infoRow}>
            <Shimmer style={styles.mealBadgeSkeleton} />
            <Shimmer style={styles.occupancySkeleton} />
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Shimmer key={i} style={styles.statItem} />
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Financial Row */}
          <View style={styles.financialRow}>
            <Shimmer style={styles.financialItem} />
            <Shimmer style={styles.financialItem} />
            <Shimmer style={styles.financialItem} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default SkeletonCard;
