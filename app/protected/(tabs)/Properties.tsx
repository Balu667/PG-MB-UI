import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import AddButton from "@/src/components/Common/AddButton";
import PropertyCard from "@/src/components/PropertyCard";
import { useGetPropertyDetailsList } from "@/src/hooks/propertyHook";
import { useTheme } from "@/src/theme/ThemeContext";
import SkeletonCard from "@/src/components/SkeletonCard";

const TAB_BAR_HEIGHT = 60;

const Properties = () => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useTheme();

  const { profileData } = useSelector((state: any) => state.profileDetails);
  const { isLoading, data: propertyData = [], isFetching } = useGetPropertyDetailsList(profileData);

  // responsive columns
  let numColumns = 2;
  if (screenWidth >= 900) numColumns = 3;
  else if (screenWidth >= 600) numColumns = 2;
  else numColumns = 1;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        sectionTitle: {
          fontSize: typography.fontSizeLg,
          fontWeight: typography.weightBold as any,
          marginLeft: spacing.md + 2,
          marginBottom: 4,
          marginTop: spacing.md - 2,
          color: colors.textPrimary,
        },
        cardsContainer: { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.md },
        emptyText: {
          textAlign: "center",
          color: colors.textMuted,
          fontSize: typography.fontSizeMd + 1,
          marginTop: 80,
        },
      }),
    [colors, spacing, typography]
  );

  // ——— Skeleton while loading/fetching ———
  if (isLoading || isFetching) {
    // create a few placeholder items to keep grid shape
    const skeletonCount = numColumns * 4; // ~4 rows worth
    const skeletons = Array.from({ length: skeletonCount }, (_, i) => ({ id: `sk-${i}` }));

    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View>
          <Text style={styles.sectionTitle}>Your Properties</Text>
        </View>
        <FlatList
          data={skeletons}
          keyExtractor={(item) => item.id}
          renderItem={() => <SkeletonCard />}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.cardsContainer,
            { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 12 },
          ]}
          columnWrapperStyle={numColumns > 1 ? { justifyContent: "flex-start" } : undefined}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: 275, offset: 275 * index, index })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          data={propertyData}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={() => <Text style={styles.sectionTitle}>Your Properties</Text>}
          renderItem={({ item }) => (
            <PropertyCard
              data={item}
              // NOTE: PropertyCard already does router.push on press internally,
              // but we keep this to preserve your current behavior.
              onPress={() => router.push(`/protected/property/${item._id}`)}
            />
          )}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.cardsContainer,
            { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 12 },
          ]}
          columnWrapperStyle={numColumns > 1 ? { justifyContent: "flex-start" } : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No properties found.</Text>}
          getItemLayout={(_, index) => ({ length: 275, offset: 275 * index, index })}
        />
      </KeyboardAvoidingView>

      {/* FAB → Add/Edit Property */}
      <AddButton onPress={() => router.push("/protected/AddandEditProperty")} />
    </SafeAreaView>
  );
};

export default Properties;
