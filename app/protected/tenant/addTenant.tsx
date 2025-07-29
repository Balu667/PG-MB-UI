/* ------------------------------------------------------------------
   AddTenant – minimal add‑form (react‑hook‑form)                 */
/* route: /protected/tenant/add                                   */
import React from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "@/src/components/AppHeader";
import Colors from "@/src/constants/Colors";

/* -------- form model -------- */
type FormValues = {
  name: string;
  phone: string;
  room: string;
  sharing: string;
};

export default function AddTenant() {
  const router = useRouter();
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: "", phone: "", room: "", sharing: "" },
  });

  const onSubmit = (data: FormValues) => {
    console.log("🔄  submit to API later", data);
    router.back(); // back to TenantsTab (list refresh will come from API later)
  };

  /* ---------- ui ---------- */
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppHeader
        showBack
        onBackPress={() => router.back()}
        avatarUri=""
        propertyOptions={[]}
        selectedId=""
        onSelectProperty={() => {}}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.surface }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Add Tenant</Text>

        {/* simple 4‑field form */}
        <Field label="Tenant Name" name="name" control={control} />
        <Field label="Phone" name="phone" control={control} keyboardType="phone-pad" />
        <Field label="Room No" name="room" control={control} />
        <Field label="Sharing" name="sharing" control={control} keyboardType="number-pad" />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.btnTxt}>Save Tenant</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- tiny reusable field component ---------- */
type FieldProps = {
  label: string;
  name: keyof FormValues;
  control: any;
  keyboardType?: "default" | "number-pad" | "phone-pad";
};

const Field = ({ label, name, control, keyboardType = "default" }: FieldProps) => (
  <Controller
    control={control}
    name={name}
    rules={{ required: true }}
    render={({ field: { value, onChange } }) => (
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
        />
      </View>
    )}
  />
);

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  body: { padding: 20, gap: 6 },
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: Colors.textAccent },
  label: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: "#256D85",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnTxt: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
