import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Pressable,
  I18nManager,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import AddButton from "@/src/components/Common/AddButton";
import PropertyCard from "@/src/components/PropertyCard";
import SearchBar from "@/src/components/SearchBar";
import { useGetPropertyDetailsList } from "@/src/hooks/propertyHook";
import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import SkeletonCard from "@/src/components/SkeletonCard";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

// Format number to Indian currency format
const formatIndianNumber = (num: number): string => {
  if (isNaN(num)) return "0";
  const str = Math.abs(Math.round(num)).toString();
  let result = "";
  const len = str.length;
  
  if (len <= 3) return num < 0 ? `-${str}` : str;
  
  result = str.slice(-3);
  let remaining = str.slice(0, -3);
  
  while (remaining.length > 2) {
    result = remaining.slice(-2) + "," + result;
    remaining = remaining.slice(0, -2);
  }
  
  if (remaining.length > 0) {
    result = remaining + "," + result;
  }
  
  return num < 0 ? `-${result}` : result;
};

/* ─────────────────────────────────────────────────────────────────────────────
   SUMMARY STATS COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface SummaryStatsProps {
  properties: any[];
  colors: ReturnType<typeof useTheme>["colors"];
  spacing: ReturnType<typeof useTheme>["spacing"];
  radius: ReturnType<typeof useTheme>["radius"];
  isCompact: boolean;
}

const SummaryStats = React.memo<SummaryStatsProps>(({ properties, colors, spacing, radius, isCompact }) => {
  const totals = useMemo(() => {
    return properties.reduce(
      (acc, p) => ({
        totalBeds: acc.totalBeds + (p.metadata?.totalBeds || 0),
        vacantBeds: acc.vacantBeds + (p.metadata?.vacantBeds || 0),
        occupiedBeds: acc.occupiedBeds + (p.metadata?.occupiedBeds || 0),
        income: acc.income + (p.metadata?.income || 0),
        expenses: acc.expenses + (p.metadata?.expenses || 0),
        dues: acc.dues + (p.metadata?.dues || 0),
      }),
      { totalBeds: 0, vacantBeds: 0, occupiedBeds: 0, income: 0, expenses: 0, dues: 0 }
    );
  }, [properties]);

  const statCards = [
    { icon: "bed", label: "Total Beds", value: totals.totalBeds, color: "#6366F1", isMoney: false },
    { icon: "bed-empty", label: "Vacant", value: totals.vacantBeds, color: "#10B981", isMoney: false },
    { icon: "account-check", label: "Occupied", value: totals.occupiedBeds, color: "#F59E0B", isMoney: false },
    { icon: "arrow-down-bold", label: "Income", value: totals.income, color: "#10B981", isMoney: true },
    { icon: "arrow-up-bold", label: "Expenses", value: totals.expenses, color: "#EF4444", isMoney: true },
    { icon: "alert-circle", label: "Dues", value: totals.dues, color: "#F59E0B", isMoney: true },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: isCompact ? 8 : 10,
        marginBottom: spacing.md,
      }}
    >
      {statCards.map((stat, idx) => (
        <View
          key={idx}
          style={{
            flex: 1,
            minWidth: isCompact ? 95 : 100,
            backgroundColor: hexToRgba(stat.color, 0.08),
            borderRadius: radius.lg,
            padding: isCompact ? 10 : 12,
            alignItems: "center",
          }}
          accessibilityLabel={`${stat.label}: ${stat.isMoney ? "₹" : ""}${formatIndianNumber(stat.value)}`}
          accessible
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: hexToRgba(stat.color, 0.15),
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 6,
            }}
          >
            <MaterialCommunityIcons name={stat.icon as never} size={16} color={stat.color} />
          </View>
          <Text
            style={{
              fontSize: isCompact ? 14 : 16,
              fontWeight: "700",
              color: stat.color,
              marginBottom: 2,
            }}
          >
            {stat.isMoney ? "₹" : ""}{formatIndianNumber(stat.value)}
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
            numberOfLines={1}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

SummaryStats.displayName = "SummaryStats";

/* ─────────────────────────────────────────────────────────────────────────────
   LIST HEADER COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface ListHeaderProps {
  properties: any[];
  colors: ReturnType<typeof useTheme>["colors"];
  spacing: ReturnType<typeof useTheme>["spacing"];
  radius: ReturnType<typeof useTheme>["radius"];
  isCompact: boolean;
  onSearchChange: (text: string) => void;
}

const ListHeader = React.memo<ListHeaderProps>(({ properties, colors, spacing, radius, isCompact, onSearchChange }) => (
  <View style={{ marginBottom: spacing.md }}>
    {/* Title Section */}
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: hexToRgba(colors.primary, 0.1),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name="home-city" size={22} color={colors.primary} />
        </View>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>
            Your Properties
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
            Manage all your PG properties
          </Text>
        </View>
      </View>
      {properties.length > 0 && (
        <View
          style={{
            backgroundColor: hexToRgba(colors.primary, 0.1),
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: radius.full,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
            {properties.length}
          </Text>
        </View>
      )}
    </View>

    {/* Summary Stats */}
    {properties.length > 0 && (
      <SummaryStats
        properties={properties}
        colors={colors}
        spacing={spacing}
        radius={radius}
        isCompact={isCompact}
      />
    )}

    {/* Search Bar */}
    {properties.length > 0 && (
      <View >
        <SearchBar
          placeholder="Search by property name..."
          onSearch={onSearchChange}
        />
      </View>
    )}
  </View>
));

ListHeader.displayName = "ListHeader";

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface EmptyStateProps {
  colors: ReturnType<typeof useTheme>["colors"];
  error: unknown;
  searchQuery?: string;
}

const EmptyState = React.memo<EmptyStateProps>(({ colors, error, searchQuery }) => {
  const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;
  
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 }}>
      {/* Icon */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: hexToRgba(colors.textMuted, 0.08),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: hexToRgba(colors.textMuted, 0.1),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name={error ? "wifi-off" : hasSearchQuery ? "magnify" : "home-city"}
            size={48}
            color={colors.textMuted}
          />
        </View>
      </View>

      {/* Message */}
      <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary, textAlign: "center", marginBottom: 8 }}>
        {error ? "Connection Error" : hasSearchQuery ? "No Results Found" : "No Properties Yet"}
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 22 }}>
        {error
          ? "Couldn't load your properties.\nPull down to retry."
          : hasSearchQuery
          ? `No properties found matching "${searchQuery}".\nTry a different search term.`
          : "Start by adding your first property.\nTap the + button below to get started."}
      </Text>
    </View>
  );
});

EmptyState.displayName = "EmptyState";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PROPERTIES SCREEN
───────────────────────────────────────────────────────────────────────────── */

const Properties = () => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const { profileData } = useSelector((state: any) => state.profileDetails);

  // API hook
  const {
    isLoading,
    isFetching,
    isRefetching,
    data: propertyData = [],
    refetch,
    error,
  } = useGetPropertyDetailsList(profileData);

  // Refreshing state
  const refreshing = !isLoading && (isRefetching || isFetching);

  // Refetch on refresh param change
  useEffect(() => {
    refetch();
  }, [refresh, refetch]);

  // Responsive sizing
  const numColumns = useMemo(() => {
    if (screenWidth >= 1024) return 4;
    if (screenWidth >= 768) return 3;
    if (screenWidth >= 600) return 2;
    return 1;
  }, [screenWidth]);

  const isCompact = screenWidth < 400;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return propertyData;

    return propertyData.filter((property: any) => {
      const propertyName = String(property?.propertyName || "").toLowerCase();
      return propertyName.includes(query);
    });
  }, [propertyData, searchQuery]);

  // Search handler
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Navigate to add property
  const handleAddProperty = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/protected/property/edit/new");
  }, [router]);


  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
        },
        listContent: {
          paddingHorizontal: spacing.sm + 2,
          paddingTop: spacing.md,
          paddingBottom: spacing.lg,
        },
      }),
    [colors, spacing]
  );

  // Skeleton loading
  if (isLoading) {
    const skeletonCount = numColumns * 3;
    const skeletons = Array.from({ length: skeletonCount }, (_, i) => ({ id: `sk-${i}` }));

    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.container}>
          <View style={[styles.listContent, { paddingTop: spacing.md }]}>
            {/* Header skeleton */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: hexToRgba(colors.primary, 0.1),
                }}
              />
              <View>
                <View style={{ width: 160, height: 24, backgroundColor: hexToRgba(colors.textMuted, 0.1), borderRadius: 8, marginBottom: 6 }} />
                <View style={{ width: 120, height: 14, backgroundColor: hexToRgba(colors.textMuted, 0.08), borderRadius: 6 }} />
              </View>
            </View>
          </View>
          <FlatList
            data={skeletons}
            keyExtractor={(item) => item.id}
            renderItem={() => <SkeletonCard />}
            numColumns={numColumns}
            key={`skeleton-${numColumns}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item._id}
          key={`properties-${numColumns}`}
          ListHeaderComponent={
            <ListHeader
              properties={propertyData}
              colors={colors}
              spacing={spacing}
              radius={radius}
              isCompact={isCompact}
              onSearchChange={handleSearchChange}
            />
          }
          renderItem={({ item }) => (
            <PropertyCard
              data={item}
              onPress={() => router.push(`/protected/property/${item._id}`)}
            />
          )}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState colors={colors} error={error} searchQuery={searchQuery} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              title={refreshing ? "Refreshing..." : undefined}
              titleColor={colors.textMuted}
              colors={[colors.primary]}
              progressBackgroundColor={colors.cardSurface}
            />
          }
          keyboardDismissMode={Platform.OS === "ios" ? "on-drag" : "none"}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
        />
      </KeyboardAvoidingView>

      {/* Add Property Button */}
      <AddButton
        onPress={handleAddProperty}
        accessibilityLabel="Add new property"
        accessibilityHint="Navigate to add a new property"
      />
    </SafeAreaView>
  );
};

export default Properties;
