import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";

const Dashboard = () => {
  const { colors, spacing, typography } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <View style={styles.container(colors)}>
        <Text style={styles.comingSoon}>Charts coming soon…</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: (c: any) => ({
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.background,
  }),
  comingSoon: { fontSize: 18, fontWeight: "600", color: "#888" },
});

export default Dashboard;
