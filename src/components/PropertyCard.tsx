// import { View, Text, StyleSheet } from "react-native";
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
//       borderRadius: 16,
//       marginVertical: 12,
//       backgroundColor: "#FFFFFF",
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 3 },
//       shadowOpacity: 0.1,
//       shadowRadius: 5,
//       elevation: 2,
//       borderWidth: 1,
//       borderColor: "#C6E9F4",
//     },
//     headerView: {
//       width: "100%",
//       paddingVertical: 16,
//       paddingHorizontal: 20,
//       backgroundColor: theme.colors.primary,
//       borderTopLeftRadius: 16,
//       borderTopRightRadius: 16,
//     },
//     locationView: {
//       flexDirection: "row",
//       alignItems: "center",
//       marginTop: 6,
//     },
//     statContainer: {
//       flexDirection: "row",
//       flexWrap: "wrap",
//       padding: 16,
//       gap: 12,
//       justifyContent: "space-between",
//     },
//     statItem: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 8,
//       padding: 12,
//       borderRadius: 10,
//       backgroundColor: "#F8FAFC",
//       flexBasis: "47%", // Two items per row for balanced grid
//       minWidth: 150,
//       shadowColor: "#000",
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: 0.05,
//       shadowRadius: 3,
//     },
//     financialContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       padding: 16,
//       borderTopWidth: 1,
//       borderTopColor: "#E5E7EB",
//       backgroundColor: "#FAFAFA",
//     },
//     footerContainer: {
//       flexDirection: "row",
//       justifyContent: "space-around",
//       padding: 16,
//       borderTopWidth: 1,
//       borderTopColor: "#E5E7EB",
//       backgroundColor: "#F8FAFC",
//       borderBottomRightRadius: 16,
//       borderBottomLeftRadius: 16,
//     },
//     icon: {
//       fontSize: 22,
//       marginEnd: 3,
//     },
//     propertyName: {
//       marginStart: 5,
//       margin: 2,
//       fontWeight: "700",
//       color: "#FFFFFF",
//     },
//     areaCity: {
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
//   });

//   return (
//     <View style={styles.container}>
//       <View style={styles.headerView}>
//         <Text style={[bs.fontSize18, styles.propertyName]}>{data?.propertyName}</Text>
//         <View style={styles.locationView}>
//           <MaterialIcons style={[bs.fontMedium, styles.icon, styles.areaCity]} name="location-on" />
//           <Text style={[bs.fontMedium, styles.areaCity]}>
//             {data?.area}, {data?.city}
//           </Text>
//         </View>
//       </View>
//       <View style={styles.statContainer}>
//         <View style={styles.statItem}>
//           <FontAwesome5 name="bed" size={22} color="#4B5563" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Total Beds: {data.metadata?.totalBeds || 0}
//           </Text>
//         </View>
//         <View style={styles.statItem}>
//           <FontAwesome5 name="bed" size={22} color="#059669" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Available: {data.metadata?.vacantBeds || 0}
//           </Text>
//         </View>
//         <View style={styles.statItem}>
//           <FontAwesome5 name="bed" size={22} color="#DC2626" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Occupied: {data.metadata?.occupiedBeds || 0}
//           </Text>
//         </View>
//         <View style={styles.statItem}>
//           <FontAwesome5 name="calendar-check" size={22} color="#D97706" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Adv Booked: {data.metadata?.advancedBookings || 0}
//           </Text>
//         </View>
//         <View style={styles.statItem}>
//           <FontAwesome5 name="bell" size={22} color="#7C3AED" />
//           <Text style={[bs.fontSmall, styles.textPrimary]}>
//             Under Notice: {data.metadata?.underNotice || 0}
//           </Text>
//         </View>
//       </View>
//       <View style={styles.financialContainer}>
//         <View style={styles.statItem}>
//           <FontAwesome5 name="arrow-down" size={22} color="#059669" />
//           <Text style={[bs.fontSmall, styles.textGreen]}>
//             Income: ₹{data.metadata?.income || 0}
//           </Text>
//         </View>
//         <View style={styles.statItem}>
//           <FontAwesome5 name="arrow-up" size={22} color="#DC2626" />
//           <Text style={[bs.fontSmall, styles.textRed]}>
//             Expenses: ₹{data.metadata?.expenses || 0}
//           </Text>
//         </View>
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

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  useWindowDimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useTheme } from "@/src/theme/ThemeContext";
import * as Haptics from "expo-haptics";
// import LinearGradient from "expo-linear-gradient";
import { LinearGradient } from "expo-linear-gradient";

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
  onPress?: () => void;
}

const PropertyCard = ({ data, onPress }: PropertyCardProps) => {
  const theme = useTheme();
  const { width: screenWidth, fontScale } = useWindowDimensions();

  // Animation value for press
  const scale = React.useRef(new Animated.Value(1)).current;

  // Responsive card width
  // For tablets: 2 or 3 columns; for phones: 2; for small phones: 1
  let numColumns = 2;
  if (screenWidth >= 900) numColumns = 3;
  else if (screenWidth >= 600) numColumns = 2;
  else numColumns = 1;

  const cardMargin = 12;
  const cardWidth = (screenWidth - cardMargin * (numColumns + 1)) / numColumns;

  // const handlePressIn = () => {
  //   Animated.spring(scale, {
  //     toValue: 0.96,
  //     useNativeDriver: true,
  //     speed: 20,
  //     bounciness: 8,
  //   }).start();
  //   if (Platform.OS !== "web") {
  //     Haptics.selectionAsync();
  //   }
  // };
  // const handlePressOut = () => {
  //   Animated.spring(scale, {
  //     toValue: 1,
  //     useNativeDriver: true,
  //     speed: 10,
  //     bounciness: 6,
  //   }).start();
  // };

  const handlePress = () => {
    // animate small, then back to normal
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
    ]).start();

    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    // call actual onPress if given
    onPress && onPress();
  };

  return (
    <Animated.View
      style={[
        {
          width: cardWidth,
          margin: cardMargin / 2,
          transform: [{ scale }],
        },
        styles.shadow,
      ]}
    >
      <Pressable
        android_ripple={{ color: "#D9F1FB" }}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.cardContainer,
          {
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            overflow: "hidden",
            opacity: pressed ? 0.98 : 1,
          },
        ]}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={[theme.colors.primary, "#4FB5C9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerView}
        >
          <Text
            numberOfLines={1}
            style={[
              {
                fontSize: 18 * fontScale,
                fontWeight: "700",
                color: "#fff",
                letterSpacing: 0.5,
              },
              { marginBottom: 2 },
            ]}
          >
            {data?.propertyName}
          </Text>
          <View style={styles.locationView}>
            <MaterialIcons name="location-on" size={18 * fontScale} color="#fff" />
            <Text
              numberOfLines={1}
              style={[
                {
                  fontSize: 15 * fontScale,
                  fontWeight: "400",
                  color: "#e3eafc",
                  marginLeft: 5,
                  opacity: 0.85,
                },
              ]}
            >
              {data?.area}, {data?.city}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statContainer}>
          <StatItem
            icon={<FontAwesome5 name="bed" size={19 * fontScale} color={theme.colors.totalBeds} />}
            label="Total Beds"
            value={data.metadata?.totalBeds || 0}
          />
          <StatItem
            icon={
              <FontAwesome5 name="bed" size={19 * fontScale} color={theme.colors.availableBeds} />
            }
            label="Available"
            value={data.metadata?.vacantBeds || 0}
          />
          <StatItem
            icon={<FontAwesome5 name="bed" size={19 * fontScale} color={theme.colors.filledBeds} />}
            label="Occupied"
            value={data.metadata?.occupiedBeds || 0}
          />
          <StatItem
            icon={
              <FontAwesome5
                name="calendar-check"
                size={19 * fontScale}
                color={theme.colors.advBookedBeds}
              />
            }
            label="Adv. Booked"
            value={data.metadata?.advancedBookings || 0}
          />
          <StatItem
            icon={
              <FontAwesome5
                name="bell"
                size={19 * fontScale}
                color={theme.colors.underNoticeBeds}
              />
            }
            label="Under Notice"
            value={data.metadata?.underNotice || 0}
          />
        </View>

        {/* Financials */}
        <View style={styles.financialRow}>
          <View style={styles.financialItem}>
            <FontAwesome5 name="arrow-down" size={16 * fontScale} color="#059669" />
            <Text style={[styles.financialLabel, { color: "#059669" }]}>
              ₹{data.metadata?.income || 0}
            </Text>
            <Text style={styles.financialText}>Income</Text>
          </View>
          <View style={styles.financialItem}>
            <FontAwesome5 name="arrow-up" size={16 * fontScale} color="#DC2626" />
            <Text style={[styles.financialLabel, { color: "#DC2626" }]}>
              ₹{data.metadata?.expenses || 0}
            </Text>
            <Text style={styles.financialText}>Expenses</Text>
          </View>
          <View style={styles.financialItem}>
            <MaterialIcons name="warning" size={16 * fontScale} color="#ED6C02" />
            <Text style={[styles.financialLabel, { color: "#ED6C02" }]}>
              ₹{data.metadata?.dues || 0}
            </Text>
            <Text style={styles.financialText}>Dues</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            Complaints:{" "}
            <Text style={{ fontWeight: "600", color: "#D97706" }}>
              {data.metadata?.complaints || 0}
            </Text>
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <View style={statItemStyles.container}>
      {icon}
      <Text numberOfLines={1} style={statItemStyles.label}>
        {label}
      </Text>
      <Text style={statItemStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11,
    shadowRadius: 10,
    // elevation: 7,
    elevation: 12, // Stronger depth
    backgroundColor: "#fff", // Needed to see elevation properly
    borderRadius: 16,
  },
  cardContainer: {
    flex: 1,
    minHeight: 245,
    justifyContent: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },
  headerView: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  locationView: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  statContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 7,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#F1F3F6",
    backgroundColor: "#F7F8FA",
    borderBottomWidth: 1,
  },
  financialItem: {
    alignItems: "center",
    gap: 2,
    flex: 1,
    minWidth: 70,
  },
  financialLabel: {
    fontWeight: "600",
    fontSize: 15,
    marginTop: 1,
  },
  financialText: {
    fontSize: 12,
    color: "#495057",
    opacity: 0.9,
  },
  footerRow: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "flex-start",
    backgroundColor: "#F1FAFE",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  footerText: {
    fontSize: 13,
    color: "#256D85",
    fontWeight: "600",
    opacity: 0.8,
  },
});

const statItemStyles = StyleSheet.create({
  container: {
    width: "48%",
    backgroundColor: "#F6F8FC",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginBottom: 6,
    gap: 7,
    minWidth: 100,
  },
  label: {
    fontSize: 13,
    color: "#283B51",
    marginLeft: 1,
    flexShrink: 1,
    opacity: 0.85,
  },
  value: {
    fontWeight: "700",
    color: "#1B3D6D",
    marginLeft: "auto",
    fontSize: 14,
  },
});

export default PropertyCard;
