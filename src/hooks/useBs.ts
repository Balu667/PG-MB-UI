import { StyleSheet } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext"; // Adjust if your path differs

export const useBS = () => {
  const theme = useTheme();

  return StyleSheet.create({
    // ✅ FLEXBOX
    dFlex: { display: "flex" },
    flexRow: { flexDirection: "row" },
    flexColumn: { flexDirection: "column" },
    justifyStart: { justifyContent: "flex-start" },
    justifyCenter: { justifyContent: "center" },
    justifyEnd: { justifyContent: "flex-end" },
    justifyBetween: { justifyContent: "space-between" },
    justifyAround: { justifyContent: "space-around" },
    alignStart: { alignItems: "flex-start" },
    alignCenter: { alignItems: "center" },
    alignEnd: { alignItems: "flex-end" },
    alignStretch: { alignItems: "stretch" },
    flex1: { flex: 1 },
    flexWrap: { flexWrap: "wrap" },
    gap1: { gap: theme.spacing.xs },
    gap2: { gap: theme.spacing.sm },

    // ✅ TEXT
    textCenter: { textAlign: "center" },
    textLeft: { textAlign: "left" },
    textRight: { textAlign: "right" },
    fwLight: { fontWeight: theme.typography.fontWeightLight as any },
    fwNormal: { fontWeight: theme.typography.fontWeightRegular as any },
    fwBold: { fontWeight: theme.typography.fontWeightBold as any },
    fontSmall: { fontSize: theme.typography.fontSizeSmall },
    fontMedium: { fontSize: theme.typography.fontSizeMedium },
    fontLarge: { fontSize: theme.typography.fontSizeLarge },
    fontSize18: { fontSize: 18 },

    // ✅ TEXT COLORS
    textPrimary: { color: theme.colors.textPrimary },
    textSecondary: { color: theme.colors.textSecondary },
    textWhite: { color: theme.colors.white },
    textDanger: { color: theme.colors.error },
    textSuccess: { color: theme.colors.success },

    // ✅ BACKGROUND COLORS
    bgPrimary: { backgroundColor: theme.colors.primary },
    bgSecondary: { backgroundColor: theme.colors.background },
    bgWhite: { backgroundColor: theme.colors.white },
    bgSurface: { backgroundColor: theme.colors.surface },
    bgDanger: { backgroundColor: theme.colors.error },
    bgSuccess: { backgroundColor: theme.colors.success },
    totalBedsColor: { color: theme.colors.totalBeds },
    availableBedsColor: { color: theme.colors.availableBeds },
    advBookedBedsColor: { color: theme.colors.advBookedBeds },
    filledBedsColor: { color: theme.colors.filledBeds },
    underNoticeBedsColor: { color: theme.colors.underNoticeBeds },

    // ✅ SPACING (based on theme)
    m0: { margin: 0 },
    mt1: { marginTop: theme.spacing.xs },
    mt2: { marginTop: theme.spacing.sm },
    mt3: { marginTop: theme.spacing.md },
    mb1: { marginBottom: theme.spacing.xs },
    mb2: { marginBottom: theme.spacing.sm },
    mb3: { marginBottom: theme.spacing.md },
    ml2: { marginLeft: theme.spacing.sm },
    mr2: { marginRight: theme.spacing.sm },
    p1: { padding: theme.spacing.xs },
    p2: { padding: theme.spacing.sm },
    p3: { padding: theme.spacing.md },
    px2: { paddingHorizontal: theme.spacing.sm },
    py2: { paddingVertical: theme.spacing.sm },

    // ✅ WIDTH / HEIGHT
    w100: { width: "100%" },
    w50: { width: "50%" },
    h100: { height: "100%" },
    h50: { height: "50%" },

    // ✅ BORDER
    rounded: { borderRadius: theme.borderRadius.medium },
    roundedSmall: { borderRadius: theme.borderRadius.small },
    roundedLarge: { borderRadius: theme.borderRadius.large },
    border: {
      borderWidth: 1,
      borderColor: theme.colors.textSecondary,
    },
    borderPrimary: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },

    // ✅ BUTTON STYLE (basic)
    btn: {
      padding: theme.button.primary.padding,
      borderRadius: theme.button.primary.borderRadius,
      backgroundColor: theme.button.primary.backgroundColor,
    },
    btnText: {
      color: theme.button.primary.color,
      fontSize: theme.button.primary.fontSize,
      fontWeight: theme.button.primary.fontWeight as any,
      textAlign: "center",
    },
  });
};
