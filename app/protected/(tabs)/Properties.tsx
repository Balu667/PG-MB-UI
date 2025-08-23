// import { useRouter } from "expo-router";
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
//   StyleSheet,
//   Text,
//   useWindowDimensions,
// } from "react-native";
// import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
// import { useSelector } from "react-redux";

// import AddButton from "@/src/components/Common/AddButton";
// import PropertyCard from "@/src/components/PropertyCard";
// import { useGetPropertyDetailsList } from "@/src/hooks/propertyHook";
// import { useTheme } from "@/src/theme/ThemeContext"; // ← themed colours --
// import SkeletonCard from "@/src/components/SkeletonCard";

// const TAB_BAR_HEIGHT = 60;

// const Properties = () => {
//   const router = useRouter();
//   const { width: screenWidth } = useWindowDimensions();
//   const insets = useSafeAreaInsets();
//   const { colors, spacing, typography } = useTheme();

//   /* -------- data from store / API -------- */
//   const { profileData } = useSelector((state: any) => state.profileDetails);
//   const { isLoading, data: propertyData, isFetching } = useGetPropertyDetailsList(profileData);

//   /* -------- selected id (not used here yet) -------- */
//   const [selectedId, setSelectedId] = useState<string | undefined>();

//   useEffect(() => {
//     if (propertyData?.length) setSelectedId(propertyData[0]._id);
//   }, [propertyData]);

//   /* -------- responsive cols -------- */
//   let numColumns = 2;
//   if (screenWidth >= 900) numColumns = 3;
//   else if (screenWidth >= 600) numColumns = 2;
//   else numColumns = 1;

//   /* -------- theme-aware styles -------- */
//   const styles = useMemo(
//     () =>
//       StyleSheet.create({
//         safeArea: { flex: 1, backgroundColor: colors.background },

//         sectionTitle: {
//           fontSize: typography.fontSizeLg,
//           fontWeight: typography.weightBold as any,
//           marginLeft: spacing.md + 2,
//           marginBottom: 4,
//           marginTop: spacing.md - 2,
//           color: colors.textPrimary,
//         },

//         cardsContainer: {
//           paddingHorizontal: spacing.sm + 2,
//           paddingVertical: spacing.md,
//         },

//         emptyText: {
//           textAlign: "center",
//           color: colors.textMuted,
//           fontSize: typography.fontSizeMd + 1,
//           marginTop: 80,
//         },
//       }),
//     [colors, spacing, typography]
//   );

//   /* -------- loading state -------- */
//   if (isLoading || isFetching) {
//     return (
//       <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
//         <Text>Loading…</Text>
//       </SafeAreaView>
//     );
//   }
//   const pgProperties = [
//     {
//       _id: "6801cc72e26fc33c842415e1",
//       metadata: {
//         totalRooms: 15,
//         totalBeds: 56,
//         vacantBeds: 48,
//         advancedBookings: 4,
//         occupiedBeds: 4,
//         underNotice: 0,
//         expenses: 0,
//         dues: 63000,
//         income: 0,
//       },
//       propertyId: "PG-00031",
//       propertyName: "Hanuman Gen's PG",
//       tenantType: "Male",
//       mealType: "Both",
//       doorNo: "900",
//       streetName: "100 Feet Road",
//       area: "Madhapur",
//       city: "Hyderabad",
//       state: "Telangana",
//       pincode: "500098",
//       country: "India",
//       landmark: "Near Tea shop",
//       facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV"],
//       notifications: { sms: true, whatsapp: true },
//       noticePeriod: "30",
//     },
//     {
//       _id: "6801ccbce26fc33c842415ec",
//       metadata: {
//         totalRooms: 1,
//         totalBeds: 1,
//         vacantBeds: 0,
//         advancedBookings: 0,
//         occupiedBeds: 1,
//         underNotice: 1,
//         expenses: 0,
//         dues: 4000,
//         income: 0,
//       },
//       propertyId: "PG-00032",
//       propertyName: "Hanuman Gen's PG",
//       tenantType: "Male",
//       mealType: "Both",
//       doorNo: "900",
//       streetName: "BTM Layout",
//       area: "BTM Layout",
//       city: "Bangalore Urban",
//       state: "Karnataka",
//       pincode: "524004",
//       country: "India",
//       landmark: "Near Water tank",
//       facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV", "AC"],
//       notifications: { sms: true, whatsapp: true },
//       noticePeriod: "30",
//     },
//   ];
//   /* ==================================================================== */
//   return (
//     <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         style={{ flex: 1 }}
//       >
//         <FlatList
//           // data={propertyData}
//           data={pgProperties}
//           keyExtractor={(item) => item._id}
//           ListHeaderComponent={() => <Text style={styles.sectionTitle}>Your Properties</Text>}
//           renderItem={({ item }) => (
//             <PropertyCard
//               data={item}
//               onPress={() => router.push(`/protected/property/${item._id}`)}
//             />
//           )}
//           numColumns={numColumns}
//           contentContainerStyle={[
//             styles.cardsContainer,
//             { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 12 },
//           ]}
//           columnWrapperStyle={numColumns > 1 ? { justifyContent: "flex-start" } : undefined}
//           showsVerticalScrollIndicator={false}
//           ListEmptyComponent={<Text style={styles.emptyText}>No properties found.</Text>}
//           getItemLayout={(_, index) => ({
//             length: 275,
//             offset: 275 * index,
//             index,
//           })}
//         />
//       </KeyboardAvoidingView>

//       {/* FAB */}
//       <AddButton onPress={() => router.push("/properties/add")} />
//     </SafeAreaView>
//   );
// };

// export default Properties;
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
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
  const { isLoading, data: propertyData, isFetching } = useGetPropertyDetailsList(profileData);

  const [selectedId, setSelectedId] = useState<string | undefined>();
  useEffect(() => {
    if (propertyData?.length) setSelectedId(propertyData[0]._id);
  }, [propertyData]);

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

  if (isLoading || isFetching) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <Text>Loading…</Text>
      </SafeAreaView>
    );
  }

  const pgProperties = [
    {
      _id: "6801cc72e26fc33c842415e1",
      metadata: {
        totalRooms: 15,
        totalBeds: 56,
        vacantBeds: 48,
        advancedBookings: 4,
        occupiedBeds: 4,
        underNotice: 0,
        expenses: 0,
        dues: 63000,
        income: 0,
      },
      propertyId: "PG-00031",
      propertyName: "Hanuman Gen's PG",
      tenantType: "Male",
      mealType: "Both",
      doorNo: "900",
      streetName: "100 Feet Road",
      area: "Madhapur",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500098",
      country: "India",
      landmark: "Near Tea shop",
      facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV"],
      notifications: { sms: true, whatsapp: true },
      noticePeriod: "30",
    },
    {
      _id: "6801ccbce26fc33c842415ec",
      metadata: {
        totalRooms: 1,
        totalBeds: 1,
        vacantBeds: 0,
        advancedBookings: 0,
        occupiedBeds: 1,
        underNotice: 1,
        expenses: 0,
        dues: 4000,
        income: 0,
      },
      propertyId: "PG-00032",
      propertyName: "Hanuman Gen's PG",
      tenantType: "Male",
      mealType: "Both",
      doorNo: "900",
      streetName: "BTM Layout",
      area: "BTM Layout",
      city: "Bangalore Urban",
      state: "Karnataka",
      pincode: "524004",
      country: "India",
      landmark: "Near Water tank",
      facilities: ["Washing Machine", "Wifi", "Hot Water", "Table", "TV", "AC"],
      notifications: { sms: true, whatsapp: true },
      noticePeriod: "30",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          data={pgProperties}
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
