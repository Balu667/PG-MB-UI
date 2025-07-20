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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

export interface RoomFilter {
  status: ("Available" | "Partial" | "Filled")[];
  sharing: number[];
  floor: ("GF" | `${number}F`)[];
  facilities: ("AC" | "Geyser" | "WM" | "WiFi" | "TV" | "Furnished")[];
}

export const emptyFilter: RoomFilter = {
  status: [],
  sharing: [],
  floor: [],
  facilities: [],
};

const TABS = [
  { k: "status", label: "Room Status" },
  { k: "sharing", label: "Sharing" },
  { k: "floor", label: "Floor" },
  { k: "facilities", label: "Facilities" },
] as const;
type TabKey = (typeof TABS)[number]["k"];

const toggleValue = <K extends keyof RoomFilter>(
  draft: RoomFilter,
  k: K,
  v: RoomFilter[K][number]
): RoomFilter => ({
  ...draft,
  [k]: draft[k].includes(v as any) ? draft[k].filter((x) => x !== v) : [...draft[k], v],
});

interface Props {
  visible: boolean;
  value: RoomFilter;
  onChange: (f: RoomFilter) => void;
  onClose: () => void;
  customContent?: Record<string, React.ReactNode>;
}

const RoomFilterSheet: React.FC<Props> = ({ visible, value, onChange, onClose }) => {
  const safe = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const [draft, setDraft] = useState<RoomFilter>(value);
  const [tab, setTab] = useState<TabKey>("status");

  const sideBarW = Math.max(100, Math.min(140, width * 0.26));
  const minBodyH = height * 0.4;

  const rows = useMemo(() => {
    switch (tab) {
      case "status":
        return ["Available", "Partial", "Filled"].map((s) => ({
          label: s,
          val: s as const,
        }));
      case "sharing":
        return Array.from({ length: 10 }, (_, i) => i + 1).map((n) => ({
          label: `${n} Sharing`,
          val: n,
        }));
      case "floor":
        return ["GF", ...Array.from({ length: 10 }, (_, i) => `${i + 1}F`)].map((f) => ({
          label: f === "GF" ? "Ground Floor" : `${f.replace("F", "")} Floor`,
          val: f as const,
        }));
      default:
        return ["AC", "Geyser", "WM", "WiFi", "TV", "Furnished"].map((f) => ({
          label: f,
          val: f as const,
        }));
    }
  }, [tab]);

  const isChecked = <K extends keyof RoomFilter>(k: K, v: RoomFilter[K][number]) =>
    draft[k].includes(v as any);

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
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {rows.map((r) => (
                <CheckRow
                  key={String(r.val)}
                  label={r.label}
                  value={isChecked(tab, r.val as any)}
                  onToggle={() => setDraft((d) => toggleValue(d, tab, r.val as any))}
                />
              ))}
            </ScrollView>
          </View>

          <View style={[styles.footer, { paddingBottom: safe.bottom || 16 }]}>
            <TouchableOpacity
              style={[styles.btn, styles.clear]}
              onPress={() => setDraft(emptyFilter)}
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
});

export default RoomFilterSheet;
