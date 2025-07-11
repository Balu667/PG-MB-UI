// // // import { View, Text, StyleSheet } from "react-native";
// // // import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// // // import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
// // // import { useTheme } from "@/src/theme/ThemeContext";
// // // import { useBS } from "@/src/hooks/useBs";

// // // interface PropertyMetadata {
// // //   totalBeds?: number;
// // //   // Add other metadata fields as needed
// // // }

// // // interface PropertyData {
// // //   propertyName: string;
// // //   area: string;
// // //   city: string;
// // //   metadata?: PropertyMetadata;
// // //   // Add other fields as needed
// // // }

// // // interface PropertyCardProps {
// // //   data: PropertyData;
// // // }

// // // const PropertyCard = ({ data }: PropertyCardProps) => {
// // //   const theme = useTheme();

// // //   const bs = useBS();
// // //   const styles = StyleSheet.create({
// // //     container: {
// // //       width: "100%",
// // //       borderRadius: 10,
// // //       marginBottom: 20,
// // //       borderColor: "grey",
// // //       borderWidth: 0.3,
// // //     },
// // //     headerView: {
// // //       width: "100%",
// // //       height: 74,
// // //       backgroundColor: theme.colors.primary,
// // //       borderTopLeftRadius: 10,
// // //       borderTopRightRadius: 10,
// // //       display: "flex",
// // //       justifyContent: "center",
// // //       alignItems: "flex-start",
// // //       gap: 6,
// // //       paddingHorizontal: 20,
// // //     },
// // //     locationView: {
// // //       flexDirection: "row",
// // //       alignItems: "center",
// // //       justifyContent: "center",
// // //     },
// // //   });
// // //   return (
// // //     <View style={styles.container}>
// // //       <View style={[styles.headerView, bs.p3]}>
// // //         <Text style={[bs.fontSize18, bs.textWhite]}>{data?.propertyName}</Text>
// // //         <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1]}>
// // //           <MaterialIcons style={[bs.fontMedium, bs.textWhite, bs.mt1]} name="location-on" />
// // //           <Text style={[bs.fontMedium, bs.textWhite]}>
// // //             {data?.area}, {data?.city}
// // //           </Text>
// // //         </View>
// // //       </View>
// // //       <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.flexWrap, bs.p3]}>
// // //         <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1, bs.w50]}>
// // //           <FontAwesome5 style={[bs.totalBedsColor]} name="bed" size={24} color="black" />
// // //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// // //             Total : {data.metadata?.totalBeds || 0}
// // //           </Text>
// // //         </View>
// // //         <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1]}>
// // //           <FontAwesome5 style={[bs.availableBedsColor]} name="bed" size={24} color="black" />
// // //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// // //             Available: {data.metadata?.totalBeds || 0}
// // //           </Text>
// // //         </View>
// // //       </View>
// // //       <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2, bs.flexWrap, bs.p3]}>
// // //         <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1, bs.w50]}>
// // //           <FontAwesome5 style={[bs.filledBedsColor]} name="bed" size={24} color="black" />
// // //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// // //             Filled : {data.metadata?.totalBeds || 0}
// // //           </Text>
// // //         </View>
// // //         <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1]}>
// // //           <FontAwesome5 style={[bs.advBookedBedsColor]} name="bed" size={24} color="black" />
// // //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// // //             Adv Booked: {data.metadata?.totalBeds || 0}
// // //           </Text>
// // //         </View>
// // //       </View>
// // //       <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2, bs.flexWrap, bs.p3]}>
// // //         <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1, bs.w50]}>
// // //           <FontAwesome5 style={[bs.underNoticeBedsColor]} name="bed" size={24} color="black" />
// // //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// // //             Under Notice : {data.metadata?.totalBeds || 0}
// // //           </Text>
// // //         </View>
// // //         <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1]}>
// // //           <FontAwesome5 style={[bs.advBookedBedsColor]} name="bed" size={24} color="black" />
// // //           <Text style={[bs.fontSmall, bs.textPrimary]}>Dues: {data.metadata?.totalBeds || 0}</Text>
// // //         </View>
// // //       </View>
// // //       <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2, bs.flexWrap, bs.p3]}>
// // //         <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2, bs.w50]}>
// // //           <FontAwesome5 style={[bs.availableBedsColor]} name="arrow-down" size={24} color="black" />
// // //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// // //             Income : {data.metadata?.totalBeds || 0}
// // //           </Text>
// // //         </View>
// // //         <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2]}>
// // //           <FontAwesome5 style={[bs.filledBedsColor]} name="arrow-up" size={24} color="black" />
// // //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// // //             Expenses: {data.metadata?.totalBeds || 0}
// // //           </Text>
// // //         </View>
// // //       </View>
// // //     </View>
// // //   );
// // // };

// // // export default PropertyCard;
// // import { View, Text, StyleSheet } from "react-native";
// // import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// // import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
// // import { useTheme } from "@/src/theme/ThemeContext";
// // import { useBS } from "@/src/hooks/useBs";

// // interface PropertyMetadata {
// //   totalBeds?: number;
// //   vacantBeds?: number;
// //   occupiedBeds?: number;
// //   advancedBookings?: number;
// //   underNotice?: number;
// //   expenses?: number;
// //   dues?: number;
// //   income?: number;
// // }

// // interface PropertyData {
// //   propertyName: string;
// //   area: string;
// //   city: string;
// //   metadata?: PropertyMetadata;
// // }

// // interface PropertyCardProps {
// //   data: PropertyData;
// // }

// // const PropertyCard = ({ data }: PropertyCardProps) => {
// //   const theme = useTheme();
// //   const bs = useBS();

// //   const styles = StyleSheet.create({
// //     container: {
// //       width: "100%",
// //       borderRadius: 12,
// //       marginBottom: 20,
// //       backgroundColor: "#FFFFFF",
// //       shadowColor: "#000",
// //       shadowOffset: { width: 0, height: 2 },
// //       shadowOpacity: 0.1,
// //       shadowRadius: 8,
// //       elevation: 4,
// //     },
// //     headerView: {
// //       width: "100%",
// //       height: 80,
// //       backgroundColor: theme.colors.primary,
// //       borderTopLeftRadius: 12,
// //       borderTopRightRadius: 12,
// //       paddingHorizontal: 20,
// //       paddingVertical: 12,
// //     },
// //     locationView: {
// //       flexDirection: "row",
// //       alignItems: "center",
// //       marginTop: 4,
// //     },
// //     statContainer: {
// //       flexDirection: "row",
// //       flexWrap: "wrap",
// //       padding: 16,
// //       gap: 16,
// //     },
// //     statItem: {
// //       flexDirection: "row",
// //       alignItems: "center",
// //       gap: 8,
// //       padding: 8,
// //       borderRadius: 8,
// //       backgroundColor: "#F9FAFB",
// //       flex: 1,
// //       minWidth: 140,
// //     },
// //     financialContainer: {
// //       flexDirection: "row",
// //       justifyContent: "space-between",
// //       padding: 16,
// //       borderTopWidth: 1,
// //       borderTopColor: "#E5E7EB",
// //     },
// //     footerContainer: {
// //       flexDirection: "row",
// //       justifyContent: "space-between",
// //       padding: 16,
// //       borderTopWidth: 1,
// //       borderTopColor: "#E5E7EB",
// //     },
// //     icon: {
// //       fontSize: 20,
// //     },
// //     textBold: {
// //       fontWeight: "600",
// //     },
// //     textGreen: {
// //       color: "#10B981",
// //     },
// //     textRed: {
// //       color: "#EF4444",
// //     },
// //   });

// //   return (
// //     <View style={styles.container}>
// //       <View style={styles.headerView}>
// //         <Text style={[bs.fontSize18, bs.textWhite, styles.textBold]}>{data?.propertyName}</Text>
// //         <View style={styles.locationView}>
// //           <MaterialIcons style={[bs.fontMedium, bs.textWhite, styles.icon]} name="location-on" />
// //           <Text style={[bs.fontMedium, bs.textWhite]}>
// //             {data?.area}, {data?.city}
// //           </Text>
// //         </View>
// //       </View>
// //       <View style={styles.statContainer}>
// //         <View style={styles.statItem}>
// //           <FontAwesome5 name="bed" size={20} color="#6B7280" />
// //           <Text style={[bs.fontSmall, bs.textPrimary]}>Total: {data.metadata?.totalBeds || 0}</Text>
// //         </View>
// //         <View style={styles.statItem}>
// //           <FontAwesome5 name="bed" size={20} color="#10B981" />
// //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// //             Available: {data.metadata?.vacantBeds || 0}
// //           </Text>
// //         </View>
// //         <View style={styles.statItem}>
// //           <FontAwesome5 name="bed" size={20} color="#EF4444" />
// //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// //             Occupied: {data.metadata?.occupiedBeds || 0}
// //           </Text>
// //         </View>
// //         <View style={styles.statItem}>
// //           <FontAwesome5 name="bed" size={20} color="#F59E0B" />
// //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// //             Adv Booked: {data.metadata?.advancedBookings || 0}
// //           </Text>
// //         </View>
// //         <View style={styles.statItem}>
// //           <FontAwesome5 name="bed" size={20} color="#8B5CF6" />
// //           <Text style={[bs.fontSmall, bs.textPrimary]}>
// //             Under Notice: {data.metadata?.underNotice || 0}
// //           </Text>
// //         </View>
// //       </View>
// //       <View style={styles.financialContainer}>
// //         <View style={styles.statItem}>
// //           <FontAwesome5 name="arrow-down" size={20} color="#10B981" />
// //           <Text style={[bs.fontSmall, styles.textGreen]}>
// //             Income: ₹{data.metadata?.income || 0}
// //           </Text>
// //         </View>
// //         <View style={styles.statItem}>
// //           <FontAwesome5 name="arrow-up" size={20} color="#EF4444" />
// //           <Text style={[bs.fontSmall, styles.textRed]}>
// //             Expenses: ₹{data.metadata?.expenses || 0}
// //           </Text>
// //         </View>
// //       </View>
// //       <View style={styles.footerContainer}>
// //         <Text style={[bs.fontSmall, bs.textPrimary]}>Complaints: 0</Text>
// //         <Text style={[bs.fontSmall, bs.textPrimary]}>
// //           Advance Bookings: {data.metadata?.advancedBookings || 0}
// //         </Text>
// //       </View>
// //     </View>
// //   );
// // };

// // export default PropertyCard;
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useTheme } from "@/src/theme/ThemeContext";
import { useBS } from "@/src/hooks/useBs";

interface PropertyMetadata {
  totalBeds?: number;
  vacantBeds?: number;
  occupiedBeds?: number;
  advancedBookings?: number;
  underNotice?: number;
  expenses?: number;
  dues?: number;
  income?: number;
  complaints?: number;
}

interface PropertyData {
  propertyName: string;
  area: string;
  city: string;
  metadata?: PropertyMetadata;
}

interface PropertyCardProps {
  data: PropertyData;
}

const PropertyCard = ({ data }: PropertyCardProps) => {
  const theme = useTheme();
  const bs = useBS();

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      borderRadius: 16,
      marginVertical: 12,
      backgroundColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 5,
      borderWidth: 1,
      borderColor: "#C6E9F4",
    },
    headerView: {
      width: "100%",
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    locationView: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },
    statContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 16,
      gap: 12,
      justifyContent: "space-between",
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 10,
      backgroundColor: "#F8FAFC",
      flexBasis: "47%", // Two items per row for balanced grid
      minWidth: 150,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    financialContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      backgroundColor: "#FAFAFA",
    },
    footerContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      backgroundColor: "#F8FAFC",
      borderBottomRightRadius: 16,
      borderBottomLeftRadius: 16,
    },
    icon: {
      fontSize: 22,
      marginEnd: 3,
    },
    propertyName: {
      marginStart: 5,
      margin: 2,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    areaCity: {
      color: "#FFFFFF",
    },
    textPrimary: {
      fontWeight: "500",
      color: "#1F2937",
    },
    textGreen: {
      fontWeight: "600",
      color: "#059669",
    },
    textRed: {
      fontWeight: "600",
      color: "#DC2626",
    },
    textAmber: {
      fontWeight: "600",
      color: "#D97706",
    },
    textPurple: {
      fontWeight: "600",
      color: "#7C3AED",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerView}>
        <Text style={[bs.fontSize18, styles.propertyName]}>{data?.propertyName}</Text>
        <View style={styles.locationView}>
          <MaterialIcons style={[bs.fontMedium, styles.icon, styles.areaCity]} name="location-on" />
          <Text style={[bs.fontMedium, styles.areaCity]}>
            {data?.area}, {data?.city}
          </Text>
        </View>
      </View>
      <View style={styles.statContainer}>
        <View style={styles.statItem}>
          <FontAwesome5 name="bed" size={22} color="#4B5563" />
          <Text style={[bs.fontSmall, styles.textPrimary]}>
            Total Beds: {data.metadata?.totalBeds || 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome5 name="bed" size={22} color="#059669" />
          <Text style={[bs.fontSmall, styles.textPrimary]}>
            Available: {data.metadata?.vacantBeds || 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome5 name="bed" size={22} color="#DC2626" />
          <Text style={[bs.fontSmall, styles.textPrimary]}>
            Occupied: {data.metadata?.occupiedBeds || 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome5 name="calendar-check" size={22} color="#D97706" />
          <Text style={[bs.fontSmall, styles.textPrimary]}>
            Adv Booked: {data.metadata?.advancedBookings || 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome5 name="bell" size={22} color="#7C3AED" />
          <Text style={[bs.fontSmall, styles.textPrimary]}>
            Under Notice: {data.metadata?.underNotice || 0}
          </Text>
        </View>
      </View>
      <View style={styles.financialContainer}>
        <View style={styles.statItem}>
          <FontAwesome5 name="arrow-down" size={22} color="#059669" />
          <Text style={[bs.fontSmall, styles.textGreen]}>
            Income: ₹{data.metadata?.income || 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome5 name="arrow-up" size={22} color="#DC2626" />
          <Text style={[bs.fontSmall, styles.textRed]}>
            Expenses: ₹{data.metadata?.expenses || 0}
          </Text>
        </View>
      </View>
      <View style={styles.footerContainer}>
        <Text style={[bs.fontSmall, styles.textPrimary]}>
          Complaints: {data.metadata?.complaints || 0}
        </Text>
        <Text style={[bs.fontSmall, styles.textPrimary]}>Dues: ₹{data.metadata?.dues || 0}</Text>
      </View>
    </View>
  );
};

export default PropertyCard;
// import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
// import { useTheme } from "@/src/theme/ThemeContext";
// import { useBS } from "@/src/hooks/useBs";

// interface PropertyMetadata {
//   totalBeds?: number;
//   vacantBeds?: number;
//   occupiedBeds?: number;
//   advancedBookings?: number;
//   underNotice?: number;
//   expenses?: number;
//   dues?: number;
//   income?: number;
//   complaints?: number;
// }

// interface PropertyData {
//   propertyName: string;
//   area: string;
//   city: string;
//   metadata?: PropertyMetadata;
// }

// interface PropertyCardProps {
//   data: PropertyData;
// }

// const PropertyCard = ({ data }: PropertyCardProps) => {
//   const theme = useTheme();
//   const bs = useBS();

//   const styles = StyleSheet.create({
//     container: {
//       width: "100%",
//       borderRadius: 14,
//       marginVertical: 10, // Slightly increased for balance
//       backgroundColor: "#FFFFFF",
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 3 },
//       shadowOpacity: 0.12,
//       shadowRadius: 8,
//       elevation: 4,
//     },
//     headerView: {
//       width: "100%",
//       paddingVertical: 12, // Moderate padding
//       paddingHorizontal: 18,
//       backgroundColor: theme.colors.primary,
//       borderTopLeftRadius: 14,
//       borderTopRightRadius: 14,
//       borderBottomWidth: 1,
//       borderBottomColor: "rgba(255,255,255,0.2)",
//     },
//     locationView: {
//       flexDirection: "row",
//       alignItems: "center",
//       marginTop: 5,
//     },
//     statContainer: {
//       flexDirection: "row",
//       flexWrap: "wrap",
//       padding: 14, // Moderate padding
//       gap: 10, // Balanced gap
//       justifyContent: "space-between",
//     },
//     statItem: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 8,
//       padding: 10, // Moderate padding
//       borderRadius: 8,
//       backgroundColor: "#F9FAFB",
//       flexBasis: "48%", // Two items per row
//       minWidth: 140, // Balanced for readability
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: 0.08,
//       shadowRadius: 3,
//       elevation: 1,
//     },
//     financialContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       padding: 14, // Moderate padding
//       borderTopWidth: 1,
//       borderTopColor: "#E5E7EB",
//       backgroundColor: "#FAFAFA",
//     },
//     footerContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       padding: 12, // Moderate padding
//       borderTopWidth: 1,
//       borderTopColor: "#E5E7EB",
//       backgroundColor: "#F9FAFB",
//     },
//     icon: {
//       fontSize: 20, // Balanced icon size
//     },
//     textBold: {
//       fontWeight: "700",
//       color: "#FFFFFF",
//     },
//     textPrimary: {
//       fontWeight: "500",
//       color: "#1F2937",
//     },
//     textGreen: {
//       fontWeight: "600",
//       color: "#059669",
//     },
//     textRed: {
//       fontWeight: "600",
//       color: "#DC2626",
//     },
//     textAmber: {
//       fontWeight: "600",
//       color: "#D97706",
//     },
//     textPurple: {
//       fontWeight: "600",
//       color: "#7C3AED",
//     },
//     activePress: {
//       transform: [{ scale: 0.98 }],
//       backgroundColor: "#E5E7EB",
//     },
//   });

//   return (
//     <View style={styles.container}>
//       <View style={styles.headerView}>
//         <Text style={[bs.fontSize16, styles.textBold]}>{data?.propertyName}</Text>
//         <View style={styles.locationView}>
//           <MaterialIcons style={[bs.fontSmall, styles.textBold, styles.icon]} name="location-on" />
//           <Text style={[bs.fontSmall, styles.textBold]}>
//             {data?.area}, {data?.city}
//           </Text>
//         </View>
//       </View>
//       <View style={styles.statContainer}>
//         <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
//           <FontAwesome5 name="bed" size={20} color="#4B5563" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Total: {data.metadata?.totalBeds || 0}
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
//           <FontAwesome5 name="bed" size={20} color="#059669" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Available: {data.metadata?.vacantBeds || 0}
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
//           <FontAwesome5 name="bed" size={20} color="#DC2626" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Occupied: {data.metadata?.occupiedBeds || 0}
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
//           <FontAwesome5 name="calendar-check" size={20} color="#D97706" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Adv Booked: {data.metadata?.advancedBookings || 0}
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
//           <FontAwesome5 name="bell" size={20} color="#7C3AED" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Notice: {data.metadata?.underNotice || 0}
//           </Text>
//         </TouchableOpacity>
//       </View>
//       <View style={styles.financialContainer}>
//         <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
//           <FontAwesome5 name="arrow-down" size={20} color="#059669" />
//           <Text style={[bs.fontSmall, styles.textGreen]}>
//             Income: ₹{data.metadata?.income || 0}
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
//           <FontAwesome5 name="arrow-up" size={20} color="#DC2626" />
//           <Text style={[bs.fontSmall, styles.textRed]}>
//             Expenses: ₹{data.metadata?.expenses || 0}
//           </Text>
//         </TouchableOpacity>
//       </View>
//       <View style={styles.footerContainer}>
//         <Text style={[bs.fontSmall, styles.textPrimary]}>
//           Complaints: {data.metadata?.complaints || 0}
//         </Text>
//         <Text style={[bs.fontSmall, styles.textPrimary]}>Dues: ₹{data.metadata?.dues || 0}</Text>
//       </View>
//     </View>
//   );
// };

// export default PropertyCard;
