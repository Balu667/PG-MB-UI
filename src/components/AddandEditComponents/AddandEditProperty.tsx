// // ✅ AddEditPropertyScreen.tsx (React Native)

// import React, { useEffect, useRef, useState } from "react";
// import {
//   ScrollView,
//   View,
//   Image,
//   Alert,
//   BackHandler,
//   TouchableOpacity,
//   Pressable,
//   Platform,
//   StyleSheet,
// } from "react-native";
// import {
//   TextInput,
//   Button,
//   Text,
//   RadioButton,
//   Chip,
//   Provider as PaperProvider,
//   HelperText,
//   DefaultTheme,
// } from "react-native-paper";
// import { useForm, Controller } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as ImagePicker from "expo-image-picker";
// import { useRouter } from "expo-router";
// import { MaterialIcons } from "@expo/vector-icons";
// import {
//   PropertyFormFields,
//   AddAndEditPropertySchema,
// } from "@/src/validations/propertyValidations";
// // types.ts (or same file)
// import { useLocalSearchParams } from "expo-router";

// const facilitiesList = ["WiFi", "Laundry", "TV", "Fridge", "Parking", "CCTV"];
// type Props = {
//   type: "add" | "edit";
//   propertyData?: Partial<PropertyFormFields>;
// };
// export default function AddEditPropertyScreen({ type, propertyData }: Props) {
//   const router = useRouter();
//   const propertydata: Partial<PropertyFormFields> =
//     typeof propertyData === "string" ? JSON.parse(propertyData) : {};

//   const formType: "add" | "edit" = type === "edit" ? "edit" : "add";

//   const [images, setImages] = useState<string[]>(
//     (propertydata?.images ?? []).filter((img): img is string => typeof img === "string")
//   );

//   const [facilities, setFacilities] = useState<string[]>(
//     (propertydata?.facilities ?? []).filter((f): f is string => typeof f === "string")
//   );

//   const [isTouched, setIsTouched] = useState(false);

//   const {
//     handleSubmit,
//     control,
//     formState: { errors },
//     watch,
//   } = useForm<PropertyFormFields>({
//     defaultValues: {
//       propertyName: propertydata.propertyName ?? "",
//       tenantType: propertydata.tenantType ?? "",
//       mealType: propertydata.mealType ?? "",
//       doorNo: propertydata.doorNo ?? "",
//       streetName: propertydata.streetName ?? "",
//       area: propertydata.area ?? "",
//       landmark: propertydata.landmark ?? "",
//       state: propertydata.state ?? "",
//       city: propertydata.city ?? "",
//       pincode: propertydata.pincode ?? "",
//       noticePeriod: propertydata.noticePeriod ?? "",
//       facilities: propertydata.facilities ?? [],
//       images: propertydata.images ?? [],
//     },
//     resolver: yupResolver(AddAndEditPropertySchema),
//     mode: "onChange",
//   });

//   const formValues = watch();

//   const handleBackPress = () => {
//     if (isTouched || Object.values(formValues).some(Boolean)) {
//       Alert.alert("Unsaved Changes", "Form data might be lost. Are you sure you want to go back?", [
//         { text: "Cancel", style: "cancel" },
//         { text: "Yes", onPress: () => router.back() },
//       ]);
//       return true;
//     } else {
//       router.back();
//       return true;
//     }
//   };

//   useEffect(() => {
//     const sub = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
//     return () => sub.remove();
//   }, [formValues]);

//   const pickImages = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//     });
//     if (!result.canceled) {
//       const uris = result.assets.map((a) => a.uri);
//       setImages([...images, ...uris]);
//     }
//   };

//   const onSubmit = (data: any) => {
//     console.log({ ...data, facilities, images });
//     Alert.alert("Form Submitted");
//     router.back();
//   };

//   const toggleFacility = (item: string) => {
//     setFacilities((prev) =>
//       prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
//     );
//   };

//   const theme = {
//     ...DefaultTheme,
//     colors: {
//       ...DefaultTheme.colors,
//       background: "#fff",
//       surface: "#fff",
//     },
//   };

//   return (
//     <PaperProvider theme={theme}>
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.headerContainer}>
//           <View style={styles.headerTopRow}>
//             <Pressable
//               onPress={() => router.back()}
//               android_ripple={{ color: "#ffffff55", borderless: true }}
//               style={({ pressed }) => [
//                 styles.iconWrapper,
//                 pressed && Platform.OS === "ios" && styles.pressedIOS,
//               ]}
//             >
//               <MaterialIcons name="arrow-back" size={24} color="#fff" />
//             </Pressable>
//             <Text style={styles.headerTitle}>
//               {formType === "edit" ? "Edit Property" : "Add Property"}
//             </Text>
//           </View>
//         </View>

//         <ScrollView style={{ paddingHorizontal: 16, paddingTop: 12 }}>
//           {(
//             [
//               ["propertyName", "Property Name"],
//               ["doorNo", "Door No"],
//               ["streetName", "Street Name"],
//               ["area", "Area"],
//               ["landmark", "Landmark"],
//               ["state", "State"],
//               ["city", "City"],
//               ["pincode", "Pincode"],
//               ["noticePeriod", "Notice Period (in days)"],
//             ] as const
//           ).map(([field, label]) => (
//             <Controller
//               key={field}
//               control={control}
//               name={field}
//               render={({ field: { onChange, value } }) => (
//                 <View style={layout.fieldGap}>
//                   <TextInput
//                     label={label}
//                     value={value || ""}
//                     mode="outlined"
//                     onChangeText={(val) => {
//                       onChange(val);
//                       setIsTouched(true);
//                     }}
//                     style={{ backgroundColor: "white" }}
//                   />
//                   <HelperText type="error" visible={!!errors[field]}>
//                     {errors[field]?.message?.toString()}
//                   </HelperText>
//                 </View>
//               )}
//             />
//           ))}

//           <Text style={layout.sectionTitle}>Tenant Type</Text>
//           <Controller
//             control={control}
//             name="tenantType"
//             render={({ field: { value, onChange } }) => (
//               <RadioButton.Group
//                 onValueChange={(val) => {
//                   setIsTouched(true);
//                   onChange(val);
//                 }}
//                 value={value}
//               >
//                 <RadioButton.Item label="Male" value="Male" />
//                 <RadioButton.Item label="Female" value="Female" />
//                 <RadioButton.Item label="Co-living" value="Co-living" />
//               </RadioButton.Group>
//             )}
//           />
//           <HelperText type="error" visible={!!errors.tenantType}>
//             {errors.tenantType?.message?.toString()}
//           </HelperText>

//           <Text style={layout.sectionTitle}>Meal Type</Text>
//           <Controller
//             control={control}
//             name="mealType"
//             render={({ field: { value, onChange } }) => (
//               <RadioButton.Group
//                 onValueChange={(val) => {
//                   setIsTouched(true);
//                   onChange(val);
//                 }}
//                 value={value}
//               >
//                 <RadioButton.Item label="Veg" value="Veg" />
//                 <RadioButton.Item label="Non-Veg" value="Non-Veg" />
//                 <RadioButton.Item label="Both" value="Both" />
//               </RadioButton.Group>
//             )}
//           />
//           <HelperText type="error" visible={!!errors.mealType}>
//             {errors.mealType?.message?.toString()}
//           </HelperText>

//           <Text style={layout.sectionTitle}>Facilities</Text>
//           <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
//             {facilitiesList.map((item) => (
//               <Chip
//                 key={item}
//                 selected={facilities.includes(item)}
//                 onPress={() => toggleFacility(item)}
//                 style={{ margin: 4 }}
//               >
//                 {item}
//               </Chip>
//             ))}
//           </View>

//           <Button mode="outlined" onPress={pickImages} style={layout.uploadButton}>
//             Upload Property Images
//           </Button>

//           <ScrollView horizontal>
//             {images.map((uri, index) => (
//               <Image
//                 key={index}
//                 source={{ uri }}
//                 style={{
//                   width: 80,
//                   height: 80,
//                   marginRight: 8,
//                   borderRadius: 6,
//                 }}
//               />
//             ))}
//           </ScrollView>

//           <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.saveButton}>
//             Save Property
//           </Button>
//         </ScrollView>
//       </View>
//     </PaperProvider>
//   );
// }
// const layout = StyleSheet.create({
//   fieldGap: { marginBottom: 6 },
//   sectionTitle: { marginVertical: 6 },
//   uploadButton: { marginVertical: 8 },
// });

// const styles = StyleSheet.create({
//   iconWrapper: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#fff",
//     marginLeft: 10,
//   },
//   pressedIOS: {
//     backgroundColor: "#ffffff22",
//   },
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#256D85",
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#F7F8FA",
//     position: "relative",
//   },
//   headerContainer: {
//     backgroundColor: "#256D85",
//     paddingHorizontal: 20,
//     paddingTop: 10,
//     paddingBottom: 20,
//   },
//   headerTopRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "flex-start",
//   },

//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 60,
//   },
//   saveButton: {
//     marginBottom: 40,
//     width: "90%",
//     margin: "auto",
//     backgroundColor: "#256D85",
//   },
// });
