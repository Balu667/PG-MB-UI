export const hexToRgba = (hex: string, opacity: number = 1): string => {
  let cleanedHex = hex.replace("#", "");

  if (cleanedHex.length === 3) {
    cleanedHex = cleanedHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const r = parseInt(cleanedHex.slice(0, 2), 16);
  const g = parseInt(cleanedHex.slice(2, 4), 16);
  const b = parseInt(cleanedHex.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const lightTheme = {
  colors: {
    primary: "#6c3fc0",
    circle1: "#c0ebc9",
    circle2: "#6c3fc0",
    background2: "#f8f6fcff",
    borderColor: "#d9c8f8ff",
    borderColor2: "#412674ff",
    tabActiveBg: "#E3F2FD",
    tabInactive: "#7A7A7A",
    accent: "#6c3fc0",
    tabSurface: "#e0d7f0ff",

    background: "#FFFFFF",
    surface: "#F8F9FA",
    surface2: "#F8F9FA",
    cardBackground: "#f8f6fcff",
    cardBackground2: "#f8f6fcff",
    cardSurface: "#F8F9FA",
    textPrimary: "#212529",
    textSecondary: "#6C757D",
    textMuted: "#9CA3AF",
    link: "#4A86F7",
    moreTabBackground: "#dae9f9ff",
    error: "#EF4444",
    success: "#28a745",
    disabled: "#CCCCCC",
    disabledGradient: ["#848383ff", "#545353ff"],
    enabledGradient: ["#6c3fc0", "#8b6cc5ff"],
    backDrop: "rgba(0,0,0,0.8)",
    shadow: "rgba(0,0,0,0.12)",
    shadow2: "rgba(0,0,0,0.72)",
    white: "#FFFFFF",
    white2: "#F8F9FA",
    black: "#1c1c1cff",
    textWhite: "#FFFFFF",
    totalBeds: "#0000FF",
    availableBeds: "#0a892e",
    advBookedBeds: "#ed6d10",
    filledBeds: "#c80b0b",
    underNoticeBeds: "#6c3fc0",
    shortTermBeds: "#F59E0B",
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
    weightMedium: "500",
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
    borderColor: "#412674ff",
    background2: "#261641ff",
    tabSurface: "#1a0f2eff",
    background: "#0e0d0dff",
    borderColor2: "#8A8A8A",
    surface2: "#171717",

    surface: "#1F1F1F",

    cardBackground: "#260c56ff",
    cardBackground2: "#1f0a47",
    cardSurface: "#130b22ff",

    textPrimary: "#FFFFFF",
    textSecondary: "#B0B0B0",
    textMuted: "#8A8A8A",
    tabBackground: "#112621ff",
    moreTabBackground: "#1f1f20ff",

    circle1: "#368070ff",
    circle2: "#6c3fc0",
    white: "#1c1c1cff",
    white2: "#161616",
    black: "#FFFFFF",

    accent: "#834de7ff",
    tabActiveBg: "#204d57ff",
    tabInactive: "#9CA3AF",
    disabledGradient: ["#e0dedeff", "#abababff"],
  },
};

export type AppTheme = typeof lightTheme;
