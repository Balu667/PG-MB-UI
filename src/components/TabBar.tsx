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

const ICON_COLOR = "#256D85";
const screenWidth = Dimensions.get("window").width;

const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets(); // handles overlap with nav bar
  const maxVisibleTabs = 4;
  const visibleTabs = state.routes.slice(0, maxVisibleTabs);
  const moreTabs = state.routes.slice(maxVisibleTabs);

  // Modal for "More"
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
    const color = focused ? ICON_COLOR : "#7A7A7A";
    const icons: any = {
      index: "dashboard",
      Rooms: "meeting-room",
      Properties: "apartment",
      People: "groups",
      Store: "store",
    };
    return <MaterialIcons name={icons[name] || "circle"} size={24} color={color} />;
  };

  return (
    <>
      <View
        style={[
          styles.tabContainer,
          {
            // floating above system nav, and gap for iOS home bar / Android navbar
            marginBottom: Math.max(insets.bottom, 8),
            shadowOpacity: Platform.OS === "android" ? 0.2 : 0.1, // a bit more shadow on Android
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
              // style={styles.tabItem}
              style={[
                styles.tabItem,
                isFocused && styles.selectedTabBg, // <-- add this line
              ]}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              {getIcon(route.name, isFocused)}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.label, isFocused && styles.labelFocused]}
                allowFontScaling
              >
                {descriptors[route.key].options.title}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* {moreTabs.length > 0 && (
          <TouchableOpacity
            style={styles.tabItem}
            onPress={openMore}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Feather name="more-horizontal" size={24} color={ICON_COLOR} />
            <Text style={styles.label}>More</Text>
          </TouchableOpacity>
        )} */}
        {moreTabs.length > 0 && (
          <TouchableOpacity
            style={[
              styles.tabItem,
              isMoreFocused && styles.selectedTabBg, // highlight “More” when needed
            ]}
            onPress={openMore}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Feather
              name="more-horizontal"
              size={24}
              color={isMoreFocused ? ICON_COLOR : "#7A7A7A"}
            />
            <Text style={[styles.label, isMoreFocused && styles.labelFocused]}>More</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal for "More" */}
      <Modal visible={showMore} animationType="fade" transparent onRequestClose={closeMore}>
        <Pressable style={styles.modalOverlay} onPress={closeMore}>
          <Animated.View
            style={[
              styles.modalView,
              { transform: [{ translateY: slideAnim }] },
              // { marginBottom: insets.bottom || 20 },
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.moreContent}>
              {moreTabs.map((route: any, idx: any) => {
                const isCurrent = route.key === focusedRoute.key;
                return (
                  <TouchableOpacity
                    key={route.key}
                    style={[styles.moreItem, isCurrent && styles.moreItemSelected]}
                    onPress={() => {
                      navigation.navigate(route.name);
                      closeMore();
                    }}
                  >
                    <View style={styles.itemContainer}>
                      {getIcon(route.name, false)}
                      <Text style={styles.moreLabel}>{descriptors[route.key].options.title}</Text>
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
  selectedTabBg: {
    backgroundColor: "#E3F2FD", // Light blue (use your theme or adjust)
    borderRadius: 18,
    // paddingHorizontal: 16,
    paddingVertical: 10,
  },
  moreItemSelected: {
    backgroundColor: "#E3F2FD", // same light blue you use on the bar
    borderRadius: 10,
  },

  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginHorizontal: 12,
    // Floating look:
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 18,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 101,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 5,
    minWidth: 56,
  },
  label: {
    marginTop: 2,
    fontSize: 12,
    color: "#7A7A7A",
    textAlign: "center",
    maxWidth: screenWidth / 5 - 20,
    includeFontPadding: false,
  },
  labelFocused: {
    color: ICON_COLOR,
    fontWeight: "600",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.33)",
  },
  modalView: {
    backgroundColor: "#fff",
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
  },
  modalHandle: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginBottom: 15,
  },
  moreContent: {
    flexDirection: "column",
  },
  moreItem: {
    paddingVertical: 13,
    paddingHorizontal: 2,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 10,
    padding: 12,
  },
  moreLabel: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    flexShrink: 1,
  },
});

export default TabBar;
