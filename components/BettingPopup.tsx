import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import Modal from "react-native-modal";

type Props = {
  isModalVisible: boolean;
  toggleModal: () => void;
  selectedColor: string;
};

const BettingPopup = ({
  isModalVisible,
  toggleModal,
  selectedColor,
}: Props) => {
  const [amount, setAmount] = useState<string>("");

  const handleConfirm = () => {
    toggleModal();
    console.log("Amount:", amount);
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    setAmount(numericValue);
  };

  let color = selectedColor.toLocaleLowerCase();

  return (
    <View style={styles.container}>
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={toggleModal}
        onBackButtonPress={toggleModal}
      >
        <View style={styles.modalContent}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            Betting on {color}
          </Text>
          <View style={styles.inputCont}>
            <View style={styles.inputs}>
              <Text style={styles.labels}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={handleAmountChange}
              />
            </View>
          </View>
          <View style={styles.btnDiv}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: color }]}
              onPress={toggleModal}
            >
              <Text style={styles.buttonText}>Cancel</Text>
              
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: color }]}
              onPress={handleConfirm}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginVertical: 10,
    backgroundColor: "#fff",
    color: "#000",
  },
  inputQuantity: {
    width: "30%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginVertical: 10,
    backgroundColor: "#fff",
    color: "#000",
  },
  labels: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },

  btnDiv: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 25,
  },
  inputCont: {
    width: "100%",
  },
  inputs: {
    marginVertical: 4,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 5,
  },
});

export default BettingPopup;
