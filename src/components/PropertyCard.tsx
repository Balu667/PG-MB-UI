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
