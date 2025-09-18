// src/components/AppHeader.tsx
import React, { useMemo, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useDispatch } from "react-redux";

import { useTheme } from "@/src/theme/ThemeContext";
import { useProperty } from "@/src/context/PropertyContext";
import { persistor } from "@/src/redux/store";

interface Props {
  showBack?: boolean;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  avatarUri?: string; // if not provided or falsy -> show initials
}

const AppHeader: React.FC<Props> = ({
  showBack = false,
  onBackPress,
  onNotificationPress,
  avatarUri,
}) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { properties, selectedId, setSelected, loading } = useProperty();
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch();

  const currentTitle =
    properties.find((p) => p._id === selectedId)?.propertyName ?? "Select property";

  // ---- utils ----
  const getInitials = (name?: string) => {
    if (!name) return "PG";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    const letters = parts.map((w) => (w[0] ?? "").toUpperCase()).join("");
    return letters || "PG";
  };

  // show initials if no avatarUri
  const shouldShowInitials = !avatarUri || avatarUri.trim().length === 0;
  const initials = useMemo(() => getInitials(currentTitle), [currentTitle]);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      await persistor.purge();
      dispatch({ type: "LOGOUT" });
    } finally {
      router.replace("/public");
    }
  };

  const s = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.md,
          paddingBottom: 20,
          paddingTop: insets.top + 18,
        },
        row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
        leftRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        actionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
        avatarImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white },
        avatarBubble: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.white,
          alignItems: "center",
          justifyContent: "center",
        },
        avatarText: { color: colors.primary, fontWeight: "700", fontSize: 16, letterSpacing: 0.3 },

        ddBtn: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: 220 },
        ddTxt: { fontSize: 16, color: colors.textWhite, fontWeight: "600" },

        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: "center",
          alignItems: "center",
        },
        backWrap: {
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: "center",
          alignItems: "center",
        },

        modalOverlay: { flex: 1, backgroundColor: "transparent" },

        menu: {
          position: "absolute",
          left: spacing.md,
          right: spacing.md,
          backgroundColor: colors.background,
          borderRadius: 14,
          paddingVertical: 8,
          top: insets.top + 70,
          maxHeight: Dimensions.get("window").height * 0.45,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 12,
        },
        listContent: { paddingVertical: 4 },

        itemRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
          paddingHorizontal: 14,
          gap: 10,
        },
        itemAvatar: {
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        itemAvatarText: { color: colors.accent, fontWeight: "700", fontSize: 12 },
        itemTxt: { fontSize: 16, color: colors.textPrimary, flex: 1 },
        itemSelected: {
          backgroundColor: colors.surface,
        },
        checkIcon: { marginLeft: 8 },

        sep: { height: 1, backgroundColor: colors.surface },

        loadingWrap: {
          paddingVertical: 16,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        emptyWrap: {
          paddingVertical: 16,
          paddingHorizontal: 16,
        },
        emptyTxt: { color: colors.textSecondary },
      }),
    [colors, spacing, insets.top, radius]
  );

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
            ) : shouldShowInitials ? (
              <View style={s.avatarBubble}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            ) : (
              <Image source={{ uri: avatarUri }} style={s.avatarImg} />
            )}

            <TouchableOpacity
              style={s.ddBtn}
              activeOpacity={0.7}
              onPress={() => !loading && setShowMenu(true)}
              disabled={loading}
            >
              <Text style={s.ddTxt} numberOfLines={1}>
                {currentTitle}
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Entypo name="chevron-down" size={18} color="#fff" />
              )}
            </TouchableOpacity>
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
            {loading ? (
              <View style={s.loadingWrap}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                  Loading properties…
                </Text>
              </View>
            ) : properties.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={s.emptyTxt}>No properties found</Text>
              </View>
            ) : (
              <FlatList
                data={properties}
                keyExtractor={(i) => i._id}
                contentContainerStyle={s.listContent}
                renderItem={({ item }) => {
                  const isSelected = selectedId === item._id;
                  const itemInitials = getInitials(item.propertyName);

                  return (
                    <TouchableOpacity
                      style={[s.itemRow, isSelected && s.itemSelected]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelected(item._id);
                        setShowMenu(false);
                      }}
                    >
                      {/* Left initials bubble */}
                      <View style={s.itemAvatar}>
                        <Text style={s.itemAvatarText}>{itemInitials}</Text>
                      </View>

                      {/* Title */}
                      <Text style={s.itemTxt} numberOfLines={1}>
                        {item.propertyName}
                      </Text>

                      {/* Right check for selected */}
                      {isSelected ? (
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color={colors.accent}
                          style={s.checkIcon}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={s.sep} />}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default AppHeader;
