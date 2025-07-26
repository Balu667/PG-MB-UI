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

interface SearchBarProps {
  /** Placeholder shown inside the input */
  placeholder?: string;
  /** Called on every text change (debounce upstream if you need it) */
  onSearch: (text: string) => void;
  /** Optional: show the filter‑button & call this when tapped */
  onFilter?: () => void;
  /** When any filter is active → blue dot appears on the icon */
  filterActive?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search…",
  onSearch,
  onFilter,
  filterActive = false,
}) => {
  const { width } = useWindowDimensions();
  const [text, setText] = useState("");

  /* ---------- responsive sizes ---------- */
  const btnSize = clamp(44, width * 0.09, 56);
  const inputH = clamp(42, width * 0.085, 54);
  const font = clamp(13, width * 0.035, 16) / PixelRatio.getFontScale();

  return (
    <View style={[styles.wrap, { gap: btnSize * 0.26 }]}>
      {/* ---------------- text field ---------------- */}
      <View
        style={[
          styles.inputBox,
          {
            height: inputH,
            borderRadius: inputH * 0.33,
            paddingHorizontal: inputH * 0.33,
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
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onChangeText={(t) => {
            setText(t);
            onSearch(t);
          }}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      {/* ---------------- filter button (optional) ---------------- */}
      {onFilter && (
        <TouchableOpacity
          activeOpacity={0.75}
          style={[
            styles.filterBtn,
            { width: btnSize, height: btnSize, borderRadius: btnSize * 0.33 },
          ]}
          onPress={onFilter}
        >
          <View>
            <Feather name="sliders" size={font + 6} color={Colors.textAccent} />
            {filterActive && <View style={styles.dot} />}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },

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
  dot: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#256D85",
  },
});
