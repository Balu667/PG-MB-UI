// src/components/FilterSheet.tsx
// Premium FilterSheet with cross-platform date picker solution
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  useWindowDimensions,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */

export type CheckboxOption = { label: string; value: any };

export type DateRangeConfig = {
  /** Allow future dates (default: false - only past dates allowed) */
  allowFuture?: boolean;
  /** Maximum selectable date (default: today if allowFuture is false) */
  maxDate?: Date;
  /** Minimum selectable date */
  minDate?: Date;
  /** Label for From field */
  fromLabel?: string;
  /** Label for To field */
  toLabel?: string;
};

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
      dateConfig?: DateRangeConfig;
    }
  | {
      key: string;
      label: string;
      mode: "custom";
      render: (
        draft: any,
        setDraft: React.Dispatch<React.SetStateAction<any>>
      ) => React.ReactNode;
    };

interface FilterSheetProps<TDraft extends Record<string, any>> {
  visible: boolean;
  value: TDraft;
  onChange: (v: TDraft) => void;
  onClose: () => void;
  sections: Section[];
  resetValue: TDraft;
  title?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
═══════════════════════════════════════════════════════════════════════════ */

const formatDisplayDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getToday = (): Date => startOfDay(new Date());

/* ═══════════════════════════════════════════════════════════════════════════
   useDatePicker HOOK - Cross-platform date picker management
   
   Architecture:
   - iOS: Shows picker inside a separate modal overlay above FilterSheet
   - Android: Uses native modal picker, closes immediately on selection
═══════════════════════════════════════════════════════════════════════════ */

interface UseDatePickerConfig {
  initialDate?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onSelect: (date: Date) => void;
}

interface UseDatePickerReturn {
  /** Whether the picker is visible */
  isVisible: boolean;
  /** The currently selected date in the picker */
  selectedDate: Date;
  /** Open the date picker */
  open: (currentValue?: Date) => void;
  /** Close the date picker without selecting */
  close: () => void;
  /** Confirm selection (iOS only - Android auto-confirms) */
  confirm: () => void;
  /** Handle date change event from DateTimePicker */
  handleChange: (event: DateTimePickerEvent, date?: Date) => void;
  /** Minimum selectable date */
  minimumDate?: Date;
  /** Maximum selectable date */
  maximumDate?: Date;
}

const useDatePicker = (config: UseDatePickerConfig): UseDatePickerReturn => {
  const { initialDate, minimumDate, maximumDate, onSelect } = config;
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ?? new Date()
  );

  const open = useCallback(
    (currentValue?: Date) => {
      Haptics.selectionAsync();
      setSelectedDate(currentValue ?? initialDate ?? new Date());
      setIsVisible(true);
    },
    [initialDate]
  );

  const close = useCallback(() => {
    setIsVisible(false);
  }, []);

  const confirm = useCallback(() => {
    Haptics.selectionAsync();
    onSelect(selectedDate);
    setIsVisible(false);
  }, [selectedDate, onSelect]);

  const handleChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === "android") {
        // Android: Close picker immediately on any action
        setIsVisible(false);

        // Only update if user pressed OK (not cancelled)
        if (event.type === "set" && date) {
          const normalizedDate = startOfDay(date);
          setSelectedDate(normalizedDate);
          onSelect(normalizedDate);
        }
      } else {
        // iOS: Just update the selected date, user will confirm manually
        if (date) {
          setSelectedDate(startOfDay(date));
        }
      }
    },
    [onSelect]
  );

  return {
    isVisible,
    selectedDate,
    open,
    close,
    confirm,
    handleChange,
    minimumDate,
    maximumDate,
  };
};

/* ═══════════════════════════════════════════════════════════════════════════
   DATE PICKER MODAL COMPONENT - Renders above FilterSheet
   
   iOS: Full modal overlay with spinner picker and confirm/cancel buttons
   Android: Native modal (handled by DateTimePicker itself)
═══════════════════════════════════════════════════════════════════════════ */

interface DatePickerModalProps {
  visible: boolean;
  date: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onClose: () => void;
  onConfirm: () => void;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
  title?: string;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  date,
  minimumDate,
  maximumDate,
  onClose,
  onConfirm,
  onChange,
  title = "Select Date",
}) => {
  const { colors, spacing, radius } = useTheme();
  const safe = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: hexToRgba("#000000", 0.6),
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.lg,
        },
        container: {
          backgroundColor: colors.cardBackground,
          borderRadius: radius.xl,
          width: Math.min(width - spacing.lg * 2, 400),
          maxWidth: "100%",
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 10,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textMuted, 0.1),
        },
        headerTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        closeBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: hexToRgba(colors.textMuted, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        pickerContainer: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.md,
          alignItems: "center",
        },
        footer: {
          flexDirection: "row",
          gap: spacing.sm,
          padding: spacing.md,
          paddingBottom: spacing.md + (safe.bottom > 0 ? 0 : spacing.sm),
          borderTopWidth: 1,
          borderTopColor: hexToRgba(colors.textMuted, 0.1),
        },
        footerBtn: {
          flex: 1,
          paddingVertical: spacing.md,
          borderRadius: radius.lg,
          alignItems: "center",
        },
        cancelBtn: {
          backgroundColor: colors.surface,
        },
        confirmBtn: {
          backgroundColor: colors.accent,
        },
        cancelText: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.textPrimary,
        },
        confirmText: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.white,
        },
      }),
    [colors, spacing, radius, safe.bottom, width]
  );

  // iOS: Show full modal with picker
  if (Platform.OS === "ios") {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.container}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>{title}</Text>
                  <Pressable
                    style={styles.closeBtn}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close date picker"
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={18}
                      color={colors.textPrimary}
                    />
                  </Pressable>
                </View>

                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    onChange={onChange}
                    textColor={colors.textPrimary}
                    style={{ width: "100%", height: 200 }}
                  />
                </View>

                <View style={styles.footer}>
                  <Pressable
                    style={[styles.footerBtn, styles.cancelBtn]}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.footerBtn, styles.confirmBtn]}
                    onPress={onConfirm}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm date selection"
                  >
                    <Text style={styles.confirmText}>Confirm</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  // Android: Just render the DateTimePicker (it's already a modal)
  if (visible) {
    return (
      <DateTimePicker
        value={date}
        mode="date"
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={onChange}
      />
    );
  }

  return null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   DATE FIELD COMPONENT - Single date input field
═══════════════════════════════════════════════════════════════════════════ */

interface DateFieldProps {
  label: string;
  value?: Date;
  placeholder?: string;
  onSelect: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

const DateFieldInput: React.FC<DateFieldProps> = ({
  label,
  value,
  placeholder = "Select date",
  onSelect,
  minimumDate,
  maximumDate,
  disabled,
}) => {
  const { colors, radius, spacing, typography } = useTheme();

  const picker = useDatePicker({
    initialDate: value,
    minimumDate,
    maximumDate,
    onSelect,
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: spacing.md,
        },
        label: {
          color: colors.textSecondary,
          fontWeight: "600",
          marginBottom: 8,
          fontSize: typography.fontSizeSm,
        },
        field: {
          borderWidth: 1.5,
          borderColor: value ? colors.accent : colors.borderColor,
          borderRadius: radius.lg,
          backgroundColor: disabled
            ? hexToRgba(colors.surface, 0.5)
            : colors.cardSurface,
          paddingVertical: 14,
          paddingHorizontal: 14,
          minHeight: 54,
          justifyContent: "center",
          opacity: disabled ? 0.6 : 1,
        },
        fieldFocused: {
          borderColor: colors.accent,
          backgroundColor: hexToRgba(colors.accent, 0.04),
        },
        fieldRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        iconWrap: {
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: value
            ? hexToRgba(colors.accent, 0.12)
            : hexToRgba(colors.textMuted, 0.1),
          alignItems: "center",
          justifyContent: "center",
        },
        fieldText: {
          flex: 1,
          fontSize: typography.fontSizeMd,
        },
        fieldTextFilled: {
          color: colors.textPrimary,
          fontWeight: "600",
        },
        fieldTextEmpty: {
          color: colors.textMuted,
          fontWeight: "400",
        },
      }),
    [colors, radius, spacing, typography, disabled, value]
  );

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          disabled={disabled}
          onPress={() => picker.open(value)}
          style={[styles.field, value && styles.fieldFocused]}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? formatDisplayDate(value) : placeholder}`}
          accessibilityHint="Tap to select date"
        >
          <View style={styles.fieldRow}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name="calendar-month"
                size={20}
                color={value ? colors.accent : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.fieldText,
                value ? styles.fieldTextFilled : styles.fieldTextEmpty,
              ]}
            >
              {value ? formatDisplayDate(value) : placeholder}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textMuted}
            />
          </View>
        </Pressable>
      </View>

      {/* Date Picker Modal - Renders above FilterSheet */}
      <DatePickerModal
        visible={picker.isVisible}
        date={picker.selectedDate}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onClose={picker.close}
        onConfirm={picker.confirm}
        onChange={picker.handleChange}
        title={label}
      />
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DATE RANGE PICKER COMPONENT - From/To date selection
═══════════════════════════════════════════════════════════════════════════ */

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onChange: (range: { from?: Date; to?: Date }) => void;
  config?: DateRangeConfig;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  from,
  to,
  onChange,
  config = {},
}) => {
  const { colors, spacing, radius } = useTheme();
  const {
    allowFuture = false,
    maxDate,
    minDate,
    fromLabel = "From Date",
    toLabel = "To Date",
  } = config;

  // Calculate effective maximum date
  const effectiveMaxDate = useMemo(() => {
    if (maxDate) return maxDate;
    if (!allowFuture) return getToday();
    return undefined;
  }, [allowFuture, maxDate]);

  // From date constraints
  const fromMaxDate = useMemo(() => {
    if (to && effectiveMaxDate) {
      return to < effectiveMaxDate ? to : effectiveMaxDate;
    }
    return to ?? effectiveMaxDate;
  }, [to, effectiveMaxDate]);

  // To date constraints
  const toMinDate = useMemo(() => {
    if (from && minDate) {
      return from > minDate ? from : minDate;
    }
    return from ?? minDate;
  }, [from, minDate]);

  const handleFromChange = useCallback(
    (date: Date) => {
      const newFrom = startOfDay(date);
      if (to && newFrom > to) {
        onChange({ from: newFrom, to: undefined });
      } else {
        onChange({ from: newFrom, to });
      }
    },
    [to, onChange]
  );

  const handleToChange = useCallback(
    (date: Date) => {
      const newTo = startOfDay(date);
      if (from && newTo < from) {
        onChange({ from: undefined, to: newTo });
      } else {
        onChange({ from, to: newTo });
      }
    },
    [from, onChange]
  );

  const handleQuickSelect = useCallback(
    (days: number) => {
      Haptics.selectionAsync();
      const today = getToday();
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - days);
      onChange({ from: fromDate, to: today });
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    Haptics.selectionAsync();
    onChange({ from: undefined, to: undefined });
  }, [onChange]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: spacing.sm,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        headerIcon: {
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        headerText: {
          fontWeight: "700",
          color: colors.textPrimary,
          fontSize: 16,
        },
        quickActionsLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
          marginBottom: spacing.xs,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        quickActions: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.xs,
          marginBottom: spacing.md,
        },
        quickBtn: {
          paddingHorizontal: spacing.sm + 4,
          paddingVertical: spacing.xs + 4,
          backgroundColor: colors.surface,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textMuted, 0.12),
        },
        quickBtnPressed: {
          backgroundColor: hexToRgba(colors.accent, 0.1),
          borderColor: colors.accent,
        },
        quickBtnText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        fieldsContainer: {
          gap: spacing.xs,
        },
        clearBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: spacing.md,
          marginTop: spacing.sm,
          backgroundColor: hexToRgba(colors.error, 0.08),
          borderRadius: radius.lg,
        },
        clearBtnPressed: {
          backgroundColor: hexToRgba(colors.error, 0.15),
        },
        clearText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.error,
        },
      }),
    [colors, spacing, radius]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="calendar-range"
            size={18}
            color={colors.accent}
          />
        </View>
        <Text style={styles.headerText}>Select Date Range</Text>
      </View>

      {/* Quick Select */}
      <Text style={styles.quickActionsLabel}>Quick Select</Text>
      <View style={styles.quickActions}>
        {[
          { label: "Last 7 days", days: 7 },
          { label: "Last 30 days", days: 30 },
          { label: "Last 90 days", days: 90 },
        ].map((item) => (
          <Pressable
            key={item.days}
            style={({ pressed }) => [
              styles.quickBtn,
              pressed && styles.quickBtnPressed,
            ]}
            onPress={() => handleQuickSelect(item.days)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Text style={styles.quickBtnText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Date Fields */}
      <View style={styles.fieldsContainer}>
        <DateFieldInput
          label={fromLabel}
          value={from}
          placeholder="Select start date"
          onSelect={handleFromChange}
          minimumDate={minDate}
          maximumDate={fromMaxDate}
        />
        <DateFieldInput
          label={toLabel}
          value={to}
          placeholder="Select end date"
          onSelect={handleToChange}
          minimumDate={toMinDate}
          maximumDate={effectiveMaxDate}
        />
      </View>

      {/* Clear Button */}
      {(from || to) && (
        <Pressable
          style={({ pressed }) => [
            styles.clearBtn,
            pressed && styles.clearBtnPressed,
          ]}
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear date range"
        >
          <MaterialCommunityIcons
            name="close-circle-outline"
            size={18}
            color={colors.error}
          />
          <Text style={styles.clearText}>Clear Dates</Text>
        </Pressable>
      )}
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CHECKBOX SECTION COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

interface CheckboxSectionProps {
  options: CheckboxOption[];
  selected: any[];
  onToggle: (value: any) => void;
}

const CheckboxSection: React.FC<CheckboxSectionProps> = ({
  options,
  selected,
  onToggle,
}) => {
  const { colors, spacing, radius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: spacing.xs + 2,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: "transparent",
        },
        rowSelected: {
          backgroundColor: hexToRgba(colors.accent, 0.08),
          borderColor: hexToRgba(colors.accent, 0.25),
        },
        checkbox: {
          width: 24,
          height: 24,
          borderRadius: radius.sm + 2,
          borderWidth: 2,
          borderColor: colors.textMuted,
          justifyContent: "center",
          alignItems: "center",
          marginRight: spacing.md,
        },
        checkboxSelected: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        label: {
          flex: 1,
          fontSize: 15,
          color: colors.textPrimary,
          fontWeight: "500",
        },
        labelSelected: {
          color: colors.accent,
          fontWeight: "600",
        },
      }),
    [colors, spacing, radius]
  );

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = selected?.includes(opt.value);
        return (
          <Pressable
            key={String(opt.value)}
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => {
              Haptics.selectionAsync();
              onToggle(opt.value);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={opt.label}
          >
            <View
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            >
              {isSelected && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={colors.white}
                />
              )}
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN FILTER SHEET COMPONENT
   
   Architecture:
   - Uses a bottom sheet modal pattern
   - Increased height for modern spacious look
   - Date picker modal renders ABOVE the sheet (separate Modal)
   - Scrollable content area for long filter lists
═══════════════════════════════════════════════════════════════════════════ */

function FilterSheet<T extends Record<string, any>>({
  visible,
  value,
  onChange,
  onClose,
  sections,
  resetValue,
  title = "Filters",
}: FilterSheetProps<T>) {
  const safe = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, spacing, radius, typography } = useTheme();

  // Local draft state
  const [draft, setDraft] = useState<T>(value);
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? "");

  // Reset draft when modal opens
  useEffect(() => {
    if (visible) {
      setDraft(value);
      setActiveKey(sections[0]?.key ?? "");
    }
  }, [visible, value, sections]);

  // Responsive calculations
  const isTablet = width >= 768;
  const sideBarWidth = Math.max(120, Math.min(160, width * 0.30));
  // INCREASED HEIGHT: 92% on phones, 85% on tablets
  const sheetMaxHeight = isTablet ? height * 0.85 : height * 0.92;
  const sheetMinHeight = height * 0.55;

  // Helpers
  const toggleArrayVal = useCallback(
    (arr: any[], v: any) =>
      arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
    []
  );

  const activeSection = useMemo(
    () => sections.find((s) => s.key === activeKey),
    [activeKey, sections]
  );

  const getSectionFilterCount = useCallback(
    (sectionKey: string): number => {
      const sectionValue = draft[sectionKey];
      if (!sectionValue) return 0;
      if (Array.isArray(sectionValue)) return sectionValue.length;
      if (typeof sectionValue === "object") {
        return sectionValue.from || sectionValue.to ? 1 : 0;
      }
      return 0;
    },
    [draft]
  );

  const hasActiveFilters = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(resetValue),
    [draft, resetValue]
  );

  // Handlers
  const handleApply = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(draft);
    onClose();
  }, [draft, onChange, onClose]);

  const handleClear = useCallback(() => {
    Haptics.selectionAsync();
    setDraft(resetValue);
  }, [resetValue]);

  const handleClose = useCallback(() => {
    Haptics.selectionAsync();
    onClose();
  }, [onClose]);

  // Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: hexToRgba("#000000", 0.55),
        },
        sheet: {
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: radius.xl + 8,
          borderTopRightRadius: radius.xl + 8,
          maxHeight: sheetMaxHeight,
          minHeight: sheetMinHeight,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 20,
        },
        handle: {
          alignItems: "center",
          paddingTop: spacing.sm + 2,
          paddingBottom: spacing.xs,
        },
        handleBar: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: hexToRgba(colors.textMuted, 0.3),
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textMuted, 0.08),
        },
        headerLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm + 2,
        },
        headerIconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitle: {
          fontSize: isTablet ? 22 : 20,
          fontWeight: "700",
          color: colors.textPrimary,
          letterSpacing: 0.3,
        },
        closeBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: hexToRgba(colors.textMuted, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        closeBtnPressed: {
          backgroundColor: hexToRgba(colors.textMuted, 0.15),
        },
        body: {
          flexDirection: "row",
          flex: 1,
        },
        sidebar: {
          width: sideBarWidth,
          backgroundColor: hexToRgba(colors.surface, 0.6),
          borderRightWidth: 1,
          borderRightColor: hexToRgba(colors.textMuted, 0.06),
          paddingTop: spacing.sm,
        },
        sidebarBtn: {
          paddingVertical: spacing.md + 2,
          paddingHorizontal: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
        },
        sidebarBtnActive: {
          backgroundColor: colors.cardBackground,
          borderLeftWidth: 4,
          borderLeftColor: colors.accent,
        },
        sidebarText: {
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: "500",
          flex: 1,
        },
        sidebarTextActive: {
          color: colors.accent,
          fontWeight: "700",
        },
        sidebarBadge: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.accent,
        },
        content: {
          flex: 1,
          padding: spacing.lg,
        },
        contentScroll: {
          paddingBottom: spacing.xl,
        },
        footer: {
          flexDirection: "row",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md + 2,
          paddingBottom: Math.max(safe.bottom + spacing.sm, spacing.lg),
          borderTopWidth: 1,
          borderTopColor: hexToRgba(colors.textMuted, 0.08),
          backgroundColor: colors.cardBackground,
        },
        footerBtn: {
          flex: 1,
          borderRadius: radius.lg + 2,
          paddingVertical: spacing.md + 2,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          minHeight: 54,
        },
        clearBtn: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: hexToRgba(colors.textMuted, 0.12),
        },
        clearBtnPressed: {
          backgroundColor: hexToRgba(colors.textMuted, 0.1),
        },
        clearBtnText: {
          fontWeight: "600",
          color: colors.textPrimary,
          fontSize: 16,
        },
        applyBtn: {
          backgroundColor: colors.accent,
        },
        applyBtnPressed: {
          backgroundColor: hexToRgba(colors.accent, 0.85),
        },
        applyBtnText: {
          fontWeight: "700",
          color: colors.white,
          fontSize: 16,
        },
        applyBadge: {
          backgroundColor: hexToRgba(colors.white, 0.9),
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 10,
        },
        applyBadgeText: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.accent,
        },
      }),
    [
      colors,
      spacing,
      radius,
      sheetMaxHeight,
      sheetMinHeight,
      safe.bottom,
      sideBarWidth,
      isTablet,
    ]
  );

  if (!visible || sections.length === 0) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <MaterialCommunityIcons
                  name="filter-variant"
                  size={22}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.closeBtnPressed,
              ]}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
              {sections.map((sec) => {
                const isActive = sec.key === activeKey;
                const count = getSectionFilterCount(sec.key);
                return (
                  <Pressable
                    key={sec.key}
                    style={[
                      styles.sidebarBtn,
                      isActive && styles.sidebarBtnActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveKey(sec.key);
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={sec.label}
                  >
                    <Text
                      style={[
                        styles.sidebarText,
                        isActive && styles.sidebarTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {sec.label}
                    </Text>
                    {count > 0 && <View style={styles.sidebarBadge} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {activeSection?.mode === "checkbox" && (
                <CheckboxSection
                  options={activeSection.options}
                  selected={draft[activeSection.key] || []}
                  onToggle={(val) =>
                      setDraft((d) => ({
                        ...d,
                      [activeSection.key]: toggleArrayVal(
                        d[activeSection.key] || [],
                        val
                      ),
                      }))
                    }
                />
                      )}

              {activeSection?.mode === "date" && (
                <DateRangePicker
                  from={draft[activeSection.key]?.from}
                  to={draft[activeSection.key]?.to}
                  onChange={(range) =>
                    setDraft((d) => ({ ...d, [activeSection.key]: range }))
                  }
                  config={activeSection.dateConfig}
                />
              )}

              {activeSection?.mode === "custom" &&
                activeSection.render(draft, setDraft)}
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.footerBtn,
                styles.clearBtn,
                pressed && styles.clearBtnPressed,
              ]}
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color={colors.textPrimary}
              />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.footerBtn,
                styles.applyBtn,
                pressed && styles.applyBtnPressed,
              ]}
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
              {hasActiveFilters && (
                <View style={styles.applyBadge}>
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color={colors.accent}
                  />
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default FilterSheet;
