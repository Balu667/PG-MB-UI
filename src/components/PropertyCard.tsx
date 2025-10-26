import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  useWindowDimensions,
  GestureResponderEvent,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useTheme } from "@/src/theme/ThemeContext";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { hexToRgba } from "../theme";
import { Menu, Portal, Dialog, Button } from "react-native-paper";
import { useProperty } from "@/src/context/PropertyContext";

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
  _id?: string;
  propertyName: string;
  area: string;
  city: string;
  // ⬇️ include the rest so we can prefill
  tenantType?: "Male" | "Female" | "Co-living";
  mealType?: "Veg" | "Non-veg" | "Both";
  doorNo?: string;
  streetName?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  noticePeriod?: string;
  facilities?: string[];
  metadata?: PropertyMetadata;
}

interface PropertyCardProps {
  data: PropertyData;
  onPress?: () => void;
  onDelete?: (id?: string) => void;
}

const PropertyCard = ({ data, onPress, onDelete }: PropertyCardProps) => {
  const theme = useTheme();
  const { width: screenWidth, fontScale } = useWindowDimensions();
  const router = useRouter();
  const { setSelected } = useProperty();
  const scale = React.useRef(new Animated.Value(1)).current;
  let numColumns = 2;
  if (screenWidth >= 900) numColumns = 3;
  else if (screenWidth >= 600) numColumns = 2;
  else numColumns = 1;
  const cardMargin = 12;
  const cardWidth = (screenWidth - cardMargin * (numColumns + 1)) / numColumns;

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 20, bounciness: 8 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();

    if (Platform.OS !== "web") Haptics.selectionAsync();

    // ✅ Keep the global selection in sync with the card the user tapped
    try {
      // this comes from your PropertyContext
      // import { useProperty } from "@/src/context/PropertyContext";
      // const { setSelected } = useProperty();
      setMenuOpen(false);
      setConfirmOpen(false);
      setSelected?.(data._id);
    } catch {}

    if (onPress) onPress();
    else router.push(`/protected/property/${data._id}`);
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
      label: "Vacant Beds", // ← changed label
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

  // Map tenantType -> screen option values
  const mapTenantToScreen = (t?: string) => {
    if (!t) return undefined;
    if (t.toLowerCase().startsWith("male")) return "Men’s";
    if (t.toLowerCase().startsWith("female")) return "Women’s";
    return t as "Co-living";
  };

  return (
    <Animated.View
      style={[{ width: cardWidth, margin: cardMargin / 2, transform: [{ scale }] }, styles.shadow]}
    >
      <Pressable onPress={handlePress} style={styles.cardContainer(theme.colors)}>
        {/* Gradient Header */}
        <LinearGradient
          colors={theme.colors.enabledGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerView}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
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
                    { fontSize: 15 * fontScale, color: "#e3eafc", marginLeft: 5, opacity: 0.85 },
                  ]}
                >
                  {data?.area}, {data?.city}
                </Text>
              </View>
            </View>

            {/* 3-dot menu */}
            <Menu
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              anchor={
                <Pressable
                  accessibilityLabel="More options"
                  hitSlop={10}
                  onPress={(e: GestureResponderEvent) => {
                    e.stopPropagation();
                    setMenuOpen(true);
                  }}
                  style={{ padding: 4 }}
                >
                  <MaterialIcons name="more-vert" size={22} color="#fff" />
                </Pressable>
              }
              contentStyle={{
                backgroundColor: theme.colors.cardBackground,
                borderWidth: 1,
                borderColor: theme.colors.borderColor,
              }}
            >
              <Menu.Item
                title="Edit"
                onPress={() => {
                  setMenuOpen(false);
                  // ✅ Go to Edit with id and prefill params
                  const params: Record<string, string> = {
                    id: data._id ?? "",
                    name: data.propertyName ?? "",
                    type: mapTenantToScreen(data.tenantType) ?? "",
                    meal: (data.mealType as any) || "",
                    doorNo: data.doorNo || "",
                    street: data.streetName || "",
                    area: data.area || "",
                    landmark: data.landmark || "",
                    state: data.state || "",
                    city: data.city || "",
                    pincode: data.pincode || "",
                    noticeDays: data.noticePeriod || "",
                    // facilities as JSON string so we can parse safely in the screen
                    facilities: JSON.stringify(data.facilities || []),
                  };
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  router.push({ pathname: "/protected/AddandEditProperty", params });
                }}
              />
              <Menu.Item
                title="Delete"
                titleStyle={{ color: theme.colors.error }}
                onPress={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
              />
            </Menu>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statContainer}>
          {statsConfig.map((item, idx) => (
            <StatItem
              key={idx}
              icon={
                <FontAwesome5 name={item.icon as any} size={19 * fontScale} color={item.color} />
              }
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

        {/* Delete confirm dialog */}
        <Portal>
          <Dialog visible={confirmOpen} onDismiss={() => setConfirmOpen(false)}>
            <Dialog.Title>Delete property?</Dialog.Title>
            <Dialog.Content>
              <Text>This action cannot be undone.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                textColor={theme.colors.error}
                onPress={() => {
                  setConfirmOpen(false);
                  if (onDelete) onDelete(data._id);
                }}
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
  financialItem: { alignItems: "center", gap: 2, flex: 1, minWidth: 70 },
  financialLabel: { fontWeight: "600", fontSize: 15, marginTop: 1 },
  financialText: (c: any) => ({ fontSize: 12, color: c.black, opacity: 0.9 }),
  footerRow: (c: any) => ({
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "flex-start",
    backgroundColor: c.cardBackground,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  }),
  footerText: (c: any) => ({ fontSize: 13, color: c.black, fontWeight: "600", opacity: 0.8 }),
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
  value: (c: any) => ({ fontWeight: "700", color: c.black, marginLeft: "auto", fontSize: 14 }),
});

export default PropertyCard;
