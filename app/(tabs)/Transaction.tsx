import TransactionPage from "@/components/TransactionPage";
import { Ionicons, Fontisto, MaterialCommunityIcons , AntDesign } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Transaction = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerDiv}>
        <Ionicons name="menu" size={30} color="black" />
        <Text style={styles.headerText}>My Wallet</Text>
        <Ionicons name="notifications-outline" size={30} color="black" />
      </View>
      <View style={styles.walletCont}>
        <View style={styles.walletInnerDiv}>
          <View style={styles.actualWalletDiv}>
            <View style={styles.iconDiv}>
              <Ionicons name="wallet-outline" size={60} color="white" />
            </View>
            <View style={styles.textDiv}>
              <Text style={{ color: "white", fontSize: 22, fontWeight: "500" }}>
                Current Balance
              </Text>
              <Text style={{ color: "white", fontSize: 26, fontWeight: "600" }}>
                $ 5000
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.addMoneyContainer}>
        <View style={styles.addMoney}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={24}
            color="black"
          />
          <TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Add Money</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.addMoney}>
          <Fontisto name="wallet" size={24} color="black" />
          <TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.recentTransaction}>
        <Text style={styles.titleText}>Recent Transactions</Text>
        <AntDesign name="filter" size={24} color="black" />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainerStyle} showsVerticalScrollIndicator={false}>
        <View style={styles.transactionDiv}>
          {[1, 2, 3, 3, 2, 1, 4, 5, 6, 7, 7, 8, 8].map((item, index) => (
            <TransactionPage key={index} data={item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
  },
  headerDiv: {
    width: "95%",
    height: 70,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10,
  },
  headerText: {
    fontSize: 26,
    fontWeight: "600",
  },
  transactionDiv: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  walletCont: {
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  walletInnerDiv: {
    width: 350,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#31511E",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actualWalletDiv: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "95%",
  },
  iconDiv: {
    marginRight: 10,
  },
  textDiv: {
    justifyContent: "center",
    alignItems: "center",
  },
  addMoneyContainer: {
    width: "100%",
    height: 120,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    alignItems: "center",
    marginTop: 0,
  },
  addMoney: {
    width: 160,
    height: 60,
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    backgroundColor:"#c3ff4e"
  },
  titleText: {
    marginLeft: 15,
    fontSize: 18,
    marginBottom: 5,
    fontWeight: "600",
  },
  scrollContainerStyle: {
    paddingBottom: 30,
  },
  recentTransaction: {
    justifyContent: "space-between",
    width :"95%",
    alignItems: "center",
    marginHorizontal: 2,
    flexDirection :'row'
  },
});

export default Transaction;
