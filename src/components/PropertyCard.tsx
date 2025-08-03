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
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { hexToRgba } from "../theme";
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
  const router = useRouter();
  const cardMargin = 12;
  const cardWidth = (screenWidth - cardMargin * (numColumns + 1)) / numColumns;

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
    router.push(`/protected/property/${data._id}`);
  };
  const statsConfig = [
    {
      icon: "bed",
      color: theme.colors.totalBeds,
      label: "Total Beds",
      value: data?.metadata?.totalBeds || 0,
    },
    {
      icon: "bed",
      color: theme.colors.availableBeds,
      label: "Available",
      value: data?.metadata?.vacantBeds || 0,
    },
    {
      icon: "bed",
      color: theme.colors.filledBeds,
      label: "Occupied",
      value: data?.metadata?.occupiedBeds || 0,
    },
    {
      icon: "calendar-check",
      color: theme.colors.advBookedBeds,
      label: "Adv. Booked",
      value: data?.metadata?.advancedBookings || 0,
    },
    {
      icon: "bell",
      color: theme.colors.underNoticeBeds,
      label: "Under Notice",
      value: data?.metadata?.underNotice || 0,
    },
  ];

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
      <Pressable onPress={handlePress} style={styles.cardContainer(theme.colors)}>
        {/* Gradient Header */}
        <LinearGradient
          colors={theme.colors.enabledGradient}
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
          {statsConfig.map((item, idx) => (
            <StatItem
              key={idx}
              icon={<FontAwesome5 name={item.icon} size={19 * fontScale} color={item.color} />}
              label={item.label}
              value={item.value}
              colors={theme.colors}
            />
          ))}
        </View>

        {/* Financials */}
        <View style={styles.financialRow(theme.colors)}>
          <View style={styles.financialItem}>
            <FontAwesome5 name="arrow-down" size={16 * fontScale} color="#059669" />
            <Text style={[styles.financialLabel, { color: "#059669" }]}>
              ₹{data.metadata?.income || 0}
            </Text>
            <Text style={styles.financialText(theme.colors)}>Income</Text>
          </View>
          <View style={styles.financialItem}>
            <FontAwesome5 name="arrow-up" size={16 * fontScale} color="#DC2626" />
            <Text style={[styles.financialLabel, { color: "#DC2626" }]}>
              ₹{data.metadata?.expenses || 0}
            </Text>
            <Text style={styles.financialText(theme.colors)}>Expenses</Text>
          </View>
          <View style={styles.financialItem}>
            <MaterialIcons name="warning" size={16 * fontScale} color="#ED6C02" />
            <Text style={[styles.financialLabel, { color: "#ED6C02" }]}>
              ₹{data.metadata?.dues || 0}
            </Text>
            <Text style={styles.financialText(theme.colors)}>Dues</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerRow(theme.colors)}>
          <Text style={styles.footerText(theme.colors)}>
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

function StatItem({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colors: any;
}) {
  return (
    <View style={statItemStyles.container(colors)}>
      {icon}
      <Text numberOfLines={1} style={statItemStyles.label(colors)}>
        {label}
      </Text>
      <Text style={statItemStyles.value(colors)}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11,
    shadowRadius: 10,
    elevation: 12,
    borderRadius: 16,
  },
  cardContainer: (c: any) => ({
    flex: 1,
    minHeight: 245,
    justifyContent: "flex-start",
    backgroundColor: c.cardBackground,
    borderRadius: 20,
    overflow: "hidden",
  }),
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
  financialRow: (c: any) => ({
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: hexToRgba(c.textSecondary, 0.2),
    backgroundColor: c.cardBackground,
    borderBottomWidth: 1,
  }),
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
  financialText: (c: any) => ({
    fontSize: 12,
    color: c.black,
    opacity: 0.9,
  }),
  footerRow: (c: any) => ({
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "flex-start",
    backgroundColor: c.cardBackground,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  }),
  footerText: (c: any) => ({
    fontSize: 13,
    color: c.black,
    fontWeight: "600",
    opacity: 0.8,
  }),
});

const statItemStyles = StyleSheet.create({
  container: (c: any) => ({
    width: "48%",
    backgroundColor: c.cardSurface,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginBottom: 6,
    gap: 7,
    minWidth: 100,
  }),
  label: (c: any) => ({
    fontSize: 13,
    color: c.black,
    marginLeft: 1,
    flexShrink: 1,
    opacity: 0.85,
  }),
  value: (c: any) => ({
    fontWeight: "700",
    color: c.black,
    marginLeft: "auto",
    fontSize: 14,
  }),
});

export default PropertyCard;
