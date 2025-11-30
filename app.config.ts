import "dotenv/config";
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Expo Pro", // ✅ Human-readable name
  slug: "pgms", // ✅ URL-safe slug
  scheme: "expo-pro", // ✅ For deep linking (required)
  version: "1.0.0",
  orientation: "portrait",
  // icon: "./assets/icon.png", // ✅ Replace with your app icon
  userInterfaceStyle: "automatic",
  // splash: {
  //   image: "./assets/splash.png", // ✅ Splash image
  //   resizeMode: "contain",
  //   backgroundColor: "#ffffff",
  // },
  // updates: {
  //   fallbackToCacheTimeout: 0,
  // },
  // assetBundlePatterns: ["**/*"],

  ios: {
    bundleIdentifier: "com.yourcompany.pgms", // ✅ Change this
    supportsTablet: true,
  },
  android: {
    package: "com.yourcompany.pgms", // ✅ Change this
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
  },
  // web: {
  //   favicon: "./assets/favicon.png",
  // },
  extra: {
    apiUrl: process.env.API_URL ?? "https://your-api.com",
    fileUrl: process.env.FILE_URL ?? "https://your-cdn.com",
    eas: {
      projectId: "cc062d73-005b-4bee-8da1-f12f51827572", // Add this line
    },
  },
  updates: {
    url: "https://u.expo.dev/cc062d73-005b-4bee-8da1-f12f51827572",
  },
  owner: "maheshguna",
  jsEngine: "hermes",
});
