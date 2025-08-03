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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useDispatch } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { useProperty } from "@/src/context/PropertyContext";

interface Props {
  showBack?: boolean;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  avatarUri?: string;
}

const AppHeader: React.FC<Props> = ({
  showBack = false,
  onBackPress,
  onNotificationPress,
  avatarUri = "https://via.placeholder.com/40",
}) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { properties, selectedId, setSelected, loading } = useProperty();
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch();

  const currentTitle =
    properties.find((p) => p._id === selectedId)?.propertyName ?? "Select property";

  const logout = async () => {
    await AsyncStorage.removeItem("userToken");
    dispatch({ type: "LOGOUT" });
    router.replace("/public");
  };

  const s = StyleSheet.create({
    wrapper: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingBottom: 20,
      paddingTop: insets.top + 18,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    leftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.white,
    },
    ddBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      maxWidth: 220,
    },
    ddTxt: {
      fontSize: 16,
      color: colors.textWhite,
      fontWeight: "600",
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "transparent",
    },
    menu: {
      position: "absolute",
      left: spacing.md,
      right: spacing.md,
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 6,
      top: insets.top + 70,
      maxHeight: Dimensions.get("window").height * 0.45,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 12,
    },
    item: {
      paddingVertical: 12,
      paddingHorizontal: 18,
    },
    itemTxt: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    selTxt: {
      color: colors.primary,
      fontWeight: "700",
    },
    sep: {
      height: 1,
      backgroundColor: colors.surface,
    },
    backWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={s.wrapper}>
        <View style={s.row}>
          <View style={s.leftRow}>
            {showBack ? (
              <Pressable
                onPress={onBackPress}
                android_ripple={{ color: "#ffffff44", borderless: true }}
                style={s.backWrap}
                accessibilityRole="button"
              >
                <Entypo name="chevron-left" size={26} color="#fff" />
              </Pressable>
            ) : (
              <Image source={{ uri: avatarUri }} style={s.avatar} />
            )}

            {!loading && (
              <TouchableOpacity
                style={s.ddBtn}
                activeOpacity={0.7}
                onPress={() => setShowMenu(true)}
              >
                <Text style={s.ddTxt} numberOfLines={1}>
                  {currentTitle}
                </Text>
                <Entypo name="chevron-down" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={s.actionRow}>
            <Pressable
              onPress={onNotificationPress}
              android_ripple={{ color: "#ffffff44", borderless: true }}
              style={({ pressed }) => [
                s.iconWrap,
                pressed && Platform.OS === "ios" && { backgroundColor: "#ffffff22" },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <MaterialIcons name="notifications" size={24} color="#fff" />
            </Pressable>

            <Pressable
              onPress={logout}
              android_ripple={{ color: "#ffffff44", borderless: true }}
              style={({ pressed }) => [
                s.iconWrap,
                pressed && Platform.OS === "ios" && { backgroundColor: "#ffffff22" },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <MaterialIcons name="logout" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={s.menu}>
            <FlatList
              data={properties}
              keyExtractor={(i) => i._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.item}
                  onPress={() => {
                    setSelected(item._id);
                    setShowMenu(false);
                  }}
                >
                  <Text style={[s.itemTxt, selectedId === item._id && s.selTxt]} numberOfLines={1}>
                    {item.propertyName}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={s.sep} />}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default AppHeader;
