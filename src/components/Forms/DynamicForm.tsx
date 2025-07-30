// src/components/DynamicForm.tsx

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  TextInput,
  Button,
  RadioButton,
  Checkbox,
  HelperText,
  Chip,
  Provider as PaperProvider,
  DefaultTheme,
} from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as yup from "yup";

// Types for field configuration
export interface FormFieldConfig {
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "phone"
    | "radio"
    | "checkbox"
    | "dropdown"
    | "multiselect"
    | "image"
    | "textarea";
  fieldName: string;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>; // For radio, dropdown, multiselect
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean; // For textarea
  numberOfLines?: number; // For textarea
  keyboardType?:
    | "default"
    | "number-pad"
    | "decimal-pad"
    | "numeric"
    | "email-address"
    | "phone-pad";
}

export interface DynamicFormProps {
  fields: FormFieldConfig[];
  validationSchema: yup.AnyObjectSchema;
  onSubmit: (data: any) => void;
  submitButtonText?: string;
  initialValues?: Record<string, any>;
  loading?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  validationSchema,
  onSubmit,
  submitButtonText = "Submit",
  initialValues = {},
  loading = false,
}) => {
  // State for managing dynamic data
  const [selectedChips, setSelectedChips] = useState<Record<string, any[]>>({});
  const [images, setImages] = useState<Record<string, string[]>>({});

  // Initialize form with react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  // Handle image picker
  const handleImagePick = async (fieldName: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setImages((prev) => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), ...uris],
      }));
      setValue(fieldName, [...(images[fieldName] || []), ...uris]);
    }
  };

  // Handle multiselect chips
  const toggleChip = (fieldName: string, value: any) => {
    const currentValues = selectedChips[fieldName] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    setSelectedChips((prev) => ({
      ...prev,
      [fieldName]: newValues,
    }));
    setValue(fieldName, newValues);
  };

  // Render individual form field based on type
  const renderField = (field: FormFieldConfig) => {
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
    } = field;

    switch (type) {
      case "text":
      case "email":
      case "password":
      case "phone":
      case "textarea":
        return (
          <Controller
            key={fieldName}
            control={control}
            name={fieldName}
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldContainer}>
                <TextInput
                  label={label}
                  value={value || ""}
                  onChangeText={onChange}
                  placeholder={placeholder}
                  mode="outlined"
                  disabled={disabled}
                  secureTextEntry={type === "password"}
                  keyboardType={
                    keyboardType ||
                    (type === "email"
                      ? "email-address"
                      : type === "phone"
                      ? "phone-pad"
                      : "default")
                  }
                  multiline={multiline || type === "textarea"}
                  numberOfLines={numberOfLines || (type === "textarea" ? 4 : 1)}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors[fieldName]}>
                  {errors[fieldName]?.message?.toString()}
                </HelperText>
              </View>
            )}
          />
        );

      case "number":
        return (
          <Controller
            key={fieldName}
            control={control}
            name={fieldName}
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldContainer}>
                <TextInput
                  label={label}
                  value={value?.toString() || ""}
                  onChangeText={(text) =>
                    onChange(text ? parseFloat(text) : "")
                  }
                  placeholder={placeholder}
                  mode="outlined"
                  disabled={disabled}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors[fieldName]}>
                  {errors[fieldName]?.message?.toString()}
                </HelperText>
              </View>
            )}
          />
        );

      case "radio":
        return (
          <Controller
            key={fieldName}
            control={control}
            name={fieldName}
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <RadioButton.Group onValueChange={onChange} value={value}>
                  {options?.map((option) => (
                    <RadioButton.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      disabled={disabled}
                    />
                  ))}
                </RadioButton.Group>
                <HelperText type="error" visible={!!errors[fieldName]}>
                  {errors[fieldName]?.message?.toString()}
                </HelperText>
              </View>
            )}
          />
        );

      case "checkbox":
        return (
          <Controller
            key={fieldName}
            control={control}
            name={fieldName}
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldContainer}>
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={value ? "checked" : "unchecked"}
                    onPress={() => onChange(!value)}
                    disabled={disabled}
                  />
                  <Text style={styles.checkboxLabel}>{label}</Text>
                </View>
                <HelperText type="error" visible={!!errors[fieldName]}>
                  {errors[fieldName]?.message?.toString()}
                </HelperText>
              </View>
            )}
          />
        );

      case "dropdown":
        return (
          <Controller
            key={fieldName}
            control={control}
            name={fieldName}
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    enabled={!disabled}
                    style={styles.picker}
                  >
                    <Picker.Item label={`Select ${label}`} value="" />
                    {options?.map((option) => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </Picker>
                </View>
                <HelperText type="error" visible={!!errors[fieldName]}>
                  {errors[fieldName]?.message?.toString()}
                </HelperText>
              </View>
            )}
          />
        );

      case "multiselect":
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.chipsContainer}>
              {options?.map((option) => (
                <Chip
                  key={option.value}
                  selected={(selectedChips[fieldName] || []).includes(
                    option.value
                  )}
                  onPress={() => toggleChip(fieldName, option.value)}
                  disabled={disabled}
                  style={styles.chip}
                >
                  {option.label}
                </Chip>
              ))}
            </View>
            <HelperText type="error" visible={!!errors[fieldName]}>
              {errors[fieldName]?.message?.toString()}
            </HelperText>
          </View>
        );

      case "image":
        return (
          <View key={fieldName} style={styles.fieldContainer}>
            <Button
              mode="outlined"
              onPress={() => handleImagePick(fieldName)}
              disabled={disabled}
              style={styles.imageButton}
            >
              {label}
            </Button>
            {images[fieldName] && images[fieldName].length > 0 && (
              <ScrollView horizontal style={styles.imagePreview}>
                {images[fieldName].map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={styles.previewImage}
                  />
                ))}
              </ScrollView>
            )}
            <HelperText type="error" visible={!!errors[fieldName]}>
              {errors[fieldName]?.message?.toString()}
            </HelperText>
          </View>
        );

      default:
        return null;
    }
  };

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#fff",
      surface: "#fff",
    },
  };

  return (
    <PaperProvider theme={theme}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {fields.map(renderField)}

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          {submitButtonText}
        </Button>
      </ScrollView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "white",
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
    color: "#333",
  },
  pickerContainer: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    margin: 2,
  },
  imageButton: {
    marginBottom: 12,
  },
  imagePreview: {
    flexDirection: "row",
    marginTop: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 8,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: "#256D85",
  },
});

export default DynamicForm;
