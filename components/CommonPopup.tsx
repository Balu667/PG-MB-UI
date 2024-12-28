import React, { useState } from "react";
import { View, Text, Button, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";

type Props = {
  isModalVisible: boolean;
  toggleModal: () => void;
};

const CommonPopup = ({ isModalVisible, toggleModal }: Props) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleConfirm = () => {
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }
    // Handle the password change logic here
    console.log("Password confirmed:", newPassword);
    setErrorMessage('');
    toggleModal(); // Close the modal
  };

  return (
    <View style={styles.container}>
      <Button title="Show Dialog" onPress={toggleModal} />

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={toggleModal}
        onBackButtonPress={toggleModal}
      >
        <View style={styles.modalContent}>
          <Text style={{fontSize:16 , fontWeight :'600'}}>Change Password</Text>
          <View style={styles.inputCont}>
            <View style={styles.inputs}>
              <Text style={styles.labels}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your new password"
                keyboardType="default"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>
            <View style={styles.inputs}>
              <Text style={styles.labels}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>
          <View style={styles.btnDiv}>
            <TouchableOpacity style={styles.button} onPress={handleConfirm}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={toggleModal}>
              <Text style={styles.buttonText}>Cancel</Text>
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
    backgroundColor: "#007BFF",
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

export default CommonPopup;
