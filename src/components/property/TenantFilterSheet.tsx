// // // import React, { useState, useMemo } from "react";
// // // import {
// // //   View,
// // //   Text,
// // //   StyleSheet,
// // //   TouchableOpacity,
// // //   Modal,
// // //   ScrollView,
// // //   useWindowDimensions,
// // // } from "react-native";
// // // import Feather from "@expo/vector-icons/Feather";
// // // import DateTimePicker from "@react-native-community/datetimepicker";
// // // import { useSafeAreaInsets } from "react-native-safe-area-context";

// // // /* ───────────────── Types & Helpers ───────────────── */
// // // export interface TenantFilter {
// // //   sharing: number[];
// // //   status: ("Active" | "Dues" | "Under Notice")[];
// // //   fromDate?: Date;
// // //   toDate?: Date;
// // //   downloadedApp: ("Downloaded" | "Not Downloaded")[];
// // // }

// // // export const emptyTenantFilter: TenantFilter = {
// // //   sharing: [],
// // //   status: [],
// // //   fromDate: undefined,
// // //   toDate: undefined,
// // //   downloadedApp: [],
// // // };

// // // const TABS = [
// // //   { k: "sharing", label: "Sharing" },
// // //   { k: "status", label: "Status" },
// // //   { k: "joiningDate", label: "Joining Date" },
// // //   { k: "downloadedApp", label: "Download Status" },
// // // ] as const;

// // // type TabKey = (typeof TABS)[number]["k"];

// // // interface Props {
// // //   visible: boolean;
// // //   value: TenantFilter;
// // //   onChange: (f: TenantFilter) => void;
// // //   onClose: () => void;
// // // }

// // // const TenantFilterSheet: React.FC<Props> = ({ visible, value, onChange, onClose }) => {
// // //   const safe = useSafeAreaInsets();
// // //   const { height, width } = useWindowDimensions();
// // //   const [draft, setDraft] = useState<TenantFilter>(value);
// // //   const [tab, setTab] = useState<TabKey>("sharing");

// // //   const sideBarW = Math.max(100, Math.min(140, width * 0.26));

// // //   const rows = useMemo(() => {
// // //     switch (tab) {
// // //       case "sharing":
// // //         return Array.from({ length: 10 }, (_, i) => ({
// // //           label: `${i + 1} Sharing`,
// // //           val: i + 1,
// // //         }));
// // //       case "status":
// // //         return ["Active", "Dues", "Under Notice"].map((s) => ({ label: s, val: s }));
// // //       case "downloadedApp":
// // //         return ["Downloaded", "Not Downloaded"].map((s) => ({ label: s, val: s }));
// // //       default:
// // //         return [];
// // //     }
// // //   }, [tab]);

// // //   const isChecked = <K extends keyof TenantFilter>(k: K, v: any) => draft[k]?.includes(v);

// // //   const toggleValue = <K extends keyof TenantFilter>(k: K, v: any) => {
// // //     setDraft((prev) => ({
// // //       ...prev,
// // //       [k]: prev[k].includes(v) ? prev[k].filter((x) => x !== v) : [...prev[k], v],
// // //     }));
// // //   };

// // //   return (
// // //     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
// // //       <View style={styles.overlay}>
// // //         <View
// // //           style={[styles.panel, { paddingBottom: safe.bottom || 16, maxHeight: height * 0.85 }]}
// // //         >
// // //           <View style={styles.header}>
// // //             <Text style={styles.hTitle}>Filters</Text>
// // //             <TouchableOpacity onPress={onClose}>
// // //               <Feather name="x" size={22} color="#374151" />
// // //             </TouchableOpacity>
// // //           </View>

// // //           <View style={styles.body}>
// // //             <View style={[styles.side, { width: sideBarW }]}>
// // //               {TABS.map((t) => (
// // //                 <TouchableOpacity
// // //                   key={t.k}
// // //                   style={[styles.sideBtn, tab === t.k && styles.sideBtnOn]}
// // //                   onPress={() => setTab(t.k)}
// // //                 >
// // //                   <Text style={[styles.sideTxt, tab === t.k && styles.sideTxtOn]}>{t.label}</Text>
// // //                 </TouchableOpacity>
// // //               ))}
// // //             </View>

// // //             <ScrollView style={styles.checkWrap}>
// // //               {["sharing", "status", "downloadedApp"].includes(tab) &&
// // //                 rows.map((r) => (
// // //                   <CheckRow
// // //                     key={r.val}
// // //                     label={r.label}
// // //                     value={isChecked(tab as any, r.val)}
// // //                     onToggle={() => toggleValue(tab as any, r.val)}
// // //                   />
// // //                 ))}

// // //               {tab === "joiningDate" && (
// // //                 <View style={{ gap: 16, marginTop: 8 }}>
// // //                   <DatePickerRow
// // //                     label="From Date"
// // //                     date={draft.fromDate}
// // //                     onChange={(date) => setDraft({ ...draft, fromDate: date })}
// // //                   />
// // //                   <DatePickerRow
// // //                     label="To Date"
// // //                     date={draft.toDate}
// // //                     onChange={(date) => setDraft({ ...draft, toDate: date })}
// // //                   />
// // //                 </View>
// // //               )}
// // //             </ScrollView>
// // //           </View>

// // //           <View style={styles.footer}>
// // //             <TouchableOpacity
// // //               style={[styles.btn, styles.clear]}
// // //               onPress={() => setDraft(emptyTenantFilter)}
// // //             >
// // //               <Text style={styles.clearTxt}>Clear all</Text>
// // //             </TouchableOpacity>

// // //             <TouchableOpacity
// // //               style={[styles.btn, styles.apply]}
// // //               onPress={() => {
// // //                 onChange(draft);
// // //                 onClose();
// // //               }}
// // //             >
// // //               <Text style={styles.applyTxt}>Apply Filter</Text>
// // //             </TouchableOpacity>
// // //           </View>
// // //         </View>
// // //       </View>
// // //     </Modal>
// // //   );
// // // };

// // // const CheckRow = ({ label, value, onToggle }) => (
// // //   <TouchableOpacity style={styles.row} onPress={onToggle}>
// // //     <View style={[styles.cb, value && styles.cbOn]}>
// // //       {value && <Feather name="check" size={14} color="#fff" />}
// // //     </View>
// // //     <Text style={styles.rowTxt}>{label}</Text>
// // //   </TouchableOpacity>
// // // );

// // // const DatePickerRow = ({ label, date, onChange }) => {
// // //   const [showPicker, setShowPicker] = useState(false);

// // //   return (
// // //     <View>
// // //       <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
// // //         <Text style={styles.dateTxt}>
// // //           {label}: {date ? date.toLocaleDateString() : "Select Date"}
// // //         </Text>
// // //       </TouchableOpacity>
// // //       {showPicker && (
// // //         <DateTimePicker
// // //           value={date || new Date()}
// // //           mode="date"
// // //           onChange={(e, selected) => {
// // //             setShowPicker(false);
// // //             if (selected) onChange(selected);
// // //           }}
// // //         />
// // //       )}
// // //     </View>
// // //   );
// // // };

// // // const styles = StyleSheet.create({
// // //   overlay: {
// // //     flex: 1,
// // //     justifyContent: "flex-end",
// // //     backgroundColor: "rgba(0,0,0,0.35)",
// // //   },
// // //   panel: {
// // //     backgroundColor: "#fff",
// // //     borderTopLeftRadius: 18,
// // //     borderTopRightRadius: 18,
// // //     overflow: "hidden",
// // //   },
// // //   header: {
// // //     flexDirection: "row",
// // //     justifyContent: "space-between",
// // //     padding: 18,
// // //   },
// // //   hTitle: { fontSize: 18, fontWeight: "700" },
// // //   body: { flexDirection: "row", flex: 1 },
// // //   side: { borderRightWidth: 1, borderColor: "#ddd" },
// // //   sideBtn: { padding: 14 },
// // //   sideBtnOn: { backgroundColor: "#f0f0f0" },
// // //   sideTxt: { fontSize: 14 },
// // //   sideTxtOn: { fontWeight: "600", color: "#256D85" },
// // //   checkWrap: { flex: 1, padding: 18 },
// // //   row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
// // //   cb: {
// // //     width: 20,
// // //     height: 20,
// // //     borderWidth: 1,
// // //     borderRadius: 4,
// // //     justifyContent: "center",
// // //     alignItems: "center",
// // //     marginRight: 12,
// // //   },
// // //   cbOn: { backgroundColor: "#256D85", borderColor: "#256D85" },
// // //   rowTxt: { fontSize: 14 },
// // //   footer: { flexDirection: "row", gap: 14, padding: 18 },
// // //   btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
// // //   clear: { backgroundColor: "#eee" },
// // //   clearTxt: { fontWeight: "600" },
// // //   apply: { backgroundColor: "#256D85" },
// // //   applyTxt: { fontWeight: "600", color: "#fff" },
// // //   dateBtn: { paddingVertical: 10 },
// // //   dateTxt: { fontSize: 14 },
// // // });

// // // export default TenantFilterSheet;
// // import React from "react";
// // import RoomFilterSheet from "./RoomFilterSheet";
// // import { TenantFilter, emptyTenantFilter } from "@/src/constants/tenantFilter";

// // interface Props {
// //   visible: boolean;
// //   value: TenantFilter;
// //   onChange: (f: TenantFilter) => void;
// //   onClose: () => void;
// // }

// // const TenantFilterSheet = ({ visible, value, onChange, onClose }: Props) => (
// //   <RoomFilterSheet
// //     visible={visible}
// //     value={value}
// //     onChange={onChange}
// //     onClose={onClose}
// //     tabs={[
// //       {
// //         k: "sharing",
// //         label: "Sharing",
// //         values: Array.from({ length: 10 }, (_, i) => i + 1),
// //       },
// //       {
// //         k: "status",
// //         label: "Status",
// //         values: ["Active", "Dues", "Under Notice"],
// //       },
// //       {
// //         k: "joiningDate",
// //         label: "Joining Date",
// //         values: ["fromDate", "toDate"],
// //       },
// //       {
// //         k: "downloadedApp",
// //         label: "Download Status",
// //         values: ["Downloaded", "Not Downloaded"],
// //       },
// //     ]}
// //   />
// // );

// // export { emptyTenantFilter };
// // export default TenantFilterSheet;
// /* ----------------------------------------------------------------------
//    TenantFilterSheet – bottom‑sheet with vertical tabs
//    -------------------------------------------------------------------- */
// import React, { useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   ScrollView,
//   useWindowDimensions,
// } from "react-native";
// import Feather from "@expo/vector-icons/Feather";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// import { emptyTenantFilter, TenantFilter } from "@/src/constants/tenantFilter";

// /* --------- sidebar tabs --------- */
// const TABS = [
//   { k: "sharing", label: "Sharing" },
//   { k: "status", label: "Status" },
//   { k: "joiningDate", label: "Joining Date" },
//   { k: "downloadedApp", label: "Download App" },
// ] as const;
// type TabKey = (typeof TABS)[number]["k"];

// interface Props {
//   visible: boolean;
//   value: TenantFilter;
//   onChange: (f: TenantFilter) => void;
//   onClose: () => void;
// }

// /* ===================================================================== */
// const TenantFilterSheet: React.FC<Props> = ({ visible, value, onChange, onClose }) => {
//   /* -------- state -------- */
//   const [draft, setDraft] = useState<TenantFilter>(value);
//   const [tab, setTab] = useState<TabKey>("sharing");

//   /* -------- layout helpers -------- */
//   const insets = useSafeAreaInsets();
//   const { width, height } = useWindowDimensions();
//   const sideBarW = Math.max(100, Math.min(140, width * 0.26));
//   const maxH = height * 0.85;

//   /* -------- rows for current tab -------- */
//   const rows = useMemo(() => {
//     switch (tab) {
//       case "sharing":
//         return Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1} Sharing`, val: i + 1 }));
//       case "status":
//         return ["Active", "Dues", "Under Notice"].map((s) => ({ label: s, val: s }));
//       case "downloadedApp":
//         return ["Downloaded", "Not Downloaded"].map((s) => ({ label: s, val: s }));
//       default:
//         return []; // joiningDate handled separately
//     }
//   }, [tab]);

//   /* -------- safe helpers -------- */
//   const isChecked = <K extends keyof TenantFilter>(k: K, v: any) =>
//     Array.isArray(draft[k]) && (draft[k] as any).includes(v);

//   const toggle = <K extends keyof TenantFilter>(k: K, v: any) =>
//     setDraft((p) => {
//       const list = (Array.isArray(p[k]) ? p[k] : []) as any[];
//       const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
//       return { ...p, [k]: next };
//     });

//   /* =================================================================== */
//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//       <View style={styles.overlay}>
//         <View style={[styles.panel, { paddingBottom: insets.bottom || 14, maxHeight: maxH }]}>
//           {/* ---------- header ---------- */}
//           <View style={styles.header}>
//             <Text style={styles.hTitle}>Filters</Text>
//             <TouchableOpacity onPress={onClose} hitSlop={10}>
//               <Feather name="x" size={22} color="#374151" />
//             </TouchableOpacity>
//           </View>

//           {/* ---------- body ---------- */}
//           <View style={styles.body}>
//             {/* side bar */}
//             <View style={[styles.side, { width: sideBarW }]}>
//               {TABS.map((t) => (
//                 <TouchableOpacity
//                   key={t.k}
//                   style={[styles.sideBtn, t.k === tab && styles.sideBtnOn]}
//                   onPress={() => setTab(t.k)}
//                   activeOpacity={0.8}
//                 >
//                   <Text style={[styles.sideTxt, t.k === tab && styles.sideTxtOn]}>{t.label}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {/* checklist / pickers */}
//             <ScrollView style={styles.checkWrap} showsVerticalScrollIndicator={false}>
//               {/* checkbox‑style rows */}
//               {["sharing", "status", "downloadedApp"].includes(tab) &&
//                 rows.map((r) => (
//                   <CheckRow
//                     key={String(r.val)}
//                     label={r.label}
//                     value={isChecked(tab as any, r.val)}
//                     onToggle={() => toggle(tab as any, r.val)}
//                   />
//                 ))}

//               {/* date pickers */}
//               {tab === "joiningDate" && (
//                 <>
//                   <DateRow
//                     label="From"
//                     date={draft.fromDate}
//                     onChange={(d) => setDraft({ ...draft, fromDate: d })}
//                   />
//                   <DateRow
//                     label="To"
//                     date={draft.toDate}
//                     onChange={(d) => setDraft({ ...draft, toDate: d })}
//                   />
//                 </>
//               )}
//             </ScrollView>
//           </View>

//           {/* ---------- footer ---------- */}
//           <View style={styles.footer}>
//             <TouchableOpacity
//               style={[styles.btn, styles.clearBtn]}
//               onPress={() => setDraft(emptyTenantFilter)}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.clearTxt}>Clear all</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.btn, styles.applyBtn]}
//               onPress={() => {
//                 onChange(draft);
//                 onClose();
//               }}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.applyTxt}>Apply Filter</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// /* ---------- small pieces ---------- */
// const CheckRow = ({ label, value, onToggle }) => (
//   <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.75}>
//     <View style={[styles.cb, value && styles.cbOn]}>
//       {value && <Feather name="check" size={14} color="#fff" />}
//     </View>
//     <Text style={styles.rowTxt}>{label}</Text>
//   </TouchableOpacity>
// );

// const DateRow = ({ label, date, onChange }) => {
//   const [open, setOpen] = useState(false);
//   return (
//     <View style={{ marginVertical: 8 }}>
//       <TouchableOpacity style={styles.dateBtn} onPress={() => setOpen(true)}>
//         <Text style={styles.dateTxt}>
//           {label}: {date ? date.toLocaleDateString() : "Select"}
//         </Text>
//       </TouchableOpacity>
//       {open && (
//         <DateTimePicker
//           value={date || new Date()}
//           mode="date"
//           display="default"
//           onChange={(_, d) => {
//             setOpen(false);
//             if (d) onChange(d);
//           }}
//         />
//       )}
//     </View>
//   );
// };

// /* ---------- styles ---------- */
// const styles = StyleSheet.create({
//   overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },

//   panel: { backgroundColor: "#fff", borderTopLeftRadius: 18, borderTopRightRadius: 18 },

//   header: { flexDirection: "row", justifyContent: "space-between", padding: 18 },
//   hTitle: { fontSize: 18, fontWeight: "700" },

//   body: { flexDirection: "row", flex: 1 },

//   side: { borderRightWidth: 1, borderColor: "#E5E7EB" },
//   sideBtn: { paddingVertical: 14, paddingHorizontal: 12 },
//   sideBtnOn: { backgroundColor: "#F3F4F6" },
//   sideTxt: { fontSize: 14, color: "#374151" },
//   sideTxtOn: { color: "#256D85", fontWeight: "600" },

//   checkWrap: { flex: 1, padding: 18 },

//   row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
//   cb: {
//     width: 20,
//     height: 20,
//     borderWidth: 1.4,
//     borderColor: "#9CA3AF",
//     borderRadius: 4,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   cbOn: { backgroundColor: "#256D85", borderColor: "#256D85" },
//   rowTxt: { fontSize: 14, color: "#374151" },

//   dateBtn: { paddingVertical: 10 },
//   dateTxt: { fontSize: 14, color: "#374151" },

//   footer: { flexDirection: "row", gap: 14, paddingHorizontal: 18, paddingVertical: 12 },
//   btn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
//   clearBtn: { backgroundColor: "#F3F4F6" },
//   clearTxt: { fontWeight: "600", color: "#374151" },
//   applyBtn: { backgroundColor: "#256D85" },
//   applyTxt: { fontWeight: "600", color: "#fff" },
// });

// export default TenantFilterSheet;
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
