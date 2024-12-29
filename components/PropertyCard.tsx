import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const PropertyCard = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerView}>
        <Text style={styles.pgNameText}>MJR Mens PG</Text>
        <View>
          <Text style={styles.pgAddressText}>
            <MaterialIcons name="location-on" size={16} color="#fff" />
            Near flyover Hyderabad{" "}
          </Text>
        </View>
      </View>
      <View style={styles.totalBedContainer}>
        <Text style={styles.noOfBedText}>Total Beds : 90</Text>
        <View style={styles.bedTypeContainer}>
          <View style={styles.singleBedContainer}>
            <View style={styles.bedDiv}>
              <MaterialIcons name="king-bed" size={24} color="#06BE1B" />
              <Text>Available</Text>
            </View>
            <Text style={styles.numberText}>30</Text>
          </View>
          <View style={styles.singleBedContainer}>
            <View style={styles.bedDiv}>
              <View>
                <MaterialIcons name="king-bed" size={24} color="#DD4C0E" />
              </View>
              <View>
                <Text>Occupied</Text>
              </View>
            </View>
            <Text style={styles.numberText}>30</Text>
          </View>
          <View style={styles.singleBedContainer}>
            <View style={styles.bedDiv}>
              <MaterialIcons name="king-bed" size={24} color="#0E1FDD" />
              <Text>Under Notice</Text>
            </View>
            <Text style={styles.numberText}>30</Text>
          </View>
        </View>
        <View style={styles.horizontalLine}></View>
      </View>
      <View style={styles.totalBedContainer}>
        <View style={styles.bedTypeContainer}>
          <View style={styles.singleBedContainer}>
            <View style={styles.bedDiv}>
              <Text style={styles.incomeText}>Income & Expenses</Text>
            </View>
            <View style={styles.recordContainer}>
              <Text style={styles.receivingMoneyText}>
                <FontAwesome name="rupee" size={18} color="#06BE1B" />
                1,50,000
                <FontAwesome5
                  name="long-arrow-alt-down"
                  size={18}
                  color="#06BE1B"
                />
              </Text>
              <Text style={styles.spendingMoneyText}>
                <FontAwesome name="rupee" size={18} color="#DD4C0E" />
                50,000
                <FontAwesome5
                  name="long-arrow-alt-up"
                  size={18}
                  color="#DD4C0E"
                />
              </Text>
            </View>
          </View>
          <View style={styles.singleBedContainer}>
            <View style={styles.bedDiv}>
              <View>
                <Text style={styles.incomeText}>Due</Text>
              </View>
            </View>
            <Text style={styles.spendingMoneyText}>
              <FontAwesome name="rupee" size={18} color="#DD4C0E" />
              50,000
            </Text>
          </View>
        </View>
        <View style={styles.horizontalLine}></View>
      </View>
      <View style={styles.totalBedContainer}>
        <View style={styles.bedTypeContainer}>
          <View style={styles.singleBedContainer}>
            <View style={styles.bedDiv}>
              <Text style={styles.incomeText}>Complaints</Text>
            </View>
            <Text style={styles.complaintText}>30</Text>
          </View>
          <View style={styles.singleBedContainer}>
            <View style={styles.bedDiv}>
              <View>
                <Text style={styles.incomeText}>Advance Bookings</Text>
              </View>
            </View>
            <Text style={styles.complaintText}>30</Text>
          </View>
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
    gap: 6,
    paddingHorizontal: 20,
  },
  pgNameText: {
    fontSize: 25,
    color: "#fff",
    fontWeight: "600",
  },
  locationView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pgAddressText: {
    fontSize: 18,

    color: "#fff",
  },
  totalBedContainer: {
    paddingHorizontal: 20,
  },
  noOfBedText: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 20,
  },
  incomeText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  recordContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 30,
  },
  bedTypeContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  numberText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  singleBedContainer: {
    marginTop: 10,
  },
  bedDiv: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
  },
  horizontalLine: {
    width: "100%",
    height: 1,
    paddingHorizontal: 30,
    backgroundColor: "#DEDFE0",
    marginTop: 20,
  },
  receivingMoneyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#06BE1B",
  },
  spendingMoneyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#DD4C0E",
  },
  complaintText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
});

export default PropertyCard;
