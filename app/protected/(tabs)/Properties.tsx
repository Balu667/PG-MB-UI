import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useEffect } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const { profileData } = useSelector((state: any) => state.profileDetails);

  // react-query style hook: keep your existing API integration
  const {
    isLoading,
    isFetching,
    isRefetching,
    data: propertyData = [],
    refetch,
    error,
  } = useGetPropertyDetailsList(profileData);

  // "refreshing" should NOT show skeletons; it should show pull-to-refresh spinner only
  const refreshing = !isLoading && (isRefetching || isFetching);

  // Handle both the refresh param change and screen focus effect with a single useEffect
  useEffect(() => {
    // Trigger refetch if refresh param or screen focus changes
    refetch();
  }, [refresh, refetch]); // Add refetch and refresh as dependencies to control this

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
        errorWrap: {
          marginHorizontal: spacing.md,
          marginTop: spacing.sm,
          paddingVertical: 6,
        },
        errorText: {
          textAlign: "center",
          color: colors.error,
          fontSize: typography.fontSizeSm,
        },
      }),
    [colors, spacing, typography]
  );

  // Pull-to-refresh handler (kept tiny to avoid re-renders)
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ——— Skeleton while FIRST loading ———
  if (isLoading) {
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
          ListEmptyComponent={
            <View>
              {/* Optional light error message without changing your API layer */}
              {error ? (
                <View style={styles.errorWrap}>
                  <Text
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                    style={styles.errorText}
                  >
                    Couldn’t load properties. Pull down to retry.
                  </Text>
                </View>
              ) : null}
              <Text style={styles.emptyText}>No properties found.</Text>
            </View>
          }
          getItemLayout={(_, index) => ({ length: 275, offset: 275 * index, index })}
          // ★ Pull-to-refresh
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              // accessibility / platform polish
              tintColor={colors.accent} // iOS spinner color
              title={refreshing ? "Refreshing..." : undefined}
              titleColor={colors.textMuted}
              colors={[colors.accent]} // Android spinner colors
              progressBackgroundColor={colors.cardSurface} // Android track color
            />
          }
          // Avoid accidental keyboard dismiss on pull (helps with larger accessibility text)
          keyboardDismissMode={Platform.OS === "ios" ? "on-drag" : "none"}
        />
      </KeyboardAvoidingView>

      {/* FAB → Add/Edit Property */}
      <AddButton
        onPress={() => router.push("/protected/AddandEditProperty")}
        accessibilityLabel="Add new property"
        accessibilityHint="Opens the form to add a property"
      />
    </SafeAreaView>
  );
};

export default Properties;
