import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useTheme } from "@/theme/ThemeContext";
import { useBS } from "@/hooks/useBs";

interface PropertyMetadata {
  totalBeds?: number;
  // Add other metadata fields as needed
}

interface PropertyData {
  propertyName: string;
  area: string;
  city: string;
  metadata?: PropertyMetadata;
  // Add other fields as needed
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
      borderRadius: 10,
      marginBottom: 20,
      borderColor: "grey",
      borderWidth: 0.3,
    },
    headerView: {
      width: "100%",
      height: 74,
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      gap: 6,
      paddingHorizontal: 20,
    },
    locationView: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },


  });
  return (
    <View style={styles.container}>
      <View style={[styles.headerView, bs.p3]}>
        <Text style={[bs.fontSize18, bs.textWhite]}>{data?.propertyName}</Text>
        <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1]}>
          <MaterialIcons style={[bs.fontMedium, bs.textWhite, bs.mt1]} name="location-on" />
          <Text style={[bs.fontMedium, bs.textWhite]}>
            {data?.area}, {data?.city}
          </Text>
        </View>
      </View>
      <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.flexWrap, bs.p3]}>
        <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1, bs.w50]}>
          <FontAwesome5 style={[bs.totalBedsColor]} name="bed" size={24} color="black" />
          <Text style={[bs.fontSmall, bs.textPrimary]}>
            Total : {data.metadata?.totalBeds || 0}
          </Text>
        </View>
        <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1,]}>
          <FontAwesome5 style={[bs.availableBedsColor]} name="bed" size={24} color="black" />
          <Text style={[bs.fontSmall, bs.textPrimary]}>
            Available: {data.metadata?.totalBeds || 0}
          </Text>
        </View>
      </View>
      <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2, bs.flexWrap, bs.p3]}>
        <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1, bs.w50]}>
          <FontAwesome5 style={[bs.filledBedsColor]} name="bed" size={24} color="black" />
          <Text style={[bs.fontSmall, bs.textPrimary]}>
            Filled : {data.metadata?.totalBeds || 0}
          </Text>
        </View>
        <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1]}>
          <FontAwesome5 style={[bs.advBookedBedsColor]} name="bed" size={24} color="black" />
          <Text style={[bs.fontSmall, bs.textPrimary]}>
            Adv Booked: {data.metadata?.totalBeds || 0}
          </Text>
        </View>
      </View>
      <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2, bs.flexWrap, bs.p3]}>
        <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1, bs.w50]}>
          <FontAwesome5 style={[bs.underNoticeBedsColor]} name="bed" size={24} color="black" />
          <Text style={[bs.fontSmall, bs.textPrimary]}>
            Under Notice : {data.metadata?.totalBeds || 0}
          </Text>
        </View>
        <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap1,]}>
          <FontAwesome5 style={[bs.advBookedBedsColor]} name="bed" size={24} color="black" />
          <Text style={[bs.fontSmall, bs.textPrimary]}>
            Dues: {data.metadata?.totalBeds || 0}
          </Text>
        </View>
      </View>
      <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2, bs.flexWrap, bs.p3]}>
        <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2, bs.w50]}>
          <FontAwesome5 style={[bs.availableBedsColor]} name="arrow-down" size={24} color="black" />
          <Text style={[bs.fontSmall, bs.textPrimary]}>
            Income : {data.metadata?.totalBeds || 0}
          </Text>
        </View>
        <View style={[bs.dFlex, bs.flexRow, bs.alignCenter, bs.gap2,]}>
          <FontAwesome5 style={[bs.filledBedsColor]} name="arrow-up" size={24} color="black" />
          <Text style={[bs.fontSmall, bs.textPrimary]}>
            Expenses: {data.metadata?.totalBeds || 0}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PropertyCard;
