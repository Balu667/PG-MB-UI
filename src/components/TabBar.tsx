import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");
const ICON_COLOR = "#256D85";

const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const [showMore, setShowMore] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  const handleMorePress = () => {
    setShowMore(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseMore = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowMore(false));
  };

  const getIcon = (name: string, focused: boolean) => {
    const color = focused ? ICON_COLOR : "#7A7A7A";
    switch (name) {
      case "index":
        return <MaterialIcons name="dashboard" size={24} color={color} />;
      case "Rooms":
        return <MaterialIcons name="meeting-room" size={24} color={color} />;
      case "Properties":
        return <MaterialIcons name="apartment" size={24} color={color} />;
      case "People":
        return <MaterialIcons name="groups" size={24} color={color} />;
      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          if (["_sitemap", "+not-found"].includes(route.name)) return null;
          if (route.name === "Store") return null;

          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabItem}
            >
              {getIcon(route.name, isFocused)}
              <Text style={[styles.label, isFocused && styles.labelFocused]}>
                {route.name === "index" ? "Dashboard" : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.tabItem} onPress={handleMorePress}>
          <Feather name="more-horizontal" size={24} color={ICON_COLOR} />
          <Text style={[styles.label, styles.labelFocused]}>More</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showMore} animationType="none" transparent onRequestClose={handleCloseMore}>
        <Pressable style={styles.modalOverlay} onPress={handleCloseMore}>
          <Animated.View
            style={[
              styles.modalView,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            <View style={styles.moreContent}>
              {[1, 2, 3, 4, 5].map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.moreItem}
                  onPress={() => {
                    navigation.navigate("Store");
                    handleCloseMore();
                  }}
                >
                  <View style={styles.itemContainer}>
                    <MaterialIcons name="store" size={26} color={ICON_COLOR} />
                    <Text style={styles.moreLabel}>Store</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {/* Add more items as needed */}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 40,
    marginHorizontal: 20,
    marginBottom: Platform.OS === "ios" ? 30 : 20,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#7A7A7A",
  },
  labelFocused: {
    color: ICON_COLOR,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    backgroundColor: "#fff",
    minHeight: height * 0.25,
    overflow: "hidden",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignSelf: "center",
    marginBottom: 20,
  },
  moreContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    // paddingHorizontal: 10,
  },
  moreItem: {
    width: "50%",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 12,
    padding: 12,
  },
  moreLabel: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
});

export default TabBar;
