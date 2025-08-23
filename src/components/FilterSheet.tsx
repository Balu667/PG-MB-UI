// import React, { useState, useMemo } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   ScrollView,
//   useWindowDimensions,
//   Platform,
// } from "react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import Feather from "@expo/vector-icons/Feather";

// /* -------------------------------------------------------------------- */
// /*  💡  HOW IT WORKS

//     ┌──────────────────────────────────────────────────────────────┐
//     │  sections = [                                                │
//     │    { key:'status',   label:'Room Status', mode:'checkbox',   │
//     │      options:[{label:'Available', value:'Available'}, …] },  │
//     │    { key:'joinDate', label:'Joining Date', mode:'date' },    │
//     │    { key:'custom',   label:'Custom', mode:'custom',          │
//     │      render:(draft,set)=><YourComponent/> }                  │
//     │  ]                                                           │
//     └──────────────────────────────────────────────────────────────┘

//     • `draft` is a shallow‑copy of the `value` prop, mutated locally.
//     • When the user taps “Apply Filter”, we send that draft back via onChange().
// */
// /* -------------------------------------------------------------------- */

// export type CheckboxOption = { label: string; value: any };

// export type Section =
//   | {
//       key: string;
//       label: string;
//       mode: "checkbox";
//       options: CheckboxOption[];
//     }
//   | {
//       key: string;
//       label: string;
//       mode: "date";
//     }
//   | {
//       key: string;
//       label: string;
//       mode: "custom";
//       render: (draft: any, setDraft: React.Dispatch<React.SetStateAction<any>>) => React.ReactNode;
//     };

// interface Props<TDraft extends Record<string, any>> {
//   visible: boolean;
//   /** current filter object from the parent */
//   value: TDraft;
//   /** called when user taps “Apply Filter” */
//   onChange: (v: TDraft) => void;
//   /** closes the sheet */
//   onClose: () => void;
//   /** sidebar + body definition */
//   sections: Section[];
//   /** pristine value used for “Clear all” */
//   resetValue: TDraft;
// }

// /* -------------------------------------------------------------------- */
// /*                           COMPONENT                                  */
// /* -------------------------------------------------------------------- */

// function FilterSheet<T extends Record<string, any>>({
//   visible,
//   value,
//   onChange,
//   onClose,
//   sections,
//   resetValue,
// }: Props<T>) {
//   const safe = useSafeAreaInsets();
//   const { width, height } = useWindowDimensions();

//   /* ---------- local draft that can be cancelled ---------- */
//   const [draft, setDraft] = useState<T>(value);
//   const [activeKey, setActiveKey] = useState(sections[0].key);

//   const sideBarW = Math.max(100, Math.min(140, width * 0.26));
//   const minBodyH = height * 0.4;

//   /** helpers ------------------------------------------------ */
//   const toggleArrayVal = (arr: any[], v: any) =>
//     arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

//   const activeSection = useMemo(
//     () => sections.find((s) => s.key === activeKey)!,
//     [activeKey, sections]
//   );

//   /* ---------- render -------------------------------------- */
//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//       <View style={[styles.overlay, { paddingTop: safe.top }]}>
//         <View style={[styles.panel, { maxHeight: height * 0.85, minHeight: minBodyH }]}>
//           {/* ---------- header ---------- */}
//           <View style={styles.header}>
//             <Text style={styles.hTitle}>Filters</Text>
//             <TouchableOpacity onPress={onClose}>
//               <Feather name="x" size={22} color="#374151" />
//             </TouchableOpacity>
//           </View>

//           {/* ---------- body ---------- */}
//           <View style={styles.body}>
//             {/* ---- sidebar ---- */}
//             <View style={[styles.side, { width: sideBarW }]}>
//               {sections.map((sec) => {
//                 const active = sec.key === activeKey;
//                 return (
//                   <TouchableOpacity
//                     key={sec.key}
//                     style={[styles.sideBtn, active && styles.sideBtnOn]}
//                     onPress={() => setActiveKey(sec.key)}
//                   >
//                     <Text style={[styles.sideTxt, active && styles.sideTxtOn]}>{sec.label}</Text>
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>

//             {/* ---- content ---- */}
//             <ScrollView
//               style={styles.checkWrap}
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={{ paddingVertical: 6 }}
//             >
//               {activeSection.mode === "checkbox" &&
//                 activeSection.options.map((opt) => (
//                   <CheckRow
//                     key={String(opt.value)}
//                     label={opt.label}
//                     value={draft[activeSection.key]?.includes?.(opt.value)}
//                     onToggle={() =>
//                       setDraft((d) => ({
//                         ...d,
//                         [activeSection.key]: toggleArrayVal(d[activeSection.key] || [], opt.value),
//                       }))
//                     }
//                   />
//                 ))}

//               {activeSection.mode === "date" && (
//                 <DateRangePicker
//                   from={draft[activeSection.key]?.from}
//                   to={draft[activeSection.key]?.to}
//                   onChange={(range) => setDraft((d) => ({ ...d, [activeSection.key]: range }))}
//                 />
//               )}

//               {activeSection.mode === "custom" && activeSection.render(draft, setDraft)}
//             </ScrollView>
//           </View>

//           {/* ---------- footer ---------- */}
//           <View style={[styles.footer, { paddingBottom: safe.bottom || 16 }]}>
//             <TouchableOpacity
//               style={[styles.btn, styles.clear]}
//               onPress={() => setDraft(resetValue)}
//             >
//               <Text style={styles.clearTxt}>Clear all</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.btn, styles.apply]}
//               onPress={() => {
//                 onChange(draft);
//                 onClose();
//               }}
//             >
//               <Text style={styles.applyTxt}>Apply Filter</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// export default FilterSheet;

// /* -------------------------------------------------------------------- */
// /*                      SMALL REUSABLE PARTS                            */
// /* -------------------------------------------------------------------- */

// const CheckRow = ({
//   label,
//   value,
//   onToggle,
// }: {
//   label: string;
//   value: boolean;
//   onToggle: () => void;
// }) => (
//   <TouchableOpacity style={styles.row} onPress={onToggle}>
//     <View style={[styles.cb, value && styles.cbOn]}>
//       {value && <Feather name="check" size={14} color="#fff" />}
//     </View>
//     <Text style={styles.rowTxt}>{label}</Text>
//   </TouchableOpacity>
// );

// const DateRangePicker = ({
//   from,
//   to,
//   onChange,
// }: {
//   from?: Date;
//   to?: Date;
//   onChange: (range: { from?: Date; to?: Date }) => void;
// }) => {
//   const [show, setShow] = useState<"from" | "to" | null>(null);

//   return (
//     <View style={{ gap: 12 }}>
//       <Text style={{ fontWeight: "600", color: "#374151", marginBottom: 6 }}>
//         Select Date Range
//       </Text>

//       {/* ---- FROM ---- */}
//       <TouchableOpacity style={styles.dateRow} onPress={() => setShow("from")}>
//         <Text style={styles.rowTxt}>From: {from ? from.toDateString() : "Select Date"}</Text>
//       </TouchableOpacity>

//       {/* ---- TO ---- */}
//       <TouchableOpacity style={styles.dateRow} onPress={() => setShow("to")}>
//         <Text style={styles.rowTxt}>To: {to ? to.toDateString() : "Select Date"}</Text>
//       </TouchableOpacity>

//       {/* ---- Picker ---- */}
//       {show && (
//         <View style={Platform.OS === "android" ? {} : styles.dateModalWrapper}>
//           <DateTimePicker
//             value={show === "from" ? from || new Date() : to || new Date()}
//             mode="date"
//             display={Platform.OS === "android" ? "calendar" : "spinner"}
//             maximumDate={new Date()}
//             onChange={(_, date) => {
//               if (Platform.OS === "android") setShow(null);
//               if (date) onChange(show === "from" ? { from: date, to } : { from, to: date });
//             }}
//           />
//           {Platform.OS === "ios" && (
//             <TouchableOpacity style={styles.iosDone} onPress={() => setShow(null)}>
//               <Text style={styles.iosDoneTxt}>Done</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       )}
//     </View>
//   );
// };

// /* -------------------------------------------------------------------- */
// /*                             STYLES                                   */
// /* -------------------------------------------------------------------- */
// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     justifyContent: "flex-end",
//     backgroundColor: "rgba(0,0,0,0.35)",
//   },
//   panel: {
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 18,
//     borderTopRightRadius: 18,
//     width: "100%",
//     overflow: "hidden",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 18,
//     paddingVertical: 14,
//   },
//   hTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

//   body: { flexDirection: "row", flex: 1 },
//   side: { borderRightWidth: 1, borderColor: "#E5E7EB" },
//   sideBtn: { paddingVertical: 14, paddingHorizontal: 12 },
//   sideBtnOn: { backgroundColor: "#F3F4F6" },
//   sideTxt: { fontSize: 14, color: "#374151" },
//   sideTxtOn: { color: "#256D85", fontWeight: "600" },

//   checkWrap: { flex: 1, paddingHorizontal: 18 },

//   row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
//   cb: {
//     width: 20,
//     height: 20,
//     borderRadius: 4,
//     borderWidth: 1.4,
//     borderColor: "#9CA3AF",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   cbOn: { backgroundColor: "#256D85", borderColor: "#256D85" },
//   rowTxt: { fontSize: 14, color: "#374151" },

//   footer: { flexDirection: "row", gap: 14, paddingHorizontal: 18, paddingVertical: 8 },
//   btn: {
//     flex: 1,
//     borderRadius: 10,
//     paddingVertical: 12,
//     alignItems: "center",
//   },
//   clear: { backgroundColor: "#F3F4F6" },
//   clearTxt: { fontWeight: "600", color: "#374151" },
//   apply: { backgroundColor: "#256D85" },
//   applyTxt: { fontWeight: "600", color: "#fff" },

//   /* date‑picker box */
//   dateRow: {
//     marginBottom: 16,
//     paddingVertical: 10,
//     paddingHorizontal: 10,
//     backgroundColor: "#F9FAFB",
//     borderRadius: 8,
//   },
//   iosDone: {
//     marginTop: 12,
//     backgroundColor: "#256D85",
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   iosDoneTxt: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 16,
//   },
//   dateModalWrapper: {
//     backgroundColor: "#F9FAFB",
//     borderRadius: 10,
//     padding: 12,
//   },
// });
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

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* -------------------------------------------------------------------- */
/*                              TYPES                                   */
/* -------------------------------------------------------------------- */

export type CheckboxOption = { label: string; value: any };

export type Section =
  | {
      key: string;
      label: string;
      mode: "checkbox";
      options: CheckboxOption[];
    }
  | {
      key: string;
      label: string;
      mode: "date";
    }
  | {
      key: string;
      label: string;
      mode: "custom";
      render: (draft: any, setDraft: React.Dispatch<React.SetStateAction<any>>) => React.ReactNode;
    };

interface Props<TDraft extends Record<string, any>> {
  visible: boolean;
  /** current filter object from the parent */
  value: TDraft;
  /** called when user taps “Apply Filter” */
  onChange: (v: TDraft) => void;
  /** closes the sheet */
  onClose: () => void;
  /** sidebar + body definition */
  sections: Section[];
  /** pristine value used for “Clear all” */
  resetValue: TDraft;
}

/* -------------------------------------------------------------------- */
/*                           COMPONENT                                  */
/* -------------------------------------------------------------------- */

function FilterSheet<T extends Record<string, any>>({
  visible,
  value,
  onChange,
  onClose,
  sections,
  resetValue,
}: Props<T>) {
  const safe = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, spacing, radius } = useTheme();

  /* ---------- local draft that can be cancelled ---------- */
  const [draft, setDraft] = useState<T>(value);
  const [activeKey, setActiveKey] = useState(sections[0].key);

  const sideBarW = Math.max(100, Math.min(140, width * 0.26));
  const minBodyH = height * 0.4;

  /** helpers ------------------------------------------------ */
  const toggleArrayVal = (arr: any[], v: any) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const activeSection = useMemo(
    () => sections.find((s) => s.key === activeKey)!,
    [activeKey, sections]
  );

  /* ---------- themed styles (memo) ------------------------ */
  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: hexToRgba(colors.backDrop, 0.35),
          paddingTop: safe.top,
        },
        panel: {
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          width: "100%",
          maxHeight: height * 0.85,
          minHeight: minBodyH,
          overflow: "hidden",
        },

        /* header */
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: spacing.md + 2,
          paddingVertical: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
        },
        hTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },

        /* sidebar / body */
        body: { flexDirection: "row", flex: 1 },
        side: {
          borderRightWidth: 1,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
        },
        sideBtn: {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
        },
        sideBtnOn: {
          backgroundColor: hexToRgba(colors.accent, 0.08),
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
        },
        sideTxt: { fontSize: 14, color: colors.textPrimary },
        sideTxtOn: { color: colors.accent, fontWeight: "600" },

        checkWrap: { flex: 1, paddingHorizontal: spacing.md },

        /* checkbox row */
        row: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: spacing.md - 2,
        },
        cb: {
          width: 20,
          height: 20,
          borderRadius: radius.sm,
          borderWidth: 1.4,
          borderColor: colors.textMuted,
          justifyContent: "center",
          alignItems: "center",
          marginRight: spacing.sm,
        },
        cbOn: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        rowTxt: { fontSize: 14, color: colors.textPrimary },

        /* footer */
        footer: {
          flexDirection: "row",
          gap: spacing.md - 2,
          paddingHorizontal: spacing.md + 2,
          paddingVertical: spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: hexToRgba(colors.textSecondary, 0.15),
          paddingBottom: safe.bottom || spacing.md,
        },
        btn: {
          flex: 1,
          borderRadius: radius.md,
          paddingVertical: spacing.md - 2,
          alignItems: "center",
        },
        clear: { backgroundColor: colors.surface },
        clearTxt: { fontWeight: "600", color: colors.textPrimary },
        apply: { backgroundColor: colors.accent },
        applyTxt: { fontWeight: "600", color: colors.white },

        /* date picker */
        dateRow: {
          marginBottom: spacing.md,
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.sm,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
        },
        iosDone: {
          marginTop: spacing.md,
          backgroundColor: colors.accent,
          paddingVertical: spacing.sm + 1,
          borderRadius: radius.md,
          alignItems: "center",
        },
        iosDoneTxt: {
          color: colors.white,
          fontWeight: "600",
          fontSize: 16,
        },
        dateModalWrapper: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
      }),
    [colors, spacing, radius, safe.bottom, safe.top, height, minBodyH]
  );

  /* ---------- render -------------------------------------- */
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.panel}>
          {/* ---------- header ---------- */}
          <View style={s.header}>
            <Text style={s.hTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Feather name="x" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* ---------- body ---------- */}
          <View style={s.body}>
            {/* ---- sidebar ---- */}
            <View style={[s.side, { width: sideBarW }]}>
              {sections.map((sec) => {
                const active = sec.key === activeKey;
                return (
                  <TouchableOpacity
                    key={sec.key}
                    style={[s.sideBtn, active && s.sideBtnOn]}
                    onPress={() => setActiveKey(sec.key)}
                  >
                    <Text style={[s.sideTxt, active && s.sideTxtOn]}>{sec.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ---- content ---- */}
            <ScrollView
              style={s.checkWrap}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: spacing.xs + 2 }}
            >
              {activeSection.mode === "checkbox" &&
                activeSection.options.map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={s.row}
                    onPress={() =>
                      setDraft((d) => ({
                        ...d,
                        [activeSection.key]: toggleArrayVal(d[activeSection.key] || [], opt.value),
                      }))
                    }
                  >
                    <View style={[s.cb, draft[activeSection.key]?.includes?.(opt.value) && s.cbOn]}>
                      {draft[activeSection.key]?.includes?.(opt.value) && (
                        <Feather name="check" size={14} color={colors.white} />
                      )}
                    </View>
                    <Text style={s.rowTxt}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}

              {activeSection.mode === "date" && (
                <DateRangePicker
                  from={draft[activeSection.key]?.from}
                  to={draft[activeSection.key]?.to}
                  onChange={(range) => setDraft((d) => ({ ...d, [activeSection.key]: range }))}
                  styles={s} // pass to themed picker
                />
              )}

              {activeSection.mode === "custom" && activeSection.render(draft, setDraft)}
            </ScrollView>
          </View>

          {/* ---------- footer ---------- */}
          <View style={s.footer}>
            <TouchableOpacity style={[s.btn, s.clear]} onPress={() => setDraft(resetValue)}>
              <Text style={s.clearTxt}>Clear all</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, s.apply]}
              onPress={() => {
                onChange(draft);
                onClose();
              }}
            >
              <Text style={s.applyTxt}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default FilterSheet;

/* -------------------------------------------------------------------- */
/*                      SMALL REUSABLE PARTS                            */
/* -------------------------------------------------------------------- */

const DateRangePicker = ({
  from,
  to,
  onChange,
  styles,
}: {
  from?: Date;
  to?: Date;
  onChange: (range: { from?: Date; to?: Date }) => void;
  styles: Record<string, any>;
}) => {
  const { colors } = useTheme();
  const [show, setShow] = useState<"from" | "to" | null>(null);

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontWeight: "600", color: colors.textPrimary, marginBottom: 6 }}>
        Select Date Range
      </Text>

      {/* ---- FROM ---- */}
      <TouchableOpacity style={styles.dateRow} onPress={() => setShow("from")}>
        <Text style={styles.rowTxt}>From: {from ? from.toDateString() : "Select Date"}</Text>
      </TouchableOpacity>

      {/* ---- TO ---- */}
      <TouchableOpacity style={styles.dateRow} onPress={() => setShow("to")}>
        <Text style={styles.rowTxt}>To: {to ? to.toDateString() : "Select Date"}</Text>
      </TouchableOpacity>

      {/* ---- Picker ---- */}
      {show && (
        <View style={Platform.OS === "android" ? {} : styles.dateModalWrapper}>
          <DateTimePicker
            value={show === "from" ? from || new Date() : to || new Date()}
            mode="date"
            display={Platform.OS === "android" ? "calendar" : "spinner"}
            maximumDate={new Date()}
            onChange={(_, date) => {
              if (Platform.OS === "android") setShow(null);
              if (date) onChange(show === "from" ? { from: date, to } : { from, to: date });
            }}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity style={styles.iosDone} onPress={() => setShow(null)}>
              <Text style={styles.iosDoneTxt}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
