import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  data: number;
};

const ColorList = ({ data  }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.reasonText}>{data}</Text>
      <Text style={styles.reasonText}>20241123401</Text>
      <Text style={styles.reasonText}>red</Text>
      <View style={styles.colorDiv}></View>
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
    borderColor: "#526E48",
    backgroundColor: "#C2FFC7",
  },
  moneyText: {
    fontSize: 18,
    fontWeight: "400",
    marginRight: 5,
    color: "green",
  },
  colorDiv: {
    width: 20,
    height: 20,
    borderRadius: 25,
    backgroundColor: "red",
  },
  reasonText: {
    fontSize: 18,
    fontWeight: "400",
  },
});

export default ColorList;
