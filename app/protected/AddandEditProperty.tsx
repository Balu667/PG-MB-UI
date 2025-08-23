// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   Alert,
//   BackHandler,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   View,
//   useWindowDimensions,
// } from "react-native";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import {
//   Button,
//   Text as PaperText,
//   TextInput,
//   Chip,
//   Divider,
//   Portal,
//   Dialog,
// } from "react-native-paper";
// import * as ImagePicker from "expo-image-picker";
// import Toast from "react-native-toast-message";
// import { Controller, useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import * as Haptics from "expo-haptics";

// import { useTheme } from "@/src/theme/ThemeContext";
// import { hexToRgba } from "@/src/theme";
// import { indiaStates, citiesByState } from "@/src/constants/geoIndia";

// /* ──────────────────────────────────────────────────────────────
//    Types & Validation
//    ────────────────────────────────────────────────────────────── */
// type FormValues = {
//   name: string;
//   type: "Men’s" | "Women’s" | "Co-living";
//   meal: "Veg" | "Non-veg" | "Both";
//   doorNo: string;
//   street: string;
//   area: string;
//   landmark?: string;
//   state: string;
//   city: string;
//   pincode: string; // exactly 5 per spec
//   noticeDays: string; // numeric
//   facilities: string[];
//   photos: string[];
// };

// const schema: yup.ObjectSchema<FormValues> = yup
//   .object({
//     name: yup.string().trim().required("PG name is required"),
//     type: yup
//       .mixed<"Men’s" | "Women’s" | "Co-living">()
//       .oneOf(["Men’s", "Women’s", "Co-living"])
//       .required("PG type is required"),
//     meal: yup
//       .mixed<"Veg" | "Non-veg" | "Both">()
//       .oneOf(["Veg", "Non-veg", "Both"])
//       .required("Meal type is required"),
//     doorNo: yup.string().trim().min(7, "Min 7 characters").required("D.No/Building No is required"),
//     street: yup.string().trim().required("Street name is required"),
//     area: yup.string().trim().required("Area is required"),
//     landmark: yup.string().trim().optional(),
//     state: yup.string().trim().required("State is required"),
//     city: yup.string().trim().required("City is required"),
//     pincode: yup
//       .string()
//       .matches(/^\d{5}$/, "Pincode must be 5 digits")
//       .required("Pincode is required"),
//     noticeDays: yup
//       .string()
//       .matches(/^\d+$/, "Enter a valid number")
//       .required("Notice period is required"),
//     facilities: yup.array(yup.string()).default([]),
//     photos: yup.array(yup.string()).default([]),
//   })
//   .required();

// /* ──────────────────────────────────────────────────────────────
//    Small helpers (grid / pills / chips)
//    ────────────────────────────────────────────────────────────── */
// const FACILITY_OPTIONS = ["Washing machine", "Wifi", "Hot water", "Table", "TV", "AC", "Fridge"];

// function useCols() {
//   const { width } = useWindowDimensions();
//   return width >= 740 ? 2 : 1;
// }

// const FieldRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const cols = useCols();
//   const { spacing } = useTheme();
//   return (
//     <View
//       style={{
//         flexDirection: cols === 2 ? "row" : "column",
//         flexWrap: "wrap",
//         columnGap: spacing.md - 8,
//         rowGap: spacing.md - 8,
//       }}
//     >
//       {React.Children.map(children, (child) => (
//         <View style={{ width: cols === 2 ? "48%" : "100%" }}>{child}</View>
//       ))}
//     </View>
//   );
// };

// const Segmented: React.FC<{
//   value: string;
//   options: string[];
//   onChange: (v: string) => void;
// }> = ({ value, options, onChange }) => {
//   const { colors, radius, spacing, typography } = useTheme();
//   return (
//     <View
//       style={{
//         flexDirection: "row",
//         flexWrap: "wrap",
//         backgroundColor: colors.cardSurface,
//         borderRadius: radius.xl,
//         borderWidth: 1,
//         borderColor: colors.borderColor,
//         padding: 4,
//       }}
//     >
//       {options.map((opt) => {
//         const selected = value === opt;
//         return (
//           <Pressable
//             key={opt}
//             accessibilityRole="radio"
//             accessibilityState={{ checked: selected }}
//             onPress={() => {
//               Haptics.selectionAsync();
//               onChange(opt);
//             }}
//             style={{
//               paddingVertical: 8,
//               paddingHorizontal: 14,
//               borderRadius: radius.xl,
//               margin: 2,
//               backgroundColor: selected ? hexToRgba(colors.accent, 0.14) : "transparent",
//               borderWidth: selected ? 1 : 0,
//               borderColor: selected ? colors.accent : "transparent",
//             }}
//           >
//             <PaperText
//               style={{
//                 color: selected ? colors.accent : colors.textPrimary,
//                 fontWeight: selected ? "700" : "500",
//                 fontSize: typography.fontSizeSm,
//               }}
//             >
//               {opt}
//             </PaperText>
//           </Pressable>
//         );
//       })}
//     </View>
//   );
// };

// const ChipCheckbox: React.FC<{
//   label: string;
//   selected: boolean;
//   onToggle: () => void;
// }> = ({ label, selected, onToggle }) => {
//   const { colors, radius, typography } = useTheme();
//   return (
//     <Pressable
//       onPress={() => {
//         Haptics.selectionAsync();
//         onToggle();
//       }}
//       style={{
//         marginRight: 8,
//         marginBottom: 8,
//         borderRadius: radius.xl,
//         paddingVertical: 8,
//         paddingHorizontal: 12,
//         backgroundColor: selected ? hexToRgba(colors.accent, 0.14) : colors.cardSurface,
//         borderColor: selected ? colors.accent : colors.borderColor,
//         borderWidth: 1,
//       }}
//     >
//       <PaperText
//         style={{
//           color: selected ? colors.accent : colors.textPrimary,
//           fontSize: typography.fontSizeSm,
//           fontWeight: "600",
//         }}
//       >
//         {label}
//       </PaperText>
//     </Pressable>
//   );
// };

// /* ──────────────────────────────────────────────────────────────
//    Bottom Sheet Select (state/city)
//    ────────────────────────────────────────────────────────────── */
// const SheetSelect: React.FC<{
//   value?: string;
//   options: string[];
//   placeholder: string;
//   onChange: (v: string) => void;
//   disabled?: boolean;
// }> = ({ value, options, placeholder, onChange, disabled }) => {
//   const { colors, radius, spacing, typography } = useTheme();
//   const [open, setOpen] = useState(false);

//   return (
//     <>
//       <Pressable
//         onPress={() => {
//           if (disabled) return;
//           Haptics.selectionAsync();
//           setOpen(true);
//         }}
//         style={{
//           borderWidth: 1,
//           borderColor: colors.borderColor,
//           borderRadius: radius.lg,
//           backgroundColor: colors.cardSurface,
//           paddingVertical: 12,
//           paddingHorizontal: 12,
//           opacity: disabled ? 0.6 : 1,
//         }}
//         accessibilityRole="button"
//       >
//         <PaperText
//           style={{
//             color: value ? colors.textPrimary : colors.textMuted,
//             fontSize: typography.fontSizeMd - 1,
//           }}
//           numberOfLines={1}
//         >
//           {value || placeholder}
//         </PaperText>
//       </Pressable>

//       <Portal>
//         <Dialog
//           visible={open}
//           onDismiss={() => setOpen(false)}
//           style={{
//             backgroundColor: colors.cardBackground,
//             borderTopLeftRadius: 18,
//             borderTopRightRadius: 18,
//             marginTop: "auto",
//           }}
//         >
//           <Dialog.Title style={{ color: colors.textPrimary, marginBottom: -6 }}>
//             {placeholder}
//           </Dialog.Title>
//           <Dialog.ScrollArea>
//             <ScrollView
//               style={{ maxHeight: 360 }}
//               contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
//             >
//               {options.map((opt) => (
//                 <Pressable
//                   key={opt}
//                   onPress={() => {
//                     Haptics.selectionAsync();
//                     onChange(opt);
//                     setOpen(false);
//                   }}
//                   style={{
//                     paddingVertical: 12,
//                     borderBottomWidth: 1,
//                     borderColor: hexToRgba(colors.textSecondary, 0.12),
//                   }}
//                 >
//                   <PaperText style={{ color: colors.textPrimary }}>{opt}</PaperText>
//                 </Pressable>
//               ))}
//               {options.length === 0 && (
//                 <PaperText style={{ color: colors.textMuted, paddingVertical: 8 }}>
//                   No options
//                 </PaperText>
//               )}
//             </ScrollView>
//           </Dialog.ScrollArea>
//           <Dialog.Actions>
//             <Button onPress={() => setOpen(false)} textColor={colors.accent}>
//               Close
//             </Button>
//           </Dialog.Actions>
//         </Dialog>
//       </Portal>
//     </>
//   );
// };

// /* ──────────────────────────────────────────────────────────────
//    Screen
//    ────────────────────────────────────────────────────────────── */
// export default function AddandEditProperty() {
//   const router = useRouter();
//   const { id } = useLocalSearchParams<{ id?: string }>();
//   const insets = useSafeAreaInsets();
//   const { colors, spacing, radius, typography } = useTheme();
//   const cols = useCols();

//   const {
//     control,
//     handleSubmit,
//     setValue,
//     watch,
//     formState: { errors, isDirty },
//   } = useForm<FormValues>({
//     defaultValues: {
//       name: "",
//       type: "Men’s",
//       meal: "Veg",
//       doorNo: "",
//       street: "",
//       area: "",
//       landmark: "",
//       state: "",
//       city: "",
//       pincode: "",
//       noticeDays: "",
//       facilities: [],
//       photos: [],
//     },
//     resolver: yupResolver(schema),
//     mode: "onChange",
//   });

//   const stateVal = watch("state");
//   const selectedPhotos = watch("photos");
//   const formTouched = useRef(false);
//   const markTouched = () => (formTouched.current = true);

//   /* Cities list based on state */
//   const cityOptions = useMemo(() => (stateVal ? citiesByState[stateVal] ?? [] : []), [stateVal]);

//   /* Android hardware back with confirm if dirty or photos present */
//   useEffect(() => {
//     const onBack = () => {
//       if (isDirty || formTouched.current || (selectedPhotos?.length ?? 0) > 0) {
//         Alert.alert("Unsaved changes", "Discard your changes and go back?", [
//           { text: "Cancel", style: "cancel" },
//           { text: "Discard", style: "destructive", onPress: () => router.back() },
//         ]);
//         return true;
//       }
//       router.back();
//       return true;
//     };
//     const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
//     return () => sub.remove();
//   }, [isDirty, selectedPhotos?.length, router]);

//   /* Photo picking */
//   const pickPhotos = async () => {
//     const res = await ImagePicker.launchImageLibraryAsync({
//       allowsMultipleSelection: true,
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 0.9,
//       selectionLimit: 0,
//     });
//     if (!res.canceled) {
//       const uris = res.assets.map((a) => a.uri);
//       setValue("photos", [...(selectedPhotos ?? []), ...uris], { shouldDirty: true });
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       markTouched();
//     }
//   };

//   const removePhoto = (uri: string) => {
//     setValue(
//       "photos",
//       (selectedPhotos ?? []).filter((u) => u !== uri),
//       { shouldDirty: true }
//     );
//     Haptics.selectionAsync();
//   };

//   /* Submit */
//   const onSubmit = (data: FormValues) => {
//     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     Toast.show({ type: "success", text1: "Property saved", position: "bottom" });
//     router.back();
//   };

//   /* Bottom gutter to avoid Android nav-key overlap (kept) */
//   const bottomGutter = insets.bottom + (Platform.OS === "android" ? 72 : 36);

//   /* Themed styles */
//   const s = useMemo(
//     () => ({
//       safe: { flex: 1, backgroundColor: colors.background },
//       header: {
//         paddingHorizontal: spacing.md,
//         paddingTop: spacing.md,
//         paddingBottom: spacing.sm,
//         backgroundColor: colors.background,
//         borderBottomWidth: 1,
//         borderColor: hexToRgba(colors.textSecondary, 0.12),
//       },
//       title: {
//         color: colors.textPrimary,
//         fontSize: typography.fontSizeLg,
//         fontWeight: "700" as const,
//       },
//       body: {
//         flex: 1,
//         paddingHorizontal: spacing.md,
//         paddingTop: spacing.md,
//       },
//       sectionTitle: {
//         color: colors.textSecondary,
//         fontWeight: "700" as const,
//         marginBottom: 8,
//         letterSpacing: 0.2,
//       },

//       label: { color: colors.textPrimary, fontWeight: "600" as const, marginBottom: 6 },
//       error: { color: colors.error, fontSize: 12, marginTop: 4 },

//       input: {
//         backgroundColor: colors.cardSurface,
//       } as const,

//       photosGrid: {
//         flexDirection: "row" as const,
//         flexWrap: "wrap" as const,
//         gap: 8,
//         marginTop: spacing.sm,
//       },

//       thumbWrap: {
//         width: cols === 2 ? 90 : 100,
//         height: cols === 2 ? 90 : 100,
//         borderRadius: radius.md,
//         overflow: "hidden" as const,
//         borderWidth: 1,
//         borderColor: hexToRgba(colors.textSecondary, 0.18),
//       },

//       removeBadge: {
//         position: "absolute" as const,
//         right: 4,
//         top: 4,
//         backgroundColor: hexToRgba(colors.error, 0.9),
//         borderRadius: radius.full,
//         paddingHorizontal: 6,
//         paddingVertical: 2,
//       },

//       footerRow: {
//         flexDirection: "row" as const,
//         gap: spacing.md,
//         marginTop: spacing.lg,
//       },
//       secondaryBtn: {
//         flex: 1,
//         borderRadius: radius.lg,
//         backgroundColor: colors.surface,
//         borderWidth: 1,
//         borderColor: colors.borderColor,
//       },
//       primaryBtn: { flex: 1, borderRadius: radius.lg },
//     }),
//     [colors, spacing, radius, typography, cols]
//   );

//   /* Compact input content style */
//   const inputContent = { minHeight: 44, paddingVertical: 8 };

//   /* UI */
//   const headerTitle = id ? "Edit Property" : "Add Property";

//   const Title = ({ children }: { children: React.ReactNode }) => (
//     <PaperText style={s.sectionTitle}>{children}</PaperText>
//   );

//   const LabeledInput = ({ label, children }: { label: string; children: React.ReactNode }) => (
//     <View style={{ marginBottom: 10 }}>
//       <PaperText style={s.label}>{label}</PaperText>
//       {children}
//     </View>
//   );

//   return (
//     <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.safe}>
//       {/* Header */}
//       <View style={s.header}>
//         <PaperText style={s.title}>{headerTitle}</PaperText>
//       </View>

//       <ScrollView
//         style={s.body}
//         keyboardShouldPersistTaps="handled"
//         contentContainerStyle={{ paddingBottom: bottomGutter }}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ── Basic details ───────────────────────────────────── */}
//         <Title>Basic details</Title>
//         <FieldRow>
//           {/* PG name */}
//           <Controller
//             control={control}
//             name="name"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="PG name *">
//                 <TextInput
//                   value={value}
//                   onFocus={() => Haptics.selectionAsync()}
//                   onChangeText={(t) => (markTouched(), onChange(t))}
//                   placeholder="Enter PG name"
//                   mode="outlined"
//                   outlineColor={hexToRgba(colors.textSecondary, 0.22)}
//                   activeOutlineColor={colors.accent}
//                   style={s.input}
//                   textColor={colors.textPrimary}
//                   placeholderTextColor={colors.textMuted}
//                   returnKeyType="next"
//                   contentStyle={inputContent}
//                 />
//                 {errors.name && <PaperText style={s.error}>{errors.name.message}</PaperText>}
//               </LabeledInput>
//             )}
//           />

//           {/* D.No / Building No */}
//           <Controller
//             control={control}
//             name="doorNo"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="D.No/Building No *">
//                 <TextInput
//                   value={value}
//                   onFocus={() => Haptics.selectionAsync()}
//                   onChangeText={(t) => (markTouched(), onChange(t))}
//                   placeholder="e.g., 12-5/7"
//                   mode="outlined"
//                   outlineColor={hexToRgba(colors.textSecondary, 0.22)}
//                   activeOutlineColor={colors.accent}
//                   style={s.input}
//                   textColor={colors.textPrimary}
//                   placeholderTextColor={colors.textMuted}
//                   returnKeyType="next"
//                   autoCapitalize="characters"
//                   contentStyle={inputContent}
//                 />
//                 {errors.doorNo && <PaperText style={s.error}>{errors.doorNo.message}</PaperText>}
//               </LabeledInput>
//             )}
//           />
//         </FieldRow>

//         <FieldRow>
//           {/* Street */}
//           <Controller
//             control={control}
//             name="street"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="Street name *">
//                 <TextInput
//                   value={value}
//                   onFocus={() => Haptics.selectionAsync()}
//                   onChangeText={(t) => (markTouched(), onChange(t))}
//                   placeholder="Street"
//                   mode="outlined"
//                   outlineColor={hexToRgba(colors.textSecondary, 0.22)}
//                   activeOutlineColor={colors.accent}
//                   style={s.input}
//                   textColor={colors.textPrimary}
//                   placeholderTextColor={colors.textMuted}
//                   returnKeyType="next"
//                   contentStyle={inputContent}
//                 />
//                 {errors.street && <PaperText style={s.error}>{errors.street.message}</PaperText>}
//               </LabeledInput>
//             )}
//           />

//           {/* Area */}
//           <Controller
//             control={control}
//             name="area"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="Area *">
//                 <TextInput
//                   value={value}
//                   onFocus={() => Haptics.selectionAsync()}
//                   onChangeText={(t) => (markTouched(), onChange(t))}
//                   placeholder="Locality/Area"
//                   mode="outlined"
//                   outlineColor={hexToRgba(colors.textSecondary, 0.22)}
//                   activeOutlineColor={colors.accent}
//                   style={s.input}
//                   textColor={colors.textPrimary}
//                   placeholderTextColor={colors.textMuted}
//                   returnKeyType="next"
//                   contentStyle={inputContent}
//                 />
//                 {errors.area && <PaperText style={s.error}>{errors.area.message}</PaperText>}
//               </LabeledInput>
//             )}
//           />
//         </FieldRow>

//         <FieldRow>
//           {/* Landmark (optional) */}
//           <Controller
//             control={control}
//             name="landmark"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="Landmark (optional)">
//                 <TextInput
//                   value={value}
//                   onFocus={() => Haptics.selectionAsync()}
//                   onChangeText={(t) => (markTouched(), onChange(t))}
//                   placeholder="Near ..."
//                   mode="outlined"
//                   outlineColor={hexToRgba(colors.textSecondary, 0.22)}
//                   activeOutlineColor={colors.accent}
//                   style={s.input}
//                   textColor={colors.textPrimary}
//                   placeholderTextColor={colors.textMuted}
//                   returnKeyType="next"
//                   contentStyle={inputContent}
//                 />
//               </LabeledInput>
//             )}
//           />

//           {/* Pincode */}
//           <Controller
//             control={control}
//             name="pincode"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="Pincode (5 digits) *">
//                 <TextInput
//                   value={value}
//                   onFocus={() => Haptics.selectionAsync()}
//                   onChangeText={(t) => (
//                     markTouched(), onChange(t.replace(/[^0-9]/g, "").slice(0, 5))
//                   )}
//                   placeholder="12345"
//                   keyboardType="number-pad"
//                   mode="outlined"
//                   outlineColor={hexToRgba(colors.textSecondary, 0.22)}
//                   activeOutlineColor={colors.accent}
//                   style={s.input}
//                   textColor={colors.textPrimary}
//                   placeholderTextColor={colors.textMuted}
//                   returnKeyType="next"
//                   contentStyle={inputContent}
//                 />
//                 {errors.pincode && <PaperText style={s.error}>{errors.pincode.message}</PaperText>}
//               </LabeledInput>
//             )}
//           />
//         </FieldRow>

//         <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

//         {/* ── Location ─────────────────────────────────────────── */}
//         <Title>Location</Title>
//         <FieldRow>
//           {/* State */}
//           <Controller
//             control={control}
//             name="state"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="State *">
//                 <SheetSelect
//                   value={value}
//                   placeholder="Select State"
//                   options={indiaStates}
//                   onChange={(v) => {
//                     markTouched();
//                     onChange(v);
//                     setValue("city", "", { shouldDirty: true });
//                   }}
//                 />
//                 {errors.state && <PaperText style={s.error}>{errors.state.message}</PaperText>}
//               </LabeledInput>
//             )}
//           />

//           {/* City */}
//           <Controller
//             control={control}
//             name="city"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="City *">
//                 <SheetSelect
//                   value={value}
//                   placeholder={stateVal ? "Select City" : "Select State first"}
//                   options={cityOptions}
//                   onChange={(v) => (markTouched(), onChange(v))}
//                   disabled={!stateVal}
//                 />
//                 {errors.city && <PaperText style={s.error}>{errors.city.message}</PaperText>}
//               </LabeledInput>
//             )}
//           />
//         </FieldRow>

//         <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

//         {/* ── Preferences ──────────────────────────────────────── */}
//         <Title>Preferences</Title>
//         <FieldRow>
//           {/* PG type */}
//           <Controller
//             control={control}
//             name="type"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="PG type *">
//                 <Segmented
//                   value={value}
//                   options={["Men’s", "Women’s", "Co-living"]}
//                   onChange={onChange}
//                 />
//                 {errors.type && <PaperText style={s.error}>{errors.type.message}</PaperText>}
//               </LabeledInput>
//             )}
//           />

//           {/* Meal type */}
//           <Controller
//             control={control}
//             name="meal"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="Meal type *">
//                 <Segmented value={value} options={["Veg", "Non-veg", "Both"]} onChange={onChange} />
//                 {errors.meal && <PaperText style={s.error}>{errors.meal.message}</PaperText>}
//               </LabeledInput>
//             )}
//           />
//         </FieldRow>

//         <FieldRow>
//           {/* Notice period */}
//           <Controller
//             control={control}
//             name="noticeDays"
//             render={({ field: { value, onChange } }) => (
//               <LabeledInput label="Notice period (days) *">
//                 <TextInput
//                   value={value}
//                   onFocus={() => Haptics.selectionAsync()}
//                   onChangeText={(t) => (markTouched(), onChange(t.replace(/[^0-9]/g, "")))}
//                   placeholder="30"
//                   keyboardType="number-pad"
//                   mode="outlined"
//                   outlineColor={hexToRgba(colors.textSecondary, 0.22)}
//                   activeOutlineColor={colors.accent}
//                   style={s.input}
//                   textColor={colors.textPrimary}
//                   placeholderTextColor={colors.textMuted}
//                   contentStyle={inputContent}
//                 />
//                 {errors.noticeDays && (
//                   <PaperText style={s.error}>{errors.noticeDays.message}</PaperText>
//                 )}
//               </LabeledInput>
//             )}
//           />
//         </FieldRow>

//         <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

//         {/* ── Facilities ───────────────────────────────────────── */}
//         <Title>Property Facilities</Title>
//         <Controller
//           control={control}
//           name="facilities"
//           render={({ field: { value, onChange } }) => (
//             <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
//               {FACILITY_OPTIONS.map((f) => {
//                 const selected = (value || []).includes(f);
//                 return (
//                   <ChipCheckbox
//                     key={f}
//                     label={f}
//                     selected={selected}
//                     onToggle={() => {
//                       markTouched();
//                       const next = selected ? value.filter((x) => x !== f) : [...(value || []), f];
//                       onChange(next);
//                     }}
//                   />
//                 );
//               })}
//             </View>
//           )}
//         />

//         <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

//         {/* ── Photos ──────────────────────────────────────────── */}
//         <Title>Property photos</Title>
//         <Button
//           mode="outlined"
//           onPress={pickPhotos}
//           style={{ marginTop: 4, borderRadius: radius.lg }}
//           textColor={colors.textPrimary}
//         >
//           Pick images
//         </Button>

//         <View style={s.photosGrid}>
//           {(selectedPhotos || []).map((uri) => (
//             <View key={uri} style={s.thumbWrap}>
//               <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
//               <Pressable
//                 onPress={() => removePhoto(uri)}
//                 style={s.removeBadge}
//                 accessibilityLabel="Remove photo"
//               >
//                 <PaperText style={{ color: colors.white, fontWeight: "700" }}>×</PaperText>
//               </Pressable>
//             </View>
//           ))}
//         </View>

//         {/* Footer buttons (side by side) */}
//         <View style={s.footerRow}>
//           <Button
//             mode="outlined"
//             style={s.secondaryBtn}
//             textColor={colors.textPrimary}
//             onPress={() => {
//               if (isDirty || formTouched.current || (selectedPhotos?.length ?? 0) > 0) {
//                 Alert.alert("Unsaved changes", "Discard your changes and go back?", [
//                   { text: "Cancel", style: "cancel" },
//                   { text: "Discard", style: "destructive", onPress: () => router.back() },
//                 ]);
//               } else {
//                 router.back();
//               }
//             }}
//           >
//             Cancel
//           </Button>

//           <Button mode="contained" style={s.primaryBtn} onPress={handleSubmit(onSubmit)}>
//             Submit
//           </Button>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Text as PaperText, TextInput, Divider, Portal, Dialog } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";
import { indiaStates, citiesByState } from "@/src/constants/geoIndia";

/* Types & Validation */
type FormValues = {
  name: string;
  type: "Men’s" | "Women’s" | "Co-living";
  meal: "Veg" | "Non-veg" | "Both";
  doorNo: string;
  street: string;
  area: string;
  landmark?: string;
  state: string;
  city: string;
  pincode: string; // 5 per spec
  noticeDays: string;
  facilities: string[];
  photos: string[];
};

const schema: yup.ObjectSchema<FormValues> = yup
  .object({
    name: yup.string().trim().required("PG name is required"),
    type: yup
      .mixed<"Men’s" | "Women’s" | "Co-living">()
      .oneOf(["Men’s", "Women’s", "Co-living"])
      .required("PG type is required"),
    meal: yup
      .mixed<"Veg" | "Non-veg" | "Both">()
      .oneOf(["Veg", "Non-veg", "Both"])
      .required("Meal type is required"),
    doorNo: yup.string().trim().min(7, "Min 7 characters").required("D.No/Building No is required"),
    street: yup.string().trim().required("Street name is required"),
    area: yup.string().trim().required("Area is required"),
    landmark: yup.string().trim().optional(),
    state: yup.string().trim().required("State is required"),
    city: yup.string().trim().required("City is required"),
    pincode: yup
      .string()
      .matches(/^\d{5}$/, "Pincode must be 5 digits")
      .required("Pincode is required"),
    noticeDays: yup
      .string()
      .matches(/^\d+$/, "Enter a valid number")
      .required("Notice period is required"),
    facilities: yup.array(yup.string()).default([]),
    photos: yup.array(yup.string()).default([]),
  })
  .required();

/* Helpers */
const FACILITY_OPTIONS = ["Washing machine", "Wifi", "Hot water", "Table", "TV", "AC", "Fridge"];

function useCols() {
  const { width } = useWindowDimensions();
  return width >= 740 ? 2 : 1;
}

const FieldRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cols = useCols();
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: cols === 2 ? "row" : "column",
        flexWrap: "wrap",
        columnGap: spacing.md - 8,
        rowGap: spacing.md - 8,
      }}
    >
      {React.Children.map(children, (child) => (
        <View style={{ width: cols === 2 ? "48%" : "100%" }}>{child}</View>
      ))}
    </View>
  );
};

const Segmented: React.FC<{ value: string; options: string[]; onChange: (v: string) => void }> = ({
  value,
  options,
  onChange,
}) => {
  const { colors, radius, typography } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: colors.cardSurface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.borderColor,
        padding: 4,
      }}
    >
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(opt);
            }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: radius.xl,
              margin: 2,
              backgroundColor: selected ? hexToRgba(colors.accent, 0.14) : "transparent",
              borderWidth: selected ? 1 : 0,
              borderColor: selected ? colors.accent : "transparent",
            }}
          >
            <PaperText
              style={{
                color: selected ? colors.accent : colors.textPrimary,
                fontWeight: selected ? "700" : "500",
                fontSize: typography.fontSizeSm,
              }}
            >
              {opt}
            </PaperText>
          </Pressable>
        );
      })}
    </View>
  );
};

const ChipCheckbox: React.FC<{ label: string; selected: boolean; onToggle: () => void }> = ({
  label,
  selected,
  onToggle,
}) => {
  const { colors, radius, typography } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
      style={{
        marginRight: 8,
        marginBottom: 8,
        borderRadius: radius.xl,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: selected ? hexToRgba(colors.accent, 0.14) : colors.cardSurface,
        borderColor: selected ? colors.accent : colors.borderColor,
        borderWidth: 1,
      }}
    >
      <PaperText
        style={{
          color: selected ? colors.accent : colors.textPrimary,
          fontSize: typography.fontSizeSm,
          fontWeight: "600",
        }}
      >
        {label}
      </PaperText>
    </Pressable>
  );
};

/* Bottom-Sheet style select via Paper Dialog */
const SheetSelect: React.FC<{
  value?: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ value, options, placeholder, onChange, disabled }) => {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => {
          if (disabled) return;
          Haptics.selectionAsync();
          setOpen(true);
        }}
        style={{
          borderWidth: 1,
          borderColor: colors.borderColor,
          borderRadius: radius.lg,
          backgroundColor: colors.cardSurface,
          paddingVertical: 12,
          paddingHorizontal: 12,
          opacity: disabled ? 0.6 : 1,
        }}
        accessibilityRole="button"
      >
        <PaperText
          style={{ color: value ? colors.textPrimary : colors.textMuted }}
          numberOfLines={1}
        >
          {value || placeholder}
        </PaperText>
      </Pressable>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            marginTop: "auto",
          }}
        >
          <Dialog.Title style={{ color: colors.textPrimary, marginBottom: -6 }}>
            {placeholder}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}
            >
              {options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange(opt);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderColor: hexToRgba(colors.textSecondary, 0.12),
                  }}
                >
                  <PaperText style={{ color: colors.textPrimary }}>{opt}</PaperText>
                </Pressable>
              ))}
              {options.length === 0 && (
                <PaperText style={{ color: colors.textMuted, paddingVertical: 8 }}>
                  No options
                </PaperText>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)} textColor={colors.accent}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

/* Screen */
export default function AddandEditProperty() {
  const router = useRouter();
  const params = useLocalSearchParams<Partial<FormValues> & { id?: string; facilities?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();
  const cols = useCols();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      type: "Men’s",
      meal: "Veg",
      doorNo: "",
      street: "",
      area: "",
      landmark: "",
      state: "",
      city: "",
      pincode: "",
      noticeDays: "",
      facilities: [],
      photos: [],
    },
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  /* ✅ Prefill ONCE when editing; avoid infinite loops */
  const hasPrefilled = useRef(false);
  useEffect(() => {
    if (hasPrefilled.current) return;
    if (!params?.id) return;

    // parse facilities JSON if provided
    let parsedFacilities: string[] = [];
    if (typeof params.facilities === "string") {
      try {
        const j = JSON.parse(params.facilities);
        if (Array.isArray(j)) parsedFacilities = j.filter((x) => typeof x === "string");
      } catch {}
    }

    const nextValues: FormValues = {
      name: params.name ?? "",
      type: (params.type as FormValues["type"]) ?? "Men’s",
      meal: (params.meal as FormValues["meal"]) ?? "Veg",
      doorNo: params.doorNo ?? "",
      street: params.street ?? "",
      area: params.area ?? "",
      landmark: params.landmark ?? "",
      state: params.state ?? "",
      city: params.city ?? "",
      pincode: params.pincode ?? "",
      noticeDays: params.noticeDays ?? "",
      facilities: parsedFacilities,
      photos: [],
    };

    reset(nextValues, { keepDirty: false, keepTouched: false });
    hasPrefilled.current = true;
  }, [params?.id, reset]); // only depend on id + reset

  const stateVal = watch("state");
  const selectedPhotos = watch("photos");
  const formTouched = useRef(false);
  const markTouched = () => (formTouched.current = true);

  const cityOptions = useMemo(() => (stateVal ? citiesByState[stateVal] ?? [] : []), [stateVal]);

  // Back handling
  useEffect(() => {
    const onBack = () => {
      if (isDirty || formTouched.current || (selectedPhotos?.length ?? 0) > 0) {
        Alert.alert("Unsaved changes", "Discard your changes and go back?", [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => router.back() },
        ]);
        return true;
      }
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [isDirty, selectedPhotos?.length, router]);

  // Photos
  const pickPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      selectionLimit: 0,
    });
    if (!res.canceled) {
      const uris = res.assets.map((a) => a.uri);
      setValue("photos", [...(selectedPhotos ?? []), ...uris], { shouldDirty: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      markTouched();
    }
  };

  const removePhoto = (uri: string) => {
    setValue(
      "photos",
      (selectedPhotos ?? []).filter((u) => u !== uri),
      { shouldDirty: true }
    );
    Haptics.selectionAsync();
  };

  // Submit
  const onSubmit = (data: FormValues) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: "success", text1: "Property saved", position: "bottom" });
    router.back();
  };

  // Bottom gutter to avoid Android nav-key overlap
  const bottomGutter = insets.bottom + (Platform.OS === "android" ? 72 : 36);

  // Styles
  const s = useMemo(
    () => ({
      safe: { flex: 1, backgroundColor: colors.background },
      header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderColor: hexToRgba(colors.textSecondary, 0.12),
      },
      title: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLg,
        fontWeight: "700" as const,
      },
      body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
      sectionTitle: {
        color: colors.textSecondary,
        fontWeight: "700" as const,
        marginBottom: 8,
        letterSpacing: 0.2,
      },
      label: { color: colors.textPrimary, fontWeight: "600" as const, marginBottom: 6 },
      error: { color: colors.error, fontSize: 12, marginTop: 4 },
      input: { backgroundColor: colors.cardSurface } as const,
      photosGrid: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        gap: 8,
        marginTop: spacing.sm,
      },
      thumbWrap: {
        width: cols === 2 ? 90 : 100,
        height: cols === 2 ? 90 : 100,
        borderRadius: radius.md,
        overflow: "hidden" as const,
        borderWidth: 1,
        borderColor: hexToRgba(colors.textSecondary, 0.18),
      },
      removeBadge: {
        position: "absolute" as const,
        right: 4,
        top: 4,
        backgroundColor: hexToRgba(colors.error, 0.9),
        borderRadius: radius.full,
        paddingHorizontal: 6,
        paddingVertical: 2,
      },
      footerRow: { flexDirection: "row" as const, gap: spacing.md, marginTop: spacing.lg },
      secondaryBtn: {
        flex: 1,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderColor,
      },
      primaryBtn: { flex: 1, borderRadius: radius.lg },
    }),
    [colors, spacing, radius, typography, cols]
  );

  const inputContent = { minHeight: 44, paddingVertical: 8 };
  const headerTitle = params?.id ? "Edit Property" : "Add Property";

  const Title = ({ children }: { children: React.ReactNode }) => (
    <PaperText style={s.sectionTitle}>{children}</PaperText>
  );
  const LabeledInput = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 10 }}>
      <PaperText style={s.label}>{label}</PaperText>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <PaperText style={s.title}>{headerTitle}</PaperText>
      </View>

      <ScrollView
        style={s.body}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomGutter }}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic details */}
        <Title>Basic details</Title>
        <FieldRow>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <LabeledInput label="PG name *">
                <TextInput
                  value={value}
                  onFocus={() => Haptics.selectionAsync()}
                  onChangeText={(t) => (markTouched(), onChange(t))}
                  placeholder="Enter PG name"
                  mode="outlined"
                  outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                  activeOutlineColor={colors.accent}
                  style={s.input}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  contentStyle={inputContent}
                />
                {errors.name && <PaperText style={s.error}>{errors.name.message}</PaperText>}
              </LabeledInput>
            )}
          />
          <Controller
            control={control}
            name="doorNo"
            render={({ field: { value, onChange } }) => (
              <LabeledInput label="D.No/Building No *">
                <TextInput
                  value={value}
                  onFocus={() => Haptics.selectionAsync()}
                  onChangeText={(t) => (markTouched(), onChange(t))}
                  placeholder="e.g., 12-5/7"
                  mode="outlined"
                  outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                  activeOutlineColor={colors.accent}
                  style={s.input}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  autoCapitalize="characters"
                  contentStyle={inputContent}
                />
                {errors.doorNo && <PaperText style={s.error}>{errors.doorNo.message}</PaperText>}
              </LabeledInput>
            )}
          />
        </FieldRow>

        <FieldRow>
          <Controller
            control={control}
            name="street"
            render={({ field: { value, onChange } }) => (
              <LabeledInput label="Street name *">
                <TextInput
                  value={value}
                  onFocus={() => Haptics.selectionAsync()}
                  onChangeText={(t) => (markTouched(), onChange(t))}
                  placeholder="Street"
                  mode="outlined"
                  outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                  activeOutlineColor={colors.accent}
                  style={s.input}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  contentStyle={inputContent}
                />
                {errors.street && <PaperText style={s.error}>{errors.street.message}</PaperText>}
              </LabeledInput>
            )}
          />
          <Controller
            control={control}
            name="area"
            render={({ field: { value, onChange } }) => (
              <LabeledInput label="Area *">
                <TextInput
                  value={value}
                  onFocus={() => Haptics.selectionAsync()}
                  onChangeText={(t) => (markTouched(), onChange(t))}
                  placeholder="Locality/Area"
                  mode="outlined"
                  outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                  activeOutlineColor={colors.accent}
                  style={s.input}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  contentStyle={inputContent}
                />
                {errors.area && <PaperText style={s.error}>{errors.area.message}</PaperText>}
              </LabeledInput>
            )}
          />
        </FieldRow>

        <FieldRow>
          <Controller
            control={control}
            name="landmark"
            render={({ field: { value, onChange } }) => (
              <LabeledInput label="Landmark (optional)">
                <TextInput
                  value={value}
                  onFocus={() => Haptics.selectionAsync()}
                  onChangeText={(t) => (markTouched(), onChange(t))}
                  placeholder="Near ..."
                  mode="outlined"
                  outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                  activeOutlineColor={colors.accent}
                  style={s.input}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  contentStyle={inputContent}
                />
              </LabeledInput>
            )}
          />
          <Controller
            control={control}
            name="pincode"
            render={({ field: { value, onChange } }) => (
              <LabeledInput label="Pincode (5 digits) *">
                <TextInput
                  value={value}
                  onFocus={() => Haptics.selectionAsync()}
                  onChangeText={(t) => (
                    markTouched(), onChange(t.replace(/[^0-9]/g, "").slice(0, 5))
                  )}
                  placeholder="12345"
                  keyboardType="number-pad"
                  mode="outlined"
                  outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                  activeOutlineColor={colors.accent}
                  style={s.input}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  contentStyle={inputContent}
                />
                {errors.pincode && <PaperText style={s.error}>{errors.pincode.message}</PaperText>}
              </LabeledInput>
            )}
          />
        </FieldRow>

        <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

        {/* Location */}
        <PaperText style={s.sectionTitle}>Location</PaperText>
        <FieldRow>
          <Controller
            control={control}
            name="state"
            render={({ field: { value, onChange } }) => (
              <>
                <PaperText style={s.label}>State *</PaperText>
                <SheetSelect
                  value={value}
                  placeholder="Select State"
                  options={indiaStates}
                  onChange={(v) => {
                    markTouched();
                    onChange(v);
                    setValue("city", "", { shouldDirty: true });
                  }}
                />
                {errors.state && <PaperText style={s.error}>{errors.state.message}</PaperText>}
              </>
            )}
          />
          <Controller
            control={control}
            name="city"
            render={({ field: { value, onChange } }) => (
              <>
                <PaperText style={s.label}>City *</PaperText>
                <SheetSelect
                  value={value}
                  placeholder={stateVal ? "Select City" : "Select State first"}
                  options={cityOptions}
                  onChange={(v) => (markTouched(), onChange(v))}
                  disabled={!stateVal}
                />
                {errors.city && <PaperText style={s.error}>{errors.city.message}</PaperText>}
              </>
            )}
          />
        </FieldRow>

        <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

        {/* Preferences */}
        <PaperText style={s.sectionTitle}>Preferences</PaperText>
        <FieldRow>
          <Controller
            control={control}
            name="type"
            render={({ field: { value, onChange } }) => (
              <>
                <PaperText style={s.label}>PG type *</PaperText>
                <Segmented
                  value={value}
                  options={["Men’s", "Women’s", "Co-living"]}
                  onChange={onChange}
                />
                {errors.type && <PaperText style={s.error}>{errors.type.message}</PaperText>}
              </>
            )}
          />
          <Controller
            control={control}
            name="meal"
            render={({ field: { value, onChange } }) => (
              <>
                <PaperText style={s.label}>Meal type *</PaperText>
                <Segmented value={value} options={["Veg", "Non-veg", "Both"]} onChange={onChange} />
                {errors.meal && <PaperText style={s.error}>{errors.meal.message}</PaperText>}
              </>
            )}
          />
        </FieldRow>

        <FieldRow>
          <Controller
            control={control}
            name="noticeDays"
            render={({ field: { value, onChange } }) => (
              <>
                <PaperText style={s.label}>Notice period (days) *</PaperText>
                <TextInput
                  value={value}
                  onFocus={() => Haptics.selectionAsync()}
                  onChangeText={(t) => (markTouched(), onChange(t.replace(/[^0-9]/g, "")))}
                  placeholder="30"
                  keyboardType="number-pad"
                  mode="outlined"
                  outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                  activeOutlineColor={colors.accent}
                  style={s.input}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.textMuted}
                  contentStyle={inputContent}
                />
                {errors.noticeDays && (
                  <PaperText style={s.error}>{errors.noticeDays.message}</PaperText>
                )}
              </>
            )}
          />
        </FieldRow>

        <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

        {/* Facilities */}
        <PaperText style={s.sectionTitle}>Property Facilities</PaperText>
        <Controller
          control={control}
          name="facilities"
          render={({ field: { value, onChange } }) => (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
              {FACILITY_OPTIONS.map((f) => {
                const selected = (value || []).includes(f);
                return (
                  <ChipCheckbox
                    key={f}
                    label={f}
                    selected={selected}
                    onToggle={() => {
                      markTouched();
                      const next = selected ? value.filter((x) => x !== f) : [...(value || []), f];
                      onChange(next);
                    }}
                  />
                );
              })}
            </View>
          )}
        />

        <Divider style={{ marginVertical: spacing.sm, backgroundColor: colors.borderColor }} />

        {/* Photos */}
        <PaperText style={s.sectionTitle}>Property photos</PaperText>
        <Button
          mode="outlined"
          onPress={pickPhotos}
          style={{ marginTop: 4, borderRadius: radius.lg }}
          textColor={colors.textPrimary}
        >
          Pick images
        </Button>

        <View style={s.photosGrid}>
          {(selectedPhotos || []).map((uri) => (
            <View key={uri} style={s.thumbWrap}>
              <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
              <Pressable
                onPress={() => removePhoto(uri)}
                style={s.removeBadge}
                accessibilityLabel="Remove photo"
              >
                <PaperText style={{ color: colors.white, fontWeight: "700" }}>×</PaperText>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Footer buttons */}
        <View style={s.footerRow}>
          <Button
            mode="outlined"
            style={s.secondaryBtn}
            textColor={colors.textPrimary}
            onPress={() => {
              if (isDirty || formTouched.current || (selectedPhotos?.length ?? 0) > 0) {
                Alert.alert("Unsaved changes", "Discard your changes and go back?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Discard", style: "destructive", onPress: () => router.back() },
                ]);
              } else {
                router.back();
              }
            }}
          >
            Cancel
          </Button>
          <Button mode="contained" style={s.primaryBtn} onPress={handleSubmit(onSubmit)}>
            Submit
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
