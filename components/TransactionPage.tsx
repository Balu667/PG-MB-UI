import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  data: number;
};

const TransactionPage = ({ data }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.reasonText}>
        ArcTrade Holding Ltd , Australia. {data}
      </Text>
      <Text style={styles.moneyText}>+5000</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 420,
    height: 80,
    borderRadius: 14,
    marginTop: 7,
    marginHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor : '#526E48',
    backgroundColor : '#C2FFC7'
  },
  moneyText: {
    fontSize: 18,
    fontWeight: "400",
    marginRight: 5,
    color: "green",
  },
  reasonText: {
    fontSize: 18,
    fontWeight: "400",
  },
});

export default TransactionPage;
