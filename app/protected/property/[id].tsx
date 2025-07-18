import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Tabs, useLocalSearchParams, useRouter } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { useTheme } from "@/src/theme/ThemeContext";
import * as Haptics from "expo-haptics";

const tabs = ["Property Details", "Rooms", "Tenants", "Expenses"];

const PropertyDetailScreen = () => {
  const { propertyId } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = React.useState("Property Details");

  const handleTabPress = (tab: string) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };
  const goBack = () => {
    router.back();
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: "https://imgs.search.brave.com/IL4sZSx-J4yjFr4Qx1xlP35bkFEqYQppsKdQ6nHvayo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy8y/LzJkL1VuZGVyX0Nv/bnN0cnVjdGlvbl9C/dWlsZGluZy5qcGc",
            }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Entypo name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Entypo name="dots-three-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.propertyName}>MJR Mens PG</Text>
          <Text style={styles.address}>Near Gachibowli Flyover, Hyderabad</Text>
          <Text style={styles.floors}>🏢 5 Floors</Text>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabPress(tab)}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.sectionHeader}>{activeTab}</Text>
          {/* Future content will render here based on activeTab state */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: Dimensions.get("window").width * 0.6,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 15,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 20,
  },
  menuButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 20,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  propertyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  address: {
    fontSize: 16,
    color: "#666",
    marginVertical: 2,
  },
  floors: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    paddingVertical: 5,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#256D85",
  },
  tabText: {
    fontSize: 16,
    color: "#555",
  },
  activeTabText: {
    color: "#256D85",
    fontWeight: "bold",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
});

export default PropertyDetailScreen;
