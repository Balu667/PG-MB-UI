export const lightTheme = {
  colors: {
    primary: "#256D85",
    accent: "#1d3c34",

    background: "#FFFFFF",
    background2: "#f3f6f3ff",
    surface: "#F8F9FA",

    textPrimary: "#212529",
    textSecondary: "#6C757D",
    textMuted: "#9CA3AF",
    link: "#4A86F7",

    error: "#EF4444",
    success: "#28a745",
    disabled: "#CCCCCC",
    disabledGradient: ["#848383ff", "#545353ff"],
    enabledGradient: ["#007BFF", "#007BFF"],

    circle1: "#c0ebc9",
    circle2: "#a3d9c9",
    backDrop: "rgba(0,0,0,0.45)",
    shadow: "rgba(0,0,0,0.12)",
    shadow2: "rgba(0,0,0,0.72)",
    white: "#FFFFFF",
    totalBeds: "#0000FF",
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

  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    extraLarge: 30,
    extremeLarge: 55,
    full: 999,
  },

  typography: {
    fontSizeSm: 14,
    fontSizeMd: 16,
    fontSizeLg: 22,
    weightLight: "300",
    weightNormal: "400",
    weightBold: "700",
  },

  button: {
    primary: {
      bg: "#007BFF",
      fg: "#FFFFFF",
      pad: 16,
      rad: 8,
      largeRad: 12,
      fSize: 16,
      weight: "600",
    },
  },
} as const;

export const darkTheme: typeof lightTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: "#151515ff",
    background2: "#131615ff",
    surface: "#1F1F1F",

    textPrimary: "#FFFFFF",
    textSecondary: "#B0B0B0",
    textMuted: "#8A8A8A",

    circle1: "#368070ff",
    circle2: "#174e54",
    white: "#1c1c1cff",
    accent: "#499984ff",

    disabledGradient: ["#e0dedeff", "#abababff"],
    enabledGradient: ["#3e95b2ff", "#3e95b2ff"],
  },
};

export type AppTheme = typeof lightTheme;
