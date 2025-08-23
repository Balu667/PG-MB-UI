// // // src/components/DynamicForm.tsx

// // import React, { useState } from "react";
// // import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
// // import { useForm, Controller } from "react-hook-form";
// // import { yupResolver } from "@hookform/resolvers/yup";
// // import {
// //   TextInput,
// //   Button,
// //   RadioButton,
// //   Checkbox,
// //   HelperText,
// //   Chip,
// //   Provider as PaperProvider,
// //   DefaultTheme,
// // } from "react-native-paper";
// // import { Picker } from "@react-native-picker/picker";
// // import * as ImagePicker from "expo-image-picker";
// // import * as yup from "yup";

// // // Types for field configuration
// // export interface FormFieldConfig {
// //   label: string;
// //   type:
// //     | "text"
// //     | "email"
// //     | "password"
// //     | "number"
// //     | "phone"
// //     | "radio"
// //     | "checkbox"
// //     | "dropdown"
// //     | "multiselect"
// //     | "image"
// //     | "textarea";
// //   fieldName: string;
// //   placeholder?: string;
// //   options?: Array<{ label: string; value: any }>; // For radio, dropdown, multiselect
// //   required?: boolean;
// //   disabled?: boolean;
// //   multiline?: boolean; // For textarea
// //   numberOfLines?: number; // For textarea
// //   keyboardType?:
// //     | "default"
// //     | "number-pad"
// //     | "decimal-pad"
// //     | "numeric"
// //     | "email-address"
// //     | "phone-pad";
// // }

// // export interface DynamicFormProps {
// //   fields: FormFieldConfig[];
// //   validationSchema: yup.AnyObjectSchema;
// //   onSubmit: (data: any) => void;
// //   submitButtonText?: string;
// //   initialValues?: Record<string, any>;
// //   loading?: boolean;
// // }

// // const DynamicForm: React.FC<DynamicFormProps> = ({
// //   fields,
// //   validationSchema,
// //   onSubmit,
// //   submitButtonText = "Submit",
// //   initialValues = {},
// //   loading = false,
// // }) => {
// //   // State for managing dynamic data
// //   const [selectedChips, setSelectedChips] = useState<Record<string, any[]>>({});
// //   const [images, setImages] = useState<Record<string, string[]>>({});

// //   // Initialize form with react-hook-form
// //   const {
// //     control,
// //     handleSubmit,
// //     formState: { errors },
// //     setValue,
// //     watch,
// //   } = useForm({
// //     resolver: yupResolver(validationSchema),
// //     defaultValues: initialValues,
// //     mode: "onChange",
// //   });

// //   // Handle image picker
// //   const handleImagePick = async (fieldName: string) => {
// //     const result = await ImagePicker.launchImageLibraryAsync({
// //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
// //       allowsMultipleSelection: true,
// //       quality: 0.8,
// //     });

// //     if (!result.canceled) {
// //       const uris = result.assets.map((asset) => asset.uri);
// //       setImages((prev) => ({
// //         ...prev,
// //         [fieldName]: [...(prev[fieldName] || []), ...uris],
// //       }));
// //       setValue(fieldName, [...(images[fieldName] || []), ...uris]);
// //     }
// //   };

// //   // Handle multiselect chips
// //   const toggleChip = (fieldName: string, value: any) => {
// //     const currentValues = selectedChips[fieldName] || [];
// //     const newValues = currentValues.includes(value)
// //       ? currentValues.filter((v) => v !== value)
// //       : [...currentValues, value];

// //     setSelectedChips((prev) => ({
// //       ...prev,
// //       [fieldName]: newValues,
// //     }));
// //     setValue(fieldName, newValues);
// //   };

// //   // Render individual form field based on type
// //   const renderField = (field: FormFieldConfig) => {
// //     const {
// //       label,
// //       type,
// //       fieldName,
// //       placeholder,
// //       options,
// //       disabled,
// //       keyboardType,
// //       multiline,
// //       numberOfLines,
// //     } = field;

// //     switch (type) {
// //       case "text":
// //       case "email":
// //       case "password":
// //       case "phone":
// //       case "textarea":
// //         return (
// //           <Controller
// //             key={fieldName}
// //             control={control}
// //             name={fieldName}
// //             render={({ field: { onChange, value } }) => (
// //               <View style={styles.fieldContainer}>
// //                 <TextInput
// //                   label={label}
// //                   value={value || ""}
// //                   onChangeText={onChange}
// //                   placeholder={placeholder}
// //                   mode="outlined"
// //                   disabled={disabled}
// //                   secureTextEntry={type === "password"}
// //                   keyboardType={
// //                     keyboardType ||
// //                     (type === "email"
// //                       ? "email-address"
// //                       : type === "phone"
// //                       ? "phone-pad"
// //                       : "default")
// //                   }
// //                   multiline={multiline || type === "textarea"}
// //                   numberOfLines={numberOfLines || (type === "textarea" ? 4 : 1)}
// //                   style={styles.input}
// //                 />
// //                 <HelperText type="error" visible={!!errors[fieldName]}>
// //                   {errors[fieldName]?.message?.toString()}
// //                 </HelperText>
// //               </View>
// //             )}
// //           />
// //         );

// //       case "number":
// //         return (
// //           <Controller
// //             key={fieldName}
// //             control={control}
// //             name={fieldName}
// //             render={({ field: { onChange, value } }) => (
// //               <View style={styles.fieldContainer}>
// //                 <TextInput
// //                   label={label}
// //                   value={value?.toString() || ""}
// //                   onChangeText={(text) =>
// //                     onChange(text ? parseFloat(text) : "")
// //                   }
// //                   placeholder={placeholder}
// //                   mode="outlined"
// //                   disabled={disabled}
// //                   keyboardType="numeric"
// //                   style={styles.input}
// //                 />
// //                 <HelperText type="error" visible={!!errors[fieldName]}>
// //                   {errors[fieldName]?.message?.toString()}
// //                 </HelperText>
// //               </View>
// //             )}
// //           />
// //         );

// //       case "radio":
// //         return (
// //           <Controller
// //             key={fieldName}
// //             control={control}
// //             name={fieldName}
// //             render={({ field: { onChange, value } }) => (
// //               <View style={styles.fieldContainer}>
// //                 <Text style={styles.fieldLabel}>{label}</Text>
// //                 <RadioButton.Group onValueChange={onChange} value={value}>
// //                   {options?.map((option) => (
// //                     <RadioButton.Item
// //                       key={option.value}
// //                       label={option.label}
// //                       value={option.value}
// //                       disabled={disabled}
// //                     />
// //                   ))}
// //                 </RadioButton.Group>
// //                 <HelperText type="error" visible={!!errors[fieldName]}>
// //                   {errors[fieldName]?.message?.toString()}
// //                 </HelperText>
// //               </View>
// //             )}
// //           />
// //         );

// //       case "checkbox":
// //         return (
// //           <Controller
// //             key={fieldName}
// //             control={control}
// //             name={fieldName}
// //             render={({ field: { onChange, value } }) => (
// //               <View style={styles.fieldContainer}>
// //                 <View style={styles.checkboxContainer}>
// //                   <Checkbox
// //                     status={value ? "checked" : "unchecked"}
// //                     onPress={() => onChange(!value)}
// //                     disabled={disabled}
// //                   />
// //                   <Text style={styles.checkboxLabel}>{label}</Text>
// //                 </View>
// //                 <HelperText type="error" visible={!!errors[fieldName]}>
// //                   {errors[fieldName]?.message?.toString()}
// //                 </HelperText>
// //               </View>
// //             )}
// //           />
// //         );

// //       case "dropdown":
// //         return (
// //           <Controller
// //             key={fieldName}
// //             control={control}
// //             name={fieldName}
// //             render={({ field: { onChange, value } }) => (
// //               <View style={styles.fieldContainer}>
// //                 <Text style={styles.fieldLabel}>{label}</Text>
// //                 <View style={styles.pickerContainer}>
// //                   <Picker
// //                     selectedValue={value}
// //                     onValueChange={onChange}
// //                     enabled={!disabled}
// //                     style={styles.picker}
// //                   >
// //                     <Picker.Item label={`Select ${label}`} value="" />
// //                     {options?.map((option) => (
// //                       <Picker.Item
// //                         key={option.value}
// //                         label={option.label}
// //                         value={option.value}
// //                       />
// //                     ))}
// //                   </Picker>
// //                 </View>
// //                 <HelperText type="error" visible={!!errors[fieldName]}>
// //                   {errors[fieldName]?.message?.toString()}
// //                 </HelperText>
// //               </View>
// //             )}
// //           />
// //         );

// //       case "multiselect":
// //         return (
// //           <View key={fieldName} style={styles.fieldContainer}>
// //             <Text style={styles.fieldLabel}>{label}</Text>
// //             <View style={styles.chipsContainer}>
// //               {options?.map((option) => (
// //                 <Chip
// //                   key={option.value}
// //                   selected={(selectedChips[fieldName] || []).includes(
// //                     option.value
// //                   )}
// //                   onPress={() => toggleChip(fieldName, option.value)}
// //                   disabled={disabled}
// //                   style={styles.chip}
// //                 >
// //                   {option.label}
// //                 </Chip>
// //               ))}
// //             </View>
// //             <HelperText type="error" visible={!!errors[fieldName]}>
// //               {errors[fieldName]?.message?.toString()}
// //             </HelperText>
// //           </View>
// //         );

// //       case "image":
// //         return (
// //           <View key={fieldName} style={styles.fieldContainer}>
// //             <Button
// //               mode="outlined"
// //               onPress={() => handleImagePick(fieldName)}
// //               disabled={disabled}
// //               style={styles.imageButton}
// //             >
// //               {label}
// //             </Button>
// //             {images[fieldName] && images[fieldName].length > 0 && (
// //               <ScrollView horizontal style={styles.imagePreview}>
// //                 {images[fieldName].map((uri, index) => (
// //                   <Image
// //                     key={index}
// //                     source={{ uri }}
// //                     style={styles.previewImage}
// //                   />
// //                 ))}
// //               </ScrollView>
// //             )}
// //             <HelperText type="error" visible={!!errors[fieldName]}>
// //               {errors[fieldName]?.message?.toString()}
// //             </HelperText>
// //           </View>
// //         );

// //       default:
// //         return null;
// //     }
// //   };

// //   const theme = {
// //     ...DefaultTheme,
// //     colors: {
// //       ...DefaultTheme.colors,
// //       background: "#fff",
// //       surface: "#fff",
// //     },
// //   };

// //   return (
// //     <PaperProvider theme={theme}>
// //       <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
// //         {fields.map(renderField)}

// //         <Button
// //           mode="contained"
// //           onPress={handleSubmit(onSubmit)}
// //           loading={loading}
// //           disabled={loading}
// //           style={styles.submitButton}
// //         >
// //           {submitButtonText}
// //         </Button>
// //       </ScrollView>
// //     </PaperProvider>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     padding: 16,
// //   },
// //   fieldContainer: {
// //     marginBottom: 16,
// //   },
// //   input: {
// //     backgroundColor: "white",
// //   },
// //   fieldLabel: {
// //     fontSize: 16,
// //     fontWeight: "600",
// //     marginBottom: 8,
// //     color: "#333",
// //   },
// //   checkboxContainer: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //   },
// //   checkboxLabel: {
// //     fontSize: 16,
// //     marginLeft: 8,
// //     color: "#333",
// //   },
// //   pickerContainer: {
// //     backgroundColor: "white",
// //     borderWidth: 1,
// //     borderColor: "#ddd",
// //     borderRadius: 4,
// //     marginBottom: 8,
// //   },
// //   picker: {
// //     height: 50,
// //   },
// //   chipsContainer: {
// //     flexDirection: "row",
// //     flexWrap: "wrap",
// //     gap: 8,
// //     marginBottom: 8,
// //   },
// //   chip: {
// //     margin: 2,
// //   },
// //   imageButton: {
// //     marginBottom: 12,
// //   },
// //   imagePreview: {
// //     flexDirection: "row",
// //     marginTop: 8,
// //   },
// //   previewImage: {
// //     width: 80,
// //     height: 80,
// //     marginRight: 8,
// //     borderRadius: 8,
// //   },
// //   submitButton: {
// //     marginTop: 20,
// //     marginBottom: 40,
// //     backgroundColor: "#256D85",
// //   },
// // });

// // export default DynamicForm;
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Image,
//   Platform,
//   Pressable,
//   useWindowDimensions,
//   FlatList,
// } from "react-native";
// import { useForm, Controller, UseFormReturn } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import {
//   TextInput,
//   Button,
//   RadioButton,
//   HelperText,
//   Chip,
//   Provider as PaperProvider,
//   DefaultTheme,
// } from "react-native-paper";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import * as ImagePicker from "expo-image-picker";
// import * as DocumentPicker from "expo-document-picker";
// import * as yup from "yup";
// import Modal from "react-native-modal";

// import { useTheme } from "@/src/theme/ThemeContext";
// import { hexToRgba } from "@/src/theme";

// /* ────────────────────────────────────────────────────────────
//    Types
//    ──────────────────────────────────────────────────────────── */
// export type FieldType =
//   | "text"
//   | "email"
//   | "password"
//   | "number"
//   | "phone"
//   | "radio"
//   | "checkbox" // (kept for future)
//   | "dropdown"
//   | "multiselect"
//   | "image"
//   | "file"
//   | "textarea"
//   | "date"
//   | "readonly";

// export interface Option {
//   label: string;
//   value: any;
// }

// export interface FormFieldConfig {
//   label: string;
//   type: FieldType;
//   fieldName: string;
//   placeholder?: string;
//   options?: Option[];
//   required?: boolean;
//   disabled?: boolean;
//   multiline?: boolean;
//   numberOfLines?: number;
//   keyboardType?:
//     | "default"
//     | "number-pad"
//     | "decimal-pad"
//     | "numeric"
//     | "email-address"
//     | "phone-pad";
//   /** Section header */
//   section?: string;
//   /** Affixes for inputs */
//   leftAffix?: string;
//   rightAffix?: string;
//   /** Called when this field changes */
//   onChange?: (value: any, api: UseFormReturn<any>) => void;
//   /** For readonly/computed fields */
//   compute?: (values: Record<string, any>) => any;
//   /** Enable/disable dynamically based on other values */
//   enabledWhen?: (values: Record<string, any>) => boolean;
//   /** For number fields: integer or decimal */
//   numberMode?: "integer" | "decimal";
// }

// export interface DynamicFormProps {
//   fields: FormFieldConfig[];
//   validationSchema: yup.AnyObjectSchema;
//   onSubmit: (data: any) => void;
//   submitButtonText?: string;
//   initialValues?: Record<string, any>;
//   loading?: boolean;
//   /** Force column count; default = responsive (1 on phones, 2 on tablets+) */
//   columns?: number;
//   /** Fire on any values change */
//   onValuesChange?: (values: any, setValue: UseFormReturn["setValue"]) => void;
//   /** Hide the built-in submit button */
//   showSubmitButton?: boolean;
// }

// /* ────────────────────────────────────────────────────────────
//    Utility
//    ──────────────────────────────────────────────────────────── */
// const formatDate = (d?: Date) =>
//   d
//     ? `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
//         2,
//         "0"
//       )}-${d.getFullYear()}`
//     : "";

// const parseDate = (str?: string) => {
//   if (!str) return undefined;
//   const [dd, mm, yyyy] = str.split("-").map((x) => parseInt(x, 10));
//   const dt = new Date(yyyy, (mm || 1) - 1, dd || 1);
//   return isNaN(dt.getTime()) ? undefined : dt;
// };

// /* ────────────────────────────────────────────────────────────
//    Cross-platform Dropdown (modal list, same on iOS/Android)
//    ──────────────────────────────────────────────────────────── */
// const DropdownField = ({
//   label,
//   value,
//   onChange,
//   options = [],
//   placeholder,
//   disabled,
// }: {
//   label: string;
//   value: any;
//   onChange: (v: any) => void;
//   options?: Option[];
//   placeholder?: string;
//   disabled?: boolean;
// }) => {
//   const { colors, radius, spacing } = useTheme();
//   const [open, setOpen] = useState(false);

//   const selectedLabel =
//     options.find((o) => (o?.value ?? o) === (value ?? null))?.label ??
//     (typeof value === "string" ? value : "");

//   return (
//     <>
//       <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
//       <Pressable
//         disabled={disabled}
//         onPress={() => setOpen(true)}
//         style={[
//           styles.inputLike,
//           {
//             backgroundColor: disabled ? hexToRgba(colors.textSecondary, 0.06) : colors.surface,
//             borderColor: hexToRgba(colors.textSecondary, 0.25),
//             borderRadius: radius.md,
//           },
//         ]}
//       >
//         <Text
//           style={{
//             color: selectedLabel ? colors.textPrimary : colors.textMuted,
//             fontSize: 15,
//           }}
//           numberOfLines={1}
//         >
//           {selectedLabel || placeholder || "Select"}
//         </Text>
//         <Text style={{ color: colors.textMuted }}>▾</Text>
//       </Pressable>

//       <Modal
//         isVisible={open}
//         onBackdropPress={() => setOpen(false)}
//         onBackButtonPress={() => setOpen(false)}
//         backdropOpacity={0.35}
//         useNativeDriver
//       >
//         <View
//           style={{
//             backgroundColor: colors.cardBackground,
//             borderRadius: radius.lg,
//             paddingVertical: spacing.sm,
//             paddingHorizontal: spacing.md,
//           }}
//         >
//           <Text style={{ color: colors.textPrimary, fontWeight: "700", marginBottom: spacing.sm }}>
//             {label}
//           </Text>

//           <FlatList
//             data={options}
//             keyExtractor={(_, i) => String(i)}
//             ItemSeparatorComponent={() => (
//               <View style={{ height: 1, backgroundColor: hexToRgba(colors.textSecondary, 0.08) }} />
//             )}
//             renderItem={({ item }) => (
//               <Pressable
//                 onPress={() => {
//                   onChange(item.value);
//                   setOpen(false);
//                 }}
//                 style={{ paddingVertical: 12 }}
//               >
//                 <Text
//                   style={{
//                     color: colors.textPrimary,
//                     fontSize: 15,
//                   }}
//                 >
//                   {item.label}
//                 </Text>
//               </Pressable>
//             )}
//           />
//           <Button style={{ marginTop: spacing.sm }} mode="text" onPress={() => setOpen(false)}>
//             Close
//           </Button>
//         </View>
//       </Modal>
//     </>
//   );
// };

// /* ────────────────────────────────────────────────────────────
//    DynamicForm
//    ──────────────────────────────────────────────────────────── */
// const DynamicForm: React.FC<DynamicFormProps> = ({
//   fields,
//   validationSchema,
//   onSubmit,
//   submitButtonText = "Submit",
//   initialValues = {},
//   loading = false,
//   columns,
//   onValuesChange,
//   showSubmitButton = true,
// }) => {
//   const { colors, spacing, radius } = useTheme();
//   const { width } = useWindowDimensions();

//   const colCount = useMemo(() => columns ?? (width >= 740 ? 2 : 1), [columns, width]);

//   const form = useForm({
//     resolver: yupResolver(validationSchema),
//     defaultValues: initialValues,
//     mode: "onChange",
//   });

//   const {
//     control,
//     handleSubmit,
//     formState: { errors, isValid },
//     setValue,
//     getValues,
//     watch,
//   } = form;

//   const values = watch();

//   useEffect(() => {
//     // computed readonly fields
//     fields.forEach((f) => {
//       if (f.type === "readonly" && f.compute) {
//         const v = f.compute(values);
//         if (getValues(f.fieldName) !== v) setValue(f.fieldName, v, { shouldValidate: true });
//       }
//     });
//     onValuesChange?.(values, setValue);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [JSON.stringify(values)]);

//   const paperTheme = useMemo(
//     () => ({
//       ...DefaultTheme,
//       colors: {
//         ...DefaultTheme.colors,
//         primary: colors.accent,
//         background: colors.background,
//         surface: colors.cardBackground,
//         text: colors.textPrimary,
//         placeholder: colors.textMuted,
//       },
//       roundness: radius.md,
//     }),
//     [colors, radius]
//   );

//   const grouped = useMemo(() => {
//     const groups = new Map<string, FormFieldConfig[]>();
//     fields.forEach((f) => {
//       const key = f.section || "Form";
//       if (!groups.has(key)) groups.set(key, []);
//       groups.get(key)!.push(f);
//     });
//     return Array.from(groups.entries());
//   }, [fields]);

//   const renderError = (name: string) => (
//     <HelperText type="error" visible={!!errors[name]}>
//       {errors[name]?.message?.toString()}
//     </HelperText>
//   );

//   const Field = (field: FormFieldConfig) => {
//     const {
//       label,
//       type,
//       fieldName,
//       placeholder,
//       options,
//       disabled,
//       keyboardType,
//       multiline,
//       numberOfLines,
//       leftAffix,
//       rightAffix,
//       onChange,
//       enabledWhen,
//       numberMode,
//     } = field;

//     const enabled = enabledWhen ? !!enabledWhen(values) : !disabled;

//     const containerStyle = [
//       styles.fieldContainer,
//       { width: colCount === 1 ? "100%" : "48%" },
//       !enabled && { opacity: 0.6 },
//     ];

//     if (type === "radio") {
//       return (
//         <Controller
//           key={fieldName}
//           control={control}
//           name={fieldName}
//           render={({ field: { onChange: _onChange, value } }) => (
//             <View style={containerStyle}>
//               <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
//               <View style={styles.radioRow}>
//                 {options?.map((o) => (
//                   <Pressable
//                     key={String(o.value)}
//                     disabled={!enabled}
//                     onPress={() => {
//                       _onChange(o.value);
//                       onChange?.(o.value, form);
//                     }}
//                     style={styles.radioItem}
//                   >
//                     <RadioButton
//                       value={o.value}
//                       status={value === o.value ? "checked" : "unchecked"}
//                       onPress={() => {
//                         _onChange(o.value);
//                         onChange?.(o.value, form);
//                       }}
//                       color={colors.accent}
//                       uncheckedColor={hexToRgba(colors.textSecondary, 0.5)}
//                     />
//                     <Text style={{ color: colors.textPrimary, marginRight: 12 }}>{o.label}</Text>
//                   </Pressable>
//                 ))}
//               </View>
//               {renderError(fieldName)}
//             </View>
//           )}
//         />
//       );
//     }

//     if (type === "dropdown") {
//       return (
//         <Controller
//           key={fieldName}
//           control={control}
//           name={fieldName}
//           render={({ field: { onChange: _onChange, value } }) => (
//             <View style={containerStyle}>
//               <DropdownField
//                 label={label}
//                 value={value}
//                 options={options}
//                 placeholder={placeholder}
//                 disabled={!enabled}
//                 onChange={(v) => {
//                   _onChange(v);
//                   onChange?.(v, form);
//                 }}
//               />
//               {renderError(fieldName)}
//             </View>
//           )}
//         />
//       );
//     }

//     if (type === "multiselect") {
//       return (
//         <Controller
//           key={fieldName}
//           control={control}
//           name={fieldName}
//           render={({ field: { value = [], onChange: _onChange } }) => (
//             <View style={containerStyle}>
//               <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
//               <View style={styles.chipsWrap}>
//                 {options?.map((o) => {
//                   const selected = value.includes(o.value);
//                   return (
//                     <Chip
//                       key={String(o.value)}
//                       selected={selected}
//                       onPress={() => {
//                         if (!enabled) return;
//                         const next = selected
//                           ? value.filter((v: any) => v !== o.value)
//                           : [...value, o.value];
//                         _onChange(next);
//                         onChange?.(next, form);
//                       }}
//                       style={{ marginRight: 8, marginBottom: 8, backgroundColor: colors.surface }}
//                       selectedColor={colors.white}
//                       textStyle={{ color: selected ? colors.white : colors.textPrimary }}
//                     >
//                       {o.label}
//                     </Chip>
//                   );
//                 })}
//               </View>
//               {renderError(fieldName)}
//             </View>
//           )}
//         />
//       );
//     }

//     if (type === "image" || type === "file") {
//       return (
//         <Controller
//           key={fieldName}
//           control={control}
//           name={fieldName}
//           render={({ field: { value = [], onChange: _onChange } }) => (
//             <View style={containerStyle}>
//               <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
//               <View style={{ flexDirection: "row", gap: 8 }}>
//                 <Button
//                   mode="outlined"
//                   onPress={async () => {
//                     if (!enabled) return;
//                     if (type === "image") {
//                       const res = await ImagePicker.launchImageLibraryAsync({
//                         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//                         allowsMultipleSelection: true,
//                         quality: 0.8,
//                       });
//                       if (!res.canceled)
//                         _onChange([...(value || []), ...res.assets.map((a) => a.uri)]);
//                     } else {
//                       const res = await DocumentPicker.getDocumentAsync({
//                         multiple: true,
//                         copyToCacheDirectory: true,
//                       });
//                       if (res.assets && res.assets.length) {
//                         _onChange([...(value || []), ...res.assets.map((a) => a.uri)]);
//                       }
//                     }
//                   }}
//                 >
//                   {type === "image" ? "Pick Images" : "Pick Files"}
//                 </Button>
//                 {!!value?.length && (
//                   <Button mode="text" onPress={() => _onChange([])} textColor={colors.error}>
//                     Clear
//                   </Button>
//                 )}
//               </View>

//               {type === "image" ? (
//                 <ScrollView
//                   horizontal
//                   showsHorizontalScrollIndicator={false}
//                   style={{ marginTop: 10 }}
//                 >
//                   {(value || []).map((uri: string, i: number) => (
//                     <Image
//                       key={`${uri}-${i}`}
//                       source={{ uri }}
//                       style={{
//                         width: 70,
//                         height: 70,
//                         marginRight: 8,
//                         borderRadius: radius.md,
//                         backgroundColor: colors.surface,
//                       }}
//                     />
//                   ))}
//                 </ScrollView>
//               ) : (
//                 <View style={{ marginTop: 10, gap: 6 }}>
//                   {(value || []).map((uri: string, i: number) => (
//                     <Text
//                       key={`${uri}-${i}`}
//                       style={{ color: colors.textSecondary, fontSize: 12 }}
//                       numberOfLines={1}
//                     >
//                       {uri.split("/").pop()}
//                     </Text>
//                   ))}
//                 </View>
//               )}
//               {renderError(fieldName)}
//             </View>
//           )}
//         />
//       );
//     }

//     if (type === "date") {
//       const [show, setShow] = useState(false);
//       const isIOS = Platform.OS === "ios";

//       return (
//         <Controller
//           key={fieldName}
//           control={control}
//           name={fieldName}
//           render={({ field: { onChange: _onChange, value } }) => {
//             const currentDate = typeof value === "string" ? parseDate(value) : value ?? new Date();
//             return (
//               <View style={containerStyle}>
//                 <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
//                 <Pressable
//                   disabled={!enabled}
//                   onPress={() => setShow(true)}
//                   style={[
//                     styles.inputLike,
//                     {
//                       backgroundColor: enabled
//                         ? colors.surface
//                         : hexToRgba(colors.textSecondary, 0.06),
//                       borderColor: hexToRgba(colors.textSecondary, 0.25),
//                       borderRadius: radius.md,
//                     },
//                   ]}
//                 >
//                   <Text
//                     style={{ color: value ? colors.textPrimary : colors.textMuted, fontSize: 15 }}
//                   >
//                     {value
//                       ? typeof value === "string"
//                         ? value
//                         : formatDate(value)
//                       : placeholder || "DD-MM-YYYY"}
//                   </Text>
//                   <Text style={{ color: colors.textMuted }}>📅</Text>
//                 </Pressable>

//                 {show && (
//                   <View style={{ marginTop: isIOS ? 6 : 0 }}>
//                     <DateTimePicker
//                       value={currentDate}
//                       mode="date"
//                       display={isIOS ? "spinner" : "calendar"}
//                       onChange={(_, d) => {
//                         if (Platform.OS === "android") setShow(false);
//                         if (d) {
//                           const v = formatDate(d);
//                           _onChange(v);
//                           onChange?.(v, form);
//                         }
//                       }}
//                     />
//                     {isIOS && (
//                       <Button
//                         style={{ marginTop: 6 }}
//                         mode="contained"
//                         onPress={() => setShow(false)}
//                       >
//                         Done
//                       </Button>
//                     )}
//                   </View>
//                 )}
//                 {renderError(fieldName)}
//               </View>
//             );
//           }}
//         />
//       );
//     }

//     // text / email / password / number / phone / textarea / readonly
//     return (
//       <Controller
//         key={fieldName}
//         control={control}
//         name={fieldName}
//         render={({ field: { onChange: _onChange, value } }) => (
//           <View style={containerStyle}>
//             <TextInput
//               label={label}
//               value={value?.toString() ?? ""}
//               onChangeText={(t) => {
//                 let next: any = t;
//                 if (type === "number") {
//                   next =
//                     numberMode === "decimal" ? t.replace(/[^0-9.]/g, "") : t.replace(/[^0-9]/g, "");
//                 }
//                 if (type === "phone") {
//                   next = t.replace(/[^0-9]/g, "").slice(0, 10);
//                 }
//                 _onChange(next);
//                 onChange?.(next, form);
//               }}
//               placeholder={placeholder}
//               mode="outlined"
//               disabled={!enabled || type === "readonly"}
//               secureTextEntry={type === "password"}
//               keyboardType={
//                 keyboardType ||
//                 (type === "email"
//                   ? "email-address"
//                   : type === "phone"
//                   ? "phone-pad"
//                   : type === "number"
//                   ? "numeric"
//                   : "default")
//               }
//               multiline={multiline || type === "textarea"}
//               numberOfLines={numberOfLines || (type === "textarea" ? 4 : 1)}
//               left={leftAffix ? <TextInput.Affix text={leftAffix} /> : undefined}
//               right={rightAffix ? <TextInput.Affix text={rightAffix} /> : undefined}
//               style={{ backgroundColor: colors.surface }}
//               outlineColor={hexToRgba(colors.textSecondary, 0.25)}
//               activeOutlineColor={colors.accent}
//               textColor={colors.textPrimary}
//               placeholderTextColor={colors.textMuted}
//             />
//             {renderError(fieldName)}
//           </View>
//         )}
//       />
//     );
//   };

//   return (
//     <PaperProvider theme={paperTheme}>
//       <ScrollView
//         style={{ flex: 1 }}
//         contentContainerStyle={{
//           padding: spacing.md,
//           paddingBottom: spacing.lg * 2,
//         }}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         {grouped.map(([section, fs]) => (
//           <View key={section} style={{ marginBottom: spacing.lg }}>
//             <Text
//               style={{
//                 color: colors.textPrimary,
//                 fontWeight: "700",
//                 fontSize: 16,
//                 marginBottom: spacing.sm,
//               }}
//             >
//               {section}
//             </Text>
//             <View style={[styles.grid, { columnGap: spacing.md - 2, rowGap: spacing.md - 2 }]}>
//               {fs.map(Field)}
//             </View>
//           </View>
//         ))}

//         {showSubmitButton && (
//           <Button
//             mode="contained"
//             onPress={handleSubmit(onSubmit)}
//             loading={loading}
//             disabled={loading || !isValid}
//             style={{ borderRadius: radius.lg, paddingVertical: 8 }}
//           >
//             {submitButtonText}
//           </Button>
//         )}
//       </ScrollView>
//     </PaperProvider>
//   );
// };

// const styles = StyleSheet.create({
//   grid: { flexDirection: "row", flexWrap: "wrap" },
//   fieldContainer: { marginBottom: 0 },
//   fieldLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
//   chipsWrap: { flexDirection: "row", flexWrap: "wrap" },
//   inputLike: {
//     borderWidth: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   radioRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
//   radioItem: { flexDirection: "row", alignItems: "center", marginRight: 4 },
// });

// export default DynamicForm;

import React, { useMemo, useState, useCallback, memo, PropsWithChildren, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  Pressable,
  useWindowDimensions,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
// IMPORTANT: only subscribe to what we need
import { useForm, Controller, UseFormReturn, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  TextInput,
  Button,
  HelperText,
  Provider as PaperProvider,
  DefaultTheme,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as yup from "yup";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "phone"
  | "radio"
  | "dropdown"
  | "multiselect"
  | "image"
  | "file"
  | "textarea"
  | "date"
  | "readonly";

export interface Option {
  label: string;
  value: any;
}

export interface FormFieldConfig {
  label: string;
  fieldName: string;
  type: FieldType;

  placeholder?: string;
  options?: Option[];
  required?: boolean;
  disabled?: boolean;

  section?: string;

  leftAffix?: string;
  rightAffix?: string;
  numberMode?: "integer" | "decimal";
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?:
    | "default"
    | "number-pad"
    | "decimal-pad"
    | "numeric"
    | "email-address"
    | "phone-pad";

  /** Dynamically enable/disable field.
   *  IMPORTANT: pair this with `dependsOn` so it reacts only when needed. */
  enabledWhen?: (values: Record<string, any>) => boolean;

  /** Called when this field changes. */
  onChange?: (value: any, api: UseFormReturn<any>) => void;

  /** For readonly/computed fields. Use `dependsOn` to recompute. */
  compute?: (values: Record<string, any>) => any;

  /** Names of fields this field depends on (for enabledWhen/compute). */
  dependsOn?: string[];
}

export interface DynamicFormProps {
  fields: FormFieldConfig[];
  validationSchema: yup.AnyObjectSchema;
  onSubmit: (data: any) => void;

  submitButtonText?: string;
  initialValues?: Record<string, any>;
  loading?: boolean;
  columns?: number;

  /** Called on any change. We pass a guarded setValue that only updates when the value actually changes. */
  onValuesChange?: (
    values: any,
    setValue: (name: string, value: any, options?: any) => void
  ) => void;

  showSubmitButton?: boolean;
}

/* ────────────────────────────────────────────────────────────
   Date helpers
   ──────────────────────────────────────────────────────────── */
const formatDate = (d?: Date) =>
  d
    ? `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${d.getFullYear()}`
    : "";

const parseDate = (str?: string) => {
  if (!str) return undefined;
  const [dd, mm, yyyy] = str.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(yyyy, (mm || 1) - 1, dd || 1);
  return isNaN(dt.getTime()) ? undefined : dt;
};

const ensureDate = (value: unknown) => {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "string" && value) {
    const d = parseDate(value);
    if (d) return d;
  }
  return new Date(); // ALWAYS feed a valid Date to the picker
};

/* ────────────────────────────────────────────────────────────
   Section wrapper (memoized)
   ──────────────────────────────────────────────────────────── */
const Section: React.FC<PropsWithChildren<{ title: string }>> = memo(({ title, children }) => {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontWeight: "700",
          fontSize: 16,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
});
Section.displayName = "Section";

/* ────────────────────────────────────────────────────────────
   Cross-platform dropdown (RN Modal)
   ──────────────────────────────────────────────────────────── */
const Dropdown: React.FC<{
  label: string;
  value: any;
  options?: Option[];
  onChange: (v: any) => void;
  placeholder?: string;
  disabled?: boolean;
}> = memo(({ label, value, options = [], onChange, placeholder, disabled }) => {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedLabel =
    options.find((o) => (o?.value ?? o) === (value ?? null))?.label ??
    (typeof value === "string" ? value : "");

  return (
    <>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>

      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.inputLike,
          {
            backgroundColor: disabled ? hexToRgba(colors.textSecondary, 0.06) : colors.surface,
            borderColor: hexToRgba(colors.textSecondary, 0.22),
            borderRadius: radius.md,
          },
        ]}
      >
        <Text
          style={{
            color: selectedLabel ? colors.textPrimary : colors.textMuted,
            fontSize: 15,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {selectedLabel || placeholder || "Select"}
        </Text>
        <Text style={{ color: colors.textMuted, marginLeft: 8 }}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "center",
              paddingHorizontal: spacing.md,
            }}
          />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <View
          style={{
            position: "absolute",
            left: spacing.md,
            right: spacing.md,
            top: "20%",
            maxHeight: "60%",
            backgroundColor: colors.cardBackground,
            borderRadius: radius.lg,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: "700", marginBottom: spacing.sm }}>
            {label}
          </Text>

          <FlatList
            data={options}
            keyExtractor={(_, i) => String(i)}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: hexToRgba(colors.textSecondary, 0.08) }} />
            )}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={{ paddingVertical: 12 }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{item.label}</Text>
              </Pressable>
            )}
          />

          <Button mode="text" onPress={() => setOpen(false)} style={{ marginTop: spacing.sm }}>
            Close
          </Button>
        </View>
      </Modal>
    </>
  );
});
Dropdown.displayName = "Dropdown";

/* ────────────────────────────────────────────────────────────
   Compact radio mark (identical iOS/Android)
   ──────────────────────────────────────────────────────────── */
const RadioMark = ({ checked }: { checked: boolean }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: checked ? colors.accent : hexToRgba(colors.textSecondary, 0.55),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked ? (
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
      ) : null}
    </View>
  );
};

/* ────────────────────────────────────────────────────────────
   Main Form
   ──────────────────────────────────────────────────────────── */
const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  validationSchema,
  onSubmit,
  submitButtonText = "Submit",
  initialValues = {},
  loading = false,
  columns,
  onValuesChange,
  showSubmitButton = true,
}) => {
  const { colors, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();

  const colCount = useMemo(() => columns ?? (width >= 740 ? 2 : 1), [columns, width]);

  const form = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    getValues,
  } = form;

  /** Only update when changed (prevents cursor flicker & focus loss) */
  const setIfChanged = useCallback(
    (name: string, val: any, options?: any) => {
      const prev = getValues(name);
      const equal =
        Array.isArray(prev) && Array.isArray(val)
          ? prev.length === val.length && prev.every((x, i) => x === val[i])
          : prev === val;
      if (!equal) setValue(name as any, val, { shouldValidate: true, ...options });
    },
    [getValues, setValue]
  );

  /** Fire external change listener without re-rendering this component. */
  useEffect(() => {
    if (!onValuesChange) return;
    const sub = form.watch((vals) => onValuesChange(vals, setIfChanged));
    return () => sub.unsubscribe();
  }, [form, onValuesChange, setIfChanged]);

  const paperTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: colors.accent,
        background: colors.background,
        surface: colors.cardBackground,
        text: colors.textPrimary,
        placeholder: colors.textMuted,
      },
      roundness: radius.md,
    }),
    [colors, radius]
  );

  const grouped = useMemo(() => {
    const m = new Map<string, FormFieldConfig[]>();
    fields.forEach((f) => {
      const k = f.section || "Form";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(f);
    });
    return Array.from(m.entries());
  }, [fields]);

  const renderError = useCallback(
    (name: string) => (
      <HelperText type="error" visible={!!(errors as any)[name]}>
        {(errors as any)[name]?.message?.toString()}
      </HelperText>
    ),
    [errors]
  );

  /** Field */
  const FieldRenderer: React.FC<{ field: FormFieldConfig }> = memo(({ field }) => {
    const {
      label,
      type,
      fieldName,
      placeholder,
      options,
      disabled,
      keyboardType,
      multiline,
      numberOfLines,
      leftAffix,
      rightAffix,
      onChange,
      enabledWhen,
      numberMode,
      dependsOn,
    } = field;

    // Only subscribe to the specific dependencies of this field
    useWatch({ control, name: dependsOn });

    const enabled = enabledWhen ? !!enabledWhen(getValues()) : !disabled;
    const containerStyle = [
      styles.fieldWrap,
      { width: colCount === 1 ? "100%" : "48%" },
      !enabled && { opacity: 0.6 },
    ];

    if (type === "radio") {
      return (
        <Controller
          control={control}
          name={fieldName}
          render={({ field: { onChange: _onChange, value } }) => (
            <View style={containerStyle}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
              <View style={styles.radioRow}>
                {(options || []).map((o) => {
                  const checked = value === o.value;
                  return (
                    <Pressable
                      key={String(o.value)}
                      onPress={() => enabled && (_onChange(o.value), onChange?.(o.value, form))}
                      style={[styles.radioItem, { paddingVertical: 6, paddingRight: 12 }]}
                      disabled={!enabled}
                      android_ripple={{ color: hexToRgba(colors.accent, 0.14), borderless: true }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked, disabled: !enabled }}
                    >
                      <RadioMark checked={checked} />
                      <Text
                        style={{
                          marginLeft: 8,
                          color: colors.textPrimary,
                          includeFontPadding: false,
                          textAlignVertical: "center",
                          lineHeight: 18,
                        }}
                      >
                        {o.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {renderError(fieldName)}
            </View>
          )}
        />
      );
    }

    if (type === "dropdown") {
      return (
        <Controller
          control={control}
          name={fieldName}
          render={({ field: { onChange: _onChange, value } }) => (
            <View style={containerStyle}>
              <Dropdown
                label={label}
                value={value}
                options={options}
                placeholder={placeholder}
                disabled={!enabled}
                onChange={(v) => {
                  _onChange(v);
                  onChange?.(v, form);
                }}
              />
              {renderError(fieldName)}
            </View>
          )}
        />
      );
    }

    if (type === "image" || type === "file") {
      return (
        <Controller
          control={control}
          name={fieldName}
          render={({ field: { value = [], onChange: _onChange } }) => (
            <View style={containerStyle}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  mode="outlined"
                  onPress={async () => {
                    if (!enabled) return;
                    if (type === "image") {
                      const res = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsMultipleSelection: true,
                        quality: 0.8,
                      });
                      if (!res.canceled)
                        _onChange([...(value || []), ...res.assets.map((a) => a.uri)]);
                    } else {
                      const res = await DocumentPicker.getDocumentAsync({
                        multiple: true,
                        copyToCacheDirectory: true,
                      });
                      if (res.assets && res.assets.length) {
                        _onChange([...(value || []), ...res.assets.map((a) => a.uri)]);
                      }
                    }
                  }}
                >
                  {type === "image" ? "Pick Images" : "Pick Files"}
                </Button>
                {!!value?.length && (
                  <Button mode="text" onPress={() => _onChange([])} textColor={colors.error}>
                    Clear
                  </Button>
                )}
              </View>

              {type === "image" ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                >
                  {(value || []).map((uri: string, i: number) => (
                    <Image
                      key={`${uri}-${i}`}
                      source={{ uri }}
                      style={{
                        width: 70,
                        height: 70,
                        marginRight: 8,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                      }}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={{ marginTop: 10, gap: 6 }}>
                  {(value || []).map((uri: string, i: number) => (
                    <Text
                      key={`${uri}-${i}`}
                      style={{ color: colors.textSecondary, fontSize: 12 }}
                      numberOfLines={1}
                    >
                      {uri.split("/").pop()}
                    </Text>
                  ))}
                </View>
              )}
              {renderError(fieldName)}
            </View>
          )}
        />
      );
    }

    if (type === "date") {
      const [show, setShow] = useState(false);
      const isIOS = Platform.OS === "ios";

      return (
        <Controller
          control={control}
          name={fieldName}
          render={({ field: { onChange: _onChange, value } }) => {
            const currentDate = ensureDate(value);
            return (
              <View style={containerStyle}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
                <Pressable
                  disabled={!enabled}
                  onPress={() => setShow(true)}
                  style={[
                    styles.inputLike,
                    {
                      backgroundColor: enabled
                        ? colors.surface
                        : hexToRgba(colors.textSecondary, 0.06),
                      borderColor: hexToRgba(colors.textSecondary, 0.22),
                      borderRadius: 8,
                    },
                  ]}
                >
                  <Text
                    style={{ color: value ? colors.textPrimary : colors.textMuted, fontSize: 15 }}
                  >
                    {value
                      ? typeof value === "string"
                        ? value
                        : formatDate(value)
                      : placeholder || "DD-MM-YYYY"}
                  </Text>
                  <Text style={{ color: colors.textMuted }}>📅</Text>
                </Pressable>

                {show && (
                  <View style={{ marginTop: isIOS ? 6 : 0 }}>
                    <DateTimePicker
                      value={currentDate}
                      mode="date"
                      display={isIOS ? "spinner" : "calendar"}
                      onChange={(_, d) => {
                        if (Platform.OS === "android") setShow(false);
                        if (d) {
                          const v = formatDate(d);
                          _onChange(v);
                          onChange?.(v, form);
                        }
                      }}
                    />
                    {isIOS && (
                      <Button
                        style={{ marginTop: 6 }}
                        mode="contained"
                        onPress={() => setShow(false)}
                      >
                        Done
                      </Button>
                    )}
                  </View>
                )}
                {renderError(fieldName)}
              </View>
            );
          }}
        />
      );
    }

    // readonly / text-like
    return (
      <Controller
        control={control}
        name={fieldName}
        render={({ field: { onChange: _onChange, value } }) => {
          // handle computed updates locally when dependencies change
          if (type === "readonly" && field.compute) {
            // Each time our dependencies change, recompute and push if needed.
            const deps = useWatch({ control, name: dependsOn });
            useEffect(() => {
              const all = getValues();
              const v = field.compute!(all);
              if (value !== v) {
                // don't force re-render of the whole form
                _onChange(v);
              }
              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [JSON.stringify(deps)]);
          }

          return (
            <View style={containerStyle}>
              <TextInput
                label={label}
                value={value?.toString() ?? ""}
                onChangeText={(t) => {
                  let next: any = t;
                  if (type === "number") {
                    next =
                      numberMode === "decimal"
                        ? t.replace(/[^0-9.]/g, "")
                        : t.replace(/[^0-9]/g, "");
                  }
                  if (type === "phone") {
                    next = t.replace(/[^0-9]/g, "").slice(0, 10);
                  }
                  _onChange(next);
                  onChange?.(next, form);
                }}
                placeholder={placeholder}
                mode="outlined"
                disabled={type === "readonly" || (enabledWhen ? !enabled : disabled)}
                secureTextEntry={type === "password"}
                keyboardType={
                  keyboardType ||
                  (type === "email"
                    ? "email-address"
                    : type === "phone"
                    ? "phone-pad"
                    : type === "number"
                    ? "numeric"
                    : "default")
                }
                multiline={multiline || type === "textarea"}
                numberOfLines={numberOfLines || (type === "textarea" ? 4 : 1)}
                left={leftAffix ? <TextInput.Affix text={leftAffix} /> : undefined}
                right={rightAffix ? <TextInput.Affix text={rightAffix} /> : undefined}
                style={{
                  backgroundColor:
                    type === "readonly" ? hexToRgba(colors.textSecondary, 0.06) : colors.surface,
                }}
                outlineColor={hexToRgba(colors.textSecondary, 0.22)}
                activeOutlineColor={colors.accent}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.textMuted}
              />
              {renderError(fieldName)}
            </View>
          );
        }}
      />
    );
  });
  FieldRenderer.displayName = "FieldRenderer";

  return (
    <PaperProvider theme={paperTheme}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg * 2 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {grouped.map(([section, fs]) => (
          <Section key={section} title={section}>
            <View style={[styles.grid, { columnGap: spacing.md - 6, rowGap: spacing.md - 6 }]}>
              {fs.map((f) => (
                <FieldRenderer key={f.fieldName} field={f} />
              ))}
            </View>
          </Section>
        ))}

        {showSubmitButton && (
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading || !isValid}
            style={{ borderRadius: radius.lg, paddingVertical: 8 }}
          >
            {submitButtonText}
          </Button>
        )}
      </ScrollView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap" },
  fieldWrap: { marginBottom: 0 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  inputLike: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radioRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  radioItem: { flexDirection: "row", alignItems: "center", marginRight: 8 },
});

export default DynamicForm;
