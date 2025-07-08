// expo.config.ts
import "dotenv/config";
import { ExpoConfig, ConfigContext } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "YourAppName",
  slug: config.slug ?? "your-app-slug",
  extra: {
    ...config.extra,
    API_URL: process.env.API_URL ?? "",
    FILE_URL: process.env.FILE_URL ?? "",
  },
});
