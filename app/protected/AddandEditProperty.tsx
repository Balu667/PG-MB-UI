// ✅ AddEditPropertyScreen.tsx (React Native)

import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Image,
  Alert,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  RadioButton,
  Chip,
  Provider as PaperProvider,
  HelperText,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

const facilitiesList = [
  'WiFi',
  'Laundry',
  'TV',
  'Fridge',
  'Parking',
  'CCTV',
];

const schema = yup.object().shape({
  propertyName: yup.string().required('Property name is required'),
  tenantType: yup.string().required('Tenant type is required'),
  mealType: yup.string().required('Meal type is required'),
  doorNo: yup.string().required('Door No is required'),
  streetName: yup.string().required('Street name is required'),
  area: yup.string().required('Area is required'),
  landmark: yup.string(),
  state: yup.string().required('State is required'),
  city: yup.string().required('City is required'),
  pincode: yup.string().length(6, 'Pincode must be 6 digits'),
  noticePeriod: yup.string().required('Notice period is required'),
});

export default function AddEditPropertyScreen() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(false);
  const [facilities, setFacilities] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      propertyName: '',
      tenantType: '',
      mealType: '',
      doorNo: '',
      streetName: '',
      area: '',
      landmark: '',
      state: '',
      city: '',
      pincode: '',
      noticePeriod: '',
    },
    resolver: yupResolver(schema),
  });

  const formValues = watch();

  const handleBackPress = () => {
    if (isDirty || isTouched || Object.values(formValues).some(Boolean)) {
      Alert.alert(
        'Unsaved Changes',
        'Form data might be lost. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: () => router.back() },
        ]
      );
      return true;
    } else {
      router.back();
      return true;
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
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
    Alert.alert('Form Submitted');
    router.back();
  };

  const toggleFacility = (item: string) => {
    setFacilities((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  };

  return (
    <PaperProvider>
      <ScrollView style={{ padding: 16 }}>
        {(
          [
            ['propertyName', 'Property Name'],
            ['doorNo', 'Door No'],
            ['streetName', 'Street Name'],
            ['area', 'Area'],
            ['landmark', 'Landmark'],
            ['state', 'State'],
            ['city', 'City'],
            ['pincode', 'Pincode'],
            ['noticePeriod', 'Notice Period (in days)'],
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
                  value={value}
                  mode="outlined"
                  onChangeText={(val) => {
                    onChange(val);
                    setIsTouched(true);
                  }}
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
              value={value}>
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
              value={value}>
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {facilitiesList.map((item) => (
            <Chip
              key={item}
              selected={facilities.includes(item)}
              onPress={() => toggleFacility(item)}
              style={{ margin: 4 }}>
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
              style={{ width: 80, height: 80, marginRight: 8, borderRadius: 6 }}
            />
          ))}
        </ScrollView>

        <Button mode="contained" onPress={handleSubmit(onSubmit)} style={{ marginTop: 20 }}>
          Submit
        </Button>
        <Button mode="outlined" onPress={handleBackPress} style={{ marginTop: 10 }}>
          Go Back
        </Button>
      </ScrollView>
    </PaperProvider>
  );
}
