import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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
      case "Room":
        return (
          <MaterialIcons
            name="meeting-room"
            size={26}
            color={isFocused ? "#256D85" : "black"}
          />
        );
      case "Property":
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
              {returnIcons(route.name, isFocused)}
              <Text
                style={{ color: isFocused ? "#256D85" : "black", fontSize: 12 }}
              >
                {route.name === "index" ? "Home" : route.name}
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
    paddingVertical: 15,
    borderCurve: "continuous",
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
  },
  icons: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TabBar;
