import "dotenv/config";
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Expo Pro", // ✅ Human-readable name
  slug: "expo-pro", // ✅ URL-safe slug
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

  // ios: {
  //   bundleIdentifier: "com.yourcompany.expopro", // ✅ Change this
  //   supportsTablet: true,
  // },
  // android: {
  //   package: "com.yourcompany.expopro", // ✅ Change this
  //   adaptiveIcon: {
  //     foregroundImage: "./assets/adaptive-icon.png",
  //     backgroundColor: "#FFFFFF",
  //   },
  // },
  // web: {
  //   favicon: "./assets/favicon.png",
  // },
  extra: {
    apiUrl: process.env.API_URL ?? "https://your-api.com",
    fileUrl: process.env.FILE_URL ?? "https://your-cdn.com",
  },
});
