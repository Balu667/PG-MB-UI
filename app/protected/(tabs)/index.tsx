// import React from "react";
// import { StyleSheet, View, Text, TextInput, ScrollView } from "react-native";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import Entypo from "@expo/vector-icons/Entypo";
// import PropertyCard from "@/src/components/PropertyCard";

// const pgProperties = [
//   {
//     _id: "6801cc72e26fc33c842415e1",
//     metadata: {
//       totalRooms: 15,
//       totalBeds: 56,
//       vacantBeds: 48,
//       advancedBookings: 4,
//       occupiedBeds: 4,
//       underNotice: 0,
//       expenses: 0,
//       dues: 63000,
//       income: 0,
//     },
//     propertyId: "PG-00031",
//     propertyName: "Hanuman Gen's PG",
//     tenantType: "Male",
//     mealType: "Both",
//     doorNo: "900",
//     streetName: "100 Feet Road",
//     area: "Madhapur",
//     city: "Hyderabad",
//     state: "Telangana",
//     pincode: "500098",
//     country: "India",
//     landmark: "Near Tea shop",
//     facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV"],
//     notifications: {
//       sms: true,
//       whatsapp: true,
//     },
//     noticePeriod: "30",
//   },
//   {
//     _id: "6801ccbce26fc33c842415ec",
//     metadata: {
//       totalRooms: 1,
//       totalBeds: 1,
//       vacantBeds: 0,
//       advancedBookings: 0,
//       occupiedBeds: 1,
//       underNotice: 1,
//       expenses: 0,
//       dues: 4000,
//       income: 0,
//     },
//     propertyId: "PG-00032",
//     propertyName: "Hanuman Gen's PG",
//     tenantType: "Male",
//     mealType: "Both",
//     doorNo: "900",
//     streetName: "Btm Layout",
//     area: "Btm Layout",
//     city: "Bangalore Urban",
//     state: "Karnataka",
//     pincode: "524004",
//     country: "India",
//     landmark: "Near Water tank",
//     facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV", "AC"],
//     notifications: {
//       sms: true,
//       whatsapp: true,
//     },
//     noticePeriod: "30",
//   },
// ];

// const Index = () => {
//   return (
//     <View style={styles.container}>
//       <View style={styles.profileWrapper}>
//         <View style={styles.profileContainer}>
//           <View style={styles.textContainer}>
//             <View style={styles.profilePic}></View>
//             <View>
//               <Text style={styles.propertyName}>
//                 All Properties
//                 <Entypo name="chevron-down" size={20} color="#fff" />
//               </Text>
//             </View>
//           </View>
//           <View style={styles.optionsContainer}>
//             <View>
//               <MaterialIcons name="notification-add" size={24} color="#fff" />
//             </View>
//             <View>
//               <MaterialCommunityIcons name="menu" size={24} color="#fff" />
//             </View>
//           </View>
//         </View>
//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.inputText}
//             placeholder='Search By "Properties"'
//             placeholderTextColor={"#fff"}
//           />
//         </View>
//       </View>
//       <ScrollView style={styles.propertyCards} showsVerticalScrollIndicator={false}>
//         <Text style={styles.propertiesText}>Properties</Text>
//         {pgProperties.map((property, index) => (
//           <PropertyCard key={property?._id} data={property} />
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     marginTop: 50,
//   },
//   profileWrapper: {
//     width: "100%",
//     height: 150,
//     backgroundColor: "#256D85",
//     paddingHorizontal: 20,
//   },
//   profileContainer: {
//     width: "100%",
//     display: "flex",
//     marginTop: 10,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   profilePic: {
//     width: 40,
//     height: 40,
//     backgroundColor: "#fff",
//     borderRadius: 50,
//   },
//   textContainer: {
//     display: "flex",
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     gap: 10,
//   },
//   optionsContainer: {
//     display: "flex",
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     gap: 10,
//   },
//   propertyName: {
//     fontSize: 16,
//     color: "#fff",
//   },
//   inputContainer: {
//     marginTop: 5,
//   },
//   inputText: {
//     width: "100%",
//     height: 50,
//     borderWidth: 1,
//     borderColor: "#678d9a",
//     borderRadius: 10,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     fontSize: 18,
//     lineHeight: 20,
//     marginVertical: 10,
//     backgroundColor: "#678d9a",
//     color: "#fff",
//   },

//   propertyCards: {
//     paddingHorizontal: 20,
//   },
//   propertiesText: {
//     fontSize: 30,
//     fontWeight: "bold",
//     paddingHorizontal: 10,
//     marginBottom: 10,
//   },
// });

// export default Index;
// index.tsx - PG Owner Dashboard

// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   ScrollView,
//   SafeAreaView,
//   StatusBar,
//   Image,
//   TouchableWithoutFeedback,
//   KeyboardAvoidingView,
//   Platform,
//   Keyboard,
//   TouchableOpacity,
// } from "react-native";
// import Entypo from "@expo/vector-icons/Entypo";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import PropertyCard from "@/src/components/PropertyCard";

// const pgProperties = [
//   {
//     _id: "6801cc72e26fc33c842415e1",
//     metadata: {
//       totalRooms: 15,
//       totalBeds: 56,
//       vacantBeds: 48,
//       advancedBookings: 4,
//       occupiedBeds: 4,
//       underNotice: 0,
//       expenses: 0,
//       dues: 63000,
//       income: 0,
//     },
//     propertyId: "PG-00031",
//     propertyName: "Hanuman Gen's PG",
//     tenantType: "Male",
//     mealType: "Both",
//     doorNo: "900",
//     streetName: "100 Feet Road",
//     area: "Madhapur",
//     city: "Hyderabad",
//     state: "Telangana",
//     pincode: "500098",
//     country: "India",
//     landmark: "Near Tea shop",
//     facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV"],
//     notifications: {
//       sms: true,
//       whatsapp: true,
//     },
//     noticePeriod: "30",
//   },
//   {
//     _id: "6801ccbce26fc33c842415ec",
//     metadata: {
//       totalRooms: 1,
//       totalBeds: 1,
//       vacantBeds: 0,
//       advancedBookings: 0,
//       occupiedBeds: 1,
//       underNotice: 1,
//       expenses: 0,
//       dues: 4000,
//       income: 0,
//     },
//     propertyId: "PG-00032",
//     propertyName: "Hanuman Gen's PG",
//     tenantType: "Male",
//     mealType: "Both",
//     doorNo: "900",
//     streetName: "Btm Layout",
//     area: "Btm Layout",
//     city: "Bangalore Urban",
//     state: "Karnataka",
//     pincode: "524004",
//     country: "India",
//     landmark: "Near Water tank",
//     facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV", "AC"],
//     notifications: {
//       sms: true,
//       whatsapp: true,
//     },
//     noticePeriod: "30",
//   },
// ];

// const Dashboard = () => {
//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#256D85" />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         style={styles.keyboardView}
//       >
//         <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//           <View style={styles.container}>
//             {/* Header */}
//             <View style={styles.headerContainer}>
//               <View style={styles.headerTopRow}>
//                 <Image source={{ uri: "https://via.placeholder.com/40" }} style={styles.avatar} />
//                 <TouchableOpacity style={styles.dropdownButton}>
//                   <Text style={styles.dropdownText}>All Properties</Text>
//                   <Entypo name="chevron-down" size={18} color="#fff" />
//                 </TouchableOpacity>
//                 <MaterialIcons name="notifications" size={24} color="#fff" />
//               </View>
//               <View style={styles.searchContainer}>
//                 <TextInput
//                   style={styles.searchInput}
//                   placeholder="Search By Property"
//                   placeholderTextColor="#e5e5e5"
//                 />
//               </View>
//             </View>

//             {/* Property List */}
//             <ScrollView style={styles.propertyList} showsVerticalScrollIndicator={false}>
//               <Text style={styles.sectionTitle}>Your Properties</Text>
//               {pgProperties.map((property) => (
//                 <PropertyCard key={property._id} data={property} />
//               ))}
//             </ScrollView>
//           </View>
//         </TouchableWithoutFeedback>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#256D85",
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#F7F8FA",
//   },
//   headerContainer: {
//     backgroundColor: "#256D85",
//     paddingHorizontal: 20,
//     paddingTop: 10,
//     paddingBottom: 20,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   headerTopRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#fff",
//   },
//   dropdownButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   dropdownText: {
//     fontSize: 16,
//     color: "#fff",
//     fontWeight: "600",
//   },
//   searchContainer: {
//     marginTop: 10,
//   },
//   searchInput: {
//     height: 45,
//     backgroundColor: "#3a90a9",
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     fontSize: 16,
//     color: "#fff",
//   },
//   propertyList: {
//     flex: 1,
//     paddingHorizontal: 20,
//     marginTop: 20,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     marginBottom: 10,
//   },
// });

// export default Dashboard;

// index.tsx - PG Owner Dashboard (Improved SafeAreaView Background Handling)
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableOpacity,
  Pressable,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import PropertyCard from "@/src/components/PropertyCard";
import { useGetPropertyDetailsList } from "@/src/hooks/propertyHook";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/redux/store"; // Adjust the path if your store file is elsewhere


const Properites = () => {
 const { profileData } = useSelector((state: RootState) => state.profileDetails);
  const pgPropertiesQuery = useGetPropertyDetailsList(profileData);
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#256D85" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Image source={{ uri: "https://via.placeholder.com/40" }} style={styles.avatar} />
              <TouchableOpacity style={styles.dropdownButton}>
                <Text style={styles.dropdownText}>All Properties</Text>
                <Entypo name="chevron-down" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Pressable
              onPress={() => console.log("Notification pressed")}
              android_ripple={{ color: "#ffffff55", borderless: true }}
              style={({ pressed }) => [
                styles.iconWrapper,
                pressed && Platform.OS === "ios" && styles.pressedIOS,
              ]}
            >
              <MaterialIcons name="notifications" size={24} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search By Property"
              placeholderTextColor="#e5e5e5"
            />
          </View>
        </View>

        {/* Scrollable Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Your Properties</Text>
              {pgPropertiesQuery.isLoading && (
                <Text>Loading...</Text>
              )}
              {pgPropertiesQuery.isError && (
                <Text>Error loading properties.</Text>
              )}
              {Array.isArray(pgPropertiesQuery.data) && pgPropertiesQuery.data.map((property) => (
                <PropertyCard key={property._id} data={property} />
              ))}
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pressedIOS: {
    backgroundColor: "#ffffff22",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#256D85",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  headerContainer: {
    backgroundColor: "#256D85",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dropdownText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  searchContainer: {
    marginVertical: 20,
  },
  searchInput: {
    height: 45,
    backgroundColor: "#3a90a9",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginHorizontal: 10,
    marginVertical: 5,
  },
});

export default Properites;
