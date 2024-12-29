import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const PropertyCard = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerView}>
        <Text style={styles.pgNameText}>MJR Mens PG</Text>
        <View>
          <Text style={styles.pgAddressText}>
            <MaterialIcons name="location-on" size={22} color="#fff" />
            Near flyover Hyderabad{" "}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 400,
    borderRadius: 10,
    marginBottom: 20,
    borderColor: "grey",
    borderWidth: 0.3,
  },
  headerView: {
    width: "100%",
    height: 100,
    backgroundColor: "#256D85",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 10,
  },
  pgNameText: {
    fontSize: 25,
    color: "#fff",
    fontWeight: "600",
    paddingLeft: 30,
  },
  locationView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pgAddressText: {
    fontSize: 18,
    color: "#fff",
    paddingLeft: 30,
  },
});

export default PropertyCard;
