import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient"; // Import LinearGradient for gradient effect

type MyTabBarProps = BottomTabBarProps;

const TabBar: React.FC<MyTabBarProps> = ({
  state,
  navigation,
  descriptors,
}) => {
  const returnIcons = (name: string, isFocused: boolean) => {
    switch (name) {
      case "index":
        return (
          <MaterialIcons
            name="dashboard"
            size={26}
            color={isFocused ? "#256D85" : "black"}
          />
        );
      case "Rooms":
        return (
          <MaterialIcons
            name="meeting-room"
            size={26}
            color={isFocused ? "#256D85" : "black"}
          />
        );
      case "Properties":
        return (
          <MaterialIcons
            name="apartment"
            size={26}
            color={isFocused ? "#256D85" : "black"}
          />
        );
      case "People":
        return (
          <MaterialIcons
            name="groups"
            size={26}
            color={isFocused ? "#256D85" : "black"}
          />
        );
      case "Store":
        return (
          <MaterialIcons
            name="store"
            size={26}
            color={isFocused ? "#256D85" : "black"}
          />
        );
        break;

      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        if (["_sitemap", "+not-found"].includes(route.name)) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.name}
            style={[styles.tabBarItem]}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
          >
            <View style={[styles.icons]}>
              {isFocused ? (
                <LinearGradient
                  colors={["rgba(127, 206, 225, 0.55)", "rgb(253, 253, 253)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.selectedTabGradient]}
                />
              ) : null}
              {returnIcons(route.name, isFocused)}
              <Text
                style={{
                  color: isFocused ? "#256D85" : "black",
                  fontSize: 14,
                }}
              >
                {route.name === "index" ? "Dashboard" : route.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    bottom: 5,
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
    gap: 10,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    position: "relative",
  },
  icons: {
    width: "100%",
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedTabGradient: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: "#256D85",
    borderTopWidth: 2,
  },
});

export default TabBar;
