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
//   Pressable,
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
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.headerContainer}>
//           <View style={styles.headerTopRow}>
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <Image source={{ uri: "https://via.placeholder.com/40" }} style={styles.avatar} />
//               <TouchableOpacity style={styles.dropdownButton}>
//                 <Text style={styles.dropdownText}>All Properties</Text>
//                 <Entypo name="chevron-down" size={18} color="#fff" />
//               </TouchableOpacity>
//             </View>
//             <Pressable
//               onPress={() => console.log("Notification pressed")}
//               android_ripple={{ color: "#ffffff55", borderless: true }}
//               style={({ pressed }) => [
//                 styles.iconWrapper,
//                 pressed && Platform.OS === "ios" && styles.pressedIOS,
//               ]}
//             >
//               <MaterialIcons name="notifications" size={24} color="#fff" />
//             </Pressable>
//           </View>
//           <View style={styles.searchContainer}>
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search By Property"
//               placeholderTextColor="#e5e5e5"
//             />
//           </View>
//         </View>

//         {/* Scrollable Content */}
//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : undefined}
//           style={{ flex: 1 }}
//         >
//           <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//             <ScrollView
//               contentContainerStyle={styles.scrollContent}
//               showsVerticalScrollIndicator={false}
//             >
//               <Text style={styles.sectionTitle}>Your Properties</Text>
//               {pgProperties.map((property) => (
//                 <PropertyCard key={property._id} data={property} />
//               ))}
//             </ScrollView>
//           </TouchableWithoutFeedback>
//         </KeyboardAvoidingView>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   iconWrapper: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   pressedIOS: {
//     backgroundColor: "#ffffff22",
//   },
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#256D85",
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
//     borderBottomLeftRadius: 40,
//     borderBottomRightRadius: 40,
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
//     marginVertical: 20,
//   },
//   searchInput: {
//     height: 45,
//     backgroundColor: "#3a90a9",
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     fontSize: 16,
//     color: "#fff",
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 60,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     marginHorizontal: 10,
//     marginVertical: 5,
//   },
// });

// export default Dashboard;

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import PropertyCard from "@/src/components/PropertyCard";
import { useRouter } from "expo-router"; // <-- navigation

const pgProperties = [
  {
    _id: "6801cc72e26fc33c842415e1",
    metadata: {
      totalRooms: 15,
      totalBeds: 56,
      vacantBeds: 48,
      advancedBookings: 4,
      occupiedBeds: 4,
      underNotice: 0,
      expenses: 0,
      dues: 63000,
      income: 0,
    },
    propertyId: "PG-00031",
    propertyName: "Hanuman Gen's PG",
    tenantType: "Male",
    mealType: "Both",
    doorNo: "900",
    streetName: "100 Feet Road",
    area: "Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500098",
    country: "India",
    landmark: "Near Tea shop",
    facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV"],
    notifications: {
      sms: true,
      whatsapp: true,
    },
    noticePeriod: "30",
  },
  {
    _id: "6801ccbce26fc33c842415ec",
    metadata: {
      totalRooms: 1,
      totalBeds: 1,
      vacantBeds: 0,
      advancedBookings: 0,
      occupiedBeds: 1,
      underNotice: 1,
      expenses: 0,
      dues: 4000,
      income: 0,
    },
    propertyId: "PG-00032",
    propertyName: "Hanuman Gen's PG",
    tenantType: "Male",
    mealType: "Both",
    doorNo: "900",
    streetName: "Btm Layout",
    area: "Btm Layout",
    city: "Bangalore Urban",
    state: "Karnataka",
    pincode: "524004",
    country: "India",
    landmark: "Near Water tank",
    facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV", "AC"],
    notifications: {
      sms: true,
      whatsapp: true,
    },
    noticePeriod: "30",
  },
];

const Dashboard = () => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  // Decide numColumns based on device width
  let numColumns = 2;
  if (screenWidth >= 900) numColumns = 3;
  else if (screenWidth >= 600) numColumns = 2;
  else numColumns = 1;

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

        {/* Cards List */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Text style={styles.sectionTitle}>Your Properties</Text>
          <FlatList
            data={pgProperties}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <PropertyCard
                data={item}
                onPress={() => {
                  // Next: router.push(`/properties/${item._id}`)
                  // For now, just a placeholder
                  router.push(`/properties/${item._id}`);
                }}
              />
            )}
            numColumns={numColumns}
            contentContainerStyle={styles.cardsContainer}
            columnWrapperStyle={numColumns > 1 ? { justifyContent: "flex-start" } : undefined}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", color: "#aab6c6", fontSize: 17, marginTop: 80 }}>
                No properties found.
              </Text>
            }
            // This helps cards fill width when only one item on big devices
            getItemLayout={(data, index) => ({
              length: 275,
              offset: 275 * index,
              index,
            })}
          />
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
  cardsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    minHeight: 300,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 16,
    marginBottom: 2,
    marginTop: 10,
    color: "#1A2748",
  },
});

export default Dashboard;
