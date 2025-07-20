// // ✅ AddEditRoomScreen.tsx (React Native with Paper)

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   ScrollView,
//   Image,
//   Alert,
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
// import * as ImagePicker from "expo-image-picker";
// import { useForm, Controller } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import { MaterialIcons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import {
//   AddRoomValidation,
//   EditRoomValidation,
// } from "@/src/validations/roomValidation";
// import { RoomFormFields } from "@/src/types/room.types";

// const facilitiesList = ["Fan", "AC", "TV", "Attached Bathroom"];
// const roomTypesList = ["Single", "Double", "Triple"];
// const floorOptions = ["Ground", "1st", "2nd", "3rd"];
// const sharingTypes = ["1", "2", "3", "4"];

// type Props = {
//   type: "add" | "edit";
//   roomData?: Partial<RoomFormFields>;
// };

// export default function AddEditRoomScreen({ type, roomData }: Props) {
//   const router = useRouter();
//   const formType = type === "edit" ? "edit" : "add";

//   const [images, setImages] = useState<string[]>(
//     (roomData?.images ?? []).filter(
//       (img): img is string => typeof img === "string"
//     )
//   );

//   const [facilities, setFacilities] = useState<string[]>(
//     (roomData?.facilities ?? []).filter(
//       (f): f is string => typeof f === "string"
//     )
//   );

//   const [roomType, setRoomType] = useState<string[]>(
//     (roomData?.roomType ?? []).filter((r): r is string => typeof r === "string")
//   );

//   const {
//     handleSubmit,
//     control,
//     formState: { errors },
//     watch,
//   } = useForm<RoomFormFields>({
//     defaultValues: {
//       roomNo: roomData?.roomNo ?? "",
//       floor: roomData?.floor ?? "",
//       beds: roomData?.beds?.toString() ?? "",
//       bedPrice: roomData?.bedPrice ?? "",
//       securityDeposit: roomData?.securityDeposit ?? "",
//       electricityBillInclude: roomData?.electricityBillInclude ?? "yes",
//       remarks: roomData?.remarks ?? "",
//       facilities,
//       roomType,
//       images,
//     },
//     resolver: yupResolver(
//       type === "add" ? AddRoomValidation() : EditRoomValidation()
//     ),
//     mode: "onChange",
//   });

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

//   const toggleItem = (item: string, setFn: Function, state: string[]) => {
//     setFn((prev: string[]) =>
//       prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
//     );
//   };

//   const onSubmit = (data: RoomFormFields) => {
//     console.log({ ...data, facilities, roomType, images });
//     Alert.alert("Form Submitted");
//     router.back();
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
//               {formType === "edit" ? "Edit Room" : "Add Room"}
//             </Text>
//           </View>
//         </View>

//         <ScrollView style={{ padding: 16 }}>
//           {(
//             [
//               ["roomNo", "Room Number"],
//               ["bedPrice", "Amount Per Bed"],
//               ["securityDeposit", "Security Deposit"],
//               ["remarks", "Remarks"],
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
//                     onChangeText={onChange}
//                     style={{ backgroundColor: "white" }}
//                   />
//                   <HelperText type="error" visible={!!errors[field]}>
//                     {errors[field]?.message?.toString()}
//                   </HelperText>
//                 </View>
//               )}
//             />
//           ))}

//           <Text style={layout.sectionTitle}>Select Floor</Text>
//           <Controller
//             control={control}
//             name="floor"
//             render={({ field: { value, onChange } }) => (
//               <RadioButton.Group onValueChange={onChange} value={value}>
//                 {floorOptions.map((f) => (
//                   <RadioButton.Item label={f} value={f} key={f} />
//                 ))}
//               </RadioButton.Group>
//             )}
//           />
//           <HelperText type="error" visible={!!errors.floor}>
//             {errors.floor?.message?.toString()}
//           </HelperText>

//           <Text style={layout.sectionTitle}>Sharing Type</Text>
//           <Controller
//             control={control}
//             name="beds"
//             render={({ field: { value, onChange } }) => (
//               <RadioButton.Group onValueChange={onChange} value={value}>
//                 {sharingTypes.map((s) => (
//                   <RadioButton.Item label={`${s}-Sharing`} value={s} key={s} />
//                 ))}
//               </RadioButton.Group>
//             )}
//           />
//           <HelperText type="error" visible={!!errors.beds}>
//             {errors.beds?.message?.toString()}
//           </HelperText>

//           <Text style={layout.sectionTitle}>Facilities</Text>
//           <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
//             {facilitiesList.map((item) => (
//               <Chip
//                 key={item}
//                 selected={facilities.includes(item)}
//                 onPress={() => toggleItem(item, setFacilities, facilities)}
//                 style={{ margin: 4 }}
//               >
//                 {item}
//               </Chip>
//             ))}
//           </View>

//           <Text style={layout.sectionTitle}>Room Type</Text>
//           <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
//             {roomTypesList.map((item) => (
//               <Chip
//                 key={item}
//                 selected={roomType.includes(item)}
//                 onPress={() => toggleItem(item, setRoomType, roomType)}
//                 style={{ margin: 4 }}
//               >
//                 {item}
//               </Chip>
//             ))}
//           </View>

//           <Text style={layout.sectionTitle}>Electricity Bill Included</Text>
//           <Controller
//             control={control}
//             name="electricityBillInclude"
//             render={({ field: { value, onChange } }) => (
//               <RadioButton.Group onValueChange={onChange} value={value}>
//                 <RadioButton.Item label="Yes" value="yes" />
//                 <RadioButton.Item label="No" value="no" />
//               </RadioButton.Group>
//             )}
//           />
//           <HelperText type="error" visible={!!errors.electricityBillInclude}>
//             {errors.electricityBillInclude?.message?.toString()}
//           </HelperText>

//           <Button
//             mode="outlined"
//             onPress={pickImages}
//             style={layout.uploadButton}
//           >
//             Upload Room Images
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

//           <Button
//             mode="contained"
//             onPress={handleSubmit(onSubmit)}
//             style={styles.saveButton}
//           >
//             Save Room
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
//   saveButton: {
//     marginBottom: 40,
//     marginTop: 20,
//     backgroundColor: "#256D85",
//   },
// });
