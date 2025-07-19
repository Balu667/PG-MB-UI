import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  StatusBar,
  Platform,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface PropertyOption {
  _id: string;
  propertyName: string;
}

interface Props {
  avatarUri: string;
  propertyOptions: PropertyOption[];
  selectedId: string;
  onSelectProperty: (id: string) => void;
  onNotificationPress?: () => void;
}

const AppHeader: React.FC<Props> = ({
  avatarUri,
  propertyOptions,
  selectedId,
  onSelectProperty,
  onNotificationPress,
}) => {
  const insets = useSafeAreaInsets();
  const [showMenu, setShowMenu] = useState(false);

  const currentTitle =
    propertyOptions.find((p) => p._id === selectedId)?.propertyName ?? "Select property";

  /* =========================================================================
     Render
     ========================================================================= */
  return (
    <>
      {/* ===================== Top Bar ===================== */}
      <View
        style={[
          styles.wrapper,
          {
            marginTop: -insets.top, // keep BG behind status‑bar
            // paddingTop:
            //   insets.top +
            //   10 + // push content down
            //   Math.max(0, (insets.top - 44) / 2), // ⬅️ extra 6 px for Dynamic Island / tall punch‑holes
            paddingTop: +insets.top + 50 + Math.max(0, (insets.top - 44) / 2),
          },
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor="#256D85" />

        <View style={styles.row}>
          {/* Avatar + dropdown trigger */}
          <View style={styles.leftRow}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />

            <TouchableOpacity
              style={styles.dropdownButton}
              activeOpacity={0.7}
              onPress={() => setShowMenu(true)}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {currentTitle}
              </Text>
              <Entypo name="chevron-down" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bell */}
          <Pressable
            onPress={onNotificationPress}
            android_ripple={{ color: "#ffffff44", borderless: true }}
            style={({ pressed }) => [
              styles.iconWrapper,
              pressed && Platform.OS === "ios" && { backgroundColor: "#ffffff22" },
            ]}
          >
            <MaterialIcons name="notifications" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* ===================== Pop‑down Menu ===================== */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View
            style={[
              styles.menuPanel,
              {
                top: insets.top + 70,
                maxHeight: Dimensions.get("window").height * 0.45,
              },
            ]}
          >
            <FlatList
              data={propertyOptions}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onSelectProperty(item._id);
                    setShowMenu(false);
                  }}
                >
                  <Text
                    style={[styles.menuText, selectedId === item._id && styles.selectedText]}
                    numberOfLines={1}
                  >
                    {item.propertyName}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#256D85",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff" },

  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 220,
  },
  dropdownText: { fontSize: 16, color: "#fff", fontWeight: "600" },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  /* --- menu --- */
  modalOverlay: { flex: 1, backgroundColor: "transparent" },
  menuPanel: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 18 },
  menuText: { fontSize: 16, color: "#333" },
  selectedText: { color: "#256D85", fontWeight: "700" },
  separator: { height: 1, backgroundColor: "#f1f1f1" },
});

export default AppHeader;
