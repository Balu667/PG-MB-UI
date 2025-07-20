import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  PixelRatio,
  Platform,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Colors from "@/src/constants/Colors";

/* ---------- helpers ---------- */
const clamp = (min: number, v: number, max: number) => Math.max(min, Math.min(v, max));

export default function RoomSearchBar({
  onSearch,
  onFilter,
  active = false,
}: {
  onSearch: (t: string) => void;
  onFilter: () => void;
  active?: boolean;
}) {
  const { width } = useWindowDimensions();
  const [text, setText] = useState("");

  /* responsive numbers -------------------------------------------------- */
  // 320 → 44 dp | >600 → 56 dp
  const btnSize = clamp(44, width * 0.09, 56);
  // 320 → 42 dp | >600 → 54 dp
  const inputHeight = clamp(42, width * 0.085, 54);
  //   font‑size that respects system “Display Size”
  const font = clamp(13, width * 0.035, 16) / PixelRatio.getFontScale();
  const hasActive = active;
  return (
    <View style={[styles.wrap, { gap: btnSize * 0.26 }]}>
      {/* ---- search field ---- */}
      <View
        style={[
          styles.inputBox,
          {
            height: inputHeight,
            borderRadius: inputHeight * 0.33,
            paddingHorizontal: inputHeight * 0.33,
          },
        ]}
      >
        <Feather name="search" size={font + 4} color="#9CA3AF" />
        <TextInput
          style={[
            styles.input,
            {
              fontSize: font,
              paddingVertical: Platform.OS === "ios" ? 6 : 1,
            },
          ]}
          value={text}
          placeholder="Search by room type"
          placeholderTextColor="#9CA3AF"
          onChangeText={(t) => {
            setText(t);
            onSearch(t);
          }}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      {/* ---- filter button ---- */}
      <TouchableOpacity
        activeOpacity={0.75}
        style={[
          styles.filterBtn,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize * 0.33,
          },
        ]}
        onPress={onFilter}
      >
        <View>
          <Feather name="sliders" size={font + 6} color={Colors.textAccent} />
          {active && (
            <View
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                width: 10,
                height: 10,
                borderRadius: 10,
                backgroundColor: "#256D85",
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 8 },

  inputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: Colors.textAccent,
  },
  filterBtn: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
});
