import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

export interface TenantFilter {
  sharing: number[];
  status: ("Active" | "Dues" | "Under Notice")[];
  joinDate?: { from?: Date; to?: Date };
  downloadStatus: ("App Downloaded" | "App Not Downloaded")[];
}

export const emptyTenantFilter: TenantFilter = {
  sharing: [],
  status: [],
  joinDate: {},
  downloadStatus: [],
};

const TABS = [
  { k: "sharing", label: "Sharing" },
  { k: "status", label: "Status" },
  { k: "joinDate", label: "Joining Date" },
  { k: "downloadStatus", label: "Download Status" },
] as const;

type TabKey = (typeof TABS)[number]["k"];

const toggleValue = <K extends keyof TenantFilter>(
  draft: TenantFilter,
  k: K,
  v: TenantFilter[K][number]
): TenantFilter => ({
  ...draft,
  [k]: draft[k]?.includes(v as any)
    ? (draft[k] as any).filter((x: any) => x !== v)
    : [...(draft[k] as any), v],
});

interface Props {
  visible: boolean;
  value: TenantFilter;
  onChange: (f: TenantFilter) => void;
  onClose: () => void;
}

const TenantFilterSheet: React.FC<Props> = ({ visible, value, onChange, onClose }) => {
  const safe = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const [draft, setDraft] = useState<TenantFilter>(value);
  const [tab, setTab] = useState<TabKey>("status");

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const sideBarW = Math.max(100, Math.min(140, width * 0.26));
  const minBodyH = height * 0.4;

  const rows = useMemo(() => {
    switch (tab) {
      case "status":
        return ["Active", "Dues", "Under Notice"].map((s) => ({ label: s, val: s }));
      case "sharing":
        return Array.from({ length: 10 }, (_, i) => i + 1).map((n) => ({
          label: `${n} Sharing`,
          val: n,
        }));
      case "downloadStatus":
        return ["App Downloaded", "App Not Downloaded"].map((s) => ({ label: s, val: s }));
      default:
        return [];
    }
  }, [tab]);

  const isChecked = <K extends keyof TenantFilter>(k: K, v: TenantFilter[K][number]): boolean =>
    (draft[k] as any)?.includes?.(v);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: safe.top }]}>
        <View
          style={[
            styles.panel,
            {
              maxHeight: height * 0.85,
              minHeight: minBodyH,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.hTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={[styles.side, { width: sideBarW }]}>
              {TABS.map((t) => {
                const active = t.k === tab;
                return (
                  <TouchableOpacity
                    key={t.k}
                    style={[styles.sideBtn, active && styles.sideBtnOn]}
                    onPress={() => setTab(t.k)}
                  >
                    <Text style={[styles.sideTxt, active && styles.sideTxtOn]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView
              style={styles.checkWrap}
              contentContainerStyle={{ paddingVertical: 6 }}
              showsVerticalScrollIndicator={false}
            >
              {tab === "joinDate" ? (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontWeight: "600", color: "#374151", marginBottom: 6 }}>
                    Select Joining Date Range
                  </Text>

                  {/* FROM DATE */}
                  <TouchableOpacity style={styles.dateRow} onPress={() => setShowFromPicker(true)}>
                    <Text style={styles.rowTxt}>
                      From:{" "}
                      {draft.joinDate?.from ? draft.joinDate.from.toDateString() : "Select Date"}
                    </Text>
                  </TouchableOpacity>
                  {showFromPicker && (
                    <View style={Platform.OS === "android" ? {} : styles.dateModalWrapper}>
                      <DateTimePicker
                        value={draft.joinDate?.from || new Date()}
                        mode="date"
                        display={Platform.OS === "android" ? "calendar" : "spinner"}
                        maximumDate={new Date()}
                        onChange={(event, date) => {
                          if (Platform.OS === "android") setShowFromPicker(false);
                          if (date) {
                            setDraft((prev) => ({
                              ...prev,
                              joinDate: { ...prev.joinDate, from: date },
                            }));
                          }
                        }}
                      />
                      {Platform.OS === "ios" && (
                        <TouchableOpacity
                          style={styles.iosDone}
                          onPress={() => setShowFromPicker(false)}
                        >
                          <Text style={styles.iosDoneTxt}>Done</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* TO DATE */}
                  <TouchableOpacity style={styles.dateRow} onPress={() => setShowToPicker(true)}>
                    <Text style={styles.rowTxt}>
                      To: {draft.joinDate?.to ? draft.joinDate.to.toDateString() : "Select Date"}
                    </Text>
                  </TouchableOpacity>
                  {showToPicker && (
                    <View style={Platform.OS === "android" ? {} : styles.dateModalWrapper}>
                      <DateTimePicker
                        value={draft.joinDate?.to || new Date()}
                        mode="date"
                        display={Platform.OS === "android" ? "calendar" : "spinner"}
                        maximumDate={new Date()}
                        onChange={(event, date) => {
                          if (Platform.OS === "android") setShowToPicker(false);
                          if (date) {
                            setDraft((prev) => ({
                              ...prev,
                              joinDate: { ...prev.joinDate, to: date },
                            }));
                          }
                        }}
                      />
                      {Platform.OS === "ios" && (
                        <TouchableOpacity
                          style={styles.iosDone}
                          onPress={() => setShowToPicker(false)}
                        >
                          <Text style={styles.iosDoneTxt}>Done</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                rows.map((r) => (
                  <CheckRow
                    key={String(r.val)}
                    label={r.label}
                    value={isChecked(tab, r.val)}
                    onToggle={() => setDraft((d) => toggleValue(d, tab, r.val))}
                  />
                ))
              )}
            </ScrollView>
          </View>

          <View style={[styles.footer, { paddingBottom: safe.bottom || 16 }]}>
            <TouchableOpacity
              style={[styles.btn, styles.clear]}
              onPress={() => setDraft(emptyTenantFilter)}
            >
              <Text style={styles.clearTxt}>Clear all</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.apply]}
              onPress={() => {
                onChange(draft);
                onClose();
              }}
            >
              <Text style={styles.applyTxt}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const CheckRow = ({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity style={styles.row} onPress={onToggle}>
    <View style={[styles.cb, value && styles.cbOn]}>
      {value && <Feather name="check" size={14} color="#fff" />}
    </View>
    <Text style={styles.rowTxt}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    width: "100%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  hTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  body: { flexDirection: "row", flex: 1 },
  side: { borderRightWidth: 1, borderColor: "#E5E7EB" },
  sideBtn: { paddingVertical: 14, paddingHorizontal: 12 },
  sideBtnOn: { backgroundColor: "#F3F4F6" },
  sideTxt: { fontSize: 14, color: "#374151" },
  sideTxtOn: { color: "#256D85", fontWeight: "600" },
  checkWrap: { flex: 1, paddingHorizontal: 18 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cb: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.4,
    borderColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cbOn: { backgroundColor: "#256D85", borderColor: "#256D85" },
  rowTxt: { fontSize: 14, color: "#374151" },
  footer: { flexDirection: "row", gap: 14, paddingHorizontal: 18, paddingVertical: 8 },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  clear: { backgroundColor: "#F3F4F6" },
  clearTxt: { fontWeight: "600", color: "#374151" },
  apply: { backgroundColor: "#256D85" },
  applyTxt: { fontWeight: "600", color: "#fff" },
  dateRow: {
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  iosDone: {
    marginTop: 12,
    backgroundColor: "#256D85",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  iosDoneTxt: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default TenantFilterSheet;
