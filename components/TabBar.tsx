import React, { } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { AntDesign , FontAwesome5 } from "@expo/vector-icons";

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
          <AntDesign
            name="home"
            color={isFocused ? "green" : "black"}
            size={20}
          />
        );
      case "Transaction":
        return (
          <FontAwesome5 name="money-bill-alt" size={20}   color={isFocused ? "green" : "black"} />
        );
      case "Profile":
        return (
          <AntDesign
            name="profile"
            color={isFocused ? "green" : "black"}
            size={20}
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
                style={{ color: isFocused ? "green" : "black", fontSize: 12 }}
              >
                {route.name === 'index' ? "Home" : route.name}
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
    alignItems: "center",
    bottom: 25,
    backgroundColor: "white",
    marginHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
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
    cursor:"pointer"
  },
  icons: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TabBar;
