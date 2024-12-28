import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import ColorList from "@/components/ColorList";
import { ScrollView } from "react-native-gesture-handler";
import BettingPopup from "@/components/BettingPopup";

const ColorDiv = ({
  color,
  label,
  onClick,
}: {
  color: string;
  label: string;
  onClick: () => void;
}) => (
  <TouchableOpacity
    style={[styles.colorBox, { backgroundColor: color }]}
    onPress={() => onClick()}
  >
    <Text style={styles.colorText}>{label}</Text>
  </TouchableOpacity>
);

const Index = () => {
  const [time, setTime] = useState(119);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleColorClick = (colorLabel: string) => {
    setSelectedColor(colorLabel);
    toggleModal();
  };

  useEffect(() => {
    if (time <= 0) {
      setTime(119);
      return;
    }

    const timer = setInterval(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.colorContainer}>
        <Text style={styles.titleText}>Bingo</Text>
        <View style={styles.colorTab}>
          <ColorDiv
            color="red"
            label="Red"
            onClick={() => handleColorClick("Red")}
          />
          <ColorDiv
            color="blue"
            label="Blue"
            onClick={() => handleColorClick("Blue")}
          />
          <ColorDiv
            color="green"
            label="Green"
            onClick={() => handleColorClick("Green")}
          />
        </View>
        <View style={styles.timeDiv}>
          <Text style={styles.timeText}>Time Period</Text>
          <Text style={styles.timePeriod}>{formatTime(time)}</Text>
        </View>
      </View>
      <Text style={styles.recentText}>Recent Trend</Text>
      <ScrollView
        contentContainerStyle={styles.containerStyle}
        showsVerticalScrollIndicator={false}
      >
        {[1, 2, 3, 3, 2, 1, 4, 5, 6, 7, 7, 8, 8].map((item, index) => (
          <ColorList data={item} key={index} />
        ))}
      </ScrollView>
      <>
        {isModalVisible && (
          <BettingPopup
            isModalVisible={isModalVisible}
            toggleModal={toggleModal}
            selectedColor={selectedColor}
          />
        )}
      </>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
  containerStyle: {
    paddingBottom: 30,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  colorContainer: {
    width: "98%",
    height: 200,
    backgroundColor: "skyblue",
    margin: 5,
    borderRadius: 20,
  },
  colorTab: {
    width: "100%",
    height: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  colorBox: {
    width: 140,
    height: 80,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  timeDiv: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  timeText: {
    fontSize: 18,
    fontWeight: "600",
  },
  timePeriod: {
    fontSize: 18,
    fontWeight: "600",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    margin: 5,
  },
  colorText: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "500",
    color: "white",
  },
  recentText: {
    fontWeight: "500",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 5,
  },
});

export default Index;
