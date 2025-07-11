// import React from "react";
// import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
// import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import { LinearGradient } from "expo-linear-gradient"; // Import LinearGradient for gradient effect

// type MyTabBarProps = BottomTabBarProps;

// const TabBar: React.FC<MyTabBarProps> = ({
//   state,
//   navigation,
//   descriptors,
// }) => {
//   const returnIcons = (name: string, isFocused: boolean) => {
//     switch (name) {
//       case "index":
//         return (
//           <MaterialIcons
//             name="dashboard"
//             size={26}
//             color={isFocused ? "#256D85" : "black"}
//           />
//         );
//       case "Rooms":
//         return (
//           <MaterialIcons
//             name="meeting-room"
//             size={26}
//             color={isFocused ? "#256D85" : "black"}
//           />
//         );
//       case "Properties":
//         return (
//           <MaterialIcons
//             name="apartment"
//             size={26}
//             color={isFocused ? "#256D85" : "black"}
//           />
//         );
//       case "People":
//         return (
//           <MaterialIcons
//             name="groups"
//             size={26}
//             color={isFocused ? "#256D85" : "black"}
//           />
//         );
//       case "Store":
//         return (
//           <MaterialIcons
//             name="store"
//             size={26}
//             color={isFocused ? "#256D85" : "black"}
//           />
//         );
//         break;

//       default:
//         break;
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {state.routes.map((route, index) => {
//         const { options } = descriptors[route.key];
//         const label =
//           options.tabBarLabel !== undefined
//             ? options.tabBarLabel
//             : options.title !== undefined
//             ? options.title
//             : route.name;

//         const isFocused = state.index === index;

//         if (["_sitemap", "+not-found"].includes(route.name)) return null;

//         const onPress = () => {
//           const event = navigation.emit({
//             type: "tabPress",
//             target: route.key,
//             canPreventDefault: true,
//           });

//           if (!isFocused && !event.defaultPrevented) {
//             navigation.navigate(route.name, route.params);
//           }
//         };

//         const onLongPress = () => {
//           navigation.emit({
//             type: "tabLongPress",
//             target: route.key,
//           });
//         };

//         return (
//           <TouchableOpacity
//             key={route.name}
//             style={[styles.tabBarItem]}
//             accessibilityState={isFocused ? { selected: true } : {}}
//             accessibilityLabel={options.tabBarAccessibilityLabel}
//             testID={options.tabBarButtonTestID}
//             onPress={onPress}
//             onLongPress={onLongPress}
//           >
//             <View style={[styles.icons]}>
//               {isFocused ? (
//                 <LinearGradient
//                   colors={["rgba(127, 206, 225, 0.55)", "rgb(253, 253, 253)"]}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 0, y: 1 }}
//                   style={[styles.selectedTabGradient]}
//                 />
//               ) : null}
//               {returnIcons(route.name, isFocused)}
//               <Text
//                 style={{
//                   color: isFocused ? "#256D85" : "black",
//                   fontSize: 14,
//                 }}
//               >
//                 {route.name === "index" ? "Dashboard" : route.name}
//               </Text>
//             </View>
//           </TouchableOpacity>
//         );
//       })}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     bottom: 5,
//     backgroundColor: "white",
//     borderRadius: 20,
//     shadowColor: "black",
//     shadowOffset: { width: 0, height: 10 },
//     shadowRadius: 10,
//     shadowOpacity: 0.1,
//     gap: 10,
//   },
//   tabBarItem: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     cursor: "pointer",
//     position: "relative",
//   },
//   icons: {
//     width: "100%",
//     height: 60,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   selectedTabGradient: {
//     ...StyleSheet.absoluteFillObject,
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     borderTopColor: "#256D85",
//     borderTopWidth: 2,
//   },
// });

// export default TabBar;

// import React, { useState } from "react";
// import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Platform } from "react-native";
// import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import { LinearGradient } from "expo-linear-gradient";

// const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
//   const [showModal, setShowModal] = useState(false);

//   const handleMorePress = () => {
//     setShowModal(true);
//   };

//   const closeModal = () => {
//     setShowModal(false);
//   };

//   const returnIcons = (name: string, isFocused: boolean) => {
//     const color = isFocused ? "#256D85" : "#6B7280"; // slate-500
//     const size = 26;

//     switch (name) {
//       case "index":
//         return <MaterialIcons name="dashboard" size={size} color={color} />;
//       case "Rooms":
//         return <MaterialIcons name="meeting-room" size={size} color={color} />;
//       case "Properties":
//         return <MaterialIcons name="apartment" size={size} color={color} />;
//       case "People":
//         return <MaterialIcons name="groups" size={size} color={color} />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <>
//       <View style={styles.tabContainer}>
//         {state.routes.map((route, index) => {
//           if (["_sitemap", "+not-found", "Store"].includes(route.name)) return null;

//           const isFocused = state.index === index;
//           const { options } = descriptors[route.key];
//           const label = options.title || route.name;

//           const onPress = () => {
//             const event = navigation.emit({
//               type: "tabPress",
//               target: route.key,
//               canPreventDefault: true,
//             });

//             if (!isFocused && !event.defaultPrevented) {
//               navigation.navigate(route.name);
//             }
//           };

//           return (
//             <TouchableOpacity
//               key={route.key}
//               onPress={onPress}
//               style={styles.tabItem}
//               accessibilityState={isFocused ? { selected: true } : {}}
//               accessibilityLabel={options.tabBarAccessibilityLabel}
//               testID={options.tabBarButtonTestID}
//             >
//               <View style={styles.iconLabelWrapper}>
//                 {isFocused && (
//                   <LinearGradient
//                     colors={["#b2ebf2", "#ffffff"]}
//                     style={styles.gradientBackground}
//                   />
//                 )}
//                 {returnIcons(route.name, isFocused)}
//                 <Text style={[styles.label, isFocused && styles.activeLabel]}>
//                   {route.name === "index" ? "Dashboard" : label}
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           );
//         })}

//         {/* "More" Tab */}
//         <TouchableOpacity onPress={handleMorePress} style={styles.tabItem}>
//           <View style={styles.iconLabelWrapper}>
//             <MaterialIcons name="more-horiz" size={26} color={showModal ? "#256D85" : "#6B7280"} />
//             <Text style={[styles.label, showModal && styles.activeLabel]}>More</Text>
//           </View>
//         </TouchableOpacity>
//       </View>

//       {/* Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showModal}
//         onRequestClose={closeModal}
//       >
//         <Pressable style={styles.modalOverlay} onPress={closeModal}>
//           <View style={styles.modalContainer}>
//             <Text style={styles.modalTitle}>More Options</Text>
//             {/* Add your additional items here */}
//             <TouchableOpacity style={styles.modalItem}>
//               <Text style={styles.modalItemText}>Settings</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.modalItem}>
//               <Text style={styles.modalItemText}>Help & Support</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.modalItem}>
//               <Text style={styles.modalItemText}>Logout</Text>
//             </TouchableOpacity>
//           </View>
//         </Pressable>
//       </Modal>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   tabContainer: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     backgroundColor: "#fff",
//     paddingBottom: Platform.OS === "ios" ? 30 : 10,
//     paddingTop: 10,
//     borderTopWidth: 0.3,
//     borderColor: "#ccc",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: -3 },
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 20,
//   },
//   tabItem: {
//     alignItems: "center",
//     justifyContent: "center",
//     flex: 1,
//     paddingVertical: 6,
//   },
//   iconLabelWrapper: {
//     alignItems: "center",
//     justifyContent: "center",
//     position: "relative",
//   },
//   gradientBackground: {
//     ...StyleSheet.absoluteFillObject,
//     borderRadius: 12,
//     opacity: 0.3,
//   },
//   label: {
//     fontSize: 12,
//     marginTop: 2,
//     color: "#6B7280",
//     fontWeight: "500",
//   },
//   activeLabel: {
//     color: "#256D85",
//     fontWeight: "600",
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.2)",
//     justifyContent: "flex-end",
//   },
//   modalContainer: {
//     backgroundColor: "#fff",
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     elevation: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 10,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginBottom: 15,
//     color: "#111",
//   },
//   modalItem: {
//     paddingVertical: 12,
//   },
//   modalItemText: {
//     fontSize: 16,
//     color: "#333",
//   },
// });

// export default TabBar;
// Enhanced TabBar.tsx
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   Pressable,
//   Dimensions,
//   Platform,
// } from "react-native";
// import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import Feather from "@expo/vector-icons/Feather";
// import { BlurView } from "expo-blur";

// const { width } = Dimensions.get("window");
// const ICON_COLOR = "#256D85";

// const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
//   const [showMore, setShowMore] = useState(false);

//   const handleMorePress = () => {
//     setShowMore(true);
//   };

//   const handleCloseMore = () => {
//     setShowMore(false);
//   };

//   const getIcon = (name: string, focused: boolean) => {
//     const color = focused ? ICON_COLOR : "#7A7A7A";
//     switch (name) {
//       case "index":
//         return <MaterialIcons name="dashboard" size={24} color={color} />;
//       case "Rooms":
//         return <MaterialIcons name="meeting-room" size={24} color={color} />;
//       case "Properties":
//         return <MaterialIcons name="apartment" size={24} color={color} />;
//       case "People":
//         return <MaterialIcons name="groups" size={24} color={color} />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <>
//       <View style={styles.tabContainer}>
//         {state.routes.map((route, index) => {
//           if (["_sitemap", "+not-found"].includes(route.name)) return null;
//           if (route.name === "Store") return null;

//           const isFocused = state.index === index;
//           const onPress = () => {
//             const event = navigation.emit({
//               type: "tabPress",
//               target: route.key,
//               canPreventDefault: true,
//             });

//             if (!isFocused && !event.defaultPrevented) {
//               navigation.navigate(route.name);
//             }
//           };

//           return (
//             <TouchableOpacity
//               key={route.key}
//               accessibilityState={isFocused ? { selected: true } : {}}
//               onPress={onPress}
//               style={styles.tabItem}
//             >
//               {getIcon(route.name, isFocused)}
//               <Text style={[styles.label, isFocused && styles.labelFocused]}>
//                 {route.name === "index" ? "Dashboard" : route.name}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}

//         {/* More Button */}
//         <TouchableOpacity style={styles.tabItem} onPress={handleMorePress}>
//           <Feather name="more-horizontal" size={24} color={ICON_COLOR} />
//           <Text style={[styles.label, styles.labelFocused]}>More</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Modal */}
//       <Modal visible={showMore} animationType="slide" transparent onRequestClose={handleCloseMore}>
//         <Pressable style={styles.modalOverlay} onPress={handleCloseMore}>
//           <BlurView intensity={80} tint="light" style={styles.modalView}>
//             <View style={styles.modalHandle} />
//             <View style={styles.moreContent}>
//               <TouchableOpacity style={styles.moreItem}>
//                 <MaterialIcons name="store" size={26} color="#000" />
//                 <Text style={styles.moreLabel}>Store</Text>
//               </TouchableOpacity>
//               {/* Add more items as needed */}
//             </View>
//           </BlurView>
//         </Pressable>
//       </Modal>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   tabContainer: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 40,
//     marginHorizontal: 20,
//     marginBottom: Platform.OS === "ios" ? 30 : 20,
//     justifyContent: "space-between",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 8,
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//   },
//   tabItem: {
//     alignItems: "center",
//     flex: 1,
//   },
//   label: {
//     fontSize: 12,
//     color: "#7A7A7A",
//   },
//   labelFocused: {
//     color: ICON_COLOR,
//     fontWeight: "600",
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "flex-end",
//     backgroundColor: "rgba(0,0,0,0.2)",
//   },
//   modalView: {
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   modalHandle: {
//     width: 50,
//     height: 5,
//     borderRadius: 3,
//     backgroundColor: "#ccc",
//     alignSelf: "center",
//     marginBottom: 10,
//   },
//   moreContent: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 30,
//     justifyContent: "space-around",
//   },
//   moreItem: {
//     alignItems: "center",
//     marginVertical: 10,
//     width: width / 4,
//   },
//   moreLabel: {
//     marginTop: 5,
//     fontSize: 14,
//     fontWeight: "500",
//   },
// });

// export default TabBar;

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   Pressable,
//   Dimensions,
//   Platform,
//   Animated,
// } from "react-native";
// import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import Feather from "@expo/vector-icons/Feather";
// import { BlurView } from "expo-blur";

// const { width, height } = Dimensions.get("window");
// const ICON_COLOR = "#256D85";

// const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
//   const [showMore, setShowMore] = useState(false);
//   const slideAnim = React.useRef(new Animated.Value(height)).current;

//   const handleMorePress = () => {
//     setShowMore(true);
//     Animated.timing(slideAnim, {
//       toValue: 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//   };

//   const handleCloseMore = () => {
//     Animated.timing(slideAnim, {
//       toValue: height,
//       duration: 300,
//       useNativeDriver: true,
//     }).start(() => setShowMore(false));
//   };

//   const getIcon = (name: string, focused: boolean) => {
//     const color = focused ? ICON_COLOR : "#7A7A7A";
//     switch (name) {
//       case "index":
//         return <MaterialIcons name="dashboard" size={24} color={color} />;
//       case "Rooms":
//         return <MaterialIcons name="meeting-room" size={24} color={color} />;
//       case "Properties":
//         return <MaterialIcons name="apartment" size={24} color={color} />;
//       case "People":
//         return <MaterialIcons name="groups" size={24} color={color} />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <>
//       <View style={styles.tabContainer}>
//         {state.routes.map((route, index) => {
//           if (["_sitemap", "+not-found"].includes(route.name)) return null;
//           if (route.name === "Store") return null;

//           const isFocused = state.index === index;
//           const onPress = () => {
//             const event = navigation.emit({
//               type: "tabPress",
//               target: route.key,
//               canPreventDefault: true,
//             });

//             if (!isFocused && !event.defaultPrevented) {
//               navigation.navigate(route.name);
//             }
//           };

//           return (
//             <TouchableOpacity
//               key={route.key}
//               accessibilityState={isFocused ? { selected: true } : {}}
//               onPress={onPress}
//               style={styles.tabItem}
//             >
//               {getIcon(route.name, isFocused)}
//               <Text style={[styles.label, isFocused && styles.labelFocused]}>
//                 {route.name === "index" ? "Dashboard" : route.name}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}

//         <TouchableOpacity style={styles.tabItem} onPress={handleMorePress}>
//           <Feather name="more-horizontal" size={24} color={ICON_COLOR} />
//           <Text style={[styles.label, styles.labelFocused]}>More</Text>
//         </TouchableOpacity>
//       </View>

//       <Modal visible={showMore} animationType="none" transparent onRequestClose={handleCloseMore}>
//         <Pressable style={styles.modalOverlay} onPress={handleCloseMore}>
//           <Animated.View
//             style={[
//               styles.modalView,
//               {
//                 transform: [{ translateY: slideAnim }],
//               },
//             ]}
//           >
//             <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
//             <View style={styles.modalHandle} />
//             <View style={styles.moreContent}>
//               <TouchableOpacity
//                 style={styles.moreItem}
//                 onPress={() => {
//                   navigation.navigate("Store");
//                   handleCloseMore();
//                 }}
//               >
//                 <View style={styles.itemContainer}>
//                   <MaterialIcons name="store" size={26} color="#fff" />
//                   <Text style={styles.moreLabel}>Store</Text>
//                 </View>
//               </TouchableOpacity>
//               {/* Add more items as needed */}
//             </View>
//           </Animated.View>
//         </Pressable>
//       </Modal>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   tabContainer: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 40,
//     marginHorizontal: 20,
//     marginBottom: Platform.OS === "ios" ? 30 : 20,
//     justifyContent: "space-between",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 8,
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//   },
//   tabItem: {
//     alignItems: "center",
//     flex: 1,
//   },
//   label: {
//     fontSize: 12,
//     color: "#7A7A7A",
//   },
//   labelFocused: {
//     color: ICON_COLOR,
//     fontWeight: "600",
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "flex-end",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalView: {
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//     backgroundColor: "rgba(30, 30, 30, 0.95)",
//     minHeight: height * 0.25,
//     overflow: "hidden",
//   },
//   modalHandle: {
//     width: 40,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: "rgba(255, 255, 255, 0.3)",
//     alignSelf: "center",
//     marginBottom: 20,
//   },
//   moreContent: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "flex-start",
//     paddingHorizontal: 10,
//   },
//   moreItem: {
//     width: "50%",
//     paddingVertical: 15,
//     paddingHorizontal: 10,
//   },
//   itemContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255, 255, 255, 0.1)",
//     borderRadius: 12,
//     padding: 12,
//   },
//   moreLabel: {
//     marginLeft: 10,
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#fff",
//   },
// });

// export default TabBar;
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
