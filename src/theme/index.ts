export const lightTheme = {
  colors: {
    primary: "#256D85",
    background: "#FFFFFF",
    textPrimary: "#212529",
    textSecondary: "#6C757D",
    textMuted: "#B3a9a3",
    surface: "#F8F9FA",
    white: "#FFFFFF",
    error: "red", // Included for validation or error messages
    success: "#28a745", // (Optional)
    totalBeds: "#00f",
    availableBeds: "#0a892e",
    advBookedBeds: "#ed6d10",
    filledBeds: "#c80b0b",
    underNoticeBeds: "#6c3fc0",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontSizeSmall: 14,
    fontSizeMedium: 16,
    fontSizeLarge: 22,
    fontWeightLight: "300",
    fontWeightRegular: "400",
    fontWeightBold: "700",
  },
  button: {
    primary: {
      backgroundColor: "#007BFF",
      color: "#FFFFFF",
      padding: 16,
      borderRadius: 8,
      fontSize: 16,
      fontWeight: "600",
    },
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
  },
};

export const darkTheme: typeof lightTheme = {
  colors: {
    primary: "#256D85",
    background: "#121212",
    textPrimary: "#FFFFFF",
    textSecondary: "#B0B0B0",
    textMuted: "#8a8a8a",
    surface: "#1F1F1F",
    white: "#000000", // ⚠️ This is a bit confusing — black is not "white". Consider renaming.
    error: "red", // ✅ Add this for parity
    success: "#28a745", // ✅ Optional
    totalBeds: "#00f",
    availableBeds: "#0a892e",
    advBookedBeds: "#ed6d10",
    filledBeds: "#c80b0b",
    underNoticeBeds: "#6c3fc0",
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  button: lightTheme.button,
  borderRadius: lightTheme.borderRadius,
};

export type AppTheme = typeof lightTheme;
