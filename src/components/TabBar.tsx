import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "../theme/ThemeContext";

const screenWidth = Dimensions.get("window").width;

const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const maxVisibleTabs = 4;
  const visibleTabs = state.routes.slice(0, maxVisibleTabs);
  const moreTabs = state.routes.slice(maxVisibleTabs);
  const { colors, radius } = useTheme();
  const ICON_COLOR = colors.textWhite;

  const [showMore, setShowMore] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const focusedRoute = state.routes[state.index];
  const isMoreFocused = moreTabs.some((r: any) => r.key === focusedRoute.key);
  const openMore = () => {
    setShowMore(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMore = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowMore(false));
  };

  const handleTabPress = (route: any, index: any) => {
    const isFocused = state.index === index;
    const event = navigation.emit({ type: "tabPress", target: route.key });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const getIcon = (name: any, focused: any) => {
    const color = focused ? ICON_COLOR : colors.accent;
    const icons: any = {
      Dashboard: "dashboard",
      Rooms: "meeting-room",
      Properties: "apartment",
      Tenants: "groups",
      Store: "store",
    };
    return <MaterialIcons name={icons[name] || "circle"} size={24} color={color} />;
  };

  return (
    <>
      <View
        style={[
          styles.tabContainer(colors, radius),
          {
            marginBottom: Math.max(insets.bottom, 8),
            shadowOpacity: Platform.OS === "android" ? 0.2 : 0.1,
          },
        ]}
        pointerEvents="box-none"
      >
        {visibleTabs.map((route: any, index: any) => {
          const isFocused = state.index === index;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handleTabPress(route, index)}
              style={[styles.tabItem, isFocused && styles.selectedTabBg(colors, radius)]}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              {getIcon(route.name, isFocused)}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.label(colors), isFocused && styles.labelFocused(ICON_COLOR)]}
                allowFontScaling
              >
                {descriptors[route.key].options.title}
              </Text>
            </TouchableOpacity>
          );
        })}

        {moreTabs.length > 0 && (
          <TouchableOpacity
            style={[styles.tabItem, isMoreFocused && styles.selectedTabBg(colors, radius)]}
            onPress={openMore}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Feather
              name="more-horizontal"
              size={24}
              color={isMoreFocused ? ICON_COLOR : "#7A7A7A"}
            />
            <Text style={[styles.label(colors), isMoreFocused && styles.labelFocused(ICON_COLOR)]}>
              More
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showMore} animationType="fade" transparent onRequestClose={closeMore}>
        <Pressable style={styles.modalOverlay} onPress={closeMore}>
          <Animated.View
            style={[styles.modalView(colors), { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.modalHandle(colors)} />
            <View style={styles.moreContent}>
              {moreTabs.map((route: any, idx: any) => {
                const isCurrent = route.key === focusedRoute.key;
                return (
                  <TouchableOpacity
                    key={route.key}
                    style={[styles.moreItem, isCurrent]}
                    onPress={() => {
                      navigation.navigate(route.name);
                      closeMore();
                    }}
                  >
                    <View
                      style={
                        isCurrent
                          ? styles.moreItemSelected(colors, radius)
                          : styles.itemContainer(colors)
                      }
                    >
                      {getIcon(route.name, isCurrent)}
                      <Text
                        style={
                          isCurrent
                            ? styles.selectedMoreLabel(ICON_COLOR)
                            : styles.moreLabel(colors)
                        }
                      >
                        {descriptors[route.key].options.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectedTabBg: (c: any, r: any) => ({
    backgroundColor: c.primary,
    borderRadius: r.xl,
    paddingVertical: 10,
  }),
  moreItemSelected: (c: any, r: any) => ({
    backgroundColor: c.primary,
    borderRadius: r.xxl,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  }),

  tabContainer: (c: any, r: any) => ({
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: c.background,
    borderRadius: r.xxl,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: c.borderColor,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: r.xl,
    elevation: r.xl,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 101,
  }),
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 5,
    minWidth: 56,
  },
  label: (c: any) => ({
    marginTop: 2,
    fontSize: 12,
    color: c.accent,
    textAlign: "center",
    maxWidth: screenWidth / 5 - 20,
    includeFontPadding: false,
  }),
  labelFocused: (color: any) => ({
    color: color,
    fontWeight: "600",
  }),
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.33)",
  },
  modalView: (c: any) => ({
    backgroundColor: c.background2,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    minHeight: 130,
    // Shadow for modal
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 10,
  }),
  modalHandle: (c: any) => ({
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: c.accent,
    alignSelf: "center",
    marginBottom: 15,
  }),
  moreContent: {
    flexDirection: "column",
  },
  moreItem: {
    paddingVertical: 13,
    paddingHorizontal: 2,
  },
  itemContainer: (c: any) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.tabSurface,
    borderRadius: 10,
    padding: 12,
  }),
  moreLabel: (c: any) => ({
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
    color: c.accent,
    flexShrink: 1,
  }),
  selectedMoreLabel: (ICON_COLOR: any) => ({
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
    color: ICON_COLOR,
    flexShrink: 1,
  }),
});

export default TabBar;
