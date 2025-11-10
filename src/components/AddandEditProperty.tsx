// ✅ AddEditPropertyScreen.tsx (React Native)

import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Image,
  Alert,
  BackHandler,
  TouchableOpacity,
  Pressable,
  Platform,
  StyleSheet,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  RadioButton,
  Chip,
  Provider as PaperProvider,
  HelperText,
  DefaultTheme,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import {
  PropertyFormFields,
  AddAndEditPropertySchema,
} from "@/src/validations/propertyValidations";
// types.ts (or same file)

interface AddEditPropertyScreenProps {
  type: "add" | "edit";
  propertyData?: Partial<PropertyFormFields>;
}
const facilitiesList = ["WiFi", "Laundry", "TV", "Fridge", "Parking", "CCTV"];

export default function AddEditPropertyScreen({ propertyData }: AddEditPropertyScreenProps) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(propertyData?.images ?? []);
  const [facilities, setFacilities] = useState<string[]>(propertyData?.facilities ?? []);
  const [isTouched, setIsTouched] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<PropertyFormFields>({
    defaultValues: {
      propertyName: propertyData?.propertyName ?? "",
      tenantType: propertyData?.tenantType ?? "",
      mealType: propertyData?.mealType ?? "",
      doorNo: propertyData?.doorNo ?? "",
      streetName: propertyData?.streetName ?? "",
      area: propertyData?.area ?? "",
      landmark: propertyData?.landmark ?? null, // null is valid
      state: propertyData?.state ?? "",
      city: propertyData?.city ?? "",
      pincode: propertyData?.pincode ?? "",
      noticePeriod: propertyData?.noticePeriod ?? "",
      facilities: propertyData?.facilities ?? [], // default to empty array
      images: propertyData?.images ?? [], // default to empty array
    },
    resolver: yupResolver(AddAndEditPropertySchema),
    mode: "onTouched",
  });

  const formValues = watch();

  const handleBackPress = () => {
    if (isTouched || Object.values(formValues).some(Boolean)) {
      Alert.alert("Unsaved Changes", "Form data might be lost. Are you sure you want to go back?", [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => router.back() },
      ]);
      return true;
    } else {
      router.back();
      return true;
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => sub.remove();
  }, [formValues]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages([...images, ...uris]);
    }
  };

  const onSubmit = (data: any) => {
    console.log({ ...data, facilities, images });
    Alert.alert("Form Submitted");
    router.back();
  };

  const toggleFacility = (item: string) => {
    setFacilities((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  };
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#fff", // optional
      surface: "#fff", // affects inputs
    },
  };
  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <Pressable
              onPress={() => router.back()}
              android_ripple={{ color: "#ffffff55", borderless: true }}
              style={({ pressed }) => [
                styles.iconWrapper,
                pressed && Platform.OS === "ios" && styles.pressedIOS,
              ]}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Add Property</Text>
          </View>
        </View>

        <ScrollView style={{ padding: 16 }}>
          {(
            [
              ["propertyName", "Property Name"],
              ["doorNo", "Door No"],
              ["streetName", "Street Name"],
              ["area", "Area"],
              ["landmark", "landmark"],
              ["state", "State"],
              ["city", "City"],
              ["pincode", "Pincode"],
              ["noticePeriod", "Notice Period (in days)"],
            ] as const
          ).map(([field, label]) => (
            <Controller
              key={field}
              control={control}
              name={field}
              render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: 12 }}>
                  <TextInput
                    label={label}
                    value={value || ""}
                    mode="outlined"
                    onChangeText={(val) => {
                      onChange(val);
                      setIsTouched(true);
                    }}
                    style={{ backgroundColor: "white" }}
                  />
                  <HelperText type="error" visible={!!errors[field]}>
                    {errors[field]?.message?.toString()}
                  </HelperText>
                </View>
              )}
            />
          ))}

          <Text style={{ marginBottom: 8 }}>Tenant Type</Text>
          <Controller
            control={control}
            name="tenantType"
            render={({ field: { value, onChange } }) => (
              <RadioButton.Group
                onValueChange={(val) => {
                  setIsTouched(true);
                  onChange(val);
                }}
                value={value}
              >
                <RadioButton.Item label="Male" value="Male" />
                <RadioButton.Item label="Female" value="Female" />
                <RadioButton.Item label="Co-living" value="Co-living" />
              </RadioButton.Group>
            )}
          />
          <HelperText type="error" visible={!!errors.tenantType}>
            {errors.tenantType?.message?.toString()}
          </HelperText>

          <Text style={{ marginBottom: 8 }}>Meal Type</Text>
          <Controller
            control={control}
            name="mealType"
            render={({ field: { value, onChange } }) => (
              <RadioButton.Group
                onValueChange={(val) => {
                  setIsTouched(true);
                  onChange(val);
                }}
                value={value}
              >
                <RadioButton.Item label="Veg" value="Veg" />
                <RadioButton.Item label="Non-Veg" value="Non-Veg" />
                <RadioButton.Item label="Both" value="Both" />
              </RadioButton.Group>
            )}
          />
          <HelperText type="error" visible={!!errors.mealType}>
            {errors.mealType?.message?.toString()}
          </HelperText>

          <Text style={{ marginVertical: 8 }}>Facilities</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {facilitiesList.map((item) => (
              <Chip
                key={item}
                selected={facilities.includes(item)}
                onPress={() => toggleFacility(item)}
                style={{ margin: 4 }}
              >
                {item}
              </Chip>
            ))}
          </View>

          <Button mode="outlined" onPress={pickImages} style={{ marginVertical: 12 }}>
            Upload Property Images
          </Button>
          <ScrollView horizontal>
            {images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={{
                  width: 80,
                  height: 80,
                  marginRight: 8,
                  borderRadius: 6,
                }}
              />
            ))}
          </ScrollView>

          <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.saveButton}>
            Save Property
          </Button>
        </ScrollView>
      </View>
    </PaperProvider>
  );
}
const styles = StyleSheet.create({
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 10,
  },
  pressedIOS: {
    backgroundColor: "#ffffff22",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#256D85",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    position: "relative",
  },
  headerContainer: {
    backgroundColor: "#256D85",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  saveButton: {
    marginBottom: 40,
    width: "90%",
    margin: "auto",
    backgroundColor: "#256D85",
  },
});
