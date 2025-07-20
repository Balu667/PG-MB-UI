import React, { useRef, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/src/constants/Colors";

interface Props {
  tabs: readonly string[];
  value: string;
  onChange: (t: string) => void;
}

export default function SegmentBar({ tabs, value, onChange }: Props) {
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineW = useRef(new Animated.Value(0)).current;
  const tabMeta = useRef<{ x: number; w: number }[]>([]).current;
  const init = useRef(false);

  /** animate each time value changes */
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
  }, [value]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroller}
      >
        <Animated.View
          style={[styles.underline, { transform: [{ translateX: underlineX }], width: underlineW }]}
        />

        {tabs.map((t, idx) => {
          const selected = value === t;
          return (
            <TouchableOpacity
              key={t}
              style={styles.item}
              activeOpacity={0.7}
              onLayout={(e) => {
                tabMeta[idx] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
                if (!init.current && selected) {
                  underlineX.setValue(tabMeta[idx].x);
                  underlineW.setValue(tabMeta[idx].w);
                  init.current = true;
                }
              }}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(t);
              }}
            >
              <Text style={[styles.label, selected && styles.labelSel]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFF",
  },
  scroller: { paddingHorizontal: 14, position: "relative" },
  item: { paddingVertical: 14, marginRight: 24 },
  label: { fontSize: 15, color: Colors.textMuted },
  labelSel: { color: Colors.textAccent, fontWeight: "600" },
  underline: {
    position: "absolute",
    bottom: 0,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: Colors.primary,
  },
});
