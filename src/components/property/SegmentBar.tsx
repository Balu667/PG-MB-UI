import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

interface Props {
  /** list of tab labels */
  tabs: readonly string[];
  /** currently selected label */
  value: string;
  /** callback when user taps a tab */
  onChange: (t: string) => void;
}

/* ------------------------------------------------------------------ */
/*                              COMPONENT                              */
/* ------------------------------------------------------------------ */
export default function SegmentBar({ tabs, value, onChange }: Props) {
  const { colors, spacing } = useTheme();

  /* ---------- animated underline state ---------- */
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineW = useRef(new Animated.Value(0)).current;
  const tabMeta = useRef<{ x: number; w: number }[]>([]).current;
  const init = useRef(false);

  /* ---------- run animation whenever value changes ---------- */
  useEffect(() => {
    const idx = tabs.findIndex((t) => t === value);
    if (idx === -1) return;
    const { x, w } = tabMeta[idx] ?? { x: 0, w: 0 };
    Animated.parallel([
      Animated.timing(underlineX, {
        toValue: x,
        duration: 260,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }),
      Animated.timing(underlineW, {
        toValue: w,
        duration: 260,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, tabs, underlineX, underlineW]);

  /* ---------- theme-aware styles ---------- */
  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: hexToRgba(colors.textMuted),
        },
        scroller: {
          paddingHorizontal: spacing.md - 2,
          position: "relative",
        },
        item: {
          paddingVertical: spacing.md - 2,
          marginRight: spacing.lg,
        },
        label: {
          fontSize: 15,
          color: colors.textMuted,
        },
        labelSel: {
          color: colors.accent,
          fontWeight: Platform.OS === "ios" ? "600" : "700",
        },
        underline: {
          position: "absolute",
          bottom: 0,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: colors.primary,
        },
      }),
    [colors, spacing]
  );

  /* ---------- render ---------- */
  return (
    <View style={s.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scroller}
      >
        {/* animated underline */}
        <Animated.View
          style={[s.underline, { transform: [{ translateX: underlineX }], width: underlineW }]}
        />

        {/* tab buttons */}
        {tabs.map((t, idx) => {
          const selected = value === t;
          return (
            <TouchableOpacity
              key={t}
              activeOpacity={0.7}
              style={s.item}
              onLayout={(e) => {
                tabMeta[idx] = {
                  x: e.nativeEvent.layout.x,
                  w: e.nativeEvent.layout.width,
                };

                // set initial position instantly on first mount
                if (!init.current && selected) {
                  underlineX.setValue(tabMeta[idx].x);
                  underlineW.setValue(tabMeta[idx].w);
                  init.current = true;
                }
              }}
              onPress={() => {
                if (t !== value) Haptics.selectionAsync();
                onChange(t);
              }}
              accessibilityRole="button"
              accessibilityState={selected ? { selected: true } : undefined}
            >
              <Text style={[s.label, selected && s.labelSel]} numberOfLines={1}>
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
