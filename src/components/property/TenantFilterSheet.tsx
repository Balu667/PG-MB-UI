import React, { useState, useMemo } from "react";
import RoomFilterSheet from "./RoomFilterSheet";
import { TenantFilter, emptyTenantFilter } from "@/src/constants/tenantFilter";
import DateTimePicker from "@react-native-community/datetimepicker";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  visible: boolean;
  value: TenantFilter;
  onChange: (f: TenantFilter) => void;
  onClose: () => void;
}

const TenantFilterSheet = ({ visible, value, onChange, onClose }: Props) => {
  const [draft, setDraft] = useState(value);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const tabs = useMemo(
    () => [
      { k: "sharing", label: "Sharing", values: Array.from({ length: 10 }, (_, i) => i + 1) },
      { k: "status", label: "Status", values: ["Active", "Dues", "Under Notice"] },
      { k: "joiningDate", label: "Joining Date", values: [] },
      { k: "downloadedApp", label: "Download Status", values: ["Downloaded", "Not Downloaded"] },
    ],
    []
  );

  const handleChange = (updatedDraft: TenantFilter) => setDraft(updatedDraft);

  return (
    <RoomFilterSheet
      visible={visible}
      value={draft}
      onChange={(newVal) => {
        setDraft(newVal);
      }}
      onClose={() => {
        onChange(draft);
        onClose();
      }}
      tabs={tabs}
      customContent={{
        joiningDate: (
          <View style={{ padding: 20, gap: 10 }}>
            <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.dateBtn}>
              <Text style={styles.dateTxt}>
                From: {draft.fromDate ? draft.fromDate.toLocaleDateString() : "Select Date"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.dateBtn}>
              <Text style={styles.dateTxt}>
                To: {draft.toDate ? draft.toDate.toLocaleDateString() : "Select Date"}
              </Text>
            </TouchableOpacity>

            {showFromPicker && (
              <DateTimePicker
                value={draft.fromDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowFromPicker(false);
                  if (selectedDate) handleChange({ ...draft, fromDate: selectedDate });
                }}
              />
            )}
            {showToPicker && (
              <DateTimePicker
                value={draft.toDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowToPicker(false);
                  if (selectedDate) handleChange({ ...draft, toDate: selectedDate });
                }}
              />
            )}
          </View>
        ),
      }}
    />
  );
};

const styles = StyleSheet.create({
  dateBtn: {
    paddingVertical: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  dateTxt: { fontSize: 14, color: "#555" },
});

export { emptyTenantFilter };
export default TenantFilterSheet;
