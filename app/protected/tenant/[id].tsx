import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Text, Pressable, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "@/src/components/AppHeader";
import { TextInput, Button, Menu } from "react-native-paper";
import Colors from "@/src/constants/Colors";
import { Tenant, mockTenants } from "@/src/constants/mockTenants";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
const TenantProfileScreen = () => {
  const { params } = useRoute();
  const insets = useSafeAreaInsets();
  const tenant = mockTenants.find((t) => t.id === params.id) as Tenant;
  const [menuOpen, setMenuOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const { control, handleSubmit, setValue } = useForm<Tenant>({
    defaultValues: tenant,
  });

  const pickDocument = async (field: keyof Tenant) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0].size < 5000000) {
      setValue(field, result.assets[0].uri);
    } else {
      Alert.alert("File too large or canceled.");
    }
  };

  const onSave = (data: Tenant) => {
    console.log(data);
    setEditMode(false);
    Alert.alert("Details saved");
  };
  const actions = ["Send E‑KYC Link", "Approve KYC", "Give Notice", "Checkout Tenant"];

  const onActionSelect = (label: string) => {
    setMenuOpen(false);
    console.log("TODO call API for:", label);
    // later: open confirm modal, navigate, etc.
  };
  const router = useRouter();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        avatarUri={tenant.imageUri!}
        propertyOptions={[]}
        selectedId=""
        onSelectProperty={() => {}}
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Menu
            visible={menuOpen}
            onDismiss={() => setMenuOpen(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuOpen(true)}
                compact
                style={{ borderRadius: 8 }}
                labelStyle={{ fontSize: 13 }}
              >
                Tenant Actions
              </Button>
            }
          >
            {actions.map((a) => (
              <Menu.Item key={a} onPress={() => onActionSelect(a)} title={a} />
            ))}
          </Menu>
          <Text style={styles.sectionTitle}>Renting Details</Text>
          <Controller
            control={control}
            name="name"
            render={({ field }) => <TextInput label="Tenant Name" {...field} editable={editMode} />}
          />

          <Controller
            control={control}
            name="joinedOn"
            render={({ field }) => (
              <TextInput label="Date of Joining" {...field} editable={editMode} />
            )}
          />

          <Controller
            control={control}
            name="room"
            render={({ field }) => <TextInput label="Room No" {...field} editable={editMode} />}
          />

          <Controller
            control={control}
            name="securityDeposit"
            render={({ field }) => (
              <TextInput label="Security Deposit" {...field} editable={editMode} />
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => <TextInput label="Phone" {...field} editable={editMode} />}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => <TextInput label="Email" {...field} editable={editMode} />}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <Pressable onPress={() => pickDocument("govtIdProof")} style={styles.uploadBtn}>
            <Text style={styles.uploadText}>Upload Govt Id Proof</Text>
          </Pressable>
          <Pressable onPress={() => pickDocument("rentalAgreement")} style={styles.uploadBtn}>
            <Text style={styles.uploadText}>Upload Rental Agreement</Text>
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          {!editMode ? (
            <Button mode="contained" onPress={() => setEditMode(true)}>
              Edit Details
            </Button>
          ) : (
            <Button mode="contained" onPress={handleSubmit(onSave)}>
              Save Details
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  body: { paddingHorizontal: 16, paddingVertical: 10 },
  section: { marginVertical: 10 },
  sectionTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  uploadBtn: {
    backgroundColor: "#eef2ff",
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
  },
  uploadText: { color: Colors.primary, fontWeight: "600" },
  buttonContainer: { marginTop: 20, marginBottom: 30 },
});

export default TenantProfileScreen;
